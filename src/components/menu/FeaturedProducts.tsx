import { useFeaturedProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-44 h-56 shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!products?.length) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 rounded-xl shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold font-arabic text-foreground">المميز</h2>
            <p className="text-xs text-muted-foreground">{products.length} منتجات مميزة</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>اسحب للمزيد</span>
          <ChevronLeft className="h-4 w-4 animate-pulse" />
        </div>
      </div>
      
      {/* Products Carousel */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 snap-x snap-mandatory">
        {products.map((product, index) => (
          <motion.div 
            key={product.id} 
            className="w-44 shrink-0 snap-start"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
