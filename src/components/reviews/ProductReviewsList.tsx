import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Trash2, Edit2, MessageSquare, Loader2 } from 'lucide-react';
import { useProductReviews, useProductAverageRating, useDeleteReview } from '@/hooks/useProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { ProductReviewDialog } from './ProductReviewDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductReviewsListProps {
  productId: string;
  productName: string;
}

export function ProductReviewsList({ productId, productName }: ProductReviewsListProps) {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useProductReviews(productId);
  const { average, count } = useProductAverageRating(productId);
  const deleteReview = useDeleteReview();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteReviewId) return;
    try {
      await deleteReview.mutateAsync({ reviewId: deleteReviewId, productId });
      toast.success('تم حذف التقييم');
      setDeleteReviewId(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-arabic">
            <MessageSquare className="h-5 w-5" />
            التقييمات ({count})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="font-arabic"
          >
            <Star className="h-4 w-4 ml-2" />
            أضف تقييمك
          </Button>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(average))}
              <span className="font-bold text-lg">{average.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground font-arabic">
              ({count} تقييم)
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-arabic">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد تقييمات بعد</p>
            <p className="text-sm mt-1">كن أول من يقيّم هذا المنتج!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews?.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium font-arabic">
                        {review.profiles?.full_name || 'مستخدم'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(new Date(review.created_at), 'dd MMM yyyy', { locale: ar })}
                    </p>
                    {review.comment && (
                      <p className="text-sm font-arabic">{review.comment}</p>
                    )}
                  </div>

                  {user?.id === review.user_id && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDialogOpen(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteReviewId(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ProductReviewDialog
        productId={productId}
        productName={productName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">حذف التقييم</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف تقييمك؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="font-arabic">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-arabic"
            >
              {deleteReview.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
