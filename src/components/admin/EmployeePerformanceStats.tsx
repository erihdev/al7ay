import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import { 
  Users, 
  Activity, 
  Award, 
  TrendingUp, 
  Clock, 
  Target,
  RefreshCw,
  Calendar,
  Download,
  Briefcase
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ACTION_CATEGORIES = {
  orders: ["order_status_change"],
  products: ["product_create", "product_update", "product_delete"],
  providers: ["provider_approve", "provider_reject", "provider_update"],
  employees: ["employee_create", "employee_update", "employee_permissions_update"],
  coupons: ["coupon_create", "coupon_update", "coupon_delete"],
  offers: ["offer_create", "offer_update", "offer_delete"],
  neighborhoods: ["neighborhood_create", "neighborhood_update"],
  settings: ["settings_update", "payout_process"],
  auth: ["login", "logout"],
};

const CATEGORY_LABELS: Record<string, string> = {
  orders: "إدارة الطلبات",
  products: "إدارة المنتجات",
  providers: "إدارة مقدمي الخدمة",
  employees: "إدارة الموظفين",
  coupons: "إدارة الكوبونات",
  offers: "إدارة العروض",
  neighborhoods: "إدارة الأحياء",
  settings: "الإعدادات والمدفوعات",
  auth: "تسجيل الدخول/الخروج",
};

const CHART_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", 
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#84cc16"
];

interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  positions: string[];
  totalActions: number;
  actionsByCategory: Record<string, number>;
  avgActionsPerDay: number;
  mostActiveHour: number;
  lastActivity: string | null;
}

