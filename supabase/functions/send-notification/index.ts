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

// Send Aimtell push notification using attributes for targeting
async function sendAimtellNotification(
  title: string,
  body: string,
  url: string,
  attributes?: Record<string, string>
): Promise<boolean> {
  const apiKey = Deno.env.get('AIMTELL_API_KEY');
  const siteId = Deno.env.get('AIMTELL_SITE_ID');

  if (!apiKey || !siteId) {
    console.log('Aimtell credentials not configured');
    return false;
  }

  try {
    // Build payload with attributes for targeted delivery
    const payload: Record<string, any> = {
      idSite: siteId,
      title: title,
      body: body,
      link: url,
      requireInteraction: true,
      icon: 'https://al7ay.lovable.app/icons/icon-192.png',
    };
    
    // Add attributes for targeting specific subscribers
    if (attributes && Object.keys(attributes).length > 0) {
      payload.attributes = attributes;
    }
    
    console.log('Sending Aimtell notification with payload:', JSON.stringify(payload));
    
    // Try multiple authentication methods for Aimtell API
    const response = await fetch('https://api.aimtell.com/prod/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    // If Bearer auth fails, try with token in body
    if (!response.ok) {
      const responseText = await response.text();
      console.log('Bearer auth failed, trying with token in payload:', responseText);
      
      const payloadWithToken = {
        ...payload,
        token: apiKey,
      };
      
      const retryResponse = await fetch('https://api.aimtell.com/prod/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadWithToken),
      });
      
      const retryText = await retryResponse.text();
      if (retryResponse.ok) {
        console.log('Aimtell notification sent with token in body. Response:', retryText);
        return true;
      } else {
        console.error('Aimtell API error with token in body:', retryResponse.status, retryText);
        return false;
      }
    }

    const responseText = await response.text();
    
    if (response.ok) {
      console.log('Aimtell notification sent successfully. Response:', responseText);
      return true;
    } else {
      console.error('Aimtell API error:', response.status, responseText);
      return false;
    }
  } catch (error) {
    console.error('Error sending Aimtell notification:', error);
    return false;
  }
}

// Helper function for realtime broadcast
async function sendRealtimeBroadcast(
  supabase: any,
  channelName: string,
  event: string,
  payload: any
): Promise<boolean> {
  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: event,
      payload: payload
    });
    return true;
  } catch (error) {
    console.error('Error sending realtime broadcast:', error);
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
    const { type, orderId, status, customerId, providerId, message, customerName, totalAmount, orderType } = requestBody;

    // Handle new order notification to provider
    if (type === 'new_order') {
      if (!orderId || !providerId) {
        return new Response(
          JSON.stringify({ error: 'Missing orderId or providerId for new_order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the provider's info
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

      const orderTypeLabel = orderType === 'delivery' ? 'توصيل 🚗' : 'استلام 📦';
      const notificationTitle = `🔔 طلب جديد - ${orderTypeLabel}`;
      const notificationBody = `طلب من ${customerName || 'عميل'} - ${totalAmount || 0} ر.س`;

      // Send realtime broadcast for in-app notification
      await sendRealtimeBroadcast(
        supabase,
        `provider-new-orders-${providerId}`,
        'new_order',
        {
          orderId,
          customerName: customerName || 'عميل',
          totalAmount,
          orderType,
          timestamp: new Date().toISOString()
        }
      );

      // Send Aimtell push notification for background notification
      const aimtellSent = await sendAimtellNotification(
        notificationTitle,
        notificationBody,
        `/provider-dashboard?tab=orders`,
        { provider_id: providerId }
      );

      console.log('New order notification sent for order:', orderId, 'aimtellSent:', aimtellSent);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Provider notified of new order',
          broadcastSent: true,
          aimtellSent: aimtellSent
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

      const arrivalMessage = message || `العميل وصل لاستلام الطلب #${orderId.slice(-4).toUpperCase()}`;

      // Send broadcast to the provider's channel for real-time in-app notification
      await sendRealtimeBroadcast(
        supabase,
        `provider-arrivals-${providerId}`,
        'customer_arrived',
        {
          orderId,
          customerName: customerName || 'العميل',
          message: arrivalMessage,
          timestamp: new Date().toISOString()
        }
      );

      // Send Aimtell push notification for background notification
      const aimtellSent = await sendAimtellNotification(
        '🙋 وصول عميل',
        arrivalMessage,
        `/provider-dashboard?tab=orders`,
        { provider_id: providerId }
      );

      console.log('Customer arrival notification sent for order:', orderId, 'aimtellSent:', aimtellSent);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Store notified of customer arrival',
          broadcastSent: true,
          aimtellSent: aimtellSent
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle order status update notification to customer
    if (type === 'order_status' || (!type && orderId && status && customerId)) {
      if (!orderId || !status || !customerId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: orderId, status, customerId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const statusMessage = statusMessages[status] || 'تحديث على طلبك';

      // Send Aimtell push notification for customer
      const aimtellSent = await sendAimtellNotification(
        'الحي - تحديث الطلب',
        statusMessage,
        `/my-store-orders`,
        { customer_id: customerId }
      );

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Customer notification sent',
          aimtellSent: aimtellSent,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid notification type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});