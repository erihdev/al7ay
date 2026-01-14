import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpecialOffer {
  id: string;
  product_id: string;
  discount_percentage: number;
  original_price: number;
  offer_price: number;
  title_ar: string;
  title_en: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  products?: {
    id: string;
    name_ar: string;
    name_en: string | null;
    image_url: string | null;
  };
}

export function useActiveOffers() {
  return useQuery({
    queryKey: ['special-offers', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_offers')
        .select(`
          *,
          products (id, name_ar, name_en, image_url)
        `)
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .lte('starts_at', new Date().toISOString())
        .order('ends_at', { ascending: true });

      if (error) throw error;
      return data as SpecialOffer[];
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useAllOffers() {
  return useQuery({
    queryKey: ['special-offers', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_offers')
        .select(`
          *,
          products (id, name_ar, name_en, image_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SpecialOffer[];
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: {
      product_id: string;
      discount_percentage: number;
      original_price: number;
      offer_price: number;
      title_ar: string;
      title_en?: string;
      starts_at: string;
      ends_at: string;
    }) => {
      const { data, error } = await supabase
        .from('special_offers')
        .insert(offer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...offer }: Partial<SpecialOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from('special_offers')
        .update(offer)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('special_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });
}
