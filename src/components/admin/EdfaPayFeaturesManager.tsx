import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  FileText, 
  Bell, 
  CreditCard, 
  Smartphone,
  Receipt,
  Calendar,
  Settings,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface EdfaPayFeature {
  id: string;
  feature_key: string;
  feature_name_ar: string;
  feature_name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const featureIcons: Record<string, React.ReactNode> = {
  refunds: <RefreshCw className="h-5 w-5" />,
  transaction_reports: <FileText className="h-5 w-5" />,
  webhooks: <Bell className="h-5 w-5" />,
  saved_cards: <CreditCard className="h-5 w-5" />,
  apple_pay: <Smartphone className="h-5 w-5" />,
  google_pay: <Smartphone className="h-5 w-5" />,
  e_invoices: <Receipt className="h-5 w-5" />,
  scheduled_payments: <Calendar className="h-5 w-5" />,
};

const featureColors: Record<string, string> = {
  refunds: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  transaction_reports: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  webhooks: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  saved_cards: 'bg-green-500/10 text-green-500 border-green-500/20',
  apple_pay: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
  google_pay: 'bg-red-500/10 text-red-500 border-red-500/20',
  e_invoices: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  scheduled_payments: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

const EdfaPayFeaturesManager = () => {
  const queryClient = useQueryClient();
  const [updatingFeature, setUpdatingFeature] = useState<string | null>(null);

  const { data: features, isLoading, error } = useQuery({
    queryKey: ['edfapay-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edfapay_features')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      return data as EdfaPayFeature[];
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('edfapay_features')
        .update({ is_enabled })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edfapay-features'] });
      toast.success('تم تحديث الميزة بنجاح');
    },
    onError: (error) => {
      console.error('Error toggling feature:', error);
      toast.error('فشل في تحديث الميزة');
    },
    onSettled: () => {
      setUpdatingFeature(null);
    },
  });

  const handleToggle = (feature: EdfaPayFeature) => {
    setUpdatingFeature(feature.id);
    toggleFeatureMutation.mutate({
      id: feature.id,
      is_enabled: !feature.is_enabled,
    });
  };

  const enabledCount = features?.filter(f => f.is_enabled).length || 0;
  const totalCount = features?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center text-destructive">
          حدث خطأ في تحميل الميزات
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">إدارة ميزات EdfaPay</h2>
                <p className="text-muted-foreground">
                  تحكم في ميزات بوابة الدفع المتاحة للمستخدمين
                </p>
              </div>
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold text-primary">
                {enabledCount} / {totalCount}
              </div>
              <p className="text-sm text-muted-foreground">ميزات مفعّلة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features?.map((feature) => (
          <Card 
            key={feature.id} 
            className={`relative overflow-hidden transition-all duration-300 ${
              feature.is_enabled 
                ? 'border-primary/50 shadow-lg shadow-primary/10' 
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <Badge 
                variant={feature.is_enabled ? 'default' : 'secondary'}
                className="gap-1"
              >
                {feature.is_enabled ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    مفعّل
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    معطّل
                  </>
                )}
              </Badge>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${featureColors[feature.feature_key] || 'bg-muted'}`}>
                  {featureIcons[feature.feature_key] || <Settings className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{feature.feature_name_ar}</CardTitle>
                  <p className="text-xs text-muted-foreground">{feature.feature_name_en}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <CardDescription className="min-h-[40px]">
                {feature.description_ar}
              </CardDescription>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">
                  {feature.is_enabled ? 'إيقاف الميزة' : 'تفعيل الميزة'}
                </span>
                <Switch
                  checked={feature.is_enabled}
                  onCheckedChange={() => handleToggle(feature)}
                  disabled={updatingFeature === feature.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">ملاحظة مهمة</h4>
              <p className="text-sm text-muted-foreground">
                بعض الميزات مثل Apple Pay و Google Pay قد تتطلب إعدادات إضافية من لوحة تحكم EdfaPay. 
                تأكد من تفعيل هذه الميزات في حسابك على EdfaPay أولاً.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdfaPayFeaturesManager;
