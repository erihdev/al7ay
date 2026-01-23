import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, CreditCard, Gift, Calendar, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SubscriptionPlan {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  duration_days: number;
  price: number;
  is_trial: boolean;
  is_active: boolean;
  features: string[];
  sort_order: number;
  created_at: string;
  discount_percent: number;
}

export function SubscriptionPlansManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    duration_days: 30,
    price: 0,
    is_trial: false,
    features: '',
    discount_percent: 0,
  });

  // Fetch plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        discount_percent: (plan as any).discount_percent || 0
      })) as SubscriptionPlan[];
    },
  });

  // Create/Update mutation
  const savePlan = useMutation({
    mutationFn: async (data: any) => {
      const planData = {
        name_ar: data.name_ar,
        name_en: data.name_en || null,
        description_ar: data.description_ar || null,
        description_en: data.description_en || null,
        duration_days: data.duration_days,
        price: data.price,
        is_trial: data.is_trial,
        features: data.features.split('\n').filter((f: string) => f.trim()),
        discount_percent: data.discount_percent || 0,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans-admin'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingPlan ? 'تم تحديث الخطة' : 'تم إضافة الخطة');
    },
    onError: () => {
      toast.error('حدث خطأ');
    },
  });

  // Toggle active mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans-admin'] });
      toast.success('تم التحديث');
    },
  });

  // Delete mutation
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans-admin'] });
      toast.success('تم حذف الخطة');
    },
    onError: () => {
      toast.error('لا يمكن حذف خطة مستخدمة');
    },
  });

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      duration_days: 30,
      price: 0,
      is_trial: false,
      features: '',
      discount_percent: 0,
    });
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name_ar: plan.name_ar,
      name_en: plan.name_en || '',
      description_ar: plan.description_ar || '',
      description_en: plan.description_en || '',
      duration_days: plan.duration_days,
      price: plan.price,
      is_trial: plan.is_trial,
      features: plan.features.join('\n'),
      discount_percent: plan.discount_percent || 0,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          إدارة خطط الاشتراك
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" />
              خطة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم بالعربية *</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="اشتراك شهري"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Monthly"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف بالعربية</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder="وصف الخطة..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المدة (بالأيام) *</Label>
                  <Input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>السعر (ر.س) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_trial}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_trial: checked })}
                  />
                  <Label>فترة تجريبية مجانية</Label>
                </div>
                <div className="space-y-2">
                  <Label>نسبة الخصم %</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>المميزات (سطر لكل ميزة)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="إدارة المنتجات&#10;استقبال الطلبات&#10;لوحة إحصائيات"
                  rows={4}
                />
              </div>

              <Button
                onClick={() => savePlan.mutate(formData)}
                disabled={!formData.name_ar || savePlan.isPending}
                className="w-full"
              >
                {savePlan.isPending ? 'جاري الحفظ...' : editingPlan ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {plans?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد خطط اشتراك
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans?.map((plan) => (
              <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {plan.is_trial ? (
                          <Gift className="h-5 w-5 text-green-500" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-primary" />
                        )}
                        <h3 className="font-bold">{plan.name_ar}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description_ar}
                      </p>
                    </div>
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: plan.id, is_active: checked })}
                    />
                  </div>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold">
                      {plan.price === 0 ? 'مجاني' : `${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-muted-foreground">ر.س</span>
                    )}
                    <span className="text-sm text-muted-foreground mr-auto">
                      / {plan.duration_days} يوم
                    </span>
                  </div>

                  {plan.is_trial && (
                    <Badge className="bg-green-500/10 text-green-600 mb-3">
                      <Gift className="h-3 w-3 ml-1" />
                      تجربة مجانية
                    </Badge>
                  )}

                  {plan.discount_percent > 0 && (
                    <Badge className="bg-orange-500/10 text-orange-600 mb-3">
                      خصم {plan.discount_percent}%
                    </Badge>
                  )}

                  {plan.features.length > 0 && (
                    <ul className="space-y-1 text-sm mb-4">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-muted-foreground">
                          +{plan.features.length - 4} مميزات أخرى
                        </li>
                      )}
                    </ul>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(plan)}
                    >
                      <Edit2 className="h-3 w-3 ml-1" />
                      تعديل
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف الخطة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف خطة "{plan.name_ar}"؟
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse gap-2">
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePlan.mutate(plan.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
