import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmployeeNotificationRequest {
  type: 'permissions_updated' | 'account_created' | 'status_changed' | 'contract_created' | 'achievement_unlocked' | 'inactivity_alert';
  employeeName: string;
  employeeEmail: string;
  permissions?: { key: string; label: string; canView: boolean; canEdit: boolean }[];
  isActive?: boolean;
  temporaryPassword?: string;
  contractNumber?: string;
  signingLink?: string;
  contractDetails?: {
    positionTitle: string;
    salary: number;
    startDate: string;
    contractType: string;
  };
  achievement?: {
    type: 'top_performer' | 'milestone_100' | 'milestone_500' | 'milestone_1000' | 'weekly_champion' | 'category_leader';
    title: string;
    description: string;
    period?: string;
    category?: string;
    count?: number;
  };
  inactivityDays?: number;
}

const permissionLabels: Record<string, string> = {
  orders: 'الطلبات',
  stats: 'الإحصائيات',
  reports: 'التقارير',
  offers: 'العروض',
  referrals: 'الإحالات',
  coupons: 'الكوبونات',
  applications: 'طلبات الانضمام',
  providers: 'مقدمي الخدمات',
  verification: 'التوثيق',
  payments: 'المدفوعات',
  subscriptions: 'الاشتراكات',
  commissions: 'العمولات',
  payouts: 'التحويلات',
  edfapay: 'EdfaPay',
  neighborhoods: 'الأحياء',
  versions: 'الإصدارات',
  settings: 'إعدادات المتجر',
  employees: 'إدارة الموظفين',
};

