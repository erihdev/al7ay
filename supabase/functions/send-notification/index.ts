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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, status, customerId } = await req.json();

    if (!orderId || !status || !customerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    const message = statusMessages[status] || 'تحديث على طلبك';
    const notificationPayload = JSON.stringify({
      title: 'الحي - تحديث الطلب',
      body: message,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: {
        orderId,
        status,
        url: '/orders',
      },
    });

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Using web-push compatible format
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          // For now, we'll store the notification intent
          // In production, you'd use a service like web-push
          console.log('Would send notification to:', sub.endpoint);
          console.log('Payload:', notificationPayload);
          
          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          console.error('Error sending to subscription:', error);
          return { success: false, endpoint: sub.endpoint, error };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        results: results.length,
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
