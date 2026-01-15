import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsFavorite, useToggleFavorite, ProductType } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  productId: string;
  productType?: ProductType;
  variant?: 'icon' | 'badge';
  className?: string;
}

export function FavoriteButton({ 
  productId, 
  productType = 'main', 
  variant = 'icon',
  className 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { data: isFavorite, isLoading: checkingFavorite } = useIsFavorite(productId, productType);
  const toggleFavorite = useToggleFavorite();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.error('يجب تسجيل الدخول لإضافة المنتجات للمفضلة');
      return;
    }

    try {
      const result = await toggleFavorite.mutateAsync({ productId, productType });
      if (result.action === 'added') {
        toast.success('تمت الإضافة للمفضلة ❤️');
      } else {
        toast.success('تمت الإزالة من المفضلة');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const isLoading = checkingFavorite || toggleFavorite.isPending;

  if (variant === 'badge') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-full p-1.5 shadow-md transition-all hover:scale-110",
          isFavorite && "bg-red-500/90",
          className
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <motion.div
              key={isFavorite ? 'filled' : 'empty'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Heart 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite ? "fill-white text-white" : "text-muted-foreground hover:text-red-500"
                )} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "h-9 w-9 rounded-full transition-all",
        isFavorite && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <motion.div
            key={isFavorite ? 'filled' : 'empty'}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            whileTap={{ scale: 1.2 }}
          >
            <Heart 
              className={cn(
                "h-5 w-5 transition-all",
                isFavorite && "fill-current"
              )} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
