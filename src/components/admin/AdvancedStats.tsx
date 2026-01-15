import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Package,
  Clock,
  Truck,
  Store,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getHours, subWeeks } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart } from 'recharts';
import { exportAdvancedStatsToPDF } from '@/utils/exportAdvancedStats';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export function AdvancedStats() {
  // Fetch comprehensive stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['advanced-admin-stats'],
    queryFn: async () => {
      const today = new Date();
      const startOfMonthDate = startOfMonth(today);
      const endOfMonthDate = endOfMonth(today);
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });
      const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });

      // Get all orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      // Get monthly orders
      const monthlyOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startOfMonthDate && orderDate <= endOfMonthDate;
      }) || [];

      // Get weekly orders
      const weeklyOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= weekStart && orderDate <= weekEnd;
      }) || [];

      // Get last week's orders
      const lastWeekOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= lastWeekStart && orderDate <= lastWeekEnd;
      }) || [];
      // Get today's orders
      const todayStr = format(today, 'yyyy-MM-dd');
      const todayOrders = allOrders?.filter(o => 
        format(new Date(o.created_at), 'yyyy-MM-dd') === todayStr
      ) || [];

      // Get yesterday's orders for comparison
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
      const yesterdayOrders = allOrders?.filter(o => 
        format(new Date(o.created_at), 'yyyy-MM-dd') === yesterdayStr
      ) || [];

      // Calculate revenues
      const todayRevenue = todayOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);
      
      const yesterdayRevenue = yesterdayOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      const monthlyRevenue = monthlyOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      const weeklyRevenue = weeklyOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      const lastWeekRevenue = lastWeekOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      // Order status breakdown
      const statusBreakdown = {
        pending: allOrders?.filter(o => o.status === 'pending').length || 0,
        preparing: allOrders?.filter(o => o.status === 'preparing').length || 0,
        ready: allOrders?.filter(o => o.status === 'ready').length || 0,
        out_for_delivery: allOrders?.filter(o => o.status === 'out_for_delivery').length || 0,
        completed: allOrders?.filter(o => o.status === 'completed').length || 0,
        cancelled: allOrders?.filter(o => o.status === 'cancelled').length || 0,
      };

      // Order type breakdown
      const deliveryOrders = allOrders?.filter(o => o.order_type === 'delivery').length || 0;
      const pickupOrders = allOrders?.filter(o => o.order_type === 'pickup').length || 0;

      // Last 7 days trend
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = allOrders?.filter(o => 
          format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr
        ) || [];
        const dayRevenue = dayOrders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + Number(o.total_amount), 0);

        return {
          date: format(date, 'EEE', { locale: ar }),
          orders: dayOrders.length,
          revenue: dayRevenue,
        };
      });

      // Hourly distribution (for today)
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
        const hourOrders = todayOrders.filter(o => {
          const orderHour = getHours(new Date(o.created_at));
          return orderHour === hour;
        });
        return {
          hour: `${hour}:00`,
          orders: hourOrders.length,
          revenue: hourOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
        };
      });

      // Weekly comparison (this week vs last week per day)
      const weekComparison = Array.from({ length: 7 }, (_, i) => {
        const dayOfWeek = i; // 0 = Sunday
        const thisWeekDay = weeklyOrders.filter(o => new Date(o.created_at).getDay() === dayOfWeek);
        const lastWeekDay = lastWeekOrders.filter(o => new Date(o.created_at).getDay() === dayOfWeek);
        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return {
          day: dayNames[dayOfWeek],
          thisWeek: thisWeekDay.reduce((sum, o) => sum + Number(o.total_amount), 0),
          lastWeek: lastWeekDay.reduce((sum, o) => sum + Number(o.total_amount), 0),
        };
      });

      // Top performing products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      allOrders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productId = item.product_id || item.product_name;
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += Number(item.total_price);
        });
      });
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      // Get products
      const { data: products } = await supabase
        .from('products')
        .select('*');

      // Get customers count
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get providers count
      const { count: providersCount } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Average order value
      const completedOrders = allOrders?.filter(o => o.status === 'completed') || [];
      const avgOrderValue = completedOrders.length > 0 
        ? completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0) / completedOrders.length 
        : 0;

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      allOrders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          // Get product category from products list
          const product = products?.find(p => p.id === item.product_id);
          const category = product?.category || 'other';
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(item.total_price);
        });
      });

      return {
        todayOrders: todayOrders.length,
        yesterdayOrders: yesterdayOrders.length,
        weeklyOrders: weeklyOrders.length,
        monthlyOrders: monthlyOrders.length,
        totalOrders: allOrders?.length || 0,
        todayRevenue,
        yesterdayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        statusBreakdown,
        deliveryOrders,
        pickupOrders,
        last7Days,
        customersCount: customersCount || 0,
        providersCount: providersCount || 0,
        productsCount: products?.length || 0,
        avgOrderValue,
        categoryBreakdown,
        hourlyDistribution,
        weekComparison,
        topProducts,
        weeklyOrdersCount: weeklyOrders.length,
        lastWeekOrdersCount: lastWeekOrders.length,
        lastWeekRevenue,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const revenueChange = stats?.yesterdayRevenue 
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue * 100) 
    : 0;

  const ordersChange = stats?.yesterdayOrders 
    ? ((stats.todayOrders - stats.yesterdayOrders) / stats.yesterdayOrders * 100) 
    : 0;

  const statusData = [
    { name: 'جديد', value: stats?.statusBreakdown.pending || 0, color: '#F59E0B' },
    { name: 'قيد التحضير', value: stats?.statusBreakdown.preparing || 0, color: '#3B82F6' },
    { name: 'جاهز', value: stats?.statusBreakdown.ready || 0, color: '#10B981' },
    { name: 'في الطريق', value: stats?.statusBreakdown.out_for_delivery || 0, color: '#8B5CF6' },
    { name: 'مكتمل', value: stats?.statusBreakdown.completed || 0, color: '#059669' },
    { name: 'ملغي', value: stats?.statusBreakdown.cancelled || 0, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const orderTypeData = [
    { name: 'توصيل', value: stats?.deliveryOrders || 0 },
    { name: 'استلام', value: stats?.pickupOrders || 0 },
  ];

  const categoryLabels: Record<string, string> = {
    coffee: 'قهوة',
    sweets: 'حلويات',
    cold_drinks: 'مشروبات باردة',
    other: 'أخرى',
  };

  const categoryData = Object.entries(stats?.categoryBreakdown || {}).map(([key, value]) => ({
    name: categoryLabels[key] || key,
    value: Math.round(value),
  }));

  const handleExportPDF = () => {
    if (!stats) {
      toast.error('البيانات غير متاحة للتصدير');
      return;
    }
    try {
      exportAdvancedStatsToPDF(stats);
      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} variant="outline" className="font-arabic gap-2">
          <FileText className="h-4 w-4" />
          تصدير تقرير PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إيرادات اليوم</p>
                <p className="text-2xl font-bold">{stats?.todayRevenue?.toFixed(0) || 0}</p>
                <p className="text-xs text-muted-foreground">ر.س</p>
              </div>
              <div className={`p-3 rounded-full ${revenueChange >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <DollarSign className={`h-6 w-6 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            {stats?.yesterdayRevenue !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {revenueChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(revenueChange).toFixed(0)}%
                </span>
                <span className="text-muted-foreground">عن أمس</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">طلبات اليوم</p>
                <p className="text-2xl font-bold">{stats?.todayOrders || 0}</p>
                <p className="text-xs text-muted-foreground">طلب</p>
              </div>
              <div className={`p-3 rounded-full ${ordersChange >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <ShoppingBag className={`h-6 w-6 ${ordersChange >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
            {stats?.yesterdayOrders !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {ordersChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(ordersChange).toFixed(0)}%
                </span>
                <span className="text-muted-foreground">عن أمس</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إيرادات الشهر</p>
                <p className="text-2xl font-bold">{stats?.monthlyRevenue?.toFixed(0) || 0}</p>
                <p className="text-xs text-muted-foreground">ر.س</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats?.monthlyOrders || 0} طلب هذا الشهر
            </div>
          </CardContent>
        </Card>

        {/* Average Order */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط الطلب</p>
                <p className="text-2xl font-bold">{stats?.avgOrderValue?.toFixed(0) || 0}</p>
                <p className="text-xs text-muted-foreground">ر.س</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              من {stats?.totalOrders || 0} طلب
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.customersCount || 0}</p>
            <p className="text-xs text-muted-foreground">عميل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.providersCount || 0}</p>
            <p className="text-xs text-muted-foreground">مقدم خدمة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.productsCount || 0}</p>
            <p className="text-xs text-muted-foreground">منتج</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.statusBreakdown.pending || 0}</p>
            <p className="text-xs text-muted-foreground">طلب جديد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.deliveryOrders || 0}</p>
            <p className="text-xs text-muted-foreground">توصيل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.pickupOrders || 0}</p>
            <p className="text-xs text-muted-foreground">استلام</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 7 Days Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              أداء آخر 7 أيام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.last7Days || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}${name === 'revenue' ? ' ر.س' : ' طلب'}`,
                      name === 'revenue' ? 'الإيرادات' : 'الطلبات'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5 text-primary" />
              حالات الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category & Order Type Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الإيرادات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number) => [`${value} ر.س`, 'الإيرادات']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع أنواع الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {orderTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            مقارنة الأسبوع الحالي مع السابق
            <Badge variant="outline" className="mr-auto text-xs">
              {stats?.weeklyRevenue && stats?.lastWeekRevenue ? (
                stats.weeklyRevenue > stats.lastWeekRevenue ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{(((stats.weeklyRevenue - stats.lastWeekRevenue) / stats.lastWeekRevenue) * 100).toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {(((stats.weeklyRevenue - stats.lastWeekRevenue) / stats.lastWeekRevenue) * 100).toFixed(0)}%
                  </span>
                )
              ) : null}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats?.weekComparison || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(0)} ر.س`,
                    name === 'thisWeek' ? 'هذا الأسبوع' : 'الأسبوع السابق'
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'thisWeek' ? 'هذا الأسبوع' : 'الأسبوع السابق'}
                />
                <Bar dataKey="lastWeek" fill="#94a3b8" radius={[4, 4, 0, 0]} name="lastWeek" />
                <Bar dataKey="thisWeek" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="thisWeek" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Distribution & Top Products */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              توزيع الطلبات على ساعات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.hourlyDistribution || []}>
                  <defs>
                    <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    className="text-xs" 
                    interval={3}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'orders' ? `${value} طلب` : `${value} ر.س`,
                      name === 'orders' ? 'الطلبات' : 'الإيرادات'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorHourly)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              أفضل المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topProducts?.slice(0, 5) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    className="text-xs" 
                    width={100}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `${value.toFixed(0)} ر.س` : `${value} وحدة`,
                      name === 'revenue' ? 'الإيرادات' : 'الكمية'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
