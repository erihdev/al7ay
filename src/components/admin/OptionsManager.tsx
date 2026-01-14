import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Settings2, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProductOption = Database['public']['Tables']['product_options']['Row'];
type OptionValue = Database['public']['Tables']['product_option_values']['Row'];

interface OptionWithValues extends ProductOption {
  values: OptionValue[];
}

export function OptionsManager() {
  const queryClient = useQueryClient();
  
  // Option dialog state
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);
  const [optionNameAr, setOptionNameAr] = useState('');
  const [optionNameEn, setOptionNameEn] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  
  // Value dialog state
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<OptionValue | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [valueNameAr, setValueNameAr] = useState('');
  const [valueNameEn, setValueNameEn] = useState('');
  const [priceModifier, setPriceModifier] = useState('0');
  
  // Delete state
  const [deleteOption, setDeleteOption] = useState<ProductOption | null>(null);
  const [deleteValue, setDeleteValue] = useState<{ value: OptionValue; optionId: string } | null>(null);

  // Fetch options with values
  const { data: options, isLoading } = useQuery({
    queryKey: ['admin-options'],
    queryFn: async () => {
      const { data: opts, error: optsError } = await supabase
        .from('product_options')
        .select('*')
        .order('created_at');
      if (optsError) throw optsError;

      const { data: values, error: valuesError } = await supabase
        .from('product_option_values')
        .select('*')
        .order('sort_order');
      if (valuesError) throw valuesError;

      return opts?.map(opt => ({
        ...opt,
        values: values?.filter(v => v.option_id === opt.id) || []
      })) as OptionWithValues[];
    },
  });

  // Option mutations
  const saveOptionMutation = useMutation({
    mutationFn: async () => {
      if (editingOption) {
        const { error } = await supabase
          .from('product_options')
          .update({
            name_ar: optionNameAr,
            name_en: optionNameEn || null,
            is_required: isRequired,
          })
          .eq('id', editingOption.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_options')
          .insert({
            name_ar: optionNameAr,
            name_en: optionNameEn || null,
            is_required: isRequired,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['all-options-with-values'] });
      toast.success(editingOption ? 'تم تحديث الخيار' : 'تم إضافة الخيار');
      closeOptionDialog();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase
        .from('product_options')
        .delete()
        .eq('id', optionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['all-options-with-values'] });
      toast.success('تم حذف الخيار');
      setDeleteOption(null);
    },
    onError: () => toast.error('حدث خطأ'),
  });

  // Value mutations
  const saveValueMutation = useMutation({
    mutationFn: async () => {
      if (editingValue) {
        const { error } = await supabase
          .from('product_option_values')
          .update({
            name_ar: valueNameAr,
            name_en: valueNameEn || null,
            price_modifier: parseFloat(priceModifier) || 0,
          })
          .eq('id', editingValue.id);
        if (error) throw error;
      } else {
        // Get max sort order
        const option = options?.find(o => o.id === selectedOptionId);
        const maxSort = Math.max(...(option?.values.map(v => v.sort_order) || [0]), 0);
        
        const { error } = await supabase
          .from('product_option_values')
          .insert({
            option_id: selectedOptionId!,
            name_ar: valueNameAr,
            name_en: valueNameEn || null,
            price_modifier: parseFloat(priceModifier) || 0,
            sort_order: maxSort + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['all-options-with-values'] });
      toast.success(editingValue ? 'تم تحديث القيمة' : 'تم إضافة القيمة');
      closeValueDialog();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (valueId: string) => {
      const { error } = await supabase
        .from('product_option_values')
        .delete()
        .eq('id', valueId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['all-options-with-values'] });
      toast.success('تم حذف القيمة');
      setDeleteValue(null);
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const openOptionDialog = (option?: ProductOption) => {
    if (option) {
      setEditingOption(option);
      setOptionNameAr(option.name_ar);
      setOptionNameEn(option.name_en || '');
      setIsRequired(option.is_required);
    } else {
      setEditingOption(null);
      setOptionNameAr('');
      setOptionNameEn('');
      setIsRequired(false);
    }
    setOptionDialogOpen(true);
  };

  const closeOptionDialog = () => {
    setOptionDialogOpen(false);
    setEditingOption(null);
    setOptionNameAr('');
    setOptionNameEn('');
    setIsRequired(false);
  };

  const openValueDialog = (optionId: string, value?: OptionValue) => {
    setSelectedOptionId(optionId);
    if (value) {
      setEditingValue(value);
      setValueNameAr(value.name_ar);
      setValueNameEn(value.name_en || '');
      setPriceModifier(value.price_modifier.toString());
    } else {
      setEditingValue(null);
      setValueNameAr('');
      setValueNameEn('');
      setPriceModifier('0');
    }
    setValueDialogOpen(true);
  };

  const closeValueDialog = () => {
    setValueDialogOpen(false);
    setEditingValue(null);
    setSelectedOptionId(null);
    setValueNameAr('');
    setValueNameEn('');
    setPriceModifier('0');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-arabic flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          إدارة خيارات التخصيص
        </h3>
        <Button onClick={() => openOptionDialog()} className="font-arabic">
          <Plus className="h-4 w-4 ml-2" />
          إضافة خيار جديد
        </Button>
      </div>

      {options?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground font-arabic">
            لا توجد خيارات. أضف خيارك الأول!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {options?.map((option) => (
            <Card key={option.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-arabic">{option.name_ar}</CardTitle>
                    {option.name_en && (
                      <p className="text-sm text-muted-foreground">{option.name_en}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {option.is_required && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        مطلوب
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openOptionDialog(option)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteOption(option)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {option.values.map((value) => (
                    <div
                      key={value.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-arabic">{value.name_ar}</span>
                        {Number(value.price_modifier) > 0 && (
                          <span className="text-sm text-primary font-medium">
                            +{Number(value.price_modifier)} ر.س
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openValueDialog(option.id, value)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteValue({ value, optionId: option.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 font-arabic"
                    onClick={() => openValueDialog(option.id)}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة قيمة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Option Dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-arabic">
              {editingOption ? 'تعديل الخيار' : 'إضافة خيار جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-arabic">الاسم بالعربية *</Label>
              <Input
                value={optionNameAr}
                onChange={(e) => setOptionNameAr(e.target.value)}
                placeholder="مثال: حجم الكوب"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-arabic">الاسم بالإنجليزية</Label>
              <Input
                value={optionNameEn}
                onChange={(e) => setOptionNameEn(e.target.value)}
                placeholder="e.g. Cup Size"
                dir="ltr"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-arabic">خيار مطلوب</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={() => saveOptionMutation.mutate()}
              disabled={!optionNameAr || saveOptionMutation.isPending}
              className="font-arabic"
            >
              {saveOptionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              حفظ
            </Button>
            <Button variant="outline" onClick={closeOptionDialog} className="font-arabic">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Value Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-arabic">
              {editingValue ? 'تعديل القيمة' : 'إضافة قيمة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-arabic">الاسم بالعربية *</Label>
              <Input
                value={valueNameAr}
                onChange={(e) => setValueNameAr(e.target.value)}
                placeholder="مثال: كبير"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-arabic">الاسم بالإنجليزية</Label>
              <Input
                value={valueNameEn}
                onChange={(e) => setValueNameEn(e.target.value)}
                placeholder="e.g. Large"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-arabic">السعر الإضافي (ر.س)</Label>
              <Input
                type="number"
                value={priceModifier}
                onChange={(e) => setPriceModifier(e.target.value)}
                placeholder="0"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={() => saveValueMutation.mutate()}
              disabled={!valueNameAr || saveValueMutation.isPending}
              className="font-arabic"
            >
              {saveValueMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              حفظ
            </Button>
            <Button variant="outline" onClick={closeValueDialog} className="font-arabic">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Option Dialog */}
      <AlertDialog open={!!deleteOption} onOpenChange={() => setDeleteOption(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">حذف الخيار</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف "{deleteOption?.name_ar}"؟ سيتم حذف جميع القيم المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="font-arabic">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOption && deleteOptionMutation.mutate(deleteOption.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-arabic"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Value Dialog */}
      <AlertDialog open={!!deleteValue} onOpenChange={() => setDeleteValue(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">حذف القيمة</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف "{deleteValue?.value.name_ar}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="font-arabic">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteValue && deleteValueMutation.mutate(deleteValue.value.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-arabic"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
