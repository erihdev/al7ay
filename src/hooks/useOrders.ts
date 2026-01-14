import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];
type OrderType = Database['public']['Enums']['order_type'];

interface CreateOrderData {
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  order_type: OrderType;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_address?: string;
  notes?: string;
  points_redeemed?: number;
  discount_amount?: number;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export function useMyOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orders', 'my-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      if (!user) throw new Error('User must be logged in');

      // Get store settings for points calculation
      const { data: settings } = await supabase
        .from('store_settings')
        .select('points_per_order')
        .limit(1)
        .single();

      const pointsEarned = settings?.points_per_order || 10;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          total_amount: orderData.total_amount,
          order_type: orderData.order_type,
          delivery_lat: orderData.delivery_lat,
          delivery_lng: orderData.delivery_lng,
          delivery_address: orderData.delivery_address,
          notes: orderData.notes,
          points_earned: pointsEarned,
          points_redeemed: orderData.points_redeemed || 0,
          discount_amount: orderData.discount_amount || 0,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderData.items.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          }))
        );

      if (itemsError) throw itemsError;

      // Update loyalty points
      const { data: currentPoints } = await supabase
        .from('loyalty_points')
        .select('total_points, lifetime_points')
        .eq('user_id', user.id)
        .single();

      if (currentPoints) {
        const newTotal = currentPoints.total_points + pointsEarned - (orderData.points_redeemed || 0);
        const newLifetime = currentPoints.lifetime_points + pointsEarned;

        await supabase
          .from('loyalty_points')
          .update({
            total_points: newTotal,
            lifetime_points: newLifetime,
          })
          .eq('user_id', user.id);

        // Record points history
        if (pointsEarned > 0) {
          await supabase.from('points_history').insert({
            user_id: user.id,
            order_id: order.id,
            points_change: pointsEarned,
            transaction_type: 'earned',
            description: `نقاط مكتسبة من الطلب رقم ${order.id.slice(0, 8)}`,
          });
        }

        if (orderData.points_redeemed && orderData.points_redeemed > 0) {
          await supabase.from('points_history').insert({
            user_id: user.id,
            order_id: order.id,
            points_change: -orderData.points_redeemed,
            transaction_type: 'redeemed',
            description: `نقاط مستبدلة في الطلب رقم ${order.id.slice(0, 8)}`,
          });
        }
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
    },
  });
}

export function useLoyaltyPoints() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-points', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no record exists, return default
        if (error.code === 'PGRST116') {
          return { total_points: 0, lifetime_points: 0 };
        }
        throw error;
      }
      return data;
    },
    enabled: !!user,
  });
}

export function usePointsHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['points-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
