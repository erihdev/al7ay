import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
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
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  Users, 
  Activity, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Target,
  RefreshCw,
  Calendar,
  Download,
  Briefcase,
  AlertTriangle,
  Mail,
  Send,
  GitCompare,
  Trophy,
  Bell
} from "lucide-react";
import { toast } from "sonner";
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

const ACHIEVEMENT_THRESHOLDS = {
  milestone_100: 100,
  milestone_500: 500,
  milestone_1000: 1000,
};

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

interface ComparisonData {
  period1: { start: Date; end: Date; label: string };
  period2: { start: Date; end: Date; label: string };
}

export const EmployeePerformanceStats = () => {
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "comparison" | "inactive" | "achievements">("overview");
  const [comparisonPeriod, setComparisonPeriod] = useState<"week" | "month">("week");
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);

  const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
  const endDate = endOfDay(new Date());

  // Comparison periods
  const comparisonData = useMemo<ComparisonData>(() => {
    const days = comparisonPeriod === "week" ? 7 : 30;
    return {
      period1: {
        start: startOfDay(subDays(new Date(), days)),
        end: endOfDay(new Date()),
        label: comparisonPeriod === "week" ? "هذا الأسبوع" : "هذا الشهر",
      },
      period2: {
        start: startOfDay(subDays(new Date(), days * 2)),
        end: endOfDay(subDays(new Date(), days)),
        label: comparisonPeriod === "week" ? "الأسبوع الماضي" : "الشهر الماضي",
      },
    };
  }, [comparisonPeriod]);

  // Fetch all employees (including inactive for alerts)
  const { data: allEmployees } = useQuery({
    queryKey: ["all-employees-with-positions"],
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
        .order("name");
      
      if (error) throw error;
      return emps;
    },
  });

  const employees = allEmployees?.filter(e => e.is_active);

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

  // Fetch logs for comparison periods
  const { data: comparisonLogs } = useQuery({
    queryKey: ["comparison-logs", comparisonPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_activity_log")
        .select("*")
        .gte("created_at", comparisonData.period2.start.toISOString())
        .lte("created_at", comparisonData.period1.end.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: activeTab === "comparison",
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { type: string; employeeName: string; employeeEmail: string; [key: string]: any }) => {
      const { data: result, error } = await supabase.functions.invoke("send-employee-notification", {
        body: data,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("تم إرسال الإشعار بنجاح");
      setSendingNotification(null);
    },
    onError: (error) => {
      toast.error("فشل إرسال الإشعار: " + error.message);
      setSendingNotification(null);
    },
  });

  // Calculate employee statistics
  const employeeStats: EmployeeStats[] = useMemo(() => {
    return employees?.map((emp) => {
      const empLogs = activityLogs?.filter((log) => log.employee_id === emp.id) || [];
      
      const positions = (emp.employee_positions || [])
        .sort((a: any, b: any) => (a.is_primary ? -1 : b.is_primary ? 1 : 0))
        .map((ep: any) => ep.job_positions?.title_ar || "غير محدد");

      const actionsByCategory: Record<string, number> = {};
      Object.entries(ACTION_CATEGORIES).forEach(([category, actions]) => {
        actionsByCategory[category] = empLogs.filter((log) => 
          actions.includes(log.action_type)
        ).length;
      });

      const days = parseInt(dateRange);
      const avgActionsPerDay = empLogs.length / days;

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
  }, [employees, activityLogs, dateRange]);

  const sortedStats = [...employeeStats].sort((a, b) => b.totalActions - a.totalActions);

  // Inactive employees (no activity in last 7 days)
  const inactiveEmployees = useMemo(() => {
    return allEmployees?.filter((emp) => {
      if (!emp.is_active) return false;
      const stats = employeeStats.find(s => s.id === emp.id);
      if (!stats?.lastActivity) return true;
      const daysSinceActivity = differenceInDays(new Date(), new Date(stats.lastActivity));
      return daysSinceActivity >= 7;
    }).map(emp => {
      const stats = employeeStats.find(s => s.id === emp.id);
      return {
        ...emp,
        daysSinceActivity: stats?.lastActivity 
          ? differenceInDays(new Date(), new Date(stats.lastActivity))
          : null,
        lastActivity: stats?.lastActivity,
      };
    }) || [];
  }, [allEmployees, employeeStats]);

  // Comparison statistics
  const comparisonStats = useMemo(() => {
    if (!comparisonLogs || !employees) return [];

    return employees.map((emp) => {
      const period1Logs = comparisonLogs.filter(
        (log) => 
          log.employee_id === emp.id && 
          new Date(log.created_at) >= comparisonData.period1.start &&
          new Date(log.created_at) <= comparisonData.period1.end
      );
      const period2Logs = comparisonLogs.filter(
        (log) => 
          log.employee_id === emp.id && 
          new Date(log.created_at) >= comparisonData.period2.start &&
          new Date(log.created_at) <= comparisonData.period2.end
      );

      const period1Count = period1Logs.length;
      const period2Count = period2Logs.length;
      const change = period2Count > 0 ? ((period1Count - period2Count) / period2Count) * 100 : period1Count > 0 ? 100 : 0;

      const positions = (emp.employee_positions || [])
        .sort((a: any, b: any) => (a.is_primary ? -1 : b.is_primary ? 1 : 0))
        .map((ep: any) => ep.job_positions?.title_ar || "غير محدد");

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        positions,
        period1Count,
        period2Count,
        change,
      };
    }).sort((a, b) => b.change - a.change);
  }, [comparisonLogs, employees, comparisonData]);

  // Chart data
  const categoryChartData = Object.keys(ACTION_CATEGORIES).map((category) => ({
    name: CATEGORY_LABELS[category],
    value: activityLogs?.filter((log) => 
      ACTION_CATEGORIES[category as keyof typeof ACTION_CATEGORIES].includes(log.action_type)
    ).length || 0,
  })).filter(d => d.value > 0);

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

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    count: activityLogs?.filter((log) => 
      new Date(log.created_at).getHours() === hour
    ).length || 0,
  }));

  // Radar chart data for employee comparison
  const radarData = useMemo(() => {
    if (sortedStats.length === 0) return [];
    const topEmployees = sortedStats.slice(0, 5);
    
    return Object.keys(ACTION_CATEGORIES).map((category) => {
      const dataPoint: any = { category: CATEGORY_LABELS[category] };
      topEmployees.forEach((emp) => {
        dataPoint[emp.name] = emp.actionsByCategory[category] || 0;
      });
      return dataPoint;
    });
  }, [sortedStats]);

  const getTopPerformerByCategory = (category: string) => {
    return sortedStats.reduce(
      (top, emp) => (emp.actionsByCategory[category] > (top?.actionsByCategory[category] || 0) ? emp : top),
      null as EmployeeStats | null
    );
  };

  // Send achievement notification
  const sendAchievementNotification = (emp: EmployeeStats, type: string, title: string, description: string) => {
    setSendingNotification(emp.id);
    sendNotificationMutation.mutate({
      type: "achievement_unlocked",
      employeeName: emp.name,
      employeeEmail: emp.email,
      achievement: {
        type,
        title,
        description,
        period: `آخر ${dateRange} يوم`,
        count: emp.totalActions,
      },
    });
  };

  // Send inactivity alert
  const sendInactivityAlert = (emp: { id: string; name: string; email: string; daysSinceActivity: number | null }) => {
    setSendingNotification(emp.id);
    sendNotificationMutation.mutate({
      type: "inactivity_alert",
      employeeName: emp.name,
      employeeEmail: emp.email,
      inactivityDays: emp.daysSinceActivity || 7,
    });
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
  const activeEmployeesCount = employeeStats.filter(e => e.totalActions > 0).length;
  const avgActionsPerEmployee = activeEmployeesCount > 0 ? totalActions / activeEmployeesCount : 0;
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            مقارنة الفترات
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            غير النشطين
            {inactiveEmployees.length > 0 && (
              <Badge variant="destructive" className="mr-1">{inactiveEmployees.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            الإنجازات
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                    <p className="text-2xl font-bold">{activeEmployeesCount}</p>
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
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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
                  <Tooltip />
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
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  مقارنة أداء الموظفين بين فترتين
                </CardTitle>
                <Select value={comparisonPeriod} onValueChange={(v) => setComparisonPeriod(v as "week" | "month")}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">أسبوعي</SelectItem>
                    <SelectItem value="month">شهري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  {comparisonData.period1.label}
                </span>
                <span>vs</span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-muted"></div>
                  {comparisonData.period2.label}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {comparisonStats.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الموظف</TableHead>
                        <TableHead className="text-right">الدور الرئيسي</TableHead>
                        <TableHead className="text-right">{comparisonData.period1.label}</TableHead>
                        <TableHead className="text-right">{comparisonData.period2.label}</TableHead>
                        <TableHead className="text-right">التغيير</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonStats.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-xs text-muted-foreground">{emp.email}</div>
                          </TableCell>
                          <TableCell>{emp.positions[0] || "غير محدد"}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">{emp.period1Count}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">{emp.period2Count}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {emp.change > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : emp.change < 0 ? (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              ) : null}
                              <span className={
                                emp.change > 0 ? "text-green-600 font-medium" :
                                emp.change < 0 ? "text-red-600 font-medium" :
                                "text-muted-foreground"
                              }>
                                {emp.change > 0 ? "+" : ""}{emp.change.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>جاري تحميل بيانات المقارنة...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Radar Chart for Top 5 */}
          {radarData.length > 0 && sortedStats.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">مقارنة أفضل 5 موظفين حسب الفئات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" className="text-xs" />
                    <PolarRadiusAxis />
                    {sortedStats.slice(0, 5).map((emp, index) => (
                      <Radar
                        key={emp.id}
                        name={emp.name}
                        dataKey={emp.name}
                        stroke={CHART_COLORS[index]}
                        fill={CHART_COLORS[index]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inactive Employees Tab */}
        <TabsContent value="inactive" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  الموظفون غير النشطين (أكثر من 7 أيام)
                </CardTitle>
                {inactiveEmployees.length > 0 && (
                  <Badge variant="destructive">{inactiveEmployees.length} موظف</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {inactiveEmployees.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الموظف</TableHead>
                        <TableHead className="text-right">البريد الإلكتروني</TableHead>
                        <TableHead className="text-right">آخر نشاط</TableHead>
                        <TableHead className="text-right">أيام الغياب</TableHead>
                        <TableHead className="text-right">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactiveEmployees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="font-medium">{emp.name}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                          <TableCell>
                            {emp.lastActivity ? (
                              format(new Date(emp.lastActivity), "dd MMM yyyy", { locale: ar })
                            ) : (
                              <span className="text-muted-foreground">لم يسجل أي نشاط</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={emp.daysSinceActivity && emp.daysSinceActivity > 14 ? "destructive" : "secondary"}>
                              {emp.daysSinceActivity || "∞"} يوم
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendingNotification === emp.id}
                              onClick={() => sendInactivityAlert(emp)}
                            >
                              {sendingNotification === emp.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Bell className="h-4 w-4 ml-2" />
                                  إرسال تنبيه
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="text-green-600 font-medium">جميع الموظفين نشطون! 🎉</p>
                  <p className="text-sm mt-1">لا يوجد موظفين غير نشطين في الفترة الأخيرة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                إنجازات الموظفين وإرسال التهنئة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Top Performer */}
              {topPerformer && topPerformer.totalActions > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">🏆</div>
                      <div>
                        <div className="font-bold text-lg">{topPerformer.name}</div>
                        <div className="text-sm text-muted-foreground">الأفضل أداءً - {topPerformer.totalActions} إجراء</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sendingNotification === topPerformer.id}
                      onClick={() => sendAchievementNotification(
                        topPerformer,
                        "top_performer",
                        "الموظف الأفضل أداءً",
                        `تهانينا! لقد حققت أعلى معدل أداء بين زملائك بإجمالي ${topPerformer.totalActions} إجراء.`
                      )}
                    >
                      {sendingNotification === topPerformer.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 ml-2" />
                          إرسال تهنئة
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Milestone Achievements */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">إنجازات المراحل</h4>
                {sortedStats.filter(emp => emp.totalActions >= 100).map((emp) => {
                  let milestone = "milestone_100";
                  let title = "100 إجراء";
                  let emoji = "💯";
                  
                  if (emp.totalActions >= 1000) {
                    milestone = "milestone_1000";
                    title = "1000 إجراء";
                    emoji = "👑";
                  } else if (emp.totalActions >= 500) {
                    milestone = "milestone_500";
                    title = "500 إجراء";
                    emoji = "🌟";
                  }

                  return (
                    <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-sm text-muted-foreground">تجاوز {title}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={sendingNotification === emp.id + milestone}
                        onClick={() => {
                          setSendingNotification(emp.id + milestone);
                          sendNotificationMutation.mutate({
                            type: "achievement_unlocked",
                            employeeName: emp.name,
                            employeeEmail: emp.email,
                            achievement: {
                              type: milestone,
                              title: `تجاوز ${title}`,
                              description: `أحسنت! لقد أكملت أكثر من ${title} في الفترة الأخيرة.`,
                              count: emp.totalActions,
                              period: `آخر ${dateRange} يوم`,
                            },
                          });
                        }}
                      >
                        {sendingNotification === emp.id + milestone ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
                {sortedStats.filter(emp => emp.totalActions >= 100).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا يوجد موظفين تجاوزوا 100 إجراء في هذه الفترة
                  </p>
                )}
              </div>

              {/* Category Leaders */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">قادة الأقسام</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.keys(ACTION_CATEGORIES).slice(0, 6).map((category) => {
                    const leader = getTopPerformerByCategory(category);
                    if (!leader || leader.actionsByCategory[category] === 0) return null;

                    return (
                      <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🎯</span>
                          <div>
                            <div className="font-medium text-sm">{leader.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[category]} - {leader.actionsByCategory[category]} إجراء
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={sendingNotification === leader.id + category}
                          onClick={() => {
                            setSendingNotification(leader.id + category);
                            sendNotificationMutation.mutate({
                              type: "achievement_unlocked",
                              employeeName: leader.name,
                              employeeEmail: leader.email,
                              achievement: {
                                type: "category_leader",
                                title: `قائد ${CATEGORY_LABELS[category]}`,
                                description: `أنت الأفضل أداءً في قسم ${CATEGORY_LABELS[category]}!`,
                                count: leader.actionsByCategory[category],
                                category: CATEGORY_LABELS[category],
                                period: `آخر ${dateRange} يوم`,
                              },
                            });
                          }}
                        >
                          {sendingNotification === leader.id + category ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
