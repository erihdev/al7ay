import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Download,
  RefreshCw,
  Wallet,
  Percent,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, startOfMonth, subMonths, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type DateRange = 'week' | 'month' | '3months' | 'year' | 'all';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PlatformRevenueManager() {
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return subDays(now, 7);
      case 'month':
        return startOfMonth(now);
      case '3months':
        return subMonths(now, 3);
      case 'year':
        return subMonths(now, 12);
      case 'all':
        return new Date(2020, 0, 1);
      default:
        return startOfMonth(now);
    }
  };

  // Fetch all revenue data
  const { data: revenueData, isLoading, refetch } = useQuery({
    queryKey: ['platform-revenue', dateRange],
    queryFn: async () => {
      const startDate = getDateFilter().toISOString();

      // 1. Fetch commission settings
      const { data: commissionSettings } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true);

      const platformRate = commissionSettings?.find(c => c.payment_method === 'platform_managed')?.commission_rate || 15;
      const directRate = commissionSettings?.find(c => c.payment_method === 'direct_gateway')?.commission_rate || 10;

      // 2. Fetch orders with provider info
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status, provider_id, payment_method')
        .gte('created_at', startDate)
        .eq('status', 'completed');

      // 3. Fetch provider orders
      const { data: providerOrders } = await supabase
        .from('provider_orders')
        .select('id, total_amount, created_at, status, provider_id')
        .gte('created_at', startDate)
        .in('status', ['completed', 'delivered']);

      // 4. Fetch providers with payment methods
      const { data: providers } = await supabase
        .from('service_providers')
        .select('id, business_name, payment_method, commission_rate');

      // 5. Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from('provider_subscriptions')
        .select('*, subscription_plans(*)')
        .gte('created_at', startDate)
        .neq('is_trial', true);

      // 6. Fetch subscription plans
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*');

      // Create provider map
      const providerMap = new Map(providers?.map(p => [p.id, p]));

      // Calculate commissions from main orders
      let totalCommissionFromOrders = 0;
      let platformManagedCommission = 0;
      let directGatewayCommission = 0;
      const ordersByMonth: { [key: string]: { orders: number; revenue: number; commission: number } } = {};
      
      orders?.forEach(order => {
        const provider = order.provider_id ? providerMap.get(order.provider_id) : null;
        const isPlatformManaged = provider?.payment_method === 'platform_managed';
        const rate = provider?.commission_rate || (isPlatformManaged ? platformRate : directRate);
        const commission = Number(order.total_amount) * (rate / 100);
        
        totalCommissionFromOrders += commission;
        if (isPlatformManaged) {
          platformManagedCommission += commission;
        } else {
          directGatewayCommission += commission;
        }

        const monthKey = format(new Date(order.created_at), 'yyyy-MM');
        if (!ordersByMonth[monthKey]) {
          ordersByMonth[monthKey] = { orders: 0, revenue: 0, commission: 0 };
        }
        ordersByMonth[monthKey].orders += 1;
        ordersByMonth[monthKey].revenue += Number(order.total_amount);
        ordersByMonth[monthKey].commission += commission;
      });

      // Calculate commissions from provider orders
      let providerOrdersCommission = 0;
      providerOrders?.forEach(order => {
        const provider = providerMap.get(order.provider_id);
        const isPlatformManaged = provider?.payment_method === 'platform_managed';
        const rate = provider?.commission_rate || (isPlatformManaged ? platformRate : directRate);
        const commission = Number(order.total_amount) * (rate / 100);
        
        providerOrdersCommission += commission;
        totalCommissionFromOrders += commission;
        
        if (isPlatformManaged) {
          platformManagedCommission += commission;
        } else {
          directGatewayCommission += commission;
        }

        const monthKey = format(new Date(order.created_at), 'yyyy-MM');
        if (!ordersByMonth[monthKey]) {
          ordersByMonth[monthKey] = { orders: 0, revenue: 0, commission: 0 };
        }
        ordersByMonth[monthKey].orders += 1;
        ordersByMonth[monthKey].revenue += Number(order.total_amount);
        ordersByMonth[monthKey].commission += commission;
      });

      // Calculate subscription revenue
      let subscriptionRevenue = 0;
      const subscriptionsByPlan: { [key: string]: { count: number; revenue: number } } = {};
      
      subscriptions?.forEach(sub => {
        const plan = sub.subscription_plans;
        if (plan && !sub.is_trial) {
          subscriptionRevenue += Number(plan.price);
          
          const planName = plan.name_ar;
          if (!subscriptionsByPlan[planName]) {
            subscriptionsByPlan[planName] = { count: 0, revenue: 0 };
          }
          subscriptionsByPlan[planName].count += 1;
          subscriptionsByPlan[planName].revenue += Number(plan.price);
        }
      });

      // Convert monthly data to array for chart
      const monthlyData = Object.entries(ordersByMonth)
        .map(([month, data]) => ({
          month: format(new Date(month + '-01'), 'MMM yyyy', { locale: ar }),
          orders: data.orders,
          revenue: data.revenue,
          commission: data.commission,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Total revenue for platform
      const totalPlatformRevenue = totalCommissionFromOrders + subscriptionRevenue;

      // Revenue breakdown for pie chart
      const revenueBreakdown = [
        { name: 'عمولات (إدارة عبر المنصة)', value: platformManagedCommission, color: COLORS[0] },
        { name: 'عمولات (ربط مباشر)', value: directGatewayCommission, color: COLORS[1] },
        { name: 'الاشتراكات', value: subscriptionRevenue, color: COLORS[2] },
      ].filter(item => item.value > 0);

      // Previous period comparison
      const prevStartDate = subMonths(getDateFilter(), dateRange === 'week' ? 0.25 : dateRange === 'month' ? 1 : dateRange === '3months' ? 3 : 12);
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total_amount, provider_id')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', getDateFilter().toISOString())
        .eq('status', 'completed');

      let prevCommission = 0;
      prevOrders?.forEach(order => {
        const provider = order.provider_id ? providerMap.get(order.provider_id) : null;
        const rate = provider?.commission_rate || platformRate;
        prevCommission += Number(order.total_amount) * (rate / 100);
      });

      const growthRate = prevCommission > 0 
        ? ((totalCommissionFromOrders - prevCommission) / prevCommission) * 100 
        : 0;

      return {
        totalPlatformRevenue,
        totalCommissionFromOrders,
        platformManagedCommission,
        directGatewayCommission,
        subscriptionRevenue,
        totalOrders: (orders?.length || 0) + (providerOrders?.length || 0),
        totalProviders: providers?.length || 0,
        activeSubscriptions: subscriptions?.filter(s => s.status === 'active').length || 0,
        monthlyData,
        revenueBreakdown,
        subscriptionsByPlan: Object.entries(subscriptionsByPlan).map(([name, data]) => ({
          name,
          ...data,
        })),
        commissionSettings: {
          platformRate,
          directRate,
        },
        growthRate,
        plans: plans || [],
      };
    },
  });

  const exportToPDF = () => {
    if (!revenueData) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Platform Revenue Report', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 105, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 15;

    // Summary Box
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, yPos, 182, 45, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Summary', 105, yPos + 10, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Platform Revenue: ${revenueData.totalPlatformRevenue.toFixed(2)} SAR`, 24, yPos + 22);
    doc.text(`Total Commissions: ${revenueData.totalCommissionFromOrders.toFixed(2)} SAR`, 24, yPos + 30);
    doc.text(`Subscription Revenue: ${revenueData.subscriptionRevenue.toFixed(2)} SAR`, 24, yPos + 38);
    doc.text(`Total Orders: ${revenueData.totalOrders}`, 120, yPos + 22);
    doc.text(`Active Providers: ${revenueData.totalProviders}`, 120, yPos + 30);
    doc.text(`Growth Rate: ${revenueData.growthRate.toFixed(1)}%`, 120, yPos + 38);

    yPos += 55;

    // Commission Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Commission Breakdown', 14, yPos);
    yPos += 8;

    doc.autoTable({
      startY: yPos,
      head: [['Source', 'Amount (SAR)', 'Percentage']],
      body: [
        ['Platform Managed', revenueData.platformManagedCommission.toFixed(2), `${((revenueData.platformManagedCommission / revenueData.totalPlatformRevenue) * 100).toFixed(1)}%`],
        ['Direct Gateway', revenueData.directGatewayCommission.toFixed(2), `${((revenueData.directGatewayCommission / revenueData.totalPlatformRevenue) * 100).toFixed(1)}%`],
        ['Subscriptions', revenueData.subscriptionRevenue.toFixed(2), `${((revenueData.subscriptionRevenue / revenueData.totalPlatformRevenue) * 100).toFixed(1)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [27, 67, 50] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Monthly Data
    if (revenueData.monthlyData.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Breakdown', 14, yPos);
      yPos += 8;

      doc.autoTable({
        startY: yPos,
        head: [['Month', 'Orders', 'Total Revenue', 'Commission']],
        body: revenueData.monthlyData.map(m => [
          m.month,
          m.orders.toString(),
          `${m.revenue.toFixed(2)} SAR`,
          `${m.commission.toFixed(2)} SAR`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [45, 106, 79] },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | Al-Hay Platform - Revenue Report`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Platform_Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">إيرادات المنصة</h2>
          <p className="text-muted-foreground">ملخص شامل لجميع مصادر دخل المنصة</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            {[
              { value: 'week', label: 'أسبوع' },
              { value: 'month', label: 'شهر' },
              { value: '3months', label: '3 أشهر' },
              { value: 'year', label: 'سنة' },
              { value: 'all', label: 'الكل' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(option.value as DateRange)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportToPDF} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي إيرادات المنصة</p>
                <p className="text-3xl font-bold text-primary">
                  {revenueData?.totalPlatformRevenue.toFixed(0)} <span className="text-lg">ر.س</span>
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {(revenueData?.growthRate || 0) >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${(revenueData?.growthRate || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(revenueData?.growthRate || 0).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">عن الفترة السابقة</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
                <p className="text-2xl font-bold">
                  {revenueData?.totalCommissionFromOrders.toFixed(0)} <span className="text-sm">ر.س</span>
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    إدارة: {revenueData?.commissionSettings.platformRate}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    مباشر: {revenueData?.commissionSettings.directRate}%
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Percent className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إيرادات الاشتراكات</p>
                <p className="text-2xl font-bold">
                  {revenueData?.subscriptionRevenue.toFixed(0)} <span className="text-sm">ر.س</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {revenueData?.activeSubscriptions} اشتراك نشط
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{revenueData?.totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {revenueData?.totalProviders} مزود خدمة
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              تطور الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(0)} ر.س`, '']}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="commission" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="العمولات"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              توزيع الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData?.revenueBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueData?.revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toFixed(0)} ر.س`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission by Type */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل العمولات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div>
                  <p className="font-medium">عمولات (إدارة عبر المنصة)</p>
                  <p className="text-sm text-muted-foreground">نسبة {revenueData?.commissionSettings.platformRate}%</p>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-green-600">
                    {revenueData?.platformManagedCommission.toFixed(0)} ر.س
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div>
                  <p className="font-medium">عمولات (ربط مباشر EdfaPay)</p>
                  <p className="text-sm text-muted-foreground">نسبة {revenueData?.commissionSettings.directRate}%</p>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-blue-600">
                    {revenueData?.directGatewayCommission.toFixed(0)} ر.س
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div>
                  <p className="font-medium">إيرادات الاشتراكات</p>
                  <p className="text-sm text-muted-foreground">{revenueData?.activeSubscriptions} اشتراك نشط</p>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-purple-600">
                    {revenueData?.subscriptionRevenue.toFixed(0)} ر.س
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card>
          <CardHeader>
            <CardTitle>الاشتراكات حسب الخطة</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData?.subscriptionsByPlan && revenueData.subscriptionsByPlan.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData.subscriptionsByPlan}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value} ر.س`, 'الإيراد']} />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="الإيراد" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <CreditCard className="h-12 w-12 mb-4 opacity-50" />
                <p>لا توجد اشتراكات مدفوعة في هذه الفترة</p>
                <p className="text-sm">الخطط المتوفرة:</p>
                <div className="flex gap-2 mt-2">
                  {revenueData?.plans.filter(p => !p.is_trial).map(plan => (
                    <Badge key={plan.id} variant="outline">
                      {plan.name_ar}: {plan.price} ر.س
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      {revenueData?.monthlyData && revenueData.monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              التفاصيل الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">الشهر</th>
                    <th className="text-right p-3">عدد الطلبات</th>
                    <th className="text-right p-3">إجمالي المبيعات</th>
                    <th className="text-right p-3">عمولة المنصة</th>
                    <th className="text-right p-3">نسبة العمولة</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.monthlyData.map((month, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{month.month}</td>
                      <td className="p-3">{month.orders}</td>
                      <td className="p-3">{month.revenue.toFixed(0)} ر.س</td>
                      <td className="p-3 text-green-600 font-medium">{month.commission.toFixed(0)} ر.س</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {((month.commission / month.revenue) * 100).toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td className="p-3">الإجمالي</td>
                    <td className="p-3">{revenueData.totalOrders}</td>
                    <td className="p-3">{revenueData.monthlyData.reduce((sum, m) => sum + m.revenue, 0).toFixed(0)} ر.س</td>
                    <td className="p-3 text-green-600">{revenueData.totalCommissionFromOrders.toFixed(0)} ر.س</td>
                    <td className="p-3">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PlatformRevenueManager;
