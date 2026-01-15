import { Plus, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCustomizationDialog } from './ProductCustomizationDialog';
import { useProductAverageRating } from '@/hooks/useProductReviews';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { motion, AnimatePresence } from 'framer-motion';
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
        className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-card cursor-pointer relative"
        onClick={() => setIsCustomizing(true)}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name_ar}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-5xl">☕</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Cart quantity badge */}
          <AnimatePresence>
            {quantityInCart > 0 && (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-background"
              >
                <ShoppingCart className="h-3 w-3 mr-0.5" />
                {quantityInCart}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Favorite button */}
          <FavoriteButton 
            productId={product.id} 
            productType="main" 
            variant="badge" 
          />

          {/* Featured badge */}
          {product.is_featured && (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 shadow-lg text-[10px] px-2">
              <Star className="h-3 w-3 fill-white mr-1" />
              مميز
            </Badge>
          )}

          {/* Rating badge on image */}
          {count > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 right-2 bg-background/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-lg"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold">{average.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground">({count})</span>
            </motion.div>
          )}

          {/* Price tag */}
          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground rounded-full px-3 py-1 shadow-lg">
            <span className="font-bold text-sm">{Number(product.price).toFixed(0)} ر.س</span>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground font-arabic text-sm line-clamp-1">
                {product.name_ar}
              </h3>
              {product.description_ar && (
                <p className="text-xs text-muted-foreground font-arabic line-clamp-2 mt-1 leading-relaxed">
                  {product.description_ar}
                </p>
              )}
              
              {/* Stars row */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                }}
                className="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity"
              >
                {count > 0 ? (
                  <>
                    {renderStars(average)}
                    <span className="text-xs text-muted-foreground">({count} تقييم)</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground font-arabic">لا توجد تقييمات</span>
                )}
              </button>
            </div>

            <Button
              size="icon"
              variant="default"
              className="h-10 w-10 rounded-xl shrink-0 shadow-lg hover:scale-105 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setIsCustomizing(true);
              }}
            >
              <Plus className="h-5 w-5" />
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
