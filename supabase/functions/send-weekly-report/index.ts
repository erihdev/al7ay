import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmployeeStats {
  name: string;
  email: string;
  totalActions: number;
  categories: Record<string, number>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get report settings
    const { data: settings } = await supabase
      .from("admin_report_settings")
      .select("*")
      .eq("report_type", "employee_performance")
      .single();

    if (!settings?.is_enabled || !settings?.recipients?.length) {
      return new Response(JSON.stringify({ message: "Reports disabled or no recipients" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get last week's date range
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all employees
    const { data: employees } = await supabase
      .from("admin_employees")
      .select("id, name, email")
      .eq("is_active", true);

    if (!employees?.length) {
      return new Response(JSON.stringify({ message: "No active employees" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get activity logs for the week
    const { data: activityLogs } = await supabase
      .from("employee_activity_log")
      .select("*")
      .gte("created_at", weekAgo.toISOString())
      .lte("created_at", now.toISOString());

    // Calculate stats per employee
    const employeeStats: EmployeeStats[] = employees.map((emp) => {
      const empLogs = activityLogs?.filter((log) => log.employee_id === emp.id) || [];
      const categories: Record<string, number> = {};
      
      empLogs.forEach((log) => {
        categories[log.action_type] = (categories[log.action_type] || 0) + 1;
      });

      return {
        name: emp.name,
        email: emp.email,
        totalActions: empLogs.length,
        categories,
      };
    });

    // Sort by total actions
    employeeStats.sort((a, b) => b.totalActions - a.totalActions);

    // Calculate points for employees
    for (const emp of employees) {
      const empLogs = activityLogs?.filter((log) => log.employee_id === emp.id) || [];
      const points = empLogs.length * 5; // 5 points per action

      if (points > 0) {
        // Update or insert points
        const { data: existingPoints } = await supabase
          .from("employee_points")
          .select("*")
          .eq("employee_id", emp.id)
          .single();

        if (existingPoints) {
          await supabase
            .from("employee_points")
            .update({
              total_points: existingPoints.total_points + points,
              weekly_points: points,
              monthly_points: existingPoints.monthly_points + points,
            })
            .eq("employee_id", emp.id);
        } else {
          await supabase.from("employee_points").insert({
            employee_id: emp.id,
            total_points: points,
            weekly_points: points,
            monthly_points: points,
          });
        }

        // Add to history
        await supabase.from("employee_points_history").insert({
          employee_id: emp.id,
          points: points,
          action_type: "weekly_activity",
          description: `نقاط الأسبوع: ${empLogs.length} إجراء × 5 نقاط`,
        });
      }
    }

    // Generate HTML report
    const totalActions = employeeStats.reduce((sum, e) => sum + e.totalActions, 0);
    const topPerformer = employeeStats[0];

    const htmlReport = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 10px 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .stat-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .stat-box h3 { margin: 0 0 10px; color: #333; }
          .stat-box .number { font-size: 32px; font-weight: bold; color: #667eea; }
          .employee-list { list-style: none; padding: 0; margin: 0; }
          .employee-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
          .employee-item:last-child { border-bottom: none; }
          .employee-name { font-weight: 500; }
          .employee-actions { color: #667eea; font-weight: bold; }
          .top-performer { background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .top-performer h3 { margin: 0; color: #333; }
          .top-performer p { margin: 5px 0 0; font-size: 18px; font-weight: bold; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 تقرير الأداء الأسبوعي</h1>
            <p>${weekAgo.toLocaleDateString('ar-SA')} - ${now.toLocaleDateString('ar-SA')}</p>
          </div>
          <div class="content">
            ${topPerformer && topPerformer.totalActions > 0 ? `
              <div class="top-performer">
                <h3>🏆 أفضل موظف هذا الأسبوع</h3>
                <p>${topPerformer.name} - ${topPerformer.totalActions} إجراء</p>
              </div>
            ` : ''}
            
            <div class="stat-box">
              <h3>إجمالي الإجراءات</h3>
              <div class="number">${totalActions}</div>
            </div>
            
            <h3>أداء الموظفين</h3>
            <ul class="employee-list">
              ${employeeStats.map((emp) => `
                <li class="employee-item">
                  <span class="employee-name">${emp.name}</span>
                  <span class="employee-actions">${emp.totalActions} إجراء</span>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="footer">
            <p>تم إرسال هذا التقرير تلقائياً من نظام الحي</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all recipients
    for (const recipient of settings.recipients) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "الحي <onboarding@resend.dev>",
          to: [recipient],
          subject: `📊 تقرير الأداء الأسبوعي - ${now.toLocaleDateString('ar-SA')}`,
          html: htmlReport,
        }),
      });
      
      if (!emailResponse.ok) {
        console.error("Failed to send email:", await emailResponse.text());
      }
    }

    // Update last sent time
    await supabase
      .from("admin_report_settings")
      .update({ last_sent_at: now.toISOString() })
      .eq("report_type", "employee_performance");

    return new Response(
      JSON.stringify({ success: true, message: "Report sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending weekly report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
