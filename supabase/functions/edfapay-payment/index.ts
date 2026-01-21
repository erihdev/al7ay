import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

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
  paymentMethod?: 'card' | 'apple_pay';
}

// Helper function to convert Uint8Array to hex string
function toHex(buffer: Uint8Array): string {
  const hexBytes = hexEncode(buffer);
  return new TextDecoder().decode(hexBytes);
}

// Helper function to calculate MD5 using Deno's crypto
async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return toHex(new Uint8Array(hashBuffer));
}

// Helper function to calculate SHA1
async function sha1(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  return toHex(new Uint8Array(hashBuffer));
}

// Calculate EdfaPay hash signature
async function calculateHash(orderId: string, amount: string, currency: string, description: string, password: string): Promise<string> {
  const concatenated = orderId + amount + currency + description + password;
  const upperCase = concatenated.toUpperCase();
  const md5Hash = await md5(upperCase);
  const sha1Hash = await sha1(md5Hash);
  return sha1Hash;
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

    const { pendingOrderId, amount, customerEmail, customerName, customerPhone, description, returnUrl, paymentMethod }: PaymentRequest = await req.json();
    
    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     '1.1.1.1';

    // Validate required fields
    if (!pendingOrderId || !amount || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique transaction ID using pending order ID
    const transactionId = `TXN${Date.now()}`;
    const orderAmount = amount.toFixed(2);
    const orderCurrency = 'SAR';
    const orderDescription = description || `Order ${pendingOrderId}`;

    // Split customer name into first and last name
    const nameParts = customerName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Calculate hash signature
    const hash = await calculateHash(transactionId, orderAmount, orderCurrency, orderDescription, password);

    // EdfaPay API endpoint
    const edfaPayUrl = 'https://api.edfapay.com/payment/initiate';

    // Prepare form data (EdfaPay requires form-data, not JSON)
    const formData = new FormData();
    formData.append('action', 'SALE');
    formData.append('edfa_merchant_id', merchantId);
    formData.append('order_id', transactionId);
    formData.append('order_amount', orderAmount);
    formData.append('order_currency', orderCurrency);
    formData.append('order_description', orderDescription);
    formData.append('payer_first_name', firstName);
    formData.append('payer_last_name', lastName);
    formData.append('payer_address', 'Saudi Arabia');
    formData.append('payer_city', 'Riyadh');
    formData.append('payer_country', 'SA');
    formData.append('payer_zip', '12345');
    formData.append('payer_email', customerEmail || 'customer@example.com');
    formData.append('payer_phone', customerPhone || '0500000000');
    formData.append('payer_ip', clientIp);
    formData.append('term_url_3ds', returnUrl);
    
    // Add payment method for Apple Pay
    if (paymentMethod === 'apple_pay') {
      formData.append('payment_method', 'APPLEPAY');
    }
    formData.append('hash', hash);

    // Make request to EdfaPay
    const response = await fetch(edfaPayUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.result === 'ERROR' || !response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Payment initiation failed',
          message: 'فشل في بدء عملية الدفع',
          details: result.errors || result.error_message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        pendingOrderId,
        paymentUrl: result.redirect_url || result.payment_url,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch {
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'حدث خطأ في معالجة الدفع' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