const contractTypeLabels: Record<string, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد مؤقت',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      employeeName, 
      employeeEmail, 
      permissions, 
      isActive, 
      temporaryPassword,
      contractNumber,
      signingLink,
      contractDetails,
      achievement,
      inactivityDays
    }: EmployeeNotificationRequest = await req.json();

    let subject: string = '';
    let html: string = '';

    const baseStyles = `
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; }
      .content { padding: 30px; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; }
      .badge-view { background: #dbeafe; color: #1d4ed8; }
      .badge-edit { background: #dcfce7; color: #166534; }
      .permission-item { padding: 12px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
      .permission-name { font-weight: 500; color: #374151; }
      .credentials-box { background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
      .credential-value { font-family: monospace; font-size: 18px; color: #7c3aed; font-weight: bold; background: #f3e8ff; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 8px; }
      .status-active { color: #059669; }
      .status-inactive { color: #dc2626; }
      .contract-details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .contract-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      .contract-row:last-child { border-bottom: none; }
      .contract-label { color: #6b7280; }
      .contract-value { font-weight: 600; color: #374151; }
      .sign-button { display: inline-block; background: linear-gradient(135deg, #059669, #10B981); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
      .warning-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; color: #92400e; }
      .achievement-box { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
      .achievement-icon { font-size: 64px; margin-bottom: 15px; }
      .achievement-title { font-size: 24px; font-weight: bold; color: #92400e; margin: 10px 0; }
      .achievement-desc { color: #78716c; font-size: 16px; }
      .inactivity-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
      .stat-card { background: #f9fafb; border-radius: 8px; padding: 15px; margin: 10px 5px; display: inline-block; min-width: 120px; }
      .stat-value { font-size: 28px; font-weight: bold; color: #7c3aed; }
      .stat-label { font-size: 12px; color: #6b7280; }
    `;

    if (type === 'account_created') {
      subject = '🎉 مرحباً بك في فريق الحي!';
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 مرحباً بك!</h1>
              <p style="margin: 0; opacity: 0.9;">تم إنشاء حسابك بنجاح</p>
            </div>
            <div class="content">
              <p>مرحباً <strong>${employeeName}</strong>،</p>
              <p>يسعدنا انضمامك إلى فريق عمل الحي! تم إنشاء حسابك في لوحة التحكم.</p>
              
              <div class="credentials-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">بيانات الدخول الخاصة بك:</p>
                <p style="margin: 5px 0;"><strong>البريد الإلكتروني:</strong></p>
                <div class="credential-value">${employeeEmail}</div>
                ${temporaryPassword ? `
                <p style="margin: 15px 0 5px 0;"><strong>كلمة المرور:</strong></p>
                <div class="credential-value">${temporaryPassword}</div>
                <p style="margin-top: 15px; font-size: 12px; color: #dc2626;">⚠️ يرجى تغيير كلمة المرور فور تسجيل الدخول</p>
                ` : ''}
              </div>
              
              <p style="text-align: center;">
                <a href="https://al7ay.lovable.app/admin-login" 
                   style="display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  تسجيل الدخول للوحة التحكم
                </a>
              </p>
            </div>
            <div class="footer">
              <p>فريق الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'permissions_updated') {
      subject = '🔐 تم تحديث صلاحياتك في لوحة التحكم';
      
      const activePermissions = permissions?.filter(p => p.canView || p.canEdit) || [];
      
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 تحديث الصلاحيات</h1>
            </div>
            <div class="content">
              <p>مرحباً <strong>${employeeName}</strong>،</p>
              <p>تم تحديث صلاحياتك في لوحة التحكم. فيما يلي الصلاحيات الجديدة:</p>
              
              ${activePermissions.length > 0 ? `
              <div style="background: #f9fafb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
                ${activePermissions.map(p => `
                  <div class="permission-item">
                    <span class="permission-name">${permissionLabels[p.key] || p.key}</span>
                    <div>
                      ${p.canView ? '<span class="badge badge-view">👁 عرض</span>' : ''}
                      ${p.canEdit ? '<span class="badge badge-edit">✏️ تعديل</span>' : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : `
              <div style="background: #fef2f2; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; color: #dc2626;">⚠️ لم يتم تعيين أي صلاحيات حالياً</p>
              </div>
              `}
              
              <p style="color: #6b7280; font-size: 14px;">
                إذا كانت لديك أي استفسارات حول صلاحياتك، يرجى التواصل مع المشرف.
              </p>
            </div>
            <div class="footer">
              <p>فريق الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'status_changed') {
      const statusText = isActive ? 'تفعيل' : 'تعطيل';
      const statusEmoji = isActive ? '✅' : '⛔';
      
      subject = `${statusEmoji} تم ${statusText} حسابك`;
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="background: ${isActive ? 'linear-gradient(135deg, #059669, #10B981)' : 'linear-gradient(135deg, #dc2626, #ef4444)'};">
              <h1>${statusEmoji} تحديث حالة الحساب</h1>
            </div>
            <div class="content" style="text-align: center;">
              <p>مرحباً <strong>${employeeName}</strong>،</p>
              
              <div style="font-size: 48px; margin: 20px 0;">${statusEmoji}</div>
              
              <p style="font-size: 18px;">
                تم <strong class="${isActive ? 'status-active' : 'status-inactive'}">${statusText}</strong> حسابك في لوحة التحكم.
              </p>
              
              ${isActive ? `
              <p style="margin-top: 20px;">
                <a href="https://al7ay.lovable.app/admin-login" 
                   style="display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  تسجيل الدخول الآن
                </a>
              </p>
              ` : `
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                إذا كان لديك أي استفسار، يرجى التواصل مع المشرف.
              </p>
              `}
            </div>
            <div class="footer">
              <p>فريق الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'contract_created') {
      subject = '📝 عقد عمل جديد بانتظار توقيعك';
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #0ea5e9, #06b6d4);">
              <h1>📝 عقد عمل جديد</h1>
              <p style="margin: 0; opacity: 0.9;">بانتظار توقيعك</p>
            </div>
            <div class="content">
              <p>مرحباً <strong>${employeeName}</strong>،</p>
              <p>تم إنشاء عقد عمل جديد لك. يرجى مراجعة تفاصيل العقد والتوقيع عليه.</p>
              
              <div class="contract-details">
                <h3 style="margin-top: 0; color: #374151;">تفاصيل العقد</h3>
                <div class="contract-row">
                  <span class="contract-label">رقم العقد:</span>
                  <span class="contract-value">${contractNumber}</span>
                </div>
                ${contractDetails ? `
                <div class="contract-row">
                  <span class="contract-label">المسمى الوظيفي:</span>
                  <span class="contract-value">${contractDetails.positionTitle}</span>
                </div>
                <div class="contract-row">
                  <span class="contract-label">نوع العقد:</span>
                  <span class="contract-value">${contractTypeLabels[contractDetails.contractType] || contractDetails.contractType}</span>
                </div>
                <div class="contract-row">
                  <span class="contract-label">الراتب الشهري:</span>
                  <span class="contract-value">${contractDetails.salary.toLocaleString()} ر.س</span>
                </div>
                <div class="contract-row">
                  <span class="contract-label">تاريخ البدء:</span>
                  <span class="contract-value">${contractDetails.startDate}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="warning-box">
                <strong>⏰ تنبيه هام:</strong> هذا الرابط صالح لمدة 7 أيام فقط. يرجى التوقيع على العقد قبل انتهاء الصلاحية.
              </div>
              
              <p style="text-align: center;">
                <a href="${signingLink}" class="sign-button">
                  ✍️ مراجعة وتوقيع العقد
                </a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                إذا كانت لديك أي استفسارات حول العقد، يرجى التواصل مع قسم الموارد البشرية.
              </p>
            </div>
            <div class="footer">
              <p>فريق الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'achievement_unlocked') {
      const achievementEmojis: Record<string, string> = {
        top_performer: '🏆',
        milestone_100: '💯',
        milestone_500: '🌟',
        milestone_1000: '👑',
        weekly_champion: '🥇',
        category_leader: '🎯',
      };
      const emoji = achievement?.type ? achievementEmojis[achievement.type] || '🎉' : '🎉';
      
      subject = `${emoji} تهانينا! لقد حققت إنجازاً جديداً`;
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">
              <h1>${emoji} إنجاز جديد!</h1>
              <p style="margin: 0; opacity: 0.9;">تهانينا على أدائك المتميز</p>
            </div>
            <div class="content">
              <p>مرحباً <strong>${employeeName}</strong>،</p>
              
              <div class="achievement-box">
                <div class="achievement-icon">${emoji}</div>
                <div class="achievement-title">${achievement?.title || 'إنجاز متميز'}</div>
                <div class="achievement-desc">${achievement?.description || ''}</div>
                ${achievement?.count ? `
                <div class="stat-card" style="margin-top: 15px;">
                  <div class="stat-value">${achievement.count}</div>
                  <div class="stat-label">إجراء مكتمل</div>
                </div>
                ` : ''}
                ${achievement?.period ? `
                <p style="margin-top: 15px; color: #78716c; font-size: 14px;">
                  📅 الفترة: ${achievement.period}
                </p>
                ` : ''}
                ${achievement?.category ? `
                <p style="margin-top: 5px; color: #78716c; font-size: 14px;">
                  📂 القسم: ${achievement.category}
                </p>
                ` : ''}
              </div>
              
              <p style="text-align: center; color: #6b7280;">
                استمر في هذا الأداء الرائع! 💪
              </p>
            </div>
            <div class="footer">
              <p>فريق الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'inactivity_alert') {
      subject = '⚠️ تنبيه: لاحظنا غيابك عن النظام';
      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #ef4444, #f87171);">
              <h1>⚠️ تنبيه عدم النشاط</h1>
            </div>
            <div class="content">
              <p>مرحباً <strong>${employeeName}</strong>،</p>
              
              <div class="inactivity-box">
                <div style="font-size: 48px; margin-bottom: 15px;">😴</div>
                <p style="font-size: 18px; color: #dc2626; margin: 0;">
                  لم نلاحظ أي نشاط منك منذ <strong>${inactivityDays || 7}</strong> يوم
                </p>
              </div>
              
              <p>نأمل أن تكون بخير! إذا كنت بحاجة إلى أي مساعدة أو واجهتك مشكلة في الوصول إلى لوحة التحكم، لا تتردد في التواصل معنا.</p>
              
              <p style="text-align: center; margin-top: 25px;">
                <a href="https://al7ay.lovable.app/admin-login" 
                   style="display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  العودة إلى لوحة التحكم
                </a>
              </p>
            </div>
            <div class="footer">
              <p>فريق الحي</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "الحي <onboarding@resend.dev>",
      to: [employeeEmail],
      subject,
      html,
    });

    console.log("Employee notification email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-employee-notification:", error);
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
