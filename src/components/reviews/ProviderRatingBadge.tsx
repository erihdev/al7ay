import { Star } from 'lucide-react';

interface ProviderRatingBadgeProps {
  averageRating: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const ProviderRatingBadge = ({ 
  averageRating, 
  totalReviews, 
  size = 'md',
  showCount = true 
}: ProviderRatingBadgeProps) => {
  if (totalReviews === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Star className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} text-gray-300`} />
        <span className={`${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          لا توجد تقييمات
        </span>
      </div>
    );
  }

  const sizeClasses = {
    sm: { star: 'h-3 w-3', text: 'text-xs', gap: 'gap-0.5' },
    md: { star: 'h-4 w-4', text: 'text-sm', gap: 'gap-1' },
    lg: { star: 'h-5 w-5', text: 'text-base', gap: 'gap-1.5' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.gap}`}>
      <Star className={`${classes.star} fill-yellow-400 text-yellow-400`} />
      <span className={`font-bold ${classes.text}`}>
        {averageRating.toFixed(1)}
      </span>
      {showCount && (
        <span className={`text-muted-foreground ${classes.text}`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default ProviderRatingBadge;
