import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAllProductOptions, SelectedOption } from '@/hooks/useProductOptions';
import { useCart } from '@/hooks/useCart';
import { useProductAverageRating } from '@/hooks/useProductReviews';
import { ProductReviewsList } from '@/components/reviews/ProductReviewsList';
import { Loader2, Plus, Minus, Star } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCustomizationDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductCustomizationDialog({
  product,
  open,
  onOpenChange,
}: ProductCustomizationDialogProps) {
  const { data: options, isLoading } = useAllProductOptions();
  const { addItem } = useCart();
  const { average, count } = useProductAverageRating(product?.id);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectedOption>>({});
  const [quantity, setQuantity] = useState(1);
  const [showReviews, setShowReviews] = useState(false);

  // Reset when product changes
  useEffect(() => {
    if (product && options) {
      const defaults: Record<string, SelectedOption> = {};
      options.forEach(option => {
        if (option.values.length > 0) {
          const firstValue = option.values[0];
          defaults[option.id] = {
            option_id: option.id,
            option_name: option.name_ar,
            value_id: firstValue.id,
            value_name: firstValue.name_ar,
            price_modifier: Number(firstValue.price_modifier),
          };
        }
      });
      setSelectedOptions(defaults);
      setQuantity(1);
      setShowReviews(false);
    }
  }, [product, options]);

  if (!product) return null;

  const handleOptionChange = (optionId: string, valueId: string) => {
    const option = options?.find(o => o.id === optionId);
    const value = option?.values.find(v => v.id === valueId);
    
    if (option && value) {
      setSelectedOptions(prev => ({
        ...prev,
        [optionId]: {
          option_id: optionId,
          option_name: option.name_ar,
          value_id: valueId,
          value_name: value.name_ar,
          price_modifier: Number(value.price_modifier),
        },
      }));
    }
  };

  const totalPriceModifier = Object.values(selectedOptions).reduce(
    (sum, opt) => sum + opt.price_modifier,
    0
  );

  const finalPrice = Number(product.price) + totalPriceModifier;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${product.id}-${Date.now()}-${i}`,
        name_ar: product.name_ar,
        price: finalPrice,
        image_url: product.image_url || undefined,
        selected_options: Object.values(selectedOptions),
      });
    }
    onOpenChange(false);
  };

  // Filter options based on product category (coffee products get all options)
  const relevantOptions = product.category === 'coffee' 
    ? options 
    : options?.filter(o => o.name_ar === 'حجم الكوب');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic text-right">
            تخصيص {product.name_ar}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Image */}
            {product.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name_ar}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Rating Display */}
            {count > 0 && (
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{average.toFixed(1)}</span>
                <span>({count} تقييم)</span>
                <span className="text-primary">{showReviews ? 'إخفاء' : 'عرض'}</span>
              </button>
            )}

            {/* Reviews Section */}
            {showReviews && (
              <ProductReviewsList productId={product.id} productName={product.name_ar} />
            )}

            {/* Options */}
            {relevantOptions?.map(option => (
              <div key={option.id} className="space-y-3">
                <Label className="text-base font-semibold font-arabic flex items-center gap-2">
                  {option.name_ar}
                  {option.is_required && (
                    <span className="text-xs text-destructive">*مطلوب</span>
                  )}
                </Label>
                <RadioGroup
                  value={selectedOptions[option.id]?.value_id || ''}
                  onValueChange={(value) => handleOptionChange(option.id, value)}
                  className="grid grid-cols-2 gap-2"
                >
                  {option.values.map(value => (
                    <div key={value.id}>
                      <RadioGroupItem
                        value={value.id}
                        id={value.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={value.id}
                        className="flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted"
                      >
                        <span className="font-arabic text-sm">{value.name_ar}</span>
                        {Number(value.price_modifier) > 0 && (
                          <span className="text-xs text-muted-foreground">
                            +{Number(value.price_modifier)} ر.س
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            {/* Quantity */}
            <div className="space-y-3">
              <Label className="text-base font-semibold font-arabic">الكمية</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>السعر الأساسي</span>
                <span>{Number(product.price)} ر.س</span>
              </div>
              {totalPriceModifier > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>الإضافات</span>
                  <span>+{totalPriceModifier} ر.س</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>الإجمالي</span>
                <span className="text-primary">{(finalPrice * quantity).toFixed(0)} ر.س</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full h-12 text-lg font-arabic"
              onClick={handleAddToCart}
            >
              إضافة إلى السلة
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
