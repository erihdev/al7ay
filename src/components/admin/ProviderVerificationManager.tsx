import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  CreditCard,
  MapPin,
  Percent,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderVerification {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  phone: string | null;
  freelance_certificate_url: string | null;
  bank_name: string | null;
  iban: string | null;
  national_address: string | null;
  is_payment_verified: boolean;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ProviderVerificationManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderVerification | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Fetch providers with verification data
  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['provider-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ProviderVerification[];
    },
  });

  // Send email notification
  const sendEmailNotification = async (
    type: 'verification_approved' | 'verification_rejected',
    provider: ProviderVerification,
    commission?: number
  ) => {
    try {
      await supabase.functions.invoke('send-application-email', {
        body: {
          type,
          email: provider.email,
          fullName: provider.business_name,
          businessName: provider.business_name,
          notes: adminNotes || undefined,
          commissionRate: commission,
        },
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  };

  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: async ({ providerId, commission, provider }: { providerId: string; commission: number; provider: ProviderVerification }) => {
      const { error } = await supabase
        .from('service_providers')
        .update({
          is_payment_verified: true,
          commission_rate: commission,
          updated_at: new Date().toISOString(),
        })
        .eq('id', providerId);

      if (error) throw error;
      
      // Send approval email
      await sendEmailNotification('verification_approved', provider, commission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-verifications'] });
      toast.success('تم توثيق مقدم الخدمة وإرسال إشعار بالبريد');
      setSelectedProvider(null);
      setAdminNotes('');
      setCommissionRate('');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التوثيق');
    },
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ providerId, provider }: { providerId: string; provider: ProviderVerification }) => {
      const { error } = await supabase
        .from('service_providers')
        .update({
          is_payment_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', providerId);

      if (error) throw error;
      
      // Send rejection email
      await sendEmailNotification('verification_rejected', provider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-verifications'] });
      toast.success('تم رفض طلب التوثيق وإرسال إشعار بالبريد');
      setSelectedProvider(null);
      setAdminNotes('');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الرفض');
    },
  });

  const handleApprove = () => {
    if (!selectedProvider) return;
    const commission = parseFloat(commissionRate) || selectedProvider.commission_rate || 10;
    approveMutation.mutate({ providerId: selectedProvider.id, commission, provider: selectedProvider });
  };

  const handleReject = () => {
    if (!selectedProvider) return;
    rejectMutation.mutate({ providerId: selectedProvider.id, provider: selectedProvider });
  };

  // Check if provider has submitted verification documents
  const hasVerificationDocs = (provider: ProviderVerification) => {
    return provider.freelance_certificate_url || provider.iban || provider.national_address;
  };

  // Get verification status
  const getVerificationStatus = (provider: ProviderVerification) => {
    if (provider.is_payment_verified) return 'verified';
    if (hasVerificationDocs(provider)) return 'pending';
    return 'not_submitted';
  };

  // Filter providers
  const filteredProviders = providers?.filter((provider) => {
    const matchesSearch =
      provider.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getVerificationStatus(provider);
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && status === 'pending';
    if (filter === 'verified') return matchesSearch && status === 'verified';
    if (filter === 'rejected') return matchesSearch && status === 'not_submitted' && hasVerificationDocs(provider);
    
    return matchesSearch;
  });

  // Stats
  const stats = {
    total: providers?.length || 0,
    pending: providers?.filter((p) => getVerificationStatus(p) === 'pending').length || 0,
    verified: providers?.filter((p) => p.is_payment_verified).length || 0,
    notSubmitted: providers?.filter((p) => !hasVerificationDocs(p)).length || 0,
  };

  const getStatusBadge = (provider: ProviderVerification) => {
    const status = getVerificationStatus(provider);
    if (status === 'verified') {
      return <Badge className="bg-green-500 text-white"><ShieldCheck className="h-3 w-3 ml-1" />موثق</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">قيد المراجعة</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">لم يرسل البيانات</Badge>;
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
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">إجمالي المزودين</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">قيد المراجعة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.verified}</div>
            <div className="text-sm text-muted-foreground">موثق</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.notSubmitted}</div>
            <div className="text-sm text-muted-foreground">لم يرسل البيانات</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            إدارة طلبات التوثيق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                الكل
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                قيد المراجعة
              </Button>
              <Button
                variant={filter === 'verified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('verified')}
              >
                موثق
              </Button>
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Providers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المتجر</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الشهادة</TableHead>
                  <TableHead className="text-right">البنك</TableHead>
                  <TableHead className="text-right">العنوان الوطني</TableHead>
                  <TableHead className="text-right">نسبة العمولة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders?.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.business_name}</TableCell>
                      <TableCell className="text-sm">{provider.email}</TableCell>
                      <TableCell>
                        {provider.freelance_certificate_url ? (
                          <Badge variant="outline" className="text-green-600">
                            <FileText className="h-3 w-3 ml-1" />
                            مرفقة
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">غير مرفقة</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.iban ? (
                          <Badge variant="outline" className="text-green-600">
                            <CreditCard className="h-3 w-3 ml-1" />
                            مضاف
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">غير مضاف</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.national_address ? (
                          <Badge variant="outline" className="text-green-600">
                            <MapPin className="h-3 w-3 ml-1" />
                            مضاف
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">غير مضاف</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Percent className="h-3 w-3 ml-1" />
                          {provider.commission_rate || 10}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(provider)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setCommissionRate(provider.commission_rate?.toString() || '10');
                          }}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
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
              تفاصيل مقدم الخدمة
            </DialogTitle>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">المعلومات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">اسم المتجر</Label>
                      <p className="font-medium">{selectedProvider.business_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                      <p className="font-medium">{selectedProvider.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">رقم الهاتف</Label>
                      <p className="font-medium">{selectedProvider.phone || 'غير محدد'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">تاريخ التسجيل</Label>
                      <p className="font-medium">
                        {format(new Date(selectedProvider.created_at), 'dd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    بيانات التوثيق
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Freelance Certificate */}
                  <div className="p-4 border rounded-lg">
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      شهادة العمل الحر
                    </Label>
                    {selectedProvider.freelance_certificate_url ? (
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500/10 text-green-600">مرفقة</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedProvider.freelance_certificate_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 ml-1" />
                          عرض الشهادة
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">غير مرفقة</Badge>
                    )}
                  </div>

                  {/* Bank Info */}
                  <div className="p-4 border rounded-lg">
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4" />
                      معلومات البنك
                    </Label>
                    {selectedProvider.iban ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">البنك:</span>
                          <span className="font-medium">{selectedProvider.bank_name || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">IBAN:</span>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {selectedProvider.iban}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">غير مضاف</Badge>
                    )}
                  </div>

                  {/* National Address */}
                  <div className="p-4 border rounded-lg">
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4" />
                      العنوان الوطني
                    </Label>
                    {selectedProvider.national_address ? (
                      <p className="font-medium">{selectedProvider.national_address}</p>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">غير مضاف</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Commission Rate Setting */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    نسبة العمولة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        placeholder="نسبة العمولة"
                      />
                    </div>
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    نسبة العمولة التي تأخذها المنصة من كل طلب
                  </p>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label>ملاحظات الإدارة (اختياري)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظات..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {!selectedProvider.is_payment_verified && hasVerificationDocs(selectedProvider) && (
                  <>
                    <Button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      {approveMutation.isPending ? 'جاري التوثيق...' : 'توثيق الحساب'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      {rejectMutation.isPending ? 'جاري الرفض...' : 'رفض الطلب'}
                    </Button>
                  </>
                )}
                {selectedProvider.is_payment_verified && (
                  <div className="flex-1 flex items-center justify-center gap-2 p-4 bg-green-500/10 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">هذا الحساب موثق</span>
                  </div>
                )}
                {!hasVerificationDocs(selectedProvider) && (
                  <div className="flex-1 flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                    <ShieldX className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">لم يرسل مقدم الخدمة بيانات التوثيق بعد</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