export const EmployeePerformanceStats = () => {
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
  const endDate = endOfDay(new Date());

  // Fetch employees with their positions
  const { data: employees } = useQuery({
    queryKey: ["employees-with-positions"],
    queryFn: async () => {
      const { data: emps, error } = await supabase
        .from("admin_employees")
        .select(`
          id, 
          name, 
          email, 
          is_active,
          employee_positions (
            is_primary,
            job_positions (
              title_ar
            )
          )
        `)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return emps;
    },
  });

  // Fetch activity logs for the date range
  const { data: activityLogs, isLoading, refetch } = useQuery({
    queryKey: ["employee-performance-logs", dateRange, selectedEmployee],
    queryFn: async () => {
      let query = supabase
        .from("employee_activity_log")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (selectedEmployee !== "all") {
        query = query.eq("employee_id", selectedEmployee);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate employee statistics
  const employeeStats: EmployeeStats[] = employees?.map((emp) => {
    const empLogs = activityLogs?.filter((log) => log.employee_id === emp.id) || [];
    
    // Get positions
    const positions = (emp.employee_positions || [])
      .sort((a: any, b: any) => (a.is_primary ? -1 : b.is_primary ? 1 : 0))
      .map((ep: any) => ep.job_positions?.title_ar || "غير محدد");

    // Count actions by category
    const actionsByCategory: Record<string, number> = {};
    Object.entries(ACTION_CATEGORIES).forEach(([category, actions]) => {
      actionsByCategory[category] = empLogs.filter((log) => 
        actions.includes(log.action_type)
      ).length;
    });

    // Calculate average actions per day
    const days = parseInt(dateRange);
    const avgActionsPerDay = empLogs.length / days;

    // Find most active hour
    const hourCounts: Record<number, number> = {};
    empLogs.forEach((log) => {
      const hour = new Date(log.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveHour = Object.entries(hourCounts).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 }
    ).hour;

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      positions,
      totalActions: empLogs.length,
      actionsByCategory,
      avgActionsPerDay,
      mostActiveHour,
      lastActivity: empLogs[0]?.created_at || null,
    };
  }) || [];

  // Sort by total actions descending
  const sortedStats = [...employeeStats].sort((a, b) => b.totalActions - a.totalActions);

  // Prepare chart data
  const categoryChartData = Object.keys(ACTION_CATEGORIES).map((category) => ({
    name: CATEGORY_LABELS[category],
    value: activityLogs?.filter((log) => 
      ACTION_CATEGORIES[category as keyof typeof ACTION_CATEGORIES].includes(log.action_type)
    ).length || 0,
  })).filter(d => d.value > 0);

  // Daily activity trend
  const dailyActivityData = Array.from({ length: parseInt(dateRange) }, (_, i) => {
    const date = subDays(new Date(), parseInt(dateRange) - 1 - i);
    const dayLogs = activityLogs?.filter((log) => {
      const logDate = new Date(log.created_at);
      return logDate.toDateString() === date.toDateString();
    }) || [];
    return {
      date: format(date, "dd/MM", { locale: ar }),
      count: dayLogs.length,
    };
  });

  // Hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    count: activityLogs?.filter((log) => 
      new Date(log.created_at).getHours() === hour
    ).length || 0,
  }));

  // Top performers by category
  const getTopPerformerByCategory = (category: string) => {
    return sortedStats.reduce(
      (top, emp) => (emp.actionsByCategory[category] > (top?.actionsByCategory[category] || 0) ? emp : top),
      null as EmployeeStats | null
    );
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.text("Employee Performance Report", 105, yPos, { align: "center" });
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Period: Last ${dateRange} days - Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, yPos, { align: "center" });
    doc.setTextColor(0, 0, 0);
    yPos += 15;

    // Summary
    doc.setFontSize(14);
    doc.text("Performance Summary", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Employee", "Position", "Total Actions", "Avg/Day", "Most Active Hour"]],
      body: sortedStats.map((emp) => [
        emp.name,
        emp.positions[0] || "-",
        emp.totalActions.toString(),
        emp.avgActionsPerDay.toFixed(1),
        `${emp.mostActiveHour}:00`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [139, 92, 246] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Category breakdown
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("Actions by Category", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Total Actions", "Top Performer"]],
      body: Object.keys(ACTION_CATEGORIES).map((category) => {
        const topPerformer = getTopPerformerByCategory(category);
        const totalActions = activityLogs?.filter((log) => 
          ACTION_CATEGORIES[category as keyof typeof ACTION_CATEGORIES].includes(log.action_type)
        ).length || 0;
        return [
          CATEGORY_LABELS[category],
          totalActions.toString(),
          topPerformer?.name || "-",
        ];
      }),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`employee-performance-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  // Summary stats
  const totalActions = activityLogs?.length || 0;
  const activeEmployees = employeeStats.filter(e => e.totalActions > 0).length;
  const avgActionsPerEmployee = activeEmployees > 0 ? totalActions / activeEmployees : 0;
  const topPerformer = sortedStats[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              إحصائيات أداء الموظفين
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7" | "30" | "90")}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">آخر 7 أيام</SelectItem>
                  <SelectItem value="30">آخر 30 يوم</SelectItem>
                  <SelectItem value="90">آخر 90 يوم</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[180px]">
                  <Users className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="جميع الموظفين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <Download className="h-4 w-4 ml-2" />
                تصدير PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإجراءات</p>
                <p className="text-2xl font-bold">{totalActions}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الموظفون النشطون</p>
                <p className="text-2xl font-bold">{activeEmployees}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معدل الإجراء/موظف</p>
                <p className="text-2xl font-bold">{avgActionsPerEmployee.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الأفضل أداءً</p>
                <p className="text-lg font-bold truncate max-w-[120px]">
                  {topPerformer?.name || "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {topPerformer?.totalActions || 0} إجراء
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              النشاط اليومي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                  name="الإجراءات"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Actions by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              توزيع الإجراءات حسب الفئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            توزيع النشاط حسب الساعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hour" className="text-xs" interval={2} />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="الإجراءات"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            ترتيب الموظفين حسب الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : sortedStats.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-12">#</TableHead>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">الدور الرئيسي</TableHead>
                    <TableHead className="text-right">إجمالي الإجراءات</TableHead>
                    <TableHead className="text-right">معدل يومي</TableHead>
                    <TableHead className="text-right">ساعة الذروة</TableHead>
                    <TableHead className="text-right">آخر نشاط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStats.map((emp, index) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        {index < 3 ? (
                          <Badge 
                            className={
                              index === 0 ? "bg-amber-500" : 
                              index === 1 ? "bg-gray-400" : 
                              "bg-amber-700"
                            }
                          >
                            {index + 1}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          <span>{emp.positions[0] || "غير محدد"}</span>
                        </div>
                        {emp.positions.length > 1 && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            +{emp.positions.length - 1} أدوار
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">{emp.totalActions}</span>
                      </TableCell>
                      <TableCell>{emp.avgActionsPerDay.toFixed(1)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{emp.mostActiveHour}:00</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {emp.lastActivity ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(emp.lastActivity), "dd MMM HH:mm", { locale: ar })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات للفترة المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.keys(ACTION_CATEGORIES).slice(0, 6).map((category) => {
          const topPerformer = getTopPerformerByCategory(category);
          const totalCategoryActions = activityLogs?.filter((log) => 
            ACTION_CATEGORIES[category as keyof typeof ACTION_CATEGORIES].includes(log.action_type)
          ).length || 0;

          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{CATEGORY_LABELS[category]}</p>
                    <p className="text-2xl font-bold mt-1">{totalCategoryActions}</p>
                  </div>
                  {topPerformer && topPerformer.actionsByCategory[category] > 0 && (
                    <div className="text-left">
                      <Badge variant="secondary" className="mb-1">الأفضل</Badge>
                      <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {topPerformer.name}
                      </p>
                      <p className="text-xs font-medium">
                        {topPerformer.actionsByCategory[category]} إجراء
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
