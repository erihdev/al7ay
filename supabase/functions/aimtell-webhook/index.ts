import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const payload = await req.json();
    console.log("Aimtell webhook received:", JSON.stringify(payload));

    // Handle different webhook event types
    const eventType = payload.event || payload.type;
    const notificationId = payload.notification_id || payload.campaign_id;
    const userId = payload.subscriber_id || payload.attributes?.customer_id;
    
    // Helper to record event and update counts
    const recordEvent = async (type: string) => {
      // Insert event record
      await supabase.from('notification_events').insert({
        notification_id: notificationId || null,
        event_type: type,
        user_id: userId,
        metadata: payload
      });

      // Update notification counts if we have a notification_id
      if (notificationId) {
        // Get current counts and increment
        const { data: current } = await supabase
          .from('notifications_log')
          .select('delivered_count, opened_count, clicked_count')
          .eq('id', notificationId)
          .single();
        
        if (current) {
          const updates: Record<string, number> = {};
          if (type === 'delivered') {
            updates.delivered_count = (current.delivered_count || 0) + 1;
          } else if (type === 'opened') {
            updates.opened_count = (current.opened_count || 0) + 1;
          } else if (type === 'clicked') {
            updates.clicked_count = (current.clicked_count || 0) + 1;
          }
          
          if (Object.keys(updates).length > 0) {
            await supabase
              .from('notifications_log')
              .update(updates)
              .eq('id', notificationId);
          }
        }
      }
    };
    
    switch (eventType) {
      case "subscription":
      case "new_subscriber":
        // New user subscribed to push notifications
        console.log("New subscriber:", payload);
        
        // If we have user attributes, we can link to our user
        const attributes = payload.attributes || {};
        
        // Log the subscription event
        if (attributes.customer_id || attributes.provider_id) {
          console.log(`Linked subscription: customer=${attributes.customer_id}, provider=${attributes.provider_id}`);
        }
        break;

      case "unsubscription":
      case "unsubscribe":
        // User unsubscribed from push notifications
        console.log("Unsubscribed:", payload);
        break;

      case "click":
      case "notification_click":
        // User clicked on a notification
        console.log("Notification clicked:", payload);
        await recordEvent('clicked');
        break;

      case "open":
      case "notification_open":
        // Notification was opened
        console.log("Notification opened:", payload);
        await recordEvent('opened');
        break;

      case "delivered":
      case "notification_delivered":
        // Notification was delivered
        console.log("Notification delivered:", payload);
        await recordEvent('delivered');
        break;

      default:
        console.log("Unknown event type:", eventType, payload);
    }

    return new Response(
      JSON.stringify({ success: true, event: eventType }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Aimtell webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
