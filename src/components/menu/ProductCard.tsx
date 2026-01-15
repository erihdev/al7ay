import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCustomizationDialog } from './ProductCustomizationDialog';
import { useProductAverageRating } from '@/hooks/useProductReviews';
import { motion } from 'framer-motion';
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

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 transition-colors ${
            star <= Math.round(rating) 
              ? 'fill-amber-400 text-amber-400' 
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );

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
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-md"
            >
              {quantityInCart}
            </motion.div>
          )}

          {/* Rating badge on image */}
          {count > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-md"
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold">{average.toFixed(1)}</span>
            </motion.div>
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
              
              {/* Stars and rating */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                }}
                className="flex items-center gap-1.5 mt-1.5 hover:opacity-80 transition-opacity"
              >
                {count > 0 ? (
                  <>
                    {renderStars(average)}
                    <span className="text-xs text-muted-foreground">({count})</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground font-arabic">لا توجد تقييمات</span>
                )}
              </button>

              <p className="text-primary font-bold mt-1.5 font-arabic text-base">
                {Number(product.price).toFixed(0)} ر.س
              </p>
            </div>

            <Button
              size="icon"
              variant="default"
              className="h-9 w-9 rounded-full shrink-0 shadow-md"
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
