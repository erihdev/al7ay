import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupProviderRequest {
  userId: string;
  email: string;
  fullName: string;
  applicationId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { userId, email, fullName, applicationId }: SetupProviderRequest = await req.json();

    console.log("Setting up provider for user:", userId, email);

    // Get the application details
    const { data: application, error: appError } = await supabaseAdmin
      .from("service_provider_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Application not found:", appError);
      throw new Error("Application not found");
    }

    // Check if role already exists
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "service_provider")
      .maybeSingle();

    if (!existingRole) {
      // Add service_provider role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "service_provider",
        });

      if (roleError) {
        console.error("Error adding role:", roleError);
        throw new Error("Failed to add service_provider role");
      }
      console.log("Added service_provider role for user:", userId);
    }

    // Find neighborhood ID
    const { data: neighborhood } = await supabaseAdmin
      .from("active_neighborhoods")
      .select("id")
      .eq("name", application.neighborhood)
      .maybeSingle();

    // Check if service provider profile already exists
    const { data: existingProvider } = await supabaseAdmin
      .from("service_providers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingProvider) {
      // Create service provider profile
      const { error: providerError } = await supabaseAdmin
        .from("service_providers")
        .insert({
          user_id: userId,
          email: email,
          business_name: application.business_name,
          phone: application.phone,
          application_id: applicationId,
          neighborhood_id: neighborhood?.id || null,
          is_active: true,
          is_verified: true,
        });

      if (providerError) {
        console.error("Error creating provider profile:", providerError);
        throw new Error("Failed to create provider profile");
      }
      console.log("Created service provider profile for user:", userId);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Provider setup completed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in setup-provider:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
