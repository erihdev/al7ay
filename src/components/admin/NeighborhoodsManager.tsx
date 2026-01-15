import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Users,
  Search,
  Filter,
  X,
  Building2,
  LayoutGrid,
  Map
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import NeighborhoodsMap from './NeighborhoodsMap';

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

// قائمة المناطق الإدارية السعودية مع مدنها
const SAUDI_REGIONS: Record<string, string[]> = {
  'منطقة الرياض': ['الرياض', 'الخرج', 'الدرعية', 'المجمعة', 'الدوادمي', 'وادي الدواسر', 'الأفلاج', 'حوطة بني تميم', 'الزلفي', 'شقراء', 'ثادق', 'الغاط'],
  'منطقة مكة المكرمة': ['مكة المكرمة', 'جدة', 'الطائف', 'رابغ', 'الليث', 'القنفذة'],
  'المنطقة الشرقية': ['الدمام', 'الخبر', 'الظهران', 'الأحساء', 'الجبيل', 'القطيف', 'رأس تنورة', 'الخفجي', 'النعيرية', 'بقيق'],
  'منطقة المدينة المنورة': ['المدينة المنورة', 'ينبع', 'العلا', 'مهد الذهب', 'بدر', 'خيبر'],
  'منطقة القصيم': ['بريدة', 'عنيزة', 'الرس', 'المذنب', 'البكيرية', 'البدائع', 'رياض الخبراء'],
  'منطقة عسير': ['أبها', 'خميس مشيط', 'بيشة', 'النماص', 'محايل عسير', 'سراة عبيدة', 'ظهران الجنوب', 'تثليث'],
  'منطقة تبوك': ['تبوك', 'الوجه', 'ضباء', 'أملج', 'حقل', 'تيماء'],
  'منطقة حائل': ['حائل', 'بقعاء', 'الشنان', 'الحائط', 'الغزالة'],
  'منطقة الحدود الشمالية': ['عرعر', 'رفحاء', 'طريف', 'العويقيلة'],
  'منطقة جازان': ['جازان', 'صبيا', 'أبو عريش', 'صامطة', 'أحد المسارحة', 'الحرث', 'فيفاء', 'العارضة', 'الدرب', 'العيدابي', 'بيش'],
  'منطقة نجران': ['نجران', 'شرورة', 'حبونا', 'بدر الجنوب', 'يدمة'],
  'منطقة الباحة': ['الباحة', 'بلجرشي', 'المندق', 'المخواة', 'قلوة', 'العقيق'],
  'منطقة الجوف': ['سكاكا', 'القريات', 'دومة الجندل', 'طبرجل']
};

const NeighborhoodsManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
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

  // استخراج المدن الفريدة من البيانات
  const uniqueCities = useMemo(() => {
    if (!neighborhoods) return [];
    const cities = [...new Set(neighborhoods.map(n => n.city))];
    return cities.sort((a, b) => a.localeCompare(b, 'ar'));
  }, [neighborhoods]);

  // تحديد المدن المتاحة بناءً على المنطقة المختارة
  const availableCities = useMemo(() => {
    if (selectedRegion === 'all') return uniqueCities;
    const regionCities = SAUDI_REGIONS[selectedRegion] || [];
    return uniqueCities.filter(city => regionCities.includes(city));
  }, [selectedRegion, uniqueCities]);

  // فلترة الأحياء
  const filteredNeighborhoods = useMemo(() => {
    if (!neighborhoods) return [];
    
    return neighborhoods.filter(n => {
      // فلتر البحث النصي
      const matchesSearch = searchTerm === '' || 
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      // فلتر المنطقة
      const matchesRegion = selectedRegion === 'all' || 
        (SAUDI_REGIONS[selectedRegion]?.includes(n.city));
      
      // فلتر المدينة
      const matchesCity = selectedCity === 'all' || n.city === selectedCity;
      
      // فلتر الحالة النشطة
      const matchesActive = !showActiveOnly || n.is_active;
      
      return matchesSearch && matchesRegion && matchesCity && matchesActive;
    });
  }, [neighborhoods, searchTerm, selectedRegion, selectedCity, showActiveOnly]);

  // إحصائيات الفلترة
  const filterStats = useMemo(() => {
    const total = neighborhoods?.length || 0;
    const filtered = filteredNeighborhoods.length;
    const activeFiltered = filteredNeighborhoods.filter(n => n.is_active).length;
    const providersFiltered = filteredNeighborhoods.reduce((sum, n) => sum + n.provider_count, 0);
    return { total, filtered, activeFiltered, providersFiltered };
  }, [neighborhoods, filteredNeighborhoods]);

  // مسح جميع الفلاتر
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRegion('all');
    setSelectedCity('all');
    setShowActiveOnly(false);
  };

  const hasActiveFilters = searchTerm !== '' || selectedRegion !== 'all' || selectedCity !== 'all' || showActiveOnly;

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
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الأحياء أو المدن..."
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">الفلاتر</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 ml-1" />
                مسح الفلاتر
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* فلتر المنطقة */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">المنطقة الإدارية</Label>
              <Select value={selectedRegion} onValueChange={(value) => {
                setSelectedRegion(value);
                setSelectedCity('all'); // إعادة ضبط المدينة عند تغيير المنطقة
              }}>
                <SelectTrigger className="font-arabic">
                  <SelectValue placeholder="جميع المناطق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المناطق</SelectItem>
                  {Object.keys(SAUDI_REGIONS).map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فلتر المدينة */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">المدينة</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="font-arabic">
                  <SelectValue placeholder="جميع المدن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {availableCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فلتر الحالة */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">الحالة</Label>
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                <Switch
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                  id="active-filter"
                />
                <Label htmlFor="active-filter" className="text-sm cursor-pointer">
                  النشط فقط
                </Label>
              </div>
            </div>

            {/* نتائج الفلترة */}
            <div className="flex items-end">
              <div className="flex items-center gap-2 h-10 px-3 bg-muted/50 rounded-md w-full">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {hasActiveFilters ? (
                    <span>
                      <span className="font-bold text-primary">{filterStats.filtered}</span>
                      <span className="text-muted-foreground"> من {filterStats.total}</span>
                    </span>
                  ) : (
                    <span className="font-bold">{filterStats.total} حي</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{filterStats.filtered}</p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? 'نتائج البحث' : 'إجمالي الأحياء'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {filterStats.activeFiltered}
            </p>
            <p className="text-sm text-muted-foreground">نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {filterStats.providersFiltered}
            </p>
            <p className="text-sm text-muted-foreground">مقدمي الخدمات</p>
          </CardContent>
        </Card>
      </div>

      {/* Map and Grid Tabs */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
          <TabsTrigger value="map" className="gap-2">
            <Map className="h-4 w-4" />
            الخريطة
          </TabsTrigger>
          <TabsTrigger value="grid" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            القائمة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <NeighborhoodsMap 
            neighborhoods={filteredNeighborhoods} 
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="grid" className="mt-4">
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

          {filteredNeighborhoods.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد أحياء تطابق معايير البحث</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
