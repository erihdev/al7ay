import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Star, MessageSquare, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProductReviewsProps {
  productId: string;
  primaryColor?: string;
}

const ProductReviews = ({ productId, primaryColor = '#1B4332' }: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['provider-product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Check if user has already reviewed
  const { data: userReview } = useQuery({
    queryKey: ['user-product-review', productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('provider_product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('provider_product_reviews')
          .update({ rating, comment: comment || null })
          .eq('id', userReview.id);
        
        if (error) throw error;
      } else {
        // Create new review
        const { error } = await supabase
          .from('provider_product_reviews')
          .insert({
            product_id: productId,
            user_id: user.id,
            rating,
            comment: comment || null
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['user-product-review', productId, user?.id] });
      toast.success(userReview ? 'تم تحديث تقييمك' : 'شكراً لتقييمك!');
      setIsDialogOpen(false);
      setComment('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء إرسال التقييم');
    }
  });

  // Calculate average rating
  const averageRating = reviews?.length 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${interactive ? 'cursor-pointer' : ''} ${
              star <= (interactive ? (hoveredRating || rating) : value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            }`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold">{averageRating}</span>
          </div>
          <span className="text-muted-foreground">
            ({reviews?.length || 0} تقييم)
          </span>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="font-arabic"
              disabled={!user}
            >
              <MessageSquare className="h-4 w-4 ml-2" />
              {userReview ? 'تعديل تقييمي' : 'أضف تقييم'}
            </Button>
          </DialogTrigger>
          
          <DialogContent dir="rtl" className="font-arabic">
            <DialogHeader>
              <DialogTitle className="font-arabic">
                {userReview ? 'تعديل تقييمك' : 'إضافة تقييم'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">ما تقييمك لهذا المنتج؟</p>
                <div className="flex justify-center">
                  {renderStars(rating, true)}
                </div>
              </div>

              <Textarea
                placeholder="اكتب تعليقك (اختياري)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="font-arabic"
              />
            </div>

            <DialogFooter>
              <Button
                onClick={() => submitReview.mutate()}
                disabled={submitReview.isPending}
                style={{ backgroundColor: primaryColor }}
                className="font-arabic"
              >
                {submitReview.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إرسال التقييم'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!user && (
        <p className="text-sm text-muted-foreground text-center bg-muted p-3 rounded-lg">
          سجّل دخولك لتتمكن من إضافة تقييم
        </p>
      )}

      {/* Reviews List */}
      {reviews?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              لا توجد تقييمات بعد. كن أول من يقيّم!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews?.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'dd MMM yyyy', { locale: ar })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
