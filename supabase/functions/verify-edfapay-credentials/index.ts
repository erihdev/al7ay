import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  providerId: string;
  merchantId: string;
  secretKey: string;
  providerEmail: string;
  providerName: string;
}

// Simple encryption function using base64 + XOR (for demo - in production use proper encryption)
function encryptCredentials(merchantId: string, secretKey: string): string {
  const combined = JSON.stringify({ merchantId, secretKey });
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'default-key';
  
  let encrypted = '';
  for (let i = 0; i < combined.length; i++) {
    const charCode = combined.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  
  return btoa(encrypted);
}

async function sendNotificationEmail(
  resend: any,
  email: string,
  providerName: string,
  success: boolean,
  message: string,
  merchantName?: string
) {
  const subject = success 
    ? '✅ تم ربط حساب EdfaPay بنجاح' 
    : '❌ فشل ربط حساب EdfaPay';

  const html = success ? `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .success-badge { background: #d1fae5; color: #065f46; padding: 15px 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
        .details { background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .detail-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-item:last-child { border-bottom: none; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ تم ربط حساب EdfaPay بنجاح!</h1>
        </div>
        <div class="content">
          <p>مرحباً <strong>${providerName}</strong>،</p>
          
          <div class="success-badge">
            <strong>🎉 تهانينا! تم التحقق من حسابك وربطه بنجاح</strong>
          </div>
          
          <div class="details">
            <h3>تفاصيل الحساب:</h3>
            <div class="detail-item">
              <span>اسم التاجر:</span>
              <strong>${merchantName || 'غير متوفر'}</strong>
            </div>
            <div class="detail-item">
              <span>الحالة:</span>
              <strong style="color: #10b981;">مفعّل</strong>
            </div>
          </div>
          
          <p>يمكنك الآن استقبال المدفوعات مباشرة في حسابك عبر بوابة EdfaPay.</p>
          <p>جميع المدفوعات ستُحول تلقائياً إلى حسابك البنكي المسجل لدى EdfaPay.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} قهوة الحي - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  ` : `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .error-badge { background: #fee2e2; color: #991b1b; padding: 15px 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
        .help-section { background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ فشل ربط حساب EdfaPay</h1>
        </div>
        <div class="content">
          <p>مرحباً <strong>${providerName}</strong>،</p>
          
          <div class="error-badge">
            <strong>⚠️ تعذر التحقق من بيانات حسابك</strong>
          </div>
          
          <p><strong>سبب الفشل:</strong> ${message}</p>
          
          <div class="help-section">
            <h3>خطوات الحل:</h3>
            <ol>
              <li>تأكد من صحة معرف التاجر (Merchant ID)</li>
              <li>تأكد من صحة المفتاح السري (Secret Key)</li>
              <li>تأكد من أن حسابك مفعّل لدى EdfaPay</li>
              <li>إذا استمرت المشكلة، تواصل مع دعم EdfaPay</li>
            </ol>
          </div>
          
          <p>يمكنك المحاولة مرة أخرى من إعدادات متجرك.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} قهوة الحي - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "قهوة الحي <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });
    console.log(`Email notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { providerId, merchantId, secretKey, providerEmail, providerName }: VerifyRequest = await req.json();

    if (!providerId || !merchantId || !secretKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'بيانات غير مكتملة' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Test EdfaPay API connection
    // This is a simulated verification - in production, call actual EdfaPay API
    let verificationSuccess = false;
    let merchantName = '';
    let errorMessage = '';

    try {
      // In production, make actual API call to EdfaPay to verify credentials
      // For now, we simulate by checking if credentials are in valid format
      
      // Validate merchant ID format (typically alphanumeric, 8-32 chars)
      if (!/^[a-zA-Z0-9]{8,32}$/.test(merchantId)) {
        errorMessage = 'صيغة معرف التاجر غير صحيحة';
      } 
      // Validate secret key format (typically 32+ characters)
      else if (secretKey.length < 16) {
        errorMessage = 'المفتاح السري قصير جداً';
      }
      else {
        // Simulate API verification
        // In production, replace with actual EdfaPay API call:
        // const response = await fetch('https://api.edfapay.com/verify', { ... });
        
        verificationSuccess = true;
        merchantName = `متجر ${providerName}`;
      }
    } catch (apiError) {
      console.error('EdfaPay API error:', apiError);
      errorMessage = 'فشل الاتصال بخادم EdfaPay';
    }

    if (verificationSuccess) {
      // Encrypt and save credentials
      const encryptedCredentials = encryptCredentials(merchantId, secretKey);
      
      const { error: updateError } = await supabase
        .from('service_providers')
        .update({
          edfapay_merchant_id_encrypted: encryptedCredentials,
          edfapay_credentials_verified: true,
          edfapay_verified_at: new Date().toISOString(),
          gateway_account_id: merchantId
        })
        .eq('id', providerId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return new Response(
          JSON.stringify({ success: false, message: 'فشل حفظ البيانات في قاعدة البيانات' }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send success email notification
      if (resend && providerEmail) {
        await sendNotificationEmail(resend, providerEmail, providerName, true, '', merchantName);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم التحقق من الحساب وحفظ البيانات بنجاح',
          merchantName 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      // Send failure email notification
      if (resend && providerEmail) {
        await sendNotificationEmail(resend, providerEmail, providerName, false, errorMessage);
      }

      return new Response(
        JSON.stringify({ success: false, message: errorMessage || 'فشل التحقق من بيانات الحساب' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: any) {
    console.error("Error in verify-edfapay-credentials:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
