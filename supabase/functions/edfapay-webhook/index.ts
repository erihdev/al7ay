import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook data from EdfaPay
    const webhookData = await req.json();
    
    console.log('EdfaPay webhook received:', webhookData);

    // Extract payment information (field names will be updated based on EdfaPay documentation)
    const {
      order_id,
      transaction_id,
      status,
      amount,
      currency,
      payment_method,
      error_message
    } = webhookData;

    // Extract original order ID from transaction ID
    const orderIdMatch = order_id?.match(/TXN-(.+?)-\d+/);
    const originalOrderId = orderIdMatch ? orderIdMatch[1] : order_id;

    if (!originalOrderId) {
      console.error('Could not extract order ID from webhook');
      return new Response(
        JSON.stringify({ error: 'Invalid order ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map EdfaPay status to our order status
    let orderStatus: string;
    let paymentStatus: string;

    switch (status?.toLowerCase()) {
      case 'success':
      case 'approved':
      case 'completed':
        orderStatus = 'preparing'; // Move to preparing after successful payment
        paymentStatus = 'paid';
        break;
      case 'pending':
      case 'processing':
        orderStatus = 'pending';
        paymentStatus = 'pending';
        break;
      case 'failed':
      case 'declined':
      case 'error':
        orderStatus = 'pending'; // Keep pending for retry
        paymentStatus = 'failed';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        paymentStatus = 'cancelled';
        break;
      default:
        orderStatus = 'pending';
        paymentStatus = 'unknown';
    }

    console.log(`Updating order ${originalOrderId} - Payment: ${paymentStatus}, Order: ${orderStatus}`);

    // Fetch the order to get customer info
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', originalOrderId)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
    }

    // Update order status and payment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: paymentStatus === 'paid' ? orderStatus : order?.status,
        payment_status: paymentStatus,
        payment_transaction_id: transaction_id,
        payment_completed_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
        notes: paymentStatus === 'paid' 
          ? `تم الدفع بنجاح - معرف المعاملة: ${transaction_id}`
          : paymentStatus === 'failed'
          ? `فشل الدفع: ${error_message || 'سبب غير محدد'}`
          : order?.notes
      })
      .eq('id', originalOrderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
    } else {
      console.log(`Order ${originalOrderId} updated - payment: ${paymentStatus}`);
    }

    // Insert payment record
    const { error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        order_id: originalOrderId,
        customer_id: order?.customer_id,
        amount: parseFloat(amount) || order?.total_amount,
        payment_method: 'edfapay',
        status: paymentStatus,
        transaction_id: transaction_id,
        provider_response: webhookData
      });

    if (paymentInsertError) {
      console.error('Error inserting payment record:', paymentInsertError);
    }

    // Send email notification based on payment status
    if (order?.customer_email) {
      try {
        let emailSubject: string;
        let emailHtml: string;

        if (paymentStatus === 'paid') {
          emailSubject = `✅ تم استلام الدفع - طلب #${originalOrderId.slice(-6)}`;
          emailHtml = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .success-icon { font-size: 48px; margin-bottom: 15px; }
                .amount { background: #ECFDF5; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
                .amount-value { font-size: 32px; font-weight: bold; color: #059669; }
                .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="success-icon">✅</div>
                  <h1>تم الدفع بنجاح!</h1>
                </div>
                <div class="content">
                  <p>مرحباً ${order.customer_name}،</p>
                  <p>تم استلام الدفع الخاص بطلبك بنجاح. سنبدأ في تحضير طلبك الآن.</p>
                  
                  <div class="amount">
                    <div>المبلغ المدفوع</div>
                    <div class="amount-value">${order.total_amount} ر.س</div>
                  </div>
                  
                  <div class="info-row">
                    <span>رقم الطلب:</span>
                    <strong>#${originalOrderId.slice(-6)}</strong>
                  </div>
                  <div class="info-row">
                    <span>رقم العملية:</span>
                    <strong>${transaction_id || '-'}</strong>
                  </div>
                  <div class="info-row">
                    <span>طريقة الاستلام:</span>
                    <strong>${order.order_type === 'delivery' ? 'توصيل' : 'استلام من المتجر'}</strong>
                  </div>
                </div>
                <div class="footer">
                  <p>شكراً لثقتك بنا! 💚</p>
                </div>
              </div>
            </body>
            </html>
          `;
        } else if (paymentStatus === 'failed') {
          emailSubject = `❌ فشل الدفع - طلب #${originalOrderId.slice(-6)}`;
          emailHtml = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .error-icon { font-size: 48px; margin-bottom: 15px; }
                .error-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 20px; margin: 20px 0; }
                .retry-btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="error-icon">❌</div>
                  <h1>فشل الدفع</h1>
                </div>
                <div class="content">
                  <p>مرحباً ${order.customer_name}،</p>
                  <p>للأسف، لم نتمكن من إتمام عملية الدفع لطلبك.</p>
                  
                  <div class="error-box">
                    <strong>سبب الفشل:</strong><br>
                    ${error_message || 'حدث خطأ أثناء معالجة الدفع'}
                  </div>
                  
                  <p>يمكنك إعادة المحاولة أو اختيار الدفع عند الاستلام.</p>
                </div>
                <div class="footer">
                  <p>إذا كنت بحاجة للمساعدة، تواصل معنا!</p>
                </div>
              </div>
            </body>
            </html>
          `;
        } else {
          // Don't send email for other statuses
          emailSubject = '';
          emailHtml = '';
        }

        if (emailSubject && emailHtml) {
          const emailResponse = await resend.emails.send({
            from: "الطلبات <onboarding@resend.dev>",
            to: [order.customer_email],
            subject: emailSubject,
            html: emailHtml,
          });
          console.log('Payment email sent:', emailResponse);
        }
      } catch (emailError) {
        console.error('Error sending payment email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});