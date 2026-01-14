import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Update order status if payment was successful
    if (paymentStatus === 'paid') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus,
          notes: `تم الدفع بنجاح - معرف المعاملة: ${transaction_id}`
        })
        .eq('id', originalOrderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
      } else {
        console.log(`Order ${originalOrderId} updated to ${orderStatus}`);
      }
    }

    // Log the payment attempt (you might want to create a payments table for this)
    console.log('Payment processed:', {
      orderId: originalOrderId,
      transactionId: transaction_id,
      status: paymentStatus,
      amount,
      currency,
      paymentMethod: payment_method,
      errorMessage: error_message
    });

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
