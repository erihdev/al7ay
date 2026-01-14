import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Settings2, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductOption = Database['public']['Tables']['product_options']['Row'];

interface OptionWithValues extends ProductOption {
  values: Database['public']['Tables']['product_option_values']['Row'][];
}

export function ProductOptionsManager() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [linkedOptions, setLinkedOptions] = useState<string[]>([]);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name_ar');
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch all options with values
  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['all-options-with-values'],
    queryFn: async () => {
      const { data: opts, error: optsError } = await supabase
        .from('product_options')
        .select('*');
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

  // Fetch product options link
  const { data: productLinks } = useQuery({
    queryKey: ['product-options-links', selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const { data, error } = await supabase
        .from('product_options_link')
        .select('option_id')
        .eq('product_id', selectedProduct.id);
      if (error) throw error;
      return data.map(l => l.option_id);
    },
    enabled: !!selectedProduct,
  });

  // Update links mutation
  const updateLinksMutation = useMutation({
    mutationFn: async ({ productId, optionIds }: { productId: string; optionIds: string[] }) => {
      // Delete existing links
      const { error: deleteError } = await supabase
        .from('product_options_link')
        .delete()
        .eq('product_id', productId);
      if (deleteError) throw deleteError;

      // Insert new links
      if (optionIds.length > 0) {
        const { error: insertError } = await supabase
          .from('product_options_link')
          .insert(optionIds.map(optionId => ({
            product_id: productId,
            option_id: optionId,
          })));
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options-links'] });
      queryClient.invalidateQueries({ queryKey: ['product-options'] });
      toast.success('تم تحديث خيارات المنتج');
      setDialogOpen(false);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التحديث');
    },
  });

  const handleOpenDialog = (product: Product) => {
    setSelectedProduct(product);
    setLinkedOptions([]);
    setDialogOpen(true);
  };

  // Set linked options when productLinks loads
  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedProduct(null);
      setLinkedOptions([]);
    }
  };

  const handleSave = () => {
    if (!selectedProduct) return;
    updateLinksMutation.mutate({
      productId: selectedProduct.id,
      optionIds: linkedOptions,
    });
  };

  const toggleOption = (optionId: string) => {
    setLinkedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  // Initialize linked options when dialog opens
  useState(() => {
    if (productLinks && selectedProduct) {
      setLinkedOptions(productLinks);
    }
  });

  if (productsLoading || optionsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-arabic">
            <Settings2 className="h-5 w-5" />
            ربط خيارات التخصيص بالمنتجات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products?.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name_ar}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium font-arabic">{product.name_ar}</p>
                    <p className="text-sm text-muted-foreground">{product.name_en}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(product)}
                  className="font-arabic"
                >
                  <Settings2 className="h-4 w-4 ml-2" />
                  إدارة الخيارات
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Options Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic">الخيارات المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {options?.map(option => (
              <div key={option.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium font-arabic">{option.name_ar}</p>
                  {option.is_required && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      مطلوب
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {option.values.map(value => (
                    <span
                      key={value.id}
                      className="text-sm bg-muted px-2 py-1 rounded"
                    >
                      {value.name_ar}
                      {Number(value.price_modifier) > 0 && (
                        <span className="text-primary mr-1">
                          +{Number(value.price_modifier)} ر.س
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Link Options Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-arabic">
              خيارات {selectedProduct?.name_ar}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground font-arabic">
              اختر الخيارات المتاحة لهذا المنتج. إذا لم تختر أي خيار، ستظهر جميع الخيارات للعميل.
            </p>
            
            {options?.map(option => (
              <div
                key={option.id}
                className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg border"
              >
                <Checkbox
                  id={option.id}
                  checked={linkedOptions.includes(option.id) || (productLinks?.includes(option.id) && linkedOptions.length === 0 && !dialogOpen)}
                  onCheckedChange={() => toggleOption(option.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="font-arabic cursor-pointer">
                    {option.name_ar}
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {option.values.map(value => (
                      <span
                        key={value.id}
                        className="text-xs bg-muted px-2 py-0.5 rounded"
                      >
                        {value.name_ar}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={handleSave}
              disabled={updateLinksMutation.isPending}
              className="font-arabic"
            >
              {updateLinksMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              حفظ التغييرات
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDialogOpen(false)}
              className="font-arabic"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
