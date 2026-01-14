import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { useCreateReview, useUpdateReview, useMyReview } from '@/hooks/useProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProductReviewDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductReviewDialog({ productId, productName, open, onOpenChange }: ProductReviewDialogProps) {
  const { user } = useAuth();
  const { data: existingReview } = useMyReview(productId);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingReview, open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('يرجى اختيار تقييم');
      return;
    }

    try {
      if (existingReview) {
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          productId,
          rating,
          comment,
        });
        toast.success('تم تحديث تقييمك');
      } else {
        await createReview.mutateAsync({
          productId,
          rating,
          comment,
        });
        toast.success('تم إضافة تقييمك');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const isPending = createReview.isPending || updateReview.isPending;

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-arabic">تسجيل الدخول مطلوب</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground font-arabic py-4">
            يجب تسجيل الدخول لإضافة تقييم
          </p>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="font-arabic">
              حسناً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-arabic">
            {existingReview ? 'تعديل تقييمك' : 'إضافة تقييم'} - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground font-arabic">اختر تقييمك</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium font-arabic">
              {rating === 1 && 'سيء'}
              {rating === 2 && 'مقبول'}
              {rating === 3 && 'جيد'}
              {rating === 4 && 'جيد جداً'}
              {rating === 5 && 'ممتاز'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium font-arabic">تعليقك (اختياري)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شاركنا رأيك في هذا المنتج..."
              className="min-h-[100px] font-arabic"
              dir="rtl"
            />
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isPending || rating === 0}
            className="font-arabic"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {existingReview ? 'تحديث التقييم' : 'إرسال التقييم'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-arabic"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
