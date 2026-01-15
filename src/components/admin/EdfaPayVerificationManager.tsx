import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle,
  Search,
  RefreshCw,
  Loader2,
  CreditCard,
  Shield,
  AlertTriangle,
  Zap,
  Calendar,
  Store,
  TrendingUp,
  Building2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderWithEdfaPay {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  phone: string | null;
  payment_method: string | null;
  gateway_account_id: string | null;
  edfapay_credentials_verified: boolean | null;
  edfapay_verified_at: string | null;
  is_payment_verified: boolean | null;
  pending_payout: number | null;
  commission_rate: number | null;
  created_at: string;
}

export function EdfaPayVerificationManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithEdfaPay | null>(null);
  const [reverifyingId, setReverifyingId] = useState<string | null>(null);

  // Fetch all providers with EdfaPay details
  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['edfapay-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('id, user_id, business_name, email, phone, payment_method, gateway_account_id, edfapay_credentials_verified, edfapay_verified_at, is_payment_verified, pending_payout, commission_rate, created_at')
        .eq('payment_method', 'direct_gateway')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProviderWithEdfaPay[];
    }
  });

  // Re-verify mutation
  const reverifyMutation = useMutation({
    mutationFn: async (provider: ProviderWithEdfaPay) => {
      setReverifyingId(provider.id);
      
      // In a real scenario, this would call the edge function with stored credentials
      // For now, we simulate a re-verification
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-edfapay-credentials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            providerId: provider.id,
            merchantId: provider.gateway_account_id || '',
            secretKey: 'stored_encrypted', // This would need the actual stored key
            providerEmail: provider.email,
            providerName: provider.business_name,
            isReverification: true
          })
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edfapay-providers'] });
      toast.success('تم إعادة التحقق بنجاح');
      setSelectedProvider(null);
      setReverifyingId(null);
    },
    onError: (error: any) => {
      console.error('Re-verification error:', error);
      toast.error(error.message || 'فشل إعادة التحقق');
      setReverifyingId(null);
    }
  });

  // Toggle verification status manually
  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ providerId, verified }: { providerId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('service_providers')
        .update({
          edfapay_credentials_verified: verified,
          edfapay_verified_at: verified ? new Date().toISOString() : null
        })
        .eq('id', providerId);

      if (error) throw error;
    },
    onSuccess: (_, { verified }) => {
      queryClient.invalidateQueries({ queryKey: ['edfapay-providers'] });
      toast.success(verified ? 'تم تفعيل التحقق' : 'تم إلغاء التحقق');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التحديث');
    }
  });

  const filteredProviders = providers?.filter(p =>
    p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.gateway_account_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: providers?.length || 0,
    verified: providers?.filter(p => p.edfapay_credentials_verified).length || 0,
    pending: providers?.filter(p => !p.edfapay_credentials_verified).length || 0,
    totalPending: providers?.reduce((sum, p) => sum + (p.pending_payout || 0), 0) || 0
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">مزودين بـ EdfaPay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">تم التحقق</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">بانتظار التحقق</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{stats.totalPending.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">المستحقات (ر.س)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو البريد أو Merchant ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-arabic"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} className="font-arabic">
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            حالة التحقق من EdfaPay
          </CardTitle>
          <CardDescription className="font-arabic">
            إدارة ومراقبة حالة ربط المزودين ببوابة الدفع EdfaPay
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProviders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد مزودين يستخدمون EdfaPay
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right font-arabic">المزود</TableHead>
                    <TableHead className="text-right font-arabic">Merchant ID</TableHead>
                    <TableHead className="text-right font-arabic">حالة التحقق</TableHead>
                    <TableHead className="text-right font-arabic">تاريخ التحقق</TableHead>
                    <TableHead className="text-right font-arabic">العمولة</TableHead>
                    <TableHead className="text-right font-arabic">المستحقات</TableHead>
                    <TableHead className="text-right font-arabic">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders?.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" />
                            <span className="font-medium">{provider.business_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{provider.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {provider.gateway_account_id || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {provider.edfapay_credentials_verified ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            تم التحقق
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            <AlertTriangle className="h-3 w-3 ml-1" />
                            غير موثق
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.edfapay_verified_at ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(provider.edfapay_verified_at), 'dd/MM/yyyy', { locale: ar })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{provider.commission_rate || 10}%</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-emerald-600">
                          {(provider.pending_payout || 0).toFixed(0)} ر.س
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-arabic"
                            onClick={() => setSelectedProvider(provider)}
                          >
                            <Zap className="h-4 w-4 ml-1" />
                            إدارة
                          </Button>
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

      {/* Provider Details Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-arabic flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              إدارة EdfaPay - {selectedProvider?.business_name}
            </DialogTitle>
            <DialogDescription className="font-arabic">
              إدارة حالة التحقق من بوابة الدفع
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-4">
              {/* Provider Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">البريد الإلكتروني:</span>
                    <span className="font-medium">{selectedProvider.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Merchant ID:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {selectedProvider.gateway_account_id || 'غير محدد'}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">حالة التحقق:</span>
                    {selectedProvider.edfapay_credentials_verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 ml-1" />
                        تم التحقق
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600">
                        <XCircle className="h-3 w-3 ml-1" />
                        غير موثق
                      </Badge>
                    )}
                  </div>
                  {selectedProvider.edfapay_verified_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">تاريخ التحقق:</span>
                      <span className="text-sm">
                        {format(new Date(selectedProvider.edfapay_verified_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full font-arabic"
                  onClick={() => reverifyMutation.mutate(selectedProvider)}
                  disabled={reverifyingId === selectedProvider.id}
                >
                  {reverifyingId === selectedProvider.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري إعادة التحقق...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 ml-2" />
                      إعادة التحقق من الربط
                    </>
                  )}
                </Button>

                {selectedProvider.edfapay_credentials_verified ? (
                  <Button
                    variant="outline"
                    className="w-full font-arabic text-red-600 hover:bg-red-50"
                    onClick={() => toggleVerificationMutation.mutate({
                      providerId: selectedProvider.id,
                      verified: false
                    })}
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    إلغاء التحقق يدوياً
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full font-arabic text-green-600 hover:bg-green-50"
                    onClick={() => toggleVerificationMutation.mutate({
                      providerId: selectedProvider.id,
                      verified: true
                    })}
                  >
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                    تفعيل التحقق يدوياً
                  </Button>
                )}

                <a
                  href="https://merchant.edfapay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح لوحة تحكم EdfaPay
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
