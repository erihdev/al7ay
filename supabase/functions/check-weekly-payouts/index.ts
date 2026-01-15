import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get providers with pending payouts (platform_managed only)
    const { data: providers, error: providersError } = await supabase
      .from('service_providers')
      .select('id, business_name, email, commission_rate, last_payout_date')
      .eq('payment_method', 'platform_managed')
      .eq('is_payment_verified', true);

    if (providersError) throw providersError;

    // Calculate pending amounts for each provider
    const pendingPayouts: Array<{
      providerId: string;
      businessName: string;
      email: string;
      pendingAmount: number;
      orderCount: number;
    }> = [];

    for (const provider of providers || []) {
      let ordersQuery = supabase
        .from('provider_orders')
        .select('total_amount')
        .eq('provider_id', provider.id)
        .in('status', ['completed', 'ready', 'out_for_delivery']);

      if (provider.last_payout_date) {
        ordersQuery = ordersQuery.gt('created_at', provider.last_payout_date);
      }

      const { data: orders } = await ordersQuery;
      
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const commissionRate = provider.commission_rate || 10;
      const netAmount = totalRevenue * (1 - commissionRate / 100);

      if (netAmount > 0) {
        pendingPayouts.push({
          providerId: provider.id,
          businessName: provider.business_name,
          email: provider.email,
          pendingAmount: netAmount,
          orderCount: orders?.length || 0,
        });
      }
    }

    if (pendingPayouts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending payouts" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send reminder to admin
    const totalPending = pendingPayouts.reduce((sum, p) => sum + p.pendingAmount, 0);
    const adminEmail = 'difmashni@gmail.com';

    const providersList = pendingPayouts.map(p => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.businessName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.orderCount}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left; font-weight: bold; color: #059669;">${p.pendingAmount.toFixed(2)} ر.س</td>
      </tr>
    `).join('');

    await resend.emails.send({
      from: "Al-Hay Platform <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `⏰ تذكير: ${pendingPayouts.length} تحويل أسبوعي معلق - ${totalPending.toFixed(0)} ر.س`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .stats-box { background: #FEF3C7; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .stats-value { font-size: 32px; font-weight: bold; color: #D97706; }
            .cta-button { display: inline-block; background: #1B4332; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; padding: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ تذكير بالتحويلات الأسبوعية</h1>
            </div>
            <div class="content">
              <p>مرحباً،</p>
              <p>هذا تذكير بوجود تحويلات أسبوعية معلقة للمزودين.</p>
              
              <div class="stats-box">
                <p style="margin: 0; color: #92400E;">إجمالي المبلغ المعلق</p>
                <p class="stats-value">${totalPending.toFixed(2)} ر.س</p>
                <p style="margin: 0; color: #92400E;">${pendingPayouts.length} مزود</p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>المتجر</th>
                    <th style="text-align: center;">عدد الطلبات</th>
                    <th style="text-align: left;">المبلغ المستحق</th>
                  </tr>
                </thead>
                <tbody>
                  ${providersList}
                </tbody>
              </table>

              <div style="text-align: center; margin-top: 30px;">
                <a href="https://al7ay.lovable.app/admin" class="cta-button">إجراء التحويلات</a>
              </div>
            </div>
            <div class="footer">
              <p>تم إرسال هذا البريد تلقائياً من منصة الحي</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Weekly payout reminder sent: ${pendingPayouts.length} providers, ${totalPending.toFixed(2)} SAR total`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pendingCount: pendingPayouts.length,
        totalAmount: totalPending 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-weekly-payouts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
