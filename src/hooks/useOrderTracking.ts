import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DeliveryTracking {
  id: string;
  order_id: string;
  current_lat: number;
  current_lng: number;
  heading: number;
  speed: number;
  updated_at: string;
}

interface RoutePoint {
  id: string;
  order_id: string;
  lat: number;
  lng: number;
  speed: number;
  recorded_at: string;
}

interface OrderWithTracking {
  id: string;
  status: string;
  order_type: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_address: string | null;
  tracking?: DeliveryTracking | null;
  routeHistory?: RoutePoint[];
}

export function useOrderTracking(orderId: string) {
  const queryClient = useQueryClient();
  const [realtimeTracking, setRealtimeTracking] = useState<DeliveryTracking | null>(null);
  const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);

  // Fetch initial order and tracking data
  const { data: order, isLoading } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, status, order_type, delivery_lat, delivery_lng, delivery_address')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: trackingData } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('order_id', orderId)
        .single();

      // Fetch route history
      const { data: historyData } = await supabase
        .from('delivery_route_history')
        .select('*')
        .eq('order_id', orderId)
        .order('recorded_at', { ascending: true });

      if (historyData) {
        setRouteHistory(historyData);
      }

      return {
        ...orderData,
        tracking: trackingData,
        routeHistory: historyData || [],
      } as OrderWithTracking;
    },
    enabled: !!orderId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!orderId) return;

    let trackingChannel: RealtimeChannel;
    let orderChannel: RealtimeChannel;
    let routeChannel: RealtimeChannel;

    // Subscribe to tracking updates
    trackingChannel = supabase
      .channel(`tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setRealtimeTracking(payload.new as DeliveryTracking);
          } else if (payload.eventType === 'DELETE') {
            setRealtimeTracking(null);
          }
        }
      )
      .subscribe();

    // Subscribe to order status updates
    orderChannel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['order-tracking', orderId] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    // Subscribe to route history updates
    routeChannel = supabase
      .channel(`route-history-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_route_history',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setRouteHistory(prev => [...prev, payload.new as RoutePoint]);
        }
      )
      .subscribe();

    return () => {
      trackingChannel.unsubscribe();
      orderChannel.unsubscribe();
      routeChannel.unsubscribe();
    };
  }, [orderId, queryClient]);

  // Merge initial tracking with realtime updates
  const currentTracking = realtimeTracking || order?.tracking || null;

  return {
    order,
    tracking: currentTracking,
    routeHistory,
    isLoading,
    isDelivery: order?.order_type === 'delivery',
    isOutForDelivery: order?.status === 'out_for_delivery',
  };
}

// Hook for admin to update delivery location
export function useUpdateDeliveryLocation() {
  const updateLocation = async (
    orderId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number
  ) => {
    const { data: existing } = await supabase
      .from('delivery_tracking')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('delivery_tracking')
        .update({
          current_lat: lat,
          current_lng: lng,
          heading: heading || 0,
          speed: speed || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('delivery_tracking')
        .insert({
          order_id: orderId,
          current_lat: lat,
          current_lng: lng,
          heading: heading || 0,
          speed: speed || 0,
        });

      if (error) throw error;
    }

    // Also record in route history (throttle to every 10 seconds approximately)
    await supabase.from('delivery_route_history').insert({
      order_id: orderId,
      lat,
      lng,
      speed: speed || 0,
    });
  };

  return { updateLocation };
}
