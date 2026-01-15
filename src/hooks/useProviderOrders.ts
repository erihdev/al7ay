import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options: any;
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
  notes: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  provider_order_items?: ProviderOrderItem[];
  service_providers?: {
    id: string;
    business_name: string;
    logo_url: string | null;
    phone: string | null;
    neighborhood_id: string | null;
    store_lat: number | null;
    store_lng: number | null;
    active_neighborhoods?: {
      lat: number;
      lng: number;
    } | null;
  };
}

// Hook for customers to view their orders from providers
export function useMyProviderOrders() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-provider-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('provider_orders')
        .select(`
          *,
          provider_order_items (*),
          service_providers (
            id,
            business_name,
            logo_url,
            phone,
            neighborhood_id,
            store_lat,
            store_lng,
            active_neighborhoods (
              lat,
              lng
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProviderOrder[];
    },
    enabled: !!user?.id,
  });
}

// Hook for providers to view orders for their store
export function useProviderOrders(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-orders', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_orders')
        .select(`
          *,
          provider_order_items (*)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProviderOrder[];
    },
    enabled: !!providerId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook for providers to update order status
export function useUpdateProviderOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data, error } = await supabase
        .from('provider_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['provider-orders', data.provider_id] });
      queryClient.invalidateQueries({ queryKey: ['my-provider-orders'] });
    },
  });
}

// Real-time subscription hook for customer order updates
export function useProviderOrderRealtime(orderId: string | undefined, onUpdate?: (order: ProviderOrder) => void) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['provider-order-realtime', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      // Set up realtime subscription
      const channel = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'provider_orders',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            const updatedOrder = payload.new as ProviderOrder;
            queryClient.setQueryData(['provider-order-realtime', orderId], updatedOrder);
            onUpdate?.(updatedOrder);
          }
        )
        .subscribe();
      
      // Fetch initial data
      const { data, error } = await supabase
        .from('provider_orders')
        .select(`
          *,
          provider_order_items (*),
          service_providers (
            id,
            business_name,
            logo_url,
            phone,
            neighborhood_id,
            store_lat,
            store_lng,
            active_neighborhoods (
              lat,
              lng
            )
          )
        `)
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      
      return data as ProviderOrder;
    },
    enabled: !!orderId,
    staleTime: Infinity, // Don't refetch, rely on realtime
  });
}
