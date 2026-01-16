import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductReviewsList } from '@/components/reviews/ProductReviewsList';
import { ProductReviewDialog } from '@/components/reviews/ProductReviewDialog';
import { useProductAverageRating, useMyReview } from '@/hooks/useProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ArrowRight, Star, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });

  const { average, count } = useProductAverageRating(productId);
  const { data: myReview } = useMyReview(productId);

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: product.id,
      name_ar: product.name_ar,
      price: Number(product.price),
      image_url: product.image_url || undefined,
    });
    
    toast.success(`تمت إضافة ${product.name_ar} إلى السلة`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <header className="bg-card border-b border-border p-4">
          <div className="container mx-auto flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background font-arabic flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">المنتج غير موجود</p>
          <Button onClick={() => navigate('/')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic pb-24" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border p-2 sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold truncate">{product.name_ar}</h1>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        {/* Product Image */}
        <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name_ar}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-coffee-light to-coffee-medium">
              <span className="text-8xl">☕</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{product.name_ar}</h2>
              {product.name_en && (
                <p className="text-muted-foreground text-sm">{product.name_en}</p>
              )}
            </div>
            <p className="text-2xl font-bold text-primary whitespace-nowrap">
              {Number(product.price).toFixed(0)} ر.س
            </p>
          </div>

          {/* Rating */}
          {count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(average)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{average.toFixed(1)}</span>
              <span className="text-muted-foreground">({count} تقييم)</span>
            </div>
          )}

          {/* Description */}
          {product.description_ar && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description_ar}
            </p>
          )}

          {/* Quantity Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">الكمية</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">التقييمات والمراجعات</h3>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewDialogOpen(true)}
              >
                {myReview ? 'تعديل تقييمي' : 'أضف تقييم'}
              </Button>
            )}
          </div>
          
          <ProductReviewsList productId={productId!} productName={product.name_ar} />
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20">
        <div className="container mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">الإجمالي</p>
            <p className="text-xl font-bold text-primary">
              {(Number(product.price) * quantity).toFixed(0)} ر.س
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={handleAddToCart}
            disabled={!product.is_available}
          >
            <ShoppingCart className="h-5 w-5" />
            أضف للسلة
          </Button>
        </div>
      </div>

      {/* Review Dialog */}
      <ProductReviewDialog
        productId={productId!}
        productName={product.name_ar}
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
      />
    </div>
  );
}
