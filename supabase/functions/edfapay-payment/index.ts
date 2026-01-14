import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  description?: string;
  returnUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get('EDFAPAY_MERCHANT_ID');
    const password = Deno.env.get('EDFAPAY_PASSWORD');

    if (!merchantId || !password) {
      console.error('EdfaPay credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Payment gateway not configured',
          message: 'يرجى التواصل مع الدعم الفني' 
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { orderId, amount, customerEmail, customerName, customerPhone, description, returnUrl }: PaymentRequest = await req.json();

    // Validate required fields
    if (!orderId || !amount || !customerEmail || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${orderId}-${Date.now()}`;

    // EdfaPay API endpoint (will be updated with actual endpoint from documentation)
    const edfaPayUrl = 'https://api.edfapay.com/payment/initiate';

    // Prepare payment request for EdfaPay
    const paymentData = {
      merchant_id: merchantId,
      password: password,
      order_id: transactionId,
      amount: amount.toFixed(2),
      currency: 'SAR',
      description: description || `طلب رقم ${orderId}`,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      return_url: returnUrl,
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/edfapay-webhook`,
    };

    console.log('Initiating EdfaPay payment:', { orderId, amount, transactionId });

    // Make request to EdfaPay
    const response = await fetch(edfaPayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('EdfaPay error:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Payment initiation failed',
          message: 'فشل في بدء عملية الدفع' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('EdfaPay payment initiated successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        paymentUrl: result.payment_url || result.redirect_url,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'حدث خطأ في معالجة الدفع' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
