import { usePayments, usePaymentStats } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, TrendingUp, CheckCircle2, XCircle, Clock, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  paid: { label: 'مدفوع', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: 'قيد الانتظار', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  failed: { label: 'فشل', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'ملغي', variant: 'outline', icon: <XCircle className="h-3 w-3" /> },
};

const methodLabels: Record<string, string> = {
  cash: 'نقدي',
  edfapay: 'إلكتروني',
  card: 'بطاقة',
};

export function PaymentsManager() {
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: stats, isLoading: statsLoading } = usePaymentStats();

  if (paymentsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPaid.toFixed(0)} ر.س</div>
            <p className="text-xs text-muted-foreground">
              {stats?.successfulTransactions} عملية ناجحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyTotal.toFixed(0)} ر.س</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اليوم</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dailyTotal.toFixed(0)} ر.س</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمليات الفاشلة</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.failedTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      {stats?.byMethod && Object.keys(stats.byMethod).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">حسب طريقة الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.byMethod).map(([method, amount]) => (
                <div key={method} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="font-medium">{methodLabels[method] || method}:</span>
                  <span className="font-bold text-primary">{amount.toFixed(0)} ر.س</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>رقم العملية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const status = statusConfig[payment.status] || statusConfig.pending;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(payment.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.order?.customer_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{payment.order?.customer_phone || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{payment.amount} ر.س</TableCell>
                        <TableCell>{methodLabels[payment.payment_method] || payment.payment_method}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.transaction_id?.slice(0, 12) || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مدفوعات بعد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}