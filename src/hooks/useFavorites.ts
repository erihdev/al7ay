import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ProductType = 'main' | 'provider';

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  product_type: ProductType;
  created_at: string;
}

export function useFavorites(productType?: ProductType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id, productType],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (productType) {
        query = query.eq('product_type', productType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });
}

export function useIsFavorite(productId: string, productType: ProductType = 'main') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-favorite', productId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('product_type', productType)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!productId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, productType = 'main' }: { productId: string; productType?: ProductType }) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      // Check if already favorited
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('product_type', productType)
        .maybeSingle();

      if (existing) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            product_id: productId,
            product_type: productType,
          });
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorite', variables.productId] });
    },
  });
}

export function useFavoritesWithProducts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites-with-products', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all favorites
      const { data: favorites, error: favError } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favError) throw favError;
      if (!favorites || favorites.length === 0) return [];

      // Get main products
      const mainProductIds = favorites
        .filter(f => f.product_type === 'main')
        .map(f => f.product_id);

      // Get provider products
      const providerProductIds = favorites
        .filter(f => f.product_type === 'provider')
        .map(f => f.product_id);

      const [mainProducts, providerProducts] = await Promise.all([
        mainProductIds.length > 0
          ? supabase.from('products').select('*').in('id', mainProductIds)
          : { data: [] },
        providerProductIds.length > 0
          ? supabase.from('provider_products').select('*').in('id', providerProductIds)
          : { data: [] },
      ]);

      // Combine with favorite info
      return favorites.map(fav => {
        const product = fav.product_type === 'main'
          ? mainProducts.data?.find(p => p.id === fav.product_id)
          : providerProducts.data?.find(p => p.id === fav.product_id);
        
        return {
          ...fav,
          product,
        };
      }).filter(f => f.product); // Only return items with valid products
    },
    enabled: !!user,
  });
}
