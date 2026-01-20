import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  pendingOrderId: string;
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

    const { pendingOrderId, amount, customerEmail, customerName, customerPhone, description, returnUrl }: PaymentRequest = await req.json();
    
    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Validate required fields
    if (!pendingOrderId || !amount || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique transaction ID using pending order ID
    const transactionId = `TXN-${pendingOrderId}-${Date.now()}`;

    // EdfaPay API endpoint
    const edfaPayUrl = 'https://api.edfapay.com/payment/initiate';

    // Split customer name into first and last name
    const nameParts = customerName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Prepare payment request for EdfaPay (using correct field names per API docs)
    const paymentData = {
      action: 'SALE',
      merchant_id: merchantId,
      merchant_password: password,
      order_id: transactionId,
      order_amount: amount.toFixed(2),
      order_currency: 'SAR',
      order_description: description || `Order ${pendingOrderId}`,
      payer_email: customerEmail || 'customer@example.com',
      payer_first_name: firstName,
      payer_last_name: lastName,
      payer_phone: customerPhone,
      payer_ip: clientIp,
      payer_address: 'Saudi Arabia',
      payer_city: 'Riyadh',
      payer_country: 'SA',
      payer_zip: '12345',
      term_url_3ds: returnUrl,
      return_url: returnUrl,
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/edfapay-webhook`,
    };

    console.log('Initiating EdfaPay payment:', { pendingOrderId, amount, transactionId });

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
        pendingOrderId,
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
