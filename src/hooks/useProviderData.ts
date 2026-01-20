import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StoreTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  header_style: 'solid' | 'gradient' | 'transparent' | 'image';
  header_image_url?: string;
  header_overlay_opacity?: number;
  header_blur?: boolean;
  font_family: string;
  border_radius: 'none' | 'small' | 'medium' | 'large' | 'full';
  button_style: 'square' | 'rounded' | 'pill';
}

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
  delivery_scope: 'neighborhood' | 'city';
  store_lat: number | null;
  store_lng: number | null;
  delivery_radius_km: number;
  store_settings: {
    primary_color: string;
    accent_color: string;
  } | null;
  store_theme: StoreTheme | null;
  freelance_certificate_url: string | null;
  bank_name: string | null;
  iban: string | null;
  national_address: string | null;
  is_payment_verified: boolean;
  commission_rate: number;
  payment_method: 'direct_gateway' | 'platform_managed';
  gateway_account_id: string | null;
  gateway_approval_url: string | null;
  payout_frequency: 'weekly' | 'monthly';
  last_payout_date: string | null;
  pending_payout: number;
  edfapay_credentials_verified: boolean | null;
  edfapay_merchant_id_encrypted: string | null;
  edfapay_verified_at: string | null;
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
      return data ? {
        ...data,
        store_settings: data.store_settings as ServiceProvider['store_settings'],
        store_theme: data.store_theme as unknown as ServiceProvider['store_theme']
      } as ServiceProvider : null;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('service_providers')
        .update(data as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
  });
}
