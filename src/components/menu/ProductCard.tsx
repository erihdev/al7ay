import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCustomizationDialog } from './ProductCustomizationDialog';
import { useProductAverageRating } from '@/hooks/useProductReviews';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items } = useCart();
  const navigate = useNavigate();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const { average, count } = useProductAverageRating(product.id);

  const cartItems = items.filter((item) => item.id.startsWith(product.id));
  const quantityInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Card 
        className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer"
        onClick={() => setIsCustomizing(true)}
      >
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name_ar}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-coffee-light to-coffee-medium">
              <span className="text-4xl">☕</span>
            </div>
          )}
          
          {quantityInCart > 0 && (
            <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-md">
              {quantityInCart}
            </div>
          )}
        </div>

        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground font-arabic text-sm truncate">
                {product.name_ar}
              </h3>
              {product.description_ar && (
                <p className="text-xs text-muted-foreground font-arabic line-clamp-1 mt-0.5">
                  {product.description_ar}
                </p>
              )}
              {count > 0 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${product.id}`);
                  }}
                  className="flex items-center gap-1 mt-1 hover:underline"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{average.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({count})</span>
                </button>
              )}
              <p className="text-primary font-bold mt-1 font-arabic">
                {Number(product.price).toFixed(0)} ر.س
              </p>
            </div>

            <Button
              size="icon"
              variant="default"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsCustomizing(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProductCustomizationDialog
        product={isCustomizing ? product : null}
        open={isCustomizing}
        onOpenChange={setIsCustomizing}
      />
    </>
  );
}
