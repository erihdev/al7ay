import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const merchantId = Deno.env.get('EDFAPAY_MERCHANT_ID');
    
    if (!merchantId) {
      console.error('EdfaPay merchant ID not configured');
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

    const { validationURL } = await req.json();

    if (!validationURL) {
      return new Response(
        JSON.stringify({ error: 'Missing validationURL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating Apple Pay merchant with URL:', validationURL);

    // Apple Pay merchant validation requires calling Apple's validation URL
    // with merchant identity certificate and key
    // For EdfaPay integration, we need to call EdfaPay's Apple Pay validation endpoint
    
    const edfaPayValidateUrl = 'https://api.edfapay.com/applepay/validate';
    
    const response = await fetch(edfaPayValidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: merchantId,
        validationURL: validationURL,
        domainName: 'al7ay.lovable.app',
        displayName: 'الحي'
      }),
    });

    const result = await response.json();

    console.log('EdfaPay validation response:', result);

    if (!response.ok || result.error) {
      console.error('Merchant validation failed:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Merchant validation failed',
          details: result 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        merchantSession: result.merchantSession || result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Apple Pay validation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'حدث خطأ في التحقق' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
