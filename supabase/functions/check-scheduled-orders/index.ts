import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Find orders scheduled for the next 30-35 minutes that haven't been notified
    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyFiveMinutesLater = new Date(now.getTime() + 35 * 60 * 1000);

    const { data: scheduledOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, scheduled_for, total_amount")
      .eq("scheduled_notification_sent", false)
      .not("scheduled_for", "is", null)
      .gte("scheduled_for", thirtyMinutesLater.toISOString())
      .lt("scheduled_for", thirtyFiveMinutesLater.toISOString())
      .in("status", ["pending", "preparing"]);

    if (ordersError) {
      console.error("Error fetching scheduled orders:", ordersError);
      throw ordersError;
    }

    console.log(`Found ${scheduledOrders?.length || 0} orders to notify`);

    const notifications = [];

    for (const order of scheduledOrders || []) {
      // Send email notification if email exists
      if (order.customer_email) {
        const scheduledTime = new Date(order.scheduled_for!);
        const formattedTime = scheduledTime.toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        });

        try {
          await resend.emails.send({
            from: "الحي <onboarding@resend.dev>",
            to: [order.customer_email],
            subject: "تذكير: طلبك المجدول قريباً!",
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1a5f4c;">مرحباً ${order.customer_name}!</h1>
                <p style="font-size: 16px; color: #333;">
                  نود تذكيرك بأن طلبك المجدول سيكون جاهزاً في الساعة <strong>${formattedTime}</strong>
                </p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #666;">المبلغ الإجمالي: <strong>${order.total_amount} ر.س</strong></p>
                </div>
                <p style="color: #666; font-size: 14px;">
                  نتطلع لخدمتك! 🎉
                </p>
                <p style="color: #1a5f4c; font-weight: bold;">فريق الحي</p>
              </div>
            `,
          });

          notifications.push({
            orderId: order.id,
            email: order.customer_email,
            status: "sent",
          });
        } catch (emailError: unknown) {
          console.error(`Error sending email for order ${order.id}:`, emailError);
          notifications.push({
            orderId: order.id,
            email: order.customer_email,
            status: "failed",
            error: emailError instanceof Error ? emailError.message : "Unknown error",
          });
        }
      }

      // Mark order as notified
      await supabase
        .from("orders")
        .update({ scheduled_notification_sent: true })
        .eq("id", order.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedOrders: scheduledOrders?.length || 0,
        notifications,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-scheduled-orders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
