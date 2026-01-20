import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    // Extract payment information
    const {
      order_id,
      transaction_id,
      status,
      amount,
      currency,
      payment_method,
      error_message
    } = webhookData;

    // Extract pending order ID from transaction ID (format: TXN-{pendingOrderId}-{timestamp})
    const pendingOrderIdMatch = order_id?.match(/TXN-(.+?)-\d+$/);
    const pendingOrderId = pendingOrderIdMatch ? pendingOrderIdMatch[1] : null;

    if (!pendingOrderId) {
      console.error('Could not extract pending order ID from webhook:', order_id);
      return new Response(
        JSON.stringify({ error: 'Invalid order ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map EdfaPay status to payment status
    let paymentStatus: string;
    let shouldCreateOrder = false;

    switch (status?.toLowerCase()) {
      case 'success':
      case 'approved':
      case 'completed':
        paymentStatus = 'paid';
        shouldCreateOrder = true;
        break;
      case 'pending':
      case 'processing':
        paymentStatus = 'pending';
        break;
      case 'failed':
      case 'declined':
      case 'error':
        paymentStatus = 'failed';
        break;
      case 'cancelled':
        paymentStatus = 'cancelled';
        break;
      default:
        paymentStatus = 'unknown';
    }

    console.log(`Processing payment for pending order ${pendingOrderId} - Status: ${paymentStatus}`);

    // Fetch pending order data
    const { data: pendingOrder, error: fetchError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('id', pendingOrderId)
      .single();

    if (fetchError || !pendingOrder) {
      console.error('Error fetching pending order:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Pending order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let createdOrderId: string | null = null;

    // Only create order if payment was successful
    if (shouldCreateOrder) {
      console.log('Payment successful - Creating actual order...');

      // Determine which orders table to use based on provider_id
      const isProviderOrder = !!pendingOrder.provider_id;
      const ordersTable = isProviderOrder ? 'provider_orders' : 'orders';
      const orderItemsTable = isProviderOrder ? 'provider_order_items' : 'order_items';

      // Create the actual order
      const orderData: any = {
        customer_id: pendingOrder.customer_id,
        customer_name: pendingOrder.customer_name,
        customer_phone: pendingOrder.customer_phone,
        customer_email: pendingOrder.customer_email,
        order_type: pendingOrder.order_type,
        delivery_address: pendingOrder.delivery_address,
        delivery_lat: pendingOrder.delivery_lat,
        delivery_lng: pendingOrder.delivery_lng,
        notes: pendingOrder.notes,
        total_amount: pendingOrder.total_amount,
        status: 'preparing', // Start preparing immediately after payment
      };

      // Add provider_id for provider orders
      if (isProviderOrder) {
        orderData.provider_id = pendingOrder.provider_id;
      } else {
        // For platform orders, add payment fields
        orderData.payment_method = 'online';
        orderData.payment_status = 'paid';
        orderData.payment_transaction_id = transaction_id;
        orderData.payment_completed_at = new Date().toISOString();
      }

      const { data: createdOrder, error: orderError } = await supabase
        .from(ordersTable)
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return new Response(
          JSON.stringify({ error: 'Failed to create order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      createdOrderId = createdOrder.id;
      console.log(`Order created successfully: ${createdOrderId}`);

      // Create order items from pending order items
      const items = pendingOrder.items as any[];
      if (items && items.length > 0) {
        const orderItems = items.map((item: any) => ({
          order_id: createdOrderId,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          selected_options: item.selectedOptions || null
        }));

        const { error: itemsError } = await supabase
          .from(orderItemsTable)
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
        }
      }

      // Send notification to provider for new order
      if (isProviderOrder) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'new_order',
              orderId: createdOrderId,
              providerId: pendingOrder.provider_id,
              customerName: pendingOrder.customer_name,
              totalAmount: pendingOrder.total_amount,
              orderType: pendingOrder.order_type
            }
          });
        } catch (notifError) {
          console.error('Failed to send provider notification:', notifError);
        }
      }

      // Delete the pending order after successful creation
      await supabase
        .from('pending_orders')
        .delete()
        .eq('id', pendingOrderId);

      console.log('Pending order deleted after successful processing');
    }

    // Insert payment record
    const { error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        order_id: createdOrderId,
        customer_id: pendingOrder.customer_id,
        amount: parseFloat(amount) || pendingOrder.total_amount,
        payment_method: 'edfapay',
        status: paymentStatus,
        transaction_id: transaction_id,
        provider_response: webhookData
      });

    if (paymentInsertError) {
      console.error('Error inserting payment record:', paymentInsertError);
    }

    // Send email notification
    if (pendingOrder.customer_email) {
      try {
        let emailSubject: string = '';
        let emailHtml: string = '';

        if (paymentStatus === 'paid' && createdOrderId) {
          emailSubject = `✅ تم الدفع وإنشاء الطلب - طلب #${createdOrderId.slice(-6)}`;
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
                  <h1>تم الدفع وإنشاء الطلب بنجاح!</h1>
                </div>
                <div class="content">
                  <p>مرحباً ${pendingOrder.customer_name}،</p>
                  <p>تم استلام الدفع بنجاح وتم إنشاء طلبك. سنبدأ في تحضيره الآن.</p>
                  
                  <div class="amount">
                    <div>المبلغ المدفوع</div>
                    <div class="amount-value">${pendingOrder.total_amount} ر.س</div>
                  </div>
                  
                  <div class="info-row">
                    <span>رقم الطلب:</span>
                    <strong>#${createdOrderId.slice(-6)}</strong>
                  </div>
                  <div class="info-row">
                    <span>رقم العملية:</span>
                    <strong>${transaction_id || '-'}</strong>
                  </div>
                  <div class="info-row">
                    <span>طريقة الاستلام:</span>
                    <strong>${pendingOrder.order_type === 'delivery' ? 'توصيل' : 'استلام من المتجر'}</strong>
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
          emailSubject = `❌ فشل الدفع - لم يتم إنشاء الطلب`;
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
                  <p>مرحباً ${pendingOrder.customer_name}،</p>
                  <p>للأسف، فشلت عملية الدفع ولم يتم إنشاء الطلب.</p>
                  
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
        }

        if (emailSubject && emailHtml) {
          const emailResponse = await resend.emails.send({
            from: "الطلبات <onboarding@resend.dev>",
            to: [pendingOrder.customer_email],
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
        message: 'Webhook processed successfully',
        orderId: createdOrderId,
        paymentStatus
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
