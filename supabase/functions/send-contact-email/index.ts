import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "منصة الحي <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return res.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate lengths
    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum length" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminEmail = "difmashni@gmail.com";

    // Send email to admin
    await sendEmail(
      [adminEmail],
      `رسالة جديدة: ${subject}`,
      `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; width: 120px; }
            .info-value { color: #333; }
            .message-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 20px; }
            .message-box h3 { margin-top: 0; color: #0d9488; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 رسالة جديدة من نموذج التواصل</h1>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="info-label">الاسم:</span>
                <span class="info-value">${name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">البريد:</span>
                <span class="info-value"><a href="mailto:${email}">${email}</a></span>
              </div>
              ${phone ? `
              <div class="info-row">
                <span class="info-label">الهاتف:</span>
                <span class="info-value"><a href="tel:${phone}">${phone}</a></span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">الموضوع:</span>
                <span class="info-value">${subject}</span>
              </div>
              <div class="message-box">
                <h3>الرسالة:</h3>
                <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
            </div>
            <div class="footer">
              <p>تم إرسال هذه الرسالة من نموذج التواصل في منصة الحي</p>
            </div>
          </div>
        </body>
        </html>
      `
    );

    // Send confirmation email to user
    await sendEmail(
      [email],
      "شكراً لتواصلك معنا - منصة الحي",
      `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; line-height: 1.8; }
            .highlight { background: #e6fffa; border-right: 4px solid #0d9488; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ تم استلام رسالتك</h1>
            </div>
            <div class="content">
              <p>مرحباً ${name}،</p>
              <p>شكراً لتواصلك معنا! تم استلام رسالتك بنجاح.</p>
              
              <div class="highlight">
                <strong>موضوع رسالتك:</strong> ${subject}
              </div>
              
              <p>سيقوم فريق الدعم لدينا بمراجعة رسالتك والرد عليك في أقرب وقت ممكن، عادةً خلال 24-48 ساعة.</p>
              
              <p>إذا كان لديك استفسار عاجل، يمكنك التواصل معنا مباشرة عبر:</p>
              <ul>
                <li>واتساب: +966 50 000 0000</li>
                <li>البريد: support@alhaay.com</li>
              </ul>
              
              <p>مع تحيات،<br>فريق منصة الحي</p>
            </div>
            <div class="footer">
              <p>© 2025 منصة الحي. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );

    console.log("Contact emails sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending contact email:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
