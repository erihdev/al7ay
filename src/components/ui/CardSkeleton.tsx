import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  className?: string;
  variant?: 'product' | 'simple' | 'featured';
}

export function CardSkeleton({ className, variant = 'product' }: CardSkeletonProps) {
  if (variant === 'simple') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "rounded-lg border bg-card p-4 overflow-hidden",
          className
        )}
      >
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: '70%' }} />
          <div className="h-3 bg-muted rounded animate-shimmer" style={{ width: '50%' }} />
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "rounded-xl border bg-card overflow-hidden",
          className
        )}
      >
        <div className="aspect-video bg-muted animate-shimmer" />
        <div className="p-4 space-y-3">
          <div className="h-5 bg-muted rounded animate-shimmer" style={{ width: '80%' }} />
          <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: '60%' }} />
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 bg-muted rounded animate-shimmer" style={{ width: '30%' }} />
            <div className="h-8 w-8 bg-muted rounded-full animate-shimmer" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Default product variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-lg border bg-card overflow-hidden",
        className
      )}
    >
      {/* Image skeleton */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: 'linear',
            repeatDelay: 0.5 
          }}
        />
      </div>
      
      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: '85%' }} />
        <div className="h-3 bg-muted rounded animate-shimmer" style={{ width: '60%' }} />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-muted rounded animate-shimmer" style={{ width: '35%' }} />
          <div className="h-7 w-7 bg-muted rounded-full animate-shimmer" />
        </div>
      </div>
    </motion.div>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ProductGridSkeleton({ count = 6, className }: ProductGridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton 
          key={i} 
          variant="product"
        />
      ))}
    </div>
  );
}
