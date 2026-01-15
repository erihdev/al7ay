import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderReview {
  id: string;
  provider_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export function useProviderReviews(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProviderReview[];
    },
    enabled: !!providerId,
  });
}

export function useProviderRatingSummary(providerId: string | undefined) {
  const { data: reviews } = useProviderReviews(providerId);
  
  const summary: ProviderRatingSummary = {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  
  if (reviews && reviews.length > 0) {
    summary.totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    summary.averageRating = totalRating / reviews.length;
    
    reviews.forEach(r => {
      summary.ratingDistribution[r.rating] = (summary.ratingDistribution[r.rating] || 0) + 1;
    });
  }
  
  return summary;
}

export function useUserProviderReview(providerId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-provider-review', providerId, user?.id],
    queryFn: async () => {
      if (!providerId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('provider_reviews')
        .select('*')
        .eq('provider_id', providerId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProviderReview | null;
    },
    enabled: !!providerId && !!user?.id,
  });
}

export function useSubmitProviderReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      providerId, 
      rating, 
      comment 
    }: { 
      providerId: string; 
      rating: number; 
      comment?: string;
    }) => {
      if (!user?.id) throw new Error('يجب تسجيل الدخول أولاً');
      
      // Check if review exists
      const { data: existing } = await supabase
        .from('provider_reviews')
        .select('id')
        .eq('provider_id', providerId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Update existing review
        const { data, error } = await supabase
          .from('provider_reviews')
          .update({ rating, comment, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('provider_reviews')
          .insert({
            provider_id: providerId,
            user_id: user.id,
            rating,
            comment,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-reviews', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['user-provider-review', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['all-provider-ratings'] });
    },
  });
}

export function useDeleteProviderReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, providerId }: { reviewId: string; providerId: string }) => {
      const { error } = await supabase
        .from('provider_reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-reviews', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['user-provider-review', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['all-provider-ratings'] });
    },
  });
}

// Fetch ratings for multiple providers (for neighborhoods page)
export function useAllProviderRatings() {
  return useQuery({
    queryKey: ['all-provider-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_reviews')
        .select('provider_id, rating');
      
      if (error) throw error;
      
      // Group by provider and calculate averages
      const ratingsMap: Record<string, { total: number; count: number; average: number }> = {};
      
      data?.forEach(review => {
        if (!ratingsMap[review.provider_id]) {
          ratingsMap[review.provider_id] = { total: 0, count: 0, average: 0 };
        }
        ratingsMap[review.provider_id].total += review.rating;
        ratingsMap[review.provider_id].count += 1;
        ratingsMap[review.provider_id].average = 
          ratingsMap[review.provider_id].total / ratingsMap[review.provider_id].count;
      });
      
      return ratingsMap;
    },
  });
}
