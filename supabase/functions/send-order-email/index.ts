import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'new_order' | 'status_update';
  orderId: string;
  customerEmail: string;
  customerName: string;
  orderTotal?: number;
  status?: string;
  items?: { name: string; quantity: number; price: number }[];
}

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  preparing: 'قيد التحضير',
  ready: 'جاهز للاستلام',
  out_for_delivery: 'في الطريق إليك',
  completed: 'تم التسليم',
  cancelled: 'ملغي',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, orderId, customerEmail, customerName, orderTotal, status, items }: EmailRequest = await req.json();

    let subject: string;
    let html: string;

    if (type === 'new_order') {
      subject = `تأكيد طلبك #${orderId.slice(0, 8)}`;
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .order-id { background: #f3f4f6; padding: 10px 15px; border-radius: 8px; display: inline-block; margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
            .items-table th { background: #f9fafb; }
            .total { font-size: 24px; color: #7c3aed; font-weight: bold; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>شكراً لطلبك! ☕</h1>
            </div>
            <div class="content">
              <p>مرحباً <strong>${customerName}</strong>،</p>
              <p>تم استلام طلبك بنجاح وسنبدأ بتحضيره الآن.</p>
              
              <div class="order-id">
                <strong>رقم الطلب:</strong> #${orderId.slice(0, 8)}
              </div>
              
              ${items ? `
              <table class="items-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>${item.price} ر.س</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ` : ''}
              
              <div class="total">
                الإجمالي: ${orderTotal?.toFixed(2)} ر.س
              </div>
            </div>
            <div class="footer">
              <p>سنرسل لك تحديثات عن حالة طلبك</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      const statusLabel = statusLabels[status || 'pending'] || status;
      subject = `تحديث طلبك #${orderId.slice(0, 8)} - ${statusLabel}`;
      
      let statusMessage = '';
      let emoji = '📦';
      
      switch (status) {
        case 'preparing':
          statusMessage = 'نحن نعمل على تحضير طلبك الآن!';
          emoji = '👨‍🍳';
          break;
        case 'ready':
          statusMessage = 'طلبك جاهز للاستلام!';
          emoji = '✅';
          break;
        case 'out_for_delivery':
          statusMessage = 'طلبك في الطريق إليك!';
          emoji = '🚗';
          break;
        case 'completed':
          statusMessage = 'تم تسليم طلبك بنجاح. نتمنى أن ينال إعجابك!';
          emoji = '🎉';
          break;
        case 'cancelled':
          statusMessage = 'تم إلغاء طلبك. نعتذر عن أي إزعاج.';
          emoji = '❌';
          break;
        default:
          statusMessage = 'تم تحديث حالة طلبك.';
      }
      
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .status-badge { display: inline-block; padding: 15px 30px; background: #f3f4f6; border-radius: 50px; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .emoji { font-size: 48px; margin-bottom: 20px; }
            .message { font-size: 16px; color: #4b5563; line-height: 1.6; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>تحديث الطلب</h1>
            </div>
            <div class="content">
              <div class="emoji">${emoji}</div>
              <p>مرحباً <strong>${customerName}</strong>،</p>
              
              <div class="status-badge">
                ${statusLabel}
              </div>
              
              <p class="message">${statusMessage}</p>
              
              <p style="margin-top: 20px; color: #9ca3af; font-size: 14px;">
                رقم الطلب: #${orderId.slice(0, 8)}
              </p>
            </div>
            <div class="footer">
              <p>شكراً لاختيارك لنا!</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "الحي <onboarding@resend.dev>",
      to: [customerEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
