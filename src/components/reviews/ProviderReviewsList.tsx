import { Star, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProviderReviews, useProviderRatingSummary } from '@/hooks/useProviderReviews';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderReviewsListProps {
  providerId: string;
}

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${
          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

const ProviderReviewsList = ({ providerId }: ProviderReviewsListProps) => {
  const { data: reviews, isLoading } = useProviderReviews(providerId);
  const summary = useProviderRatingSummary(providerId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Star className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
          <p className="text-sm text-muted-foreground">كن أول من يقيّم هذا المتجر!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-gradient-to-bl from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-amber-600">
                {summary.averageRating.toFixed(1)}
              </div>
              <div>
                <RatingStars rating={Math.round(summary.averageRating)} />
                <p className="text-sm text-muted-foreground mt-1">
                  {summary.totalReviews} تقييم
                </p>
              </div>
            </div>
            
            {/* Distribution */}
            <div className="hidden sm:flex flex-col gap-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.ratingDistribution[star] || 0;
                const percentage = summary.totalReviews > 0 
                  ? (count / summary.totalReviews) * 100 
                  : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <span className="w-6 text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <RatingStars rating={review.rating} />
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(review.created_at), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProviderReviewsList;
