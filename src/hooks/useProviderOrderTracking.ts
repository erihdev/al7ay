import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ProviderDeliveryTracking {
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

interface ProviderOrderWithTracking {
  id: string;
  status: string;
  order_type: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_address: string | null;
  provider_id: string;
  tracking?: ProviderDeliveryTracking | null;
  routeHistory?: RoutePoint[];
  service_providers?: {
    id: string;
    business_name: string;
    logo_url: string | null;
    phone: string | null;
    neighborhood_id: string | null;
    active_neighborhoods?: {
      lat: number;
      lng: number;
    } | null;
  };
}

// Hook for customers to track their provider orders
export function useProviderOrderTracking(orderId: string) {
  const queryClient = useQueryClient();
  const [realtimeTracking, setRealtimeTracking] = useState<ProviderDeliveryTracking | null>(null);
  const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);

  // Fetch initial order and tracking data
  const { data: order, isLoading } = useQuery({
    queryKey: ['provider-order-tracking', orderId],
    queryFn: async () => {
      const { data: orderData, error: orderError } = await supabase
        .from('provider_orders')
        .select(`
          id, status, order_type, delivery_lat, delivery_lng, delivery_address, provider_id,
          service_providers (
            id,
            business_name,
            logo_url,
            phone,
            neighborhood_id,
            active_neighborhoods (
              lat,
              lng
            )
          )
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) return null;

      // Fetch tracking data
      const { data: trackingData } = await supabase
        .from('provider_delivery_tracking')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      // Fetch route history
      const { data: historyData } = await supabase
        .from('provider_delivery_route_history')
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
      } as ProviderOrderWithTracking;
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
      .channel(`provider-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_delivery_tracking',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setRealtimeTracking(payload.new as ProviderDeliveryTracking);
          } else if (payload.eventType === 'DELETE') {
            setRealtimeTracking(null);
          }
        }
      )
      .subscribe();

    // Subscribe to order status updates
    orderChannel = supabase
      .channel(`provider-order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'provider_orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['provider-order-tracking', orderId] });
          queryClient.invalidateQueries({ queryKey: ['my-provider-orders'] });
        }
      )
      .subscribe();

    // Subscribe to route history updates
    routeChannel = supabase
      .channel(`provider-route-history-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'provider_delivery_route_history',
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
    storeLocation: order?.service_providers?.active_neighborhoods ? {
      lat: order.service_providers.active_neighborhoods.lat,
      lng: order.service_providers.active_neighborhoods.lng
    } : null,
  };
}

// Hook for providers to update delivery location
export function useUpdateProviderDeliveryLocation() {
  const updateLocation = async (
    orderId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number
  ) => {
    // Check if tracking record exists
    const { data: existing } = await supabase
      .from('provider_delivery_tracking')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('provider_delivery_tracking')
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
        .from('provider_delivery_tracking')
        .insert({
          order_id: orderId,
          current_lat: lat,
          current_lng: lng,
          heading: heading || 0,
          speed: speed || 0,
        });

      if (error) throw error;
    }

    // Also record in route history
    await supabase.from('provider_delivery_route_history').insert({
      order_id: orderId,
      lat,
      lng,
      speed: speed || 0,
    });
  };

  const stopTracking = async (orderId: string) => {
    // Delete tracking record when delivery is complete
    await supabase
      .from('provider_delivery_tracking')
      .delete()
      .eq('order_id', orderId);
  };

  return { updateLocation, stopTracking };
}
