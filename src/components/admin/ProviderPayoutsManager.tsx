import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  DollarSign,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Building2,
  Calendar,
  Receipt,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderPayout {
  id: string;
  provider_id: string;
  business_name: string;
  email: string;
  iban: string | null;
  bank_name: string | null;
  payment_method: string;
  is_payment_verified: boolean;
  commission_rate: number;
  totalRevenue: number;
  platformCommission: number;
  netAmount: number;
  orderCount: number;
  lastPayoutDate: string | null;
}

interface PayoutRecord {
  id: string;
  provider_id: string;
  amount: number;
  commission_amount: number;
  net_amount: number;
  status: string;
  period_start: string;
  period_end: string;
  transaction_reference: string | null;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
  service_providers?: {
    business_name: string;
    email: string;
  };
}

export function ProviderPayoutsManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderPayout | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Calculate current period (last week)
  const periodEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });
  const periodStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });

  // Fetch providers with pending payouts
  const { data: providers, isLoading: providersLoading, refetch } = useQuery({
    queryKey: ['provider-payouts-pending'],
    queryFn: async () => {
      // Get all verified providers with platform_managed payment
      const { data: providersData, error: providersError } = await supabase
        .from('service_providers')
        .select('id, business_name, email, iban, bank_name, payment_method, is_payment_verified, commission_rate, last_payout_date')
        .eq('payment_method', 'platform_managed')
        .eq('is_payment_verified', true);

      if (providersError) throw providersError;

      // Calculate pending amounts for each provider
      const providerPayouts: ProviderPayout[] = await Promise.all(
        (providersData || []).map(async (provider) => {
          // Get orders since last payout
          let ordersQuery = supabase
            .from('provider_orders')
            .select('total_amount, created_at')
            .eq('provider_id', provider.id)
            .in('status', ['completed', 'ready', 'out_for_delivery']);

          if (provider.last_payout_date) {
            ordersQuery = ordersQuery.gt('created_at', provider.last_payout_date);
          }

          const { data: orders } = await ordersQuery;

          const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
          const commissionRate = provider.commission_rate || 10;
          const platformCommission = totalRevenue * (commissionRate / 100);
          const netAmount = totalRevenue - platformCommission;

          return {
            id: provider.id,
            provider_id: provider.id,
            business_name: provider.business_name,
            email: provider.email,
            iban: provider.iban,
            bank_name: provider.bank_name,
            payment_method: provider.payment_method || 'platform_managed',
            is_payment_verified: provider.is_payment_verified || false,
            commission_rate: commissionRate,
            totalRevenue,
            platformCommission,
            netAmount,
            orderCount: orders?.length || 0,
            lastPayoutDate: provider.last_payout_date,
          };
        })
      );

      return providerPayouts.filter(p => p.netAmount > 0);
    },
  });

  // Fetch payout history
  const { data: payoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['payout-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_payouts')
        .select(`
          *,
          service_providers (business_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PayoutRecord[];
    },
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async (payout: ProviderPayout) => {
      // Create payout record
      const { error: payoutError } = await supabase
        .from('provider_payouts')
        .insert({
          provider_id: payout.provider_id,
          amount: payout.totalRevenue,
          commission_amount: payout.platformCommission,
          net_amount: payout.netAmount,
          status: 'completed',
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          transaction_reference: transactionRef || null,
          notes: payoutNotes || null,
          processed_at: new Date().toISOString(),
        });

      if (payoutError) throw payoutError;

      // Update provider's last payout date
      const { error: updateError } = await supabase
        .from('service_providers')
        .update({ 
          last_payout_date: new Date().toISOString(),
          pending_payout: 0 
        })
        .eq('id', payout.provider_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-payouts-pending'] });
      queryClient.invalidateQueries({ queryKey: ['payout-history'] });
      toast.success('تم تسجيل التحويل بنجاح');
      setSelectedProvider(null);
      setTransactionRef('');
      setPayoutNotes('');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تسجيل التحويل');
    },
  });

  const handleProcessPayout = () => {
    if (!selectedProvider) return;
    processPayoutMutation.mutate(selectedProvider);
  };

  // Stats
  const stats = {
    pendingPayouts: providers?.length || 0,
    totalPending: providers?.reduce((sum, p) => sum + p.netAmount, 0) || 0,
    totalCommission: providers?.reduce((sum, p) => sum + p.platformCommission, 0) || 0,
    completedThisMonth: payoutHistory?.filter(p => 
      p.status === 'completed' && 
      new Date(p.created_at).getMonth() === new Date().getMonth()
    ).length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 ml-1" />مكتمل</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 ml-1" />قيد التنفيذ</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />فشل</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />معلق</Badge>;
    }
  };

  // Filter payout history
  const filteredHistory = payoutHistory?.filter(p => {
    if (filter === 'pending') return p.status === 'pending' || p.status === 'processing';
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  if (providersLoading || historyLoading) {
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
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
                <div className="text-sm text-muted-foreground">تحويل معلق</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalPending.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">مبلغ معلق (ر.س)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Receipt className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalCommission.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">عمولات المنصة (ر.س)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
                <div className="text-sm text-muted-foreground">تحويل هذا الشهر</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            تحويلات معلقة (أسبوعية)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {providers && providers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المتجر</TableHead>
                    <TableHead className="text-right">البنك</TableHead>
                    <TableHead className="text-right">إجمالي الإيرادات</TableHead>
                    <TableHead className="text-right">العمولة</TableHead>
                    <TableHead className="text-right">صافي التحويل</TableHead>
                    <TableHead className="text-right">عدد الطلبات</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers
                    .filter(p => p.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{provider.business_name}</p>
                          <p className="text-xs text-muted-foreground">{provider.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{provider.bank_name || '-'}</p>
                          <code className="text-xs text-muted-foreground">{provider.iban?.slice(0, 10)}...</code>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{provider.totalRevenue.toFixed(0)} ر.س</TableCell>
                      <TableCell className="text-red-600">{provider.platformCommission.toFixed(0)} ر.س</TableCell>
                      <TableCell className="font-bold text-green-600">{provider.netAmount.toFixed(0)} ر.س</TableCell>
                      <TableCell>{provider.orderCount}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => setSelectedProvider(provider)}
                        >
                          <Send className="h-4 w-4 ml-1" />
                          تحويل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>لا توجد تحويلات معلقة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              سجل التحويلات
            </CardTitle>
            <Select value={filter} onValueChange={(v: 'all' | 'pending' | 'completed') => setFilter(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory && filteredHistory.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المتجر</TableHead>
                    <TableHead className="text-right">الفترة</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">العمولة</TableHead>
                    <TableHead className="text-right">صافي</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المرجع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="text-sm">
                        {format(new Date(payout.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payout.service_providers?.business_name || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(payout.period_start), 'dd/MM')} - {format(new Date(payout.period_end), 'dd/MM')}
                      </TableCell>
                      <TableCell>{payout.amount.toFixed(0)} ر.س</TableCell>
                      <TableCell className="text-red-600">{payout.commission_amount.toFixed(0)} ر.س</TableCell>
                      <TableCell className="font-bold text-green-600">{payout.net_amount.toFixed(0)} ر.س</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell className="text-xs font-mono">{payout.transaction_reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد تحويلات سابقة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Payout Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              تسجيل تحويل
            </DialogTitle>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedProvider.business_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">البنك:</span>
                    <p className="font-medium">{selectedProvider.bank_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الآيبان:</span>
                    <p className="font-mono text-xs">{selectedProvider.iban || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">الإيرادات</p>
                  <p className="font-bold">{selectedProvider.totalRevenue.toFixed(0)} ر.س</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">العمولة</p>
                  <p className="font-bold text-red-600">{selectedProvider.platformCommission.toFixed(0)} ر.س</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">صافي</p>
                  <p className="font-bold text-green-600">{selectedProvider.netAmount.toFixed(0)} ر.س</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>رقم/مرجع التحويل</Label>
                <Input
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="رقم العملية البنكية"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية..."
                  rows={2}
                />
              </div>

              <Button
                onClick={handleProcessPayout}
                disabled={processPayoutMutation.isPending}
                className="w-full"
              >
                {processPayoutMutation.isPending ? (
                  <Clock className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
                تأكيد التحويل
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
