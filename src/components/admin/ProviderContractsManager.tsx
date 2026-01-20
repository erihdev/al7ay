import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  CreditCard,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProviderContract {
  id: string;
  provider_id: string | null;
  contract_type: string;
  contract_number: string | null;
  merchant_name: string;
  merchant_id_number: string | null;
  merchant_email: string | null;
  merchant_phone: string | null;
  entity_type: string | null;
  cr_flc_number: string | null;
  entity_activities: string | null;
  national_address: string | null;
  vat_number: string | null;
  beneficiary_name: string | null;
  bank_name: string | null;
  iban: string | null;
  setup_fees: number | null;
  monthly_fees: number | null;
  transaction_fees_percent: number | null;
  visa_mc_fees: string | null;
  apple_google_pay_fees: string | null;
  settlement_fees: number | null;
  vat_percent: number | null;
  contract_date: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_months: number | null;
  auto_renew: boolean;
  status: string;
  contract_file_url: string | null;
  notes: string | null;
  created_at: string;
  service_providers?: {
    business_name: string;
  };
}

const CONTRACT_TYPES = [
  { value: 'edfapay_gateway', label: 'بوابة دفع EdfaPay' },
  { value: 'platform_agreement', label: 'اتفاقية المنصة' },
  { value: 'service_agreement', label: 'اتفاقية خدمات' },
  { value: 'other', label: 'أخرى' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط', color: 'bg-green-500' },
  { value: 'pending', label: 'قيد المراجعة', color: 'bg-yellow-500' },
  { value: 'expired', label: 'منتهي', color: 'bg-gray-500' },
  { value: 'terminated', label: 'ملغي', color: 'bg-red-500' },
];

export function ProviderContractsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ProviderContract | null>(null);
  const [viewContract, setViewContract] = useState<ProviderContract | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    provider_id: '',
    contract_type: 'edfapay_gateway',
    contract_number: '',
    merchant_name: '',
    merchant_id_number: '',
    merchant_email: '',
    merchant_phone: '',
    entity_type: '',
    cr_flc_number: '',
    entity_activities: '',
    national_address: '',
    vat_number: '',
    beneficiary_name: '',
    bank_name: '',
    iban: '',
    setup_fees: 0,
    monthly_fees: 0,
    transaction_fees_percent: 0,
    visa_mc_fees: '',
    apple_google_pay_fees: '',
    settlement_fees: 0,
    vat_percent: 15,
    contract_date: '',
    start_date: '',
    end_date: '',
    duration_months: 12,
    auto_renew: true,
    status: 'active',
    contract_file_url: '',
    notes: '',
  });

  // Fetch contracts
  const { data: contracts, isLoading, refetch } = useQuery({
    queryKey: ['provider-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_contracts')
        .select('*, service_providers(business_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProviderContract[];
    },
  });

  // Fetch providers for dropdown
  const { data: providers } = useQuery({
    queryKey: ['providers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('id, business_name')
        .order('business_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const contractData = {
        ...data,
        provider_id: data.provider_id || null,
        setup_fees: Number(data.setup_fees) || 0,
        monthly_fees: Number(data.monthly_fees) || 0,
        transaction_fees_percent: Number(data.transaction_fees_percent) || null,
        settlement_fees: Number(data.settlement_fees) || null,
        vat_percent: Number(data.vat_percent) || 15,
        duration_months: Number(data.duration_months) || 12,
        contract_date: data.contract_date || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      };

      if (selectedContract) {
        const { error } = await supabase
          .from('provider_contracts')
          .update(contractData)
          .eq('id', selectedContract.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('provider_contracts')
          .insert([contractData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-contracts'] });
      toast.success(selectedContract ? 'تم تحديث العقد' : 'تم إضافة العقد');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provider_contracts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-contracts'] });
      toast.success('تم حذف العقد');
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      provider_id: '',
      contract_type: 'edfapay_gateway',
      contract_number: '',
      merchant_name: '',
      merchant_id_number: '',
      merchant_email: '',
      merchant_phone: '',
      entity_type: '',
      cr_flc_number: '',
      entity_activities: '',
      national_address: '',
      vat_number: '',
      beneficiary_name: '',
      bank_name: '',
      iban: '',
      setup_fees: 0,
      monthly_fees: 0,
      transaction_fees_percent: 0,
      visa_mc_fees: '',
      apple_google_pay_fees: '',
      settlement_fees: 0,
      vat_percent: 15,
      contract_date: '',
      start_date: '',
      end_date: '',
      duration_months: 12,
      auto_renew: true,
      status: 'active',
      contract_file_url: '',
      notes: '',
    });
    setSelectedContract(null);
  };

  const openEditDialog = (contract: ProviderContract) => {
    setSelectedContract(contract);
    setFormData({
      provider_id: contract.provider_id || '',
      contract_type: contract.contract_type,
      contract_number: contract.contract_number || '',
      merchant_name: contract.merchant_name,
      merchant_id_number: contract.merchant_id_number || '',
      merchant_email: contract.merchant_email || '',
      merchant_phone: contract.merchant_phone || '',
      entity_type: contract.entity_type || '',
      cr_flc_number: contract.cr_flc_number || '',
      entity_activities: contract.entity_activities || '',
      national_address: contract.national_address || '',
      vat_number: contract.vat_number || '',
      beneficiary_name: contract.beneficiary_name || '',
      bank_name: contract.bank_name || '',
      iban: contract.iban || '',
      setup_fees: contract.setup_fees || 0,
      monthly_fees: contract.monthly_fees || 0,
      transaction_fees_percent: contract.transaction_fees_percent || 0,
      visa_mc_fees: contract.visa_mc_fees || '',
      apple_google_pay_fees: contract.apple_google_pay_fees || '',
      settlement_fees: contract.settlement_fees || 0,
      vat_percent: contract.vat_percent || 15,
      contract_date: contract.contract_date || '',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      duration_months: contract.duration_months || 12,
      auto_renew: contract.auto_renew,
      status: contract.status,
      contract_file_url: contract.contract_file_url || '',
      notes: contract.notes || '',
    });
    setIsDialogOpen(true);
  };

  const filteredContracts = contracts?.filter(c => 
    c.merchant_name.toLowerCase().includes(search.toLowerCase()) ||
    c.merchant_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.contract_number?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={`${statusOption?.color} text-white`}>
        {statusOption?.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            عقود مقدمي الخدمة
          </h2>
          <p className="text-muted-foreground">إدارة العقود والاتفاقيات مع مقدمي الخدمة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة عقد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedContract ? 'تعديل العقد' : 'إضافة عقد جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع العقد</Label>
                    <Select value={formData.contract_type} onValueChange={(v) => setFormData({...formData, contract_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم العقد</Label>
                    <Input value={formData.contract_number} onChange={(e) => setFormData({...formData, contract_number: e.target.value})} />
                  </div>
                </div>

                {/* Provider Link */}
                <div className="space-y-2">
                  <Label>ربط بمقدم خدمة (اختياري)</Label>
                  <Select value={formData.provider_id} onValueChange={(v) => setFormData({...formData, provider_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مقدم الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون ربط</SelectItem>
                      {providers?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.business_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Merchant Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">معلومات التاجر</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم التاجر *</Label>
                      <Input required value={formData.merchant_name} onChange={(e) => setFormData({...formData, merchant_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهوية</Label>
                      <Input value={formData.merchant_id_number} onChange={(e) => setFormData({...formData, merchant_id_number: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input type="email" value={formData.merchant_email} onChange={(e) => setFormData({...formData, merchant_email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input value={formData.merchant_phone} onChange={(e) => setFormData({...formData, merchant_phone: e.target.value})} />
                    </div>
                  </CardContent>
                </Card>

                {/* Entity Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">معلومات المنشأة</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نوع المنشأة</Label>
                      <Input value={formData.entity_type} onChange={(e) => setFormData({...formData, entity_type: e.target.value})} placeholder="وثيقة عمل حر / سجل تجاري" />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم السجل / الوثيقة</Label>
                      <Input value={formData.cr_flc_number} onChange={(e) => setFormData({...formData, cr_flc_number: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>النشاط</Label>
                      <Input value={formData.entity_activities} onChange={(e) => setFormData({...formData, entity_activities: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان الوطني</Label>
                      <Input value={formData.national_address} onChange={(e) => setFormData({...formData, national_address: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>الرقم الضريبي</Label>
                      <Input value={formData.vat_number} onChange={(e) => setFormData({...formData, vat_number: e.target.value})} />
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">المعلومات البنكية</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>اسم المستفيد</Label>
                      <Input value={formData.beneficiary_name} onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم البنك</Label>
                      <Input value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الآيبان</Label>
                      <Input value={formData.iban} onChange={(e) => setFormData({...formData, iban: e.target.value})} dir="ltr" />
                    </div>
                  </CardContent>
                </Card>

                {/* Fees */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">الرسوم</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>رسوم التأسيس (ر.س)</Label>
                      <Input type="number" value={formData.setup_fees} onChange={(e) => setFormData({...formData, setup_fees: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>رسوم شهرية (ر.س)</Label>
                      <Input type="number" value={formData.monthly_fees} onChange={(e) => setFormData({...formData, monthly_fees: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>رسوم العملية (%)</Label>
                      <Input type="number" step="0.01" value={formData.transaction_fees_percent} onChange={(e) => setFormData({...formData, transaction_fees_percent: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>رسوم Visa/MC</Label>
                      <Input value={formData.visa_mc_fees} onChange={(e) => setFormData({...formData, visa_mc_fees: e.target.value})} placeholder="2.5% + 1 SAR" />
                    </div>
                    <div className="space-y-2">
                      <Label>رسوم Apple/Google Pay</Label>
                      <Input value={formData.apple_google_pay_fees} onChange={(e) => setFormData({...formData, apple_google_pay_fees: e.target.value})} placeholder="1 SAR" />
                    </div>
                    <div className="space-y-2">
                      <Label>رسوم التسوية (ر.س)</Label>
                      <Input type="number" value={formData.settlement_fees} onChange={(e) => setFormData({...formData, settlement_fees: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>ضريبة القيمة المضافة (%)</Label>
                      <Input type="number" value={formData.vat_percent} onChange={(e) => setFormData({...formData, vat_percent: Number(e.target.value)})} />
                    </div>
                  </CardContent>
                </Card>

                {/* Contract Dates */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">تواريخ العقد</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>تاريخ العقد</Label>
                      <Input type="date" value={formData.contract_date} onChange={(e) => setFormData({...formData, contract_date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ البدء</Label>
                      <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ الانتهاء</Label>
                      <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>المدة (بالأشهر)</Label>
                      <Input type="number" value={formData.duration_months} onChange={(e) => setFormData({...formData, duration_months: Number(e.target.value)})} />
                    </div>
                  </CardContent>
                </Card>

                {/* Status & File */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>رابط ملف العقد</Label>
                    <Input value={formData.contract_file_url} onChange={(e) => setFormData({...formData, contract_file_url: e.target.value})} placeholder="https://..." />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو البريد أو رقم العقد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contracts?.length || 0}</div>
            <div className="text-sm text-muted-foreground">إجمالي العقود</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {contracts?.filter(c => c.status === 'active').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">عقود نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {contracts?.filter(c => c.status === 'pending').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">قيد المراجعة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {contracts?.filter(c => c.status === 'expired' || c.status === 'terminated').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">منتهية / ملغاة</div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-right p-4">التاجر</th>
                  <th className="text-right p-4">نوع العقد</th>
                  <th className="text-right p-4">مقدم الخدمة</th>
                  <th className="text-right p-4">رسوم العملية</th>
                  <th className="text-right p-4">تاريخ العقد</th>
                  <th className="text-right p-4">الحالة</th>
                  <th className="text-right p-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      لا توجد عقود
                    </td>
                  </tr>
                ) : (
                  filteredContracts?.map((contract) => (
                    <tr key={contract.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{contract.merchant_name}</div>
                          <div className="text-sm text-muted-foreground">{contract.merchant_email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        {CONTRACT_TYPES.find(t => t.value === contract.contract_type)?.label}
                      </td>
                      <td className="p-4">
                        {contract.service_providers?.business_name || '-'}
                      </td>
                      <td className="p-4">
                        {contract.transaction_fees_percent ? `${contract.transaction_fees_percent}%` : '-'}
                      </td>
                      <td className="p-4">
                        {contract.contract_date 
                          ? format(new Date(contract.contract_date), 'yyyy/MM/dd', { locale: ar })
                          : '-'
                        }
                      </td>
                      <td className="p-4">{getStatusBadge(contract.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewContract(contract)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(contract)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {contract.contract_file_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={contract.contract_file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا العقد؟')) {
                                deleteMutation.mutate(contract.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Contract Dialog */}
      <Dialog open={!!viewContract} onOpenChange={() => setViewContract(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل العقد</DialogTitle>
          </DialogHeader>
          {viewContract && (
            <div className="space-y-6">
              {/* Merchant Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    معلومات التاجر
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">الاسم:</span> {viewContract.merchant_name}</div>
                  <div><span className="text-muted-foreground">رقم الهوية:</span> {viewContract.merchant_id_number || '-'}</div>
                  <div><span className="text-muted-foreground">البريد:</span> {viewContract.merchant_email || '-'}</div>
                  <div><span className="text-muted-foreground">الهاتف:</span> {viewContract.merchant_phone || '-'}</div>
                  <div><span className="text-muted-foreground">نوع المنشأة:</span> {viewContract.entity_type || '-'}</div>
                  <div><span className="text-muted-foreground">رقم السجل:</span> {viewContract.cr_flc_number || '-'}</div>
                  <div><span className="text-muted-foreground">العنوان الوطني:</span> {viewContract.national_address || '-'}</div>
                  <div><span className="text-muted-foreground">الرقم الضريبي:</span> {viewContract.vat_number || '-'}</div>
                </CardContent>
              </Card>

              {/* Bank Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    المعلومات البنكية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">المستفيد:</span> {viewContract.beneficiary_name || '-'}</div>
                  <div><span className="text-muted-foreground">البنك:</span> {viewContract.bank_name || '-'}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">الآيبان:</span> {viewContract.iban || '-'}</div>
                </CardContent>
              </Card>

              {/* Fees */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">هيكل الرسوم</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground">رسوم التأسيس</div>
                    <div className="text-lg font-bold">{viewContract.setup_fees || 0} ر.س</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground">رسوم العملية</div>
                    <div className="text-lg font-bold">{viewContract.transaction_fees_percent || 0}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground">Visa/MC</div>
                    <div className="text-lg font-bold">{viewContract.visa_mc_fees || '-'}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground">Apple/Google Pay</div>
                    <div className="text-lg font-bold">{viewContract.apple_google_pay_fees || '-'}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground">رسوم التسوية</div>
                    <div className="text-lg font-bold">{viewContract.settlement_fees || 0} ر.س</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground">ضريبة القيمة المضافة</div>
                    <div className="text-lg font-bold">{viewContract.vat_percent || 15}%</div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Dates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    تواريخ العقد
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">تاريخ العقد</div>
                    <div className="font-medium">
                      {viewContract.contract_date 
                        ? format(new Date(viewContract.contract_date), 'yyyy/MM/dd')
                        : '-'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">تاريخ البدء</div>
                    <div className="font-medium">
                      {viewContract.start_date 
                        ? format(new Date(viewContract.start_date), 'yyyy/MM/dd')
                        : '-'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">تاريخ الانتهاء</div>
                    <div className="font-medium">
                      {viewContract.end_date 
                        ? format(new Date(viewContract.end_date), 'yyyy/MM/dd')
                        : '-'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">المدة</div>
                    <div className="font-medium">{viewContract.duration_months || 12} شهر</div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getStatusBadge(viewContract.status)}
                  {viewContract.auto_renew && (
                    <Badge variant="outline">تجديد تلقائي</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {viewContract.contract_file_url && (
                    <Button variant="outline" asChild>
                      <a href={viewContract.contract_file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 ml-2" />
                        عرض الملف
                      </a>
                    </Button>
                  )}
                  <Button onClick={() => {
                    setViewContract(null);
                    openEditDialog(viewContract);
                  }}>
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProviderContractsManager;
