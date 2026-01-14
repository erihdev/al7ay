import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  DollarSign,
  Package,
  Users,
  Calendar,
  Award
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  order_type: string;
}

interface ProviderProduct {
  id: string;
  name_ar: string;
  price: number;
  is_available: boolean;
  is_featured: boolean;
}

interface ProviderStatsProps {
  orders: ProviderOrder[];
  products: ProviderProduct[];
}

const COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'];

const ProviderStats = ({ orders, products }: ProviderStatsProps) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    
    // This week's data
    const thisWeekOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= subDays(today, 7);
    });

    // Last week's data for comparison
    const lastWeekOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= subDays(today, 14) && orderDate < subDays(today, 7);
    });

    // Today's orders
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return isWithinInterval(orderDate, { start: todayStart, end: todayEnd });
    });

    // Completed orders
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedThisWeek = thisWeekOrders.filter(o => o.status === 'completed');
    const completedLastWeek = lastWeekOrders.filter(o => o.status === 'completed');

    // Revenue calculations
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const weekRevenue = completedThisWeek.reduce((sum, o) => sum + o.total_amount, 0);
    const lastWeekRevenue = completedLastWeek.reduce((sum, o) => sum + o.total_amount, 0);
    const todayRevenue = todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0);

    // Growth calculation
    const revenueGrowth = lastWeekRevenue > 0 
      ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue * 100) 
      : weekRevenue > 0 ? 100 : 0;

    const ordersGrowth = completedLastWeek.length > 0
      ? ((completedThisWeek.length - completedLastWeek.length) / completedLastWeek.length * 100)
      : completedThisWeek.length > 0 ? 100 : 0;

    // Average order value
    const avgOrderValue = completedOrders.length > 0 
      ? totalRevenue / completedOrders.length 
      : 0;

    // Unique customers
    const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;

    return {
      totalRevenue,
      weekRevenue,
      todayRevenue,
      revenueGrowth,
      totalOrders: completedOrders.length,
      weekOrders: completedThisWeek.length,
      todayOrders: todayOrders.length,
      ordersGrowth,
      avgOrderValue,
      uniqueCustomers,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      preparingOrders: orders.filter(o => o.status === 'preparing').length,
    };
  }, [orders]);

  // 7-day trend data
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd }) && o.status === 'completed';
      });

      days.push({
        name: format(date, 'EEE', { locale: ar }),
        date: format(date, 'dd/MM'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
      });
    }
    return days;
  }, [orders]);

  // Order type distribution
  const orderTypeData = useMemo(() => {
    const deliveryOrders = orders.filter(o => o.order_type === 'delivery').length;
    const pickupOrders = orders.filter(o => o.order_type === 'pickup').length;
    
    return [
      { name: 'توصيل', value: deliveryOrders },
      { name: 'استلام', value: pickupOrders },
    ].filter(d => d.value > 0);
  }, [orders]);

  // Order status distribution
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      pending: 'جديد',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      out_for_delivery: 'في الطريق',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
    }));
  }, [orders]);

  // Product stats
  const productStats = useMemo(() => {
    return {
      total: products.length,
      available: products.filter(p => p.is_available).length,
      featured: products.filter(p => p.is_featured).length,
      avgPrice: products.length > 0 
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
        : 0,
    };
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إيرادات هذا الأسبوع</p>
                <p className="text-2xl font-bold">{stats.weekRevenue.toFixed(0)} ر.س</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stats.revenueGrowth).toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">طلبات هذا الأسبوع</p>
                <p className="text-2xl font-bold">{stats.weekOrders}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${stats.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.ordersGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stats.ordersGrowth).toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متوسط الطلب</p>
                <p className="text-xl font-bold">{stats.avgOrderValue.toFixed(0)} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عملاء فريدون</p>
                <p className="text-xl font-bold">{stats.uniqueCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              أداء الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `${value} ر.س` : value,
                      name === 'revenue' ? 'الإيرادات' : 'الطلبات'
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1B4332" 
                    strokeWidth={2}
                    dot={{ fill: '#1B4332' }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#40916C" 
                    strokeWidth={2}
                    dot={{ fill: '#40916C' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              توزيع حالات الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            الإيرادات اليومية (آخر 7 أيام)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} ر.س`, 'الإيرادات']}
                />
                <Bar dataKey="revenue" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              إحصائيات إجمالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إجمالي الإيرادات</span>
              <span className="font-bold text-lg">{stats.totalRevenue.toFixed(0)} ر.س</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إجمالي الطلبات المكتملة</span>
              <span className="font-bold">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إيرادات اليوم</span>
              <span className="font-bold text-green-600">{stats.todayRevenue.toFixed(0)} ر.س</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">طلبات اليوم</span>
              <span className="font-bold">{stats.todayOrders}</span>
            </div>
          </CardContent>
        </Card>

        {/* Product Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              إحصائيات المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إجمالي المنتجات</span>
              <span className="font-bold">{productStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">منتجات متاحة</span>
              <span className="font-bold text-green-600">{productStats.available}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">منتجات مميزة</span>
              <span className="font-bold text-yellow-600">{productStats.featured}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">متوسط السعر</span>
              <span className="font-bold">{productStats.avgPrice.toFixed(0)} ر.س</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              نوع الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderTypeData.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {orderTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderStats;
