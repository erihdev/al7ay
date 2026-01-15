import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  DollarSign,
  TrendingUp,
  Percent,
  Building2,
  RefreshCw,
  Download,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderCommission {
  id: string;
  business_name: string;
  email: string;
  is_payment_verified: boolean;
  commission_rate: number;
  totalRevenue: number;
  totalOrders: number;
  platformCommission: number;
  providerEarnings: number;
  monthlyData: {
    month: string;
    revenue: number;
    orders: number;
    commission: number;
  }[];
}

export function ProviderCommissionsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderCommission | null>(null);
  const [dateRange, setDateRange] = useState<'all' | 'month' | '3months'>('month');

  // Fetch providers with their orders and calculate commissions
  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['provider-commissions', dateRange],
    queryFn: async () => {
      // Get all providers
      const { data: providersData, error: providersError } = await supabase
        .from('service_providers')
        .select('id, business_name, email, is_payment_verified, commission_rate')
        .order('business_name');

      if (providersError) throw providersError;

      // Calculate date range
      const now = new Date();
      let startDate: Date | null = null;
      
      if (dateRange === 'month') {
        startDate = startOfMonth(now);
      } else if (dateRange === '3months') {
        startDate = startOfMonth(subMonths(now, 2));
      }

      // Get orders for each provider
      const providerCommissions: ProviderCommission[] = await Promise.all(
        providersData.map(async (provider) => {
          let ordersQuery = supabase
            .from('provider_orders')
            .select('total_amount, created_at, status')
            .eq('provider_id', provider.id)
            .in('status', ['completed', 'ready', 'out_for_delivery']);

          if (startDate) {
            ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
          }

          const { data: orders } = await ordersQuery;

          const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
          const totalOrders = orders?.length || 0;
          const commissionRate = provider.commission_rate || 10;
          const platformCommission = totalRevenue * (commissionRate / 100);
          const providerEarnings = totalRevenue - platformCommission;

          // Calculate monthly breakdown
          const monthlyData: { [key: string]: { revenue: number; orders: number; commission: number } } = {};
          
          orders?.forEach((order) => {
            const monthKey = format(new Date(order.created_at), 'yyyy-MM');
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { revenue: 0, orders: 0, commission: 0 };
            }
            monthlyData[monthKey].revenue += Number(order.total_amount);
            monthlyData[monthKey].orders += 1;
            monthlyData[monthKey].commission += Number(order.total_amount) * (commissionRate / 100);
          });

          return {
            id: provider.id,
            business_name: provider.business_name,
            email: provider.email,
            is_payment_verified: provider.is_payment_verified || false,
            commission_rate: commissionRate,
            totalRevenue,
            totalOrders,
            platformCommission,
            providerEarnings,
            monthlyData: Object.entries(monthlyData)
              .map(([month, data]) => ({ month, ...data }))
              .sort((a, b) => b.month.localeCompare(a.month)),
          };
        })
      );

      return providerCommissions;
    },
  });

  // Filter providers
  const filteredProviders = providers?.filter((provider) =>
    provider.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totals = {
    totalRevenue: providers?.reduce((sum, p) => sum + p.totalRevenue, 0) || 0,
    totalOrders: providers?.reduce((sum, p) => sum + p.totalOrders, 0) || 0,
    totalCommission: providers?.reduce((sum, p) => sum + p.platformCommission, 0) || 0,
    verifiedProviders: providers?.filter((p) => p.is_payment_verified).length || 0,
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!providers) return;

    const headers = ['اسم المتجر', 'البريد الإلكتروني', 'نسبة العمولة', 'إجمالي الإيرادات', 'عدد الطلبات', 'عمولة المنصة', 'أرباح المزود', 'موثق'];
    const rows = providers.map((p) => [
      p.business_name,
      p.email,
      `${p.commission_rate}%`,
      p.totalRevenue.toFixed(2),
      p.totalOrders,
      p.platformCommission.toFixed(2),
      p.providerEarnings.toFixed(2),
      p.is_payment_verified ? 'نعم' : 'لا',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير-العمولات-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.totalRevenue.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">إجمالي الإيرادات (ر.س)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Percent className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{totals.totalCommission.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">عمولات المنصة (ر.س)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.totalOrders}</div>
                <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totals.verifiedProviders}</div>
                <div className="text-sm text-muted-foreground">مزود موثق</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            إيرادات وعمولات مقدمي الخدمات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو البريد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('month')}
              >
                <Calendar className="h-4 w-4 ml-1" />
                هذا الشهر
              </Button>
              <Button
                variant={dateRange === '3months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('3months')}
              >
                آخر 3 أشهر
              </Button>
              <Button
                variant={dateRange === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('all')}
              >
                الكل
              </Button>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 ml-1" />
                تصدير
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المتجر</TableHead>
                  <TableHead className="text-right">نسبة العمولة</TableHead>
                  <TableHead className="text-right">إجمالي الإيرادات</TableHead>
                  <TableHead className="text-right">عدد الطلبات</TableHead>
                  <TableHead className="text-right">عمولة المنصة</TableHead>
                  <TableHead className="text-right">أرباح المزود</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders?.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.business_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Percent className="h-3 w-3 ml-1" />
                          {provider.commission_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">{provider.totalRevenue.toFixed(0)} ر.س</TableCell>
                      <TableCell>{provider.totalOrders}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {provider.platformCommission.toFixed(0)} ر.س
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        {provider.providerEarnings.toFixed(0)} ر.س
                      </TableCell>
                      <TableCell>
                        {provider.is_payment_verified ? (
                          <Badge className="bg-green-500 text-white">
                            <ShieldCheck className="h-3 w-3 ml-1" />
                            موثق
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            غير موثق
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProvider(provider)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          تفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Provider Details Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              تفاصيل إيرادات {selectedProvider?.business_name}
            </DialogTitle>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {selectedProvider.totalRevenue.toFixed(0)} ر.س
                    </div>
                    <div className="text-sm text-muted-foreground">إجمالي الإيرادات</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedProvider.platformCommission.toFixed(0)} ر.س
                    </div>
                    <div className="text-sm text-muted-foreground">عمولة المنصة ({selectedProvider.commission_rate}%)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedProvider.providerEarnings.toFixed(0)} ر.س
                    </div>
                    <div className="text-sm text-muted-foreground">صافي أرباح المزود</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{selectedProvider.totalOrders}</div>
                    <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Breakdown */}
              {selectedProvider.monthlyData.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">التفصيل الشهري</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الشهر</TableHead>
                          <TableHead className="text-right">الإيرادات</TableHead>
                          <TableHead className="text-right">الطلبات</TableHead>
                          <TableHead className="text-right">العمولة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProvider.monthlyData.map((month) => (
                          <TableRow key={month.month}>
                            <TableCell>
                              {format(new Date(month.month + '-01'), 'MMMM yyyy', { locale: ar })}
                            </TableCell>
                            <TableCell className="font-medium">{month.revenue.toFixed(0)} ر.س</TableCell>
                            <TableCell>{month.orders}</TableCell>
                            <TableCell className="text-green-600">{month.commission.toFixed(0)} ر.س</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {selectedProvider.monthlyData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد طلبات في الفترة المحددة</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
