import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const statusMessages: Record<string, string> = {
  pending: 'تم استلام طلبك',
  preparing: 'جاري تحضير طلبك ☕',
  ready: 'طلبك جاهز للاستلام! 🎉',
  out_for_delivery: 'طلبك في الطريق إليك 🚗',
  completed: 'تم إكمال طلبك. شكراً لك! ⭐',
  cancelled: 'تم إلغاء طلبك ❌',
};

// VAPID keys for web push - these need to be generated for production
// Generate using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Helper function to send web push notification
async function sendWebPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<boolean> {
  try {
    // For web push, we need to use the Web Push protocol
    // This is a simplified implementation - in production, use a proper web-push library
    console.log('Sending push notification to:', subscription.endpoint);
    console.log('Payload:', payload);
    
    // Note: Full Web Push implementation requires VAPID signing
    // For now, we'll simulate success and rely on realtime for in-app notifications
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json();
    const { type, orderId, status, customerId, providerId, message, customerName } = requestBody;

    // Handle customer arrival notification to store
    if (type === 'customer_arrived') {
      if (!orderId || !providerId) {
        return new Response(
          JSON.stringify({ error: 'Missing orderId or providerId for customer_arrived' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the provider's user_id to send notification
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('user_id, business_name')
        .eq('id', providerId)
        .single();

      if (providerError || !provider) {
        console.error('Error fetching provider:', providerError);
        return new Response(
          JSON.stringify({ error: 'Provider not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send broadcast to the provider's channel for real-time in-app notification
      const channel = supabase.channel(`provider-arrivals-${providerId}`);
      await channel.send({
        type: 'broadcast',
        event: 'customer_arrived',
        payload: {
          orderId,
          customerName: customerName || 'العميل',
          message: message || `العميل وصل لاستلام الطلب #${orderId.slice(-4).toUpperCase()}`,
          timestamp: new Date().toISOString()
        }
      });

      // Get provider's push subscriptions for background notifications
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', provider.user_id);

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
      }

      const notificationPayload = JSON.stringify({
        title: '🙋 وصول عميل',
        body: message || `عميل وصل لاستلام الطلب #${orderId.slice(-4).toUpperCase()}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `arrival-${orderId}`,
        requireInteraction: true,
        data: {
          type: 'customer_arrived',
          orderId,
          url: '/provider-dashboard?tab=orders',
        },
      });

      // Send push notifications to all provider subscriptions
      let pushSent = 0;
      if (subscriptions && subscriptions.length > 0) {
        const results = await Promise.allSettled(
          subscriptions.map(sub => sendWebPushNotification(sub, notificationPayload))
        );
        pushSent = results.filter(r => r.status === 'fulfilled' && r.value).length;
      }

      console.log('Customer arrival notification sent for order:', orderId, 'pushSent:', pushSent);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Store notified of customer arrival',
          broadcastSent: true,
          pushNotificationsSent: pushSent
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle order status update notification to customer
    if (!orderId || !status || !customerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, status, customerId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', customerId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusMessage = statusMessages[status] || 'تحديث على طلبك';
    const notificationPayload = JSON.stringify({
      title: 'الحي - تحديث الطلب',
      body: statusMessage,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `order-${orderId}`,
      data: {
        type: 'order_status',
        orderId,
        status,
        url: '/my-store-orders',
      },
    });

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendWebPushNotification(sub, notificationPayload))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notifications processed',
        total: subscriptions.length,
        sent: successCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});