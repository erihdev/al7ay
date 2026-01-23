import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Status messages for customer notifications
// Only these statuses will trigger push notifications to reduce notification spam
const statusMessages: Record<string, string> = {
  ready: 'طلبك جاهز للاستلام! ✅',
  out_for_delivery: 'طلبك في الطريق إليك 🚗',
  completed: 'تم تسليم طلبك بنجاح 🎉',
  cancelled: 'تم إلغاء طلبك ❌',
};

// Statuses that should NOT trigger push notifications to customers
// pending and preparing are silent - customer can check in-app
const silentStatuses = ['pending', 'preparing'];

// Send Web Push notification using VAPID
async function sendWebPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<boolean> {
  try {
    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return false;
    }

    console.log(`Found ${subscriptions.length} push subscriptions for user:`, userId);

    // Call send-webpush edge function for each subscription
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-webpush`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        icon: 'https://al7ay.lovable.app/icons/icon-192.png',
        url,
      }),
    });

    if (response.ok) {
      console.log('Web Push sent successfully to user:', userId);
      return true;
    } else {
      console.error('Web Push failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error sending Web Push:', error);
    return false;
  }
}

// Send Aimtell push notification using alias for targeting
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
    // Build payload for notification
    // Reference: https://developers.aimtell.com/reference/api-send-push-notification
    const payload: Record<string, any> = {
      idSite: siteId,
      title: title,
      body: body,
      link: url,
      requireInteraction: true,
      icon: 'https://al7ay.lovable.app/icons/icon-192.png',
    };
    
    // Add alias for targeting - format must be "user==VALUE" as per Aimtell docs
    // Reference: https://developers.aimtell.com/reference/api-send-push-notification#option-3
    if (attributes) {
      if (attributes.provider_id) {
        payload.alias = `user==${attributes.provider_id}`;
      } else if (attributes.customer_id) {
        payload.alias = `user==${attributes.customer_id}`;
      }
    }
    
    console.log('Sending Aimtell notification with payload:', JSON.stringify(payload));
    
    // Use X-Authorization header and /prod/push endpoint
    // Reference: https://developers.aimtell.com/reference/api-send-push-notification
    const response = await fetch('https://api.aimtell.com/prod/push', {
      method: 'POST',
      headers: {
        'X-Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Aimtell API response:', response.status, responseText);
    
    // Check if request was successful
    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.result === 'success') {
          console.log('Aimtell notification sent successfully');
          return true;
        } else {
          console.error('Aimtell API returned error:', jsonResponse);
          return false;
        }
      } catch {
        // If not JSON, just check HTTP status
        console.log('Aimtell notification sent (non-JSON response)');
        return true;
      }
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

    // Helper function to log notifications
    async function logNotification(params: {
      recipientId?: string;
      recipientType: string;
      title: string;
      body: string;
      notificationType: string;
      sentVia: string[];
      isBulk: boolean;
      bulkRecipientsCount?: number;
      status: string;
      errorMessage?: string;
    }) {
      try {
        await supabase.from('notifications_log').insert({
          recipient_id: params.recipientId || null,
          recipient_type: params.recipientType,
          title: params.title,
          body: params.body,
          notification_type: params.notificationType,
          sent_via: params.sentVia,
          is_bulk: params.isBulk,
          bulk_recipients_count: params.bulkRecipientsCount || 0,
          status: params.status,
          error_message: params.errorMessage
        });
      } catch (error) {
        console.error('Error logging notification:', error);
      }
    }

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

      // Send Aimtell push notification for background notification (Android/Desktop)
      const aimtellSent = await sendAimtellNotification(
        notificationTitle,
        notificationBody,
        `/provider-dashboard?tab=orders`,
        { provider_id: providerId }
      );

      // Also send Web Push for iOS PWA users
      const webPushSent = await sendWebPushToUser(
        supabase,
        provider.user_id,
        notificationTitle,
        notificationBody,
        `/provider-dashboard?tab=orders`
      );

      console.log('New order notification sent for order:', orderId, 'aimtellSent:', aimtellSent, 'webPushSent:', webPushSent);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Provider notified of new order',
          broadcastSent: true,
          aimtellSent: aimtellSent,
          webPushSent: webPushSent
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

      // Skip push notifications for silent statuses (pending, preparing)
      // These updates are visible in-app but don't need push notifications
      if (silentStatuses.includes(status)) {
        console.log(`Skipping push notification for silent status: ${status}`);
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Status update is silent - no push notification sent',
            skipped: true,
            status: status
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Handle admin message notification to customer
    if (type === 'admin_message') {
      const { title, message: msgBody } = requestBody;
      
      if (!customerId || !title || !msgBody) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: customerId, title, message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send Aimtell push notification
      const aimtellSent = await sendAimtellNotification(
        title,
        msgBody,
        `/app`,
        { customer_id: customerId }
      );

      // Also send Web Push for iOS users
      const webPushSent = await sendWebPushToUser(
        supabase,
        customerId,
        title,
        msgBody,
        `/app`
      );

      // Log the notification
      const sentVia: string[] = [];
      if (aimtellSent) sentVia.push('aimtell');
      if (webPushSent) sentVia.push('webpush');

      await logNotification({
        recipientId: customerId,
        recipientType: 'customer',
        title,
        body: msgBody,
        notificationType: 'admin_message',
        sentVia,
        isBulk: false,
        status: sentVia.length > 0 ? 'sent' : 'failed'
      });

      console.log('Admin message sent to customer:', customerId, 'aimtellSent:', aimtellSent, 'webPushSent:', webPushSent);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Admin message sent to customer',
          aimtellSent,
          webPushSent
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle count recipients (for filtered bulk notifications)
    if (type === 'count_recipients') {
      const { tier, neighborhoodId } = requestBody;
      
      try {
        // Build query to count recipients
        let userIds: string[] = [];

        if (tier) {
          // Get users by tier from loyalty_points
          const { data: loyaltyData } = await supabase
            .from('loyalty_points')
            .select('user_id')
            .eq('tier', tier);
          
          userIds = loyaltyData?.map(l => l.user_id) || [];
        } else {
          // Get all user ids from profiles
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id');
          
          userIds = profilesData?.map(p => p.user_id) || [];
        }

        // If neighborhood filter, further filter by users who ordered from providers in that neighborhood
        if (neighborhoodId && userIds.length > 0) {
          // Get providers in this neighborhood
          const { data: providers } = await supabase
            .from('service_providers')
            .select('id')
            .eq('neighborhood_id', neighborhoodId);
          
          const providerIds = providers?.map(p => p.id) || [];
          
          if (providerIds.length > 0) {
            // Get unique customer_ids who ordered from these providers
            const { data: orders } = await supabase
              .from('orders')
              .select('customer_id')
              .in('provider_id', providerIds);
            
            const customerIds = [...new Set(orders?.map(o => o.customer_id) || [])];
            userIds = userIds.filter(id => customerIds.includes(id));
          } else {
            userIds = [];
          }
        }

        return new Response(
          JSON.stringify({ count: userIds.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error counting recipients:', error);
        return new Response(
          JSON.stringify({ count: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle bulk notification to customers (optionally filtered)
    if (type === 'bulk_notification') {
      const { title, message: msgBody, tier, neighborhoodId } = requestBody;
      
      if (!title || !msgBody) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: title, message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build filtered list of customer IDs
      let customerUserIds: string[] = [];
      let filterDescription = 'all';

      if (tier) {
        // Get users by tier from loyalty_points
        const { data: loyaltyData } = await supabase
          .from('loyalty_points')
          .select('user_id')
          .eq('tier', tier);
        
        customerUserIds = loyaltyData?.map(l => l.user_id) || [];
        filterDescription = `tier:${tier}`;
      } else {
        // Get all user ids from profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id');
        
        customerUserIds = profilesData?.map(p => p.user_id) || [];
      }

      // If neighborhood filter, further filter by users who ordered from providers in that neighborhood
      if (neighborhoodId && customerUserIds.length > 0) {
        // Get providers in this neighborhood
        const { data: providers } = await supabase
          .from('service_providers')
          .select('id')
          .eq('neighborhood_id', neighborhoodId);
        
        const providerIds = providers?.map(p => p.id) || [];
        
        if (providerIds.length > 0) {
          // Get unique customer_ids who ordered from these providers
          const { data: orders } = await supabase
            .from('orders')
            .select('customer_id')
            .in('provider_id', providerIds);
          
          const orderCustomerIds = [...new Set(orders?.map(o => o.customer_id) || [])];
          customerUserIds = customerUserIds.filter(id => orderCustomerIds.includes(id));
        } else {
          customerUserIds = [];
        }
        filterDescription += `,neighborhood:${neighborhoodId}`;
      }

      const customerCount = customerUserIds.length;
      console.log(`Sending bulk notification to ${customerCount} customers (filter: ${filterDescription})`);

      if (customerCount === 0) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'No recipients match the filter',
            sentCount: 0
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send Aimtell broadcast (for non-filtered, send to all; for filtered, we need individual sends)
      let aimtellSent = false;
      if (!tier && !neighborhoodId) {
        // Broadcast to all
        aimtellSent = await sendAimtellNotification(title, msgBody, `/app`);
      } else {
        // For filtered, send to each user individually
        for (const userId of customerUserIds) {
          await sendAimtellNotification(title, msgBody, `/app`, { customer_id: userId });
        }
        aimtellSent = true;
      }

      // Send Web Push to filtered customers
      let webPushSuccessCount = 0;
      for (const userId of customerUserIds) {
        const sent = await sendWebPushToUser(supabase, userId, title, msgBody, `/app`);
        if (sent) webPushSuccessCount++;
      }

      // Log the bulk notification
      const sentVia: string[] = [];
      if (aimtellSent) sentVia.push('aimtell');
      if (webPushSuccessCount > 0) sentVia.push('webpush');

      await logNotification({
        recipientType: tier || neighborhoodId ? 'filtered' : 'all',
        title,
        body: msgBody,
        notificationType: 'bulk_notification',
        sentVia,
        isBulk: true,
        bulkRecipientsCount: customerCount,
        status: 'sent'
      });

      console.log(`Bulk notification sent: aimtell=${aimtellSent}, webpush=${webPushSuccessCount}/${customerCount}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Bulk notification sent',
          sentCount: customerCount,
          aimtellSent,
          webPushSent: webPushSuccessCount
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