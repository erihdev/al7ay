import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      throw new Error("Unauthorized");
    }

    // Check if caller is admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .single();

    if (roleError || !adminRole) {
      throw new Error("Only admins can delete provider accounts");
    }

    const { userId, providerId } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`Admin ${callerUser.email} is deleting provider ${userId}`);

    // Start deletion process - order matters due to foreign key constraints
    
    // 1. Delete provider products reviews
    if (providerId) {
      const { data: products } = await supabaseAdmin
        .from("provider_products")
        .select("id")
        .eq("provider_id", providerId);

      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);
        await supabaseAdmin
          .from("provider_product_reviews")
          .delete()
          .in("product_id", productIds);
      }

      // 2. Delete provider products
      await supabaseAdmin
        .from("provider_products")
        .delete()
        .eq("provider_id", providerId);

      // 3. Delete provider order items
      const { data: orders } = await supabaseAdmin
        .from("provider_orders")
        .select("id")
        .eq("provider_id", providerId);

      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        
        // Delete delivery tracking
        await supabaseAdmin
          .from("provider_delivery_tracking")
          .delete()
          .in("order_id", orderIds);
        
        // Delete route history
        await supabaseAdmin
          .from("provider_delivery_route_history")
          .delete()
          .in("order_id", orderIds);
        
        // Delete order items
        await supabaseAdmin
          .from("provider_order_items")
          .delete()
          .in("order_id", orderIds);
      }

      // 4. Delete provider orders
      await supabaseAdmin
        .from("provider_orders")
        .delete()
        .eq("provider_id", providerId);

      // 5. Delete provider reviews
      await supabaseAdmin
        .from("provider_reviews")
        .delete()
        .eq("provider_id", providerId);

      // 6. Delete provider payouts
      await supabaseAdmin
        .from("provider_payouts")
        .delete()
        .eq("provider_id", providerId);

      // 7. Delete provider subscriptions
      await supabaseAdmin
        .from("provider_subscriptions")
        .delete()
        .eq("provider_id", providerId);

      // 8. Delete provider contracts
      await supabaseAdmin
        .from("provider_contracts")
        .delete()
        .eq("provider_id", providerId);

      // 9. Delete service provider record
      await supabaseAdmin
        .from("service_providers")
        .delete()
        .eq("id", providerId);
    }

    // 10. Delete user role
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // 11. Delete user profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    // 12. Delete push subscriptions
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    // 13. Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    console.log(`Successfully deleted provider ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Provider deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Delete provider error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
