import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Percent, Save, Building, CreditCard, Info } from "lucide-react";

interface CommissionSetting {
  id: string;
  payment_method: string;
  commission_rate: number;
  description_ar: string | null;
  is_active: boolean;
}

const methodConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  platform_managed: {
    label: "عبر المنصة",
    icon: Building,
    description: "العمولة المطبقة عند إدارة المدفوعات من خلال المنصة"
  },
  direct_gateway: {
    label: "ربط مباشر (EdfaPay)",
    icon: CreditCard,
    description: "العمولة المطبقة عند ربط مقدم الخدمة مباشرة مع بوابة الدفع"
  }
};

export default function CommissionSettingsManager() {
  const queryClient = useQueryClient();
  const [editedRates, setEditedRates] = useState<Record<string, number>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .order('payment_method');
      
      if (error) throw error;
      return data as CommissionSetting[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string; rate: number }) => {
      const { error } = await supabase
        .from('commission_settings')
        .update({ commission_rate: rate })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-settings'] });
      toast.success("تم تحديث نسبة العمولة بنجاح");
    },
    onError: () => {
      toast.error("فشل في تحديث نسبة العمولة");
    }
  });

  const handleRateChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setEditedRates(prev => ({ ...prev, [id]: numValue }));
    }
  };

  const handleSave = (setting: CommissionSetting) => {
    const newRate = editedRates[setting.id];
    if (newRate !== undefined && newRate !== setting.commission_rate) {
      updateMutation.mutate({ id: setting.id, rate: newRate });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Percent className="h-5 w-5" />
          إعدادات العمولة
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          تحكم في نسب العمولة المطبقة على مقدمي الخدمات حسب طريقة الدفع
        </p>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">ملاحظة هامة:</p>
            <p>التغييرات في نسب العمولة ستظهر فوراً في صفحة تسجيل مقدمي الخدمات الجدد. يتم تطبيق النسب على المبيعات المستقبلية فقط.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settings?.map((setting) => {
          const config = methodConfig[setting.payment_method] || {
            label: setting.payment_method,
            icon: Percent,
            description: setting.description_ar || ""
          };
          const Icon = config.icon;
          const currentRate = editedRates[setting.id] ?? setting.commission_rate;
          const hasChanges = editedRates[setting.id] !== undefined && editedRates[setting.id] !== setting.commission_rate;

          return (
            <Card key={setting.id} className={hasChanges ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {config.label}
                </CardTitle>
                <CardDescription>
                  {config.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`rate-${setting.id}`}>نسبة العمولة (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`rate-${setting.id}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={currentRate}
                      onChange={(e) => handleRateChange(setting.id, e.target.value)}
                      className="text-lg font-bold text-center w-24"
                    />
                    <span className="text-xl font-bold text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    النسبة الحالية: <span className="font-bold">{setting.commission_rate}%</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSave(setting)}
                    disabled={!hasChanges || updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 ml-1" />
                    حفظ
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
