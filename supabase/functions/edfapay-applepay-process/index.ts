import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplePayProcessRequest {
  pendingOrderId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  applePayToken: string;
}

// Helper function to convert Uint8Array to hex string
function toHex(buffer: Uint8Array): string {
  const hexBytes = hexEncode(buffer);
  return new TextDecoder().decode(hexBytes);
}

// Helper function to calculate MD5
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    const { pendingOrderId, amount, customerName, customerPhone, customerEmail, applePayToken }: ApplePayProcessRequest = await req.json();

    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     '1.1.1.1';

    // Validate required fields
    if (!pendingOrderId || !amount || !applePayToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique transaction ID
    const transactionId = `APAY${Date.now()}`;
    const orderAmount = amount.toFixed(2);
    const orderCurrency = 'SAR';
    const orderDescription = `Apple Pay - Order ${pendingOrderId}`;

    // Split customer name into first and last name
    const nameParts = customerName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Calculate hash signature
    const hash = await calculateHash(transactionId, orderAmount, orderCurrency, orderDescription, password);

    // EdfaPay Apple Pay processing endpoint
    const edfaPayUrl = 'https://api.edfapay.com/payment/applepay';

    // Prepare form data
    const formData = new FormData();
    formData.append('action', 'SALE');
    formData.append('edfa_merchant_id', merchantId);
    formData.append('order_id', transactionId);
    formData.append('order_amount', orderAmount);
    formData.append('order_currency', orderCurrency);
    formData.append('order_description', orderDescription);
    formData.append('payer_first_name', firstName);
    formData.append('payer_last_name', lastName);
    formData.append('payer_email', customerEmail || 'customer@example.com');
    formData.append('payer_phone', customerPhone || '0500000000');
    formData.append('payer_ip', clientIp);
    formData.append('payer_address', 'Saudi Arabia');
    formData.append('payer_city', 'Riyadh');
    formData.append('payer_country', 'SA');
    formData.append('payer_zip', '12345');
    formData.append('payment_method', 'APPLEPAY');
    formData.append('apple_pay_token', applePayToken);
    formData.append('hash', hash);

    console.log('Processing Apple Pay payment:', { 
      pendingOrderId, 
      amount: orderAmount, 
      transactionId,
      firstName,
      lastName
    });

    // Make request to EdfaPay
    const response = await fetch(edfaPayUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    console.log('EdfaPay Apple Pay response:', result);

    if (result.result === 'ERROR' || !response.ok) {
      console.error('EdfaPay Apple Pay error:', result);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Payment processing failed',
          message: 'فشل في معالجة الدفع',
          details: result.errors || result.error_message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment successful - create the actual order
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get pending order data
    const { data: pendingOrder, error: fetchError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('id', pendingOrderId)
      .single();

    if (fetchError || !pendingOrder) {
      console.error('Error fetching pending order:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Pending order not found' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the actual order
    const { data: order, error: orderError } = await supabase
      .from('provider_orders')
      .insert({
        provider_id: pendingOrder.provider_id,
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
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create order' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items
    const items = pendingOrder.items as any[];
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      selected_options: item.selectedOptions || null
    }));

    await supabase.from('provider_order_items').insert(orderItems);

    // Delete the pending order
    await supabase.from('pending_orders').delete().eq('id', pendingOrderId);

    console.log('Apple Pay order created successfully:', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        transactionId,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Apple Pay processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: 'حدث خطأ في معالجة الدفع' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
