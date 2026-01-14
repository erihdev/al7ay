import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationEmailRequest {
  type?: 'applicant_notification' | 'admin_notification' | 'neighborhood_suggestion';
  email: string;
  fullName: string;
  businessName: string;
  neighborhood?: string;
  phone?: string;
  status?: 'approved' | 'rejected';
  notes?: string;
  customNeighborhood?: string;
  customCity?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'applicant_notification', email, fullName, businessName, neighborhood, phone, status, notes, customNeighborhood, customCity }: ApplicationEmailRequest = await req.json();

    let subject: string;
    let htmlContent: string;
    let toEmail: string;

    // Neighborhood suggestion notification to admin
    if (type === 'neighborhood_suggestion') {
      const adminEmail = 'difmashni@gmail.com';
      toEmail = adminEmail;
      subject = `📍 اقتراح حي جديد - ${customNeighborhood}، ${customCity}`;
      htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #7C3AED, #5B21B6); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .new-badge { display: inline-block; background: #FCD34D; color: #1B4332; padding: 8px 20px; border-radius: 20px; font-weight: bold; margin-bottom: 15px; }
            .content { padding: 30px; }
            .info-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #6b7280; }
            .info-value { font-weight: bold; color: #1f2937; }
            .cta-button { display: inline-block; background: #7C3AED; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="new-badge">📍 اقتراح جديد</div>
              <h1>اقتراح حي جديد</h1>
            </div>
            <div class="content">
              <p>تم استلام اقتراح لإضافة حي جديد إلى منصة الحي!</p>
              
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">اسم الحي المقترح</span>
                  <span class="info-value">${customNeighborhood}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">المدينة</span>
                  <span class="info-value">${customCity}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">مقدم الاقتراح</span>
                  <span class="info-value">${fullName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">النشاط التجاري</span>
                  <span class="info-value">${businessName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">البريد الإلكتروني</span>
                  <span class="info-value">${email}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">رقم الهاتف</span>
                  <span class="info-value">${phone || 'غير محدد'}</span>
                </div>
              </div>

              <p>يرجى مراجعة الاقتراح وإضافة الحي إلى قائمة الأحياء النشطة إذا كان مناسباً.</p>

              <div style="text-align: center;">
                <a href="https://al7ay.lovable.app/admin" class="cta-button">مراجعة الاقتراح</a>
              </div>
            </div>
            <div class="footer">
              <p>تم إرسال هذا البريد تلقائياً من منصة الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'admin_notification') {
      // Admin notification for new application
      const adminEmail = 'difmashni@gmail.com';
      toEmail = adminEmail;
      subject = `🆕 طلب انضمام جديد - ${businessName}`;
      htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1B4332, #2D6A4F); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .new-badge { display: inline-block; background: #FCD34D; color: #1B4332; padding: 8px 20px; border-radius: 20px; font-weight: bold; margin-bottom: 15px; }
            .content { padding: 30px; }
            .info-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #6b7280; }
            .info-value { font-weight: bold; color: #1f2937; }
            .cta-button { display: inline-block; background: #1B4332; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="new-badge">طلب جديد 🆕</div>
              <h1>طلب انضمام مقدم خدمة جديد</h1>
            </div>
            <div class="content">
              <p>تم استلام طلب انضمام جديد لمنصة الحي!</p>
              
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">الاسم الكامل</span>
                  <span class="info-value">${fullName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">اسم النشاط</span>
                  <span class="info-value">${businessName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">الحي</span>
                  <span class="info-value">${neighborhood || 'غير محدد'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">رقم الهاتف</span>
                  <span class="info-value">${phone || 'غير محدد'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">البريد الإلكتروني</span>
                  <span class="info-value">${email}</span>
                </div>
              </div>

              <p>يرجى مراجعة الطلب واتخاذ الإجراء المناسب.</p>

              <div style="text-align: center;">
                <a href="https://al7ay.lovable.app/admin" class="cta-button">مراجعة الطلب في لوحة التحكم</a>
              </div>
            </div>
            <div class="footer">
              <p>تم إرسال هذا البريد تلقائياً من منصة الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (status === 'approved') {
      toEmail = email;
      subject = `🎉 تم قبول طلبك للانضمام إلى منصة الحي`;
      htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1B4332, #2D6A4F); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .success-icon { font-size: 64px; margin-bottom: 20px; }
            .content { padding: 30px; }
            .highlight-box { background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .cta-button { display: inline-block; background: #1B4332; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .steps { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .step { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px; }
            .step-number { background: #1B4332; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">🎉</div>
              <h1>مبروك! تم قبول طلبك</h1>
            </div>
            <div class="content">
              <p>مرحباً <strong>${fullName}</strong>،</p>
              <p>يسعدنا إبلاغك بأنه تم قبول طلب انضمام نشاطك <strong>"${businessName}"</strong> إلى منصة الحي!</p>
              
              <div class="highlight-box">
                <p style="margin: 0; font-size: 18px; color: #059669;">🏪 أنت الآن جزء من عائلة الحي!</p>
              </div>

              <div class="steps">
                <h3 style="margin-top: 0;">الخطوات التالية:</h3>
                <div class="step">
                  <div class="step-number">1</div>
                  <div>
                    <strong>سجّل دخولك</strong><br>
                    <span style="color: #6b7280;">انتقل إلى صفحة تسجيل الدخول وأنشئ حسابك</span>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div>
                    <strong>أضف منتجاتك</strong><br>
                    <span style="color: #6b7280;">ابدأ بإضافة منتجاتك وتحديد أسعارك</span>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div>
                    <strong>استقبل الطلبات</strong><br>
                    <span style="color: #6b7280;">ابدأ في استقبال طلبات العملاء في حيّك</span>
                  </div>
                </div>
              </div>

              ${notes ? `<p><strong>ملاحظة من الإدارة:</strong> ${notes}</p>` : ''}

              <div style="text-align: center;">
                <a href="https://al7ay.lovable.app/provider-login" class="cta-button">تسجيل الدخول الآن</a>
              </div>
            </div>
            <div class="footer">
              <p>شكراً لانضمامك إلى منصة الحي! 💚</p>
              <p>فريق منصة الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Default applicant notification (rejected)
      toEmail = email;
      subject = `تحديث بخصوص طلب انضمامك إلى منصة الحي`;
      htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6B7280, #4B5563); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .info-box { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #1B4332; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>تحديث بخصوص طلبك</h1>
            </div>
            <div class="content">
              <p>مرحباً <strong>${fullName}</strong>،</p>
              <p>شكراً لاهتمامك بالانضمام إلى منصة الحي.</p>
              
              <p>بعد مراجعة طلب انضمام نشاطك <strong>"${businessName}"</strong>، نأسف لإبلاغك بأنه لم يتم قبول الطلب في الوقت الحالي.</p>

              ${notes ? `
                <div class="info-box">
                  <strong>ملاحظة من الإدارة:</strong><br>
                  ${notes}
                </div>
              ` : ''}

              <p>يمكنك إعادة تقديم الطلب مرة أخرى بعد معالجة الملاحظات المذكورة أعلاه.</p>

              <div style="text-align: center;">
                <a href="https://al7ay.lovable.app" class="cta-button">تقديم طلب جديد</a>
              </div>
            </div>
            <div class="footer">
              <p>نتمنى لك التوفيق!</p>
              <p>فريق منصة الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "منصة الحي <onboarding@resend.dev>",
      to: [toEmail!],
      subject: subject,
      html: htmlContent,
    });

    console.log("Application email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
