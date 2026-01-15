import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp,
  CreditCard,
  DollarSign,
  Percent,
  Calendar,
  Download,
  Store,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderPaymentStats {
  id: string;
  business_name: string;
  email: string;
  payment_method: string | null;
  commission_rate: number | null;
  pending_payout: number | null;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  netPayout: number;
  completedPayouts: number;
}

type DateRange = 'week' | 'month' | 'lastMonth' | 'quarter' | 'year';

export function EdfaPayReports() {
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const getDateRange = (range: DateRange) => {
    const now = new Date();
    switch (range) {
      case 'week':
        return { start: subDays(now, 7), end: now };
      case 'month':
        return { start: startOfMonth(now), end: now };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'quarter':
        return { start: subDays(now, 90), end: now };
      case 'year':
        return { start: subDays(now, 365), end: now };
      default:
        return { start: startOfMonth(now), end: now };
    }
  };

  // Fetch payment statistics
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['edfapay-reports', dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange(dateRange);

      // Get all providers with direct gateway
      const { data: providers, error: providersError } = await supabase
        .from('service_providers')
        .select('id, business_name, email, payment_method, commission_rate, pending_payout')
        .eq('payment_method', 'direct_gateway');

      if (providersError) throw providersError;

      // Get orders within date range
      const { data: orders, error: ordersError } = await supabase
        .from('provider_orders')
        .select('provider_id, total_amount, status, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .in('status', ['completed', 'delivered']);

      if (ordersError) throw ordersError;

      // Get completed payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('provider_payouts')
        .select('provider_id, net_amount, commission_amount, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'completed');

      if (payoutsError) throw payoutsError;

      // Calculate stats per provider
      const providerStats: ProviderPaymentStats[] = (providers || []).map(provider => {
        const providerOrders = orders?.filter(o => o.provider_id === provider.id) || [];
        const providerPayouts = payouts?.filter(p => p.provider_id === provider.id) || [];
        
        const totalRevenue = providerOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const commissionRate = provider.commission_rate || 10;
        const totalCommission = totalRevenue * (commissionRate / 100);
        const netPayout = totalRevenue - totalCommission;
        const completedPayouts = providerPayouts.reduce((sum, p) => sum + Number(p.net_amount), 0);

        return {
          id: provider.id,
          business_name: provider.business_name,
          email: provider.email,
          payment_method: provider.payment_method,
          commission_rate: provider.commission_rate,
          pending_payout: provider.pending_payout,
          totalOrders: providerOrders.length,
          totalRevenue,
          totalCommission,
          netPayout,
          completedPayouts
        };
      });

      // Calculate overall stats
      const overallStats = {
        totalProviders: providerStats.length,
        totalRevenue: providerStats.reduce((sum, p) => sum + p.totalRevenue, 0),
        totalCommissions: providerStats.reduce((sum, p) => sum + p.totalCommission, 0),
        totalPayouts: providerStats.reduce((sum, p) => sum + p.completedPayouts, 0),
        totalPending: providerStats.reduce((sum, p) => sum + (p.pending_payout || 0), 0),
        totalOrders: providerStats.reduce((sum, p) => sum + p.totalOrders, 0),
        avgCommissionRate: providerStats.length > 0 
          ? providerStats.reduce((sum, p) => sum + (p.commission_rate || 10), 0) / providerStats.length 
          : 10
      };

      return { providers: providerStats, overall: overallStats };
    }
  });

  const exportToCSV = () => {
    if (!stats?.providers) return;

    const headers = ['المزود', 'البريد الإلكتروني', 'الطلبات', 'الإيرادات', 'نسبة العمولة', 'قيمة العمولة', 'صافي المستحقات', 'المحول'];
    const rows = stats.providers.map(p => [
      p.business_name,
      p.email,
      p.totalOrders,
      p.totalRevenue.toFixed(2),
      `${p.commission_rate || 10}%`,
      p.totalCommission.toFixed(2),
      p.netPayout.toFixed(2),
      p.completedPayouts.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `edfapay-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر 7 أيام</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="lastMonth">الشهر الماضي</SelectItem>
              <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="font-arabic">
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.overall.totalProviders || 0}</p>
                <p className="text-xs text-muted-foreground">مزودين EdfaPay</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.overall.totalOrders || 0}</p>
                <p className="text-xs text-muted-foreground">الطلبات المكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats?.overall.totalRevenue || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">إجمالي الإيرادات (ر.س)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Percent className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats?.overall.totalCommissions || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">عمولات المنصة (ر.س)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats?.overall.totalPayouts || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">المحول للمزودين (ر.س)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <CreditCard className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats?.overall.totalPending || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">المستحقات المعلقة (ر.س)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            تقرير تفصيلي للمدفوعات عبر EdfaPay
          </CardTitle>
          <CardDescription className="font-arabic">
            إحصائيات الإيرادات والعمولات والتحويلات لكل مزود
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.providers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات للفترة المحددة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right font-arabic">المزود</TableHead>
                    <TableHead className="text-right font-arabic">الطلبات</TableHead>
                    <TableHead className="text-right font-arabic">الإيرادات</TableHead>
                    <TableHead className="text-right font-arabic">نسبة العمولة</TableHead>
                    <TableHead className="text-right font-arabic">قيمة العمولة</TableHead>
                    <TableHead className="text-right font-arabic">صافي المستحقات</TableHead>
                    <TableHead className="text-right font-arabic">المحول</TableHead>
                    <TableHead className="text-right font-arabic">المعلق</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.providers?.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{provider.business_name}</p>
                          <p className="text-xs text-muted-foreground">{provider.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {provider.totalOrders}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{provider.totalRevenue.toFixed(0)}</span>
                          <span className="text-xs text-muted-foreground">ر.س</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          {provider.commission_rate || 10}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-purple-600 font-medium">
                          {provider.totalCommission.toFixed(0)} ر.س
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-emerald-600 font-medium">
                          {provider.netPayout.toFixed(0)} ر.س
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-600">
                            {provider.completedPayouts.toFixed(0)} ر.س
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ArrowDown className="h-3 w-3 text-amber-600" />
                          <span className="font-medium text-amber-600">
                            {(provider.pending_payout || 0).toFixed(0)} ر.س
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
