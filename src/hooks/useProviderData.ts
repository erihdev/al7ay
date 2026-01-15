import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServiceProvider {
  id: string;
  user_id: string;
  application_id: string | null;
  business_name: string;
  business_name_en: string | null;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  email: string;
  neighborhood_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  subscription_status: string | null;
  store_settings: {
    primary_color: string;
    accent_color: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderProduct {
  id: string;
  provider_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderOrder {
  id: string;
  provider_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: string;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProviderProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['provider-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ServiceProvider | null;
    },
    enabled: !!user,
  });
}

export function useProviderProducts(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-products', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_products')
        .select('*')
        .eq('provider_id', providerId)
        .order('sort_order');
      
      if (error) throw error;
      return data as ProviderProduct[];
    },
    enabled: !!providerId,
  });
}

export function useProviderOrders(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-orders', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_orders')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProviderOrder[];
    },
    enabled: !!providerId,
  });
}

export function useCreateProviderProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<ProviderProduct, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('provider_products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-products', variables.provider_id] });
    },
  });
}

export function useUpdateProviderProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, providerId, data }: { id: string; providerId: string; data: Partial<ProviderProduct> }) => {
      const { error } = await supabase
        .from('provider_products')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-products', variables.providerId] });
    },
  });
}

export function useDeleteProviderProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, providerId }: { id: string; providerId: string }) => {
      const { error } = await supabase
        .from('provider_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-products', variables.providerId] });
    },
  });
}

export function useUpdateProviderOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, providerId, status }: { id: string; providerId: string; status: string }) => {
      const { error } = await supabase
        .from('provider_orders')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-orders', variables.providerId] });
    },
  });
}

export function useUpdateProviderProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceProvider> }) => {
      const { error } = await supabase
        .from('service_providers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
  });
}
