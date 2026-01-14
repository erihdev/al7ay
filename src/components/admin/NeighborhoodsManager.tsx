import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Users,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  provider_count: number;
  is_active: boolean;
  created_at: string;
}

const NeighborhoodsManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    city: 'الرياض',
    lat: '',
    lng: '',
    provider_count: '0',
    is_active: true
  });

  const { data: neighborhoods, isLoading } = useQuery({
    queryKey: ['admin-neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_neighborhoods')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Neighborhood[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Neighborhood, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('active_neighborhoods')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] });
      toast.success('تم إضافة الحي بنجاح');
      resetForm();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة الحي');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Neighborhood> }) => {
      const { error } = await supabase
        .from('active_neighborhoods')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] });
      toast.success('تم تحديث الحي بنجاح');
      resetForm();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث الحي');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('active_neighborhoods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] });
      toast.success('تم حذف الحي بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف الحي');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      city: 'الرياض',
      lat: '',
      lng: '',
      provider_count: '0',
      is_active: true
    });
    setEditingNeighborhood(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (neighborhood: Neighborhood) => {
    setEditingNeighborhood(neighborhood);
    setFormData({
      name: neighborhood.name,
      city: neighborhood.city,
      lat: String(neighborhood.lat),
      lng: String(neighborhood.lng),
      provider_count: String(neighborhood.provider_count),
      is_active: neighborhood.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      city: formData.city,
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      provider_count: parseInt(formData.provider_count),
      is_active: formData.is_active
    };

    if (editingNeighborhood) {
      updateMutation.mutate({ id: editingNeighborhood.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredNeighborhoods = neighborhoods?.filter(n =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الأحياء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 font-arabic"
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="font-arabic">
          <Plus className="h-4 w-4 ml-2" />
          إضافة حي جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{neighborhoods?.length || 0}</p>
            <p className="text-sm text-muted-foreground">إجمالي الأحياء</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {neighborhoods?.filter(n => n.is_active).length || 0}
            </p>
            <p className="text-sm text-muted-foreground">نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {neighborhoods?.reduce((sum, n) => sum + n.provider_count, 0) || 0}
            </p>
            <p className="text-sm text-muted-foreground">مقدمي الخدمات</p>
          </CardContent>
        </Card>
      </div>

      {/* Neighborhoods Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNeighborhoods?.map((neighborhood) => (
          <Card key={neighborhood.id} className={!neighborhood.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{neighborhood.name}</h3>
                </div>
                <Badge variant={neighborhood.is_active ? 'default' : 'secondary'}>
                  {neighborhood.is_active ? 'نشط' : 'معطل'}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{neighborhood.city}</p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Users className="h-4 w-4" />
                <span>{neighborhood.provider_count} مقدم خدمة</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(neighborhood)}
                  className="flex-1 font-arabic"
                >
                  <Edit className="h-4 w-4 ml-1" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف هذا الحي؟')) {
                      deleteMutation.mutate(neighborhood.id);
                    }
                  }}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-arabic">
              {editingNeighborhood ? 'تعديل الحي' : 'إضافة حي جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-arabic">اسم الحي</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="حي النرجس"
                  required
                  className="font-arabic"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-arabic">المدينة</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="الرياض"
                  required
                  className="font-arabic"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-arabic">خط العرض (Latitude)</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  placeholder="24.7136"
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-arabic">خط الطول (Longitude)</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  placeholder="46.6753"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">عدد مقدمي الخدمات</Label>
              <Input
                type="number"
                value={formData.provider_count}
                onChange={(e) => setFormData({ ...formData, provider_count: e.target.value })}
                min="0"
                dir="ltr"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="font-arabic">الحي نشط</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm} className="font-arabic">
                إلغاء
              </Button>
              <Button type="submit" className="font-arabic">
                {editingNeighborhood ? 'حفظ التغييرات' : 'إضافة الحي'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NeighborhoodsManager;
