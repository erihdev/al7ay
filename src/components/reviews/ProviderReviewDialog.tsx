import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitProviderReview, useUserProviderReview, useDeleteProviderReview } from '@/hooks/useProviderReviews';
import { useAuth } from '@/contexts/AuthContext';

interface ProviderReviewDialogProps {
  providerId: string;
  providerName: string;
  trigger?: React.ReactNode;
}

const ProviderReviewDialog = ({ providerId, providerName, trigger }: ProviderReviewDialogProps) => {
  const { user } = useAuth();
  const { data: existingReview } = useUserProviderReview(providerId);
  const submitReview = useSubmitProviderReview();
  const deleteReview = useDeleteProviderReview();
  
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  // Update state when existing review loads
  useState(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    }
  });

  const handleSubmit = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول لإضافة تقييم');
      return;
    }
    
    if (rating === 0) {
      toast.error('يرجى اختيار تقييم');
      return;
    }

    try {
      await submitReview.mutateAsync({
        providerId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success(existingReview ? 'تم تحديث التقييم' : 'تم إضافة التقييم');
      setOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ التقييم');
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    
    try {
      await deleteReview.mutateAsync({ reviewId: existingReview.id, providerId });
      toast.success('تم حذف التقييم');
      setRating(0);
      setComment('');
      setOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف التقييم');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Star className="h-4 w-4" />
            {existingReview ? 'تعديل التقييم' : 'أضف تقييم'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {existingReview ? 'تعديل تقييمك' : 'تقييم'} {providerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            {rating === 0 && 'اختر تقييمك'}
            {rating === 1 && 'سيء جداً'}
            {rating === 2 && 'سيء'}
            {rating === 3 && 'متوسط'}
            {rating === 4 && 'جيد'}
            {rating === 5 && 'ممتاز'}
          </p>

          {/* Comment */}
          <Textarea
            placeholder="أضف تعليقاً (اختياري)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="resize-none"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={rating === 0 || submitReview.isPending}
              className="flex-1"
            >
              {submitReview.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : existingReview ? (
                'تحديث التقييم'
              ) : (
                'إرسال التقييم'
              )}
            </Button>
            
            {existingReview && (
              <Button 
                variant="outline" 
                onClick={handleDelete}
                disabled={deleteReview.isPending}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {deleteReview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حذف'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderReviewDialog;
