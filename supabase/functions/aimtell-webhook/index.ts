const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Aimtell webhook received:", JSON.stringify(payload));

    // Handle different webhook event types
    const eventType = payload.event || payload.type;
    
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
        break;

      case "delivered":
      case "notification_delivered":
        // Notification was delivered
        console.log("Notification delivered:", payload);
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
