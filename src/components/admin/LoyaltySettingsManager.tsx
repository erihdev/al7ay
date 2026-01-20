import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Crown, 
  Medal, 
  Award, 
  Settings, 
  Save, 
  Info, 
  Gift, 
  Users, 
  Percent,
  Coins,
  UserPlus
} from 'lucide-react';

interface LoyaltySettings {
  id: string;
  bronze_min_points: number;
  silver_min_points: number;
  gold_min_points: number;
  bronze_discount: number;
  silver_discount: number;
  gold_discount: number;
  bronze_multiplier: number;
  silver_multiplier: number;
  gold_multiplier: number;
  points_per_riyal: number;
  points_value_in_riyals: number;
  referrer_bonus_points: number;
  referred_bonus_points: number;
  referral_enabled: boolean;
  loyalty_enabled: boolean;
  program_description_ar: string | null;
  referral_description_ar: string | null;
}

export default function LoyaltySettingsManager() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);

  const { data: fetchedSettings, isLoading } = useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as LoyaltySettings;
    }
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<LoyaltySettings>) => {
      const { error } = await supabase
        .from('loyalty_settings')
        .update(newSettings)
        .eq('id', settings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  });

  const handleSave = () => {
    if (!settings) return;
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!settings) {
    return <div className="text-center py-8 text-muted-foreground">لا توجد إعدادات</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات نظام الولاء والإحالات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            تحكم في إعدادات برنامج الولاء ومكافآت الإحالات
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 ml-2" />
          {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {/* Enable/Disable Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">نظام الولاء</p>
                  <p className="text-sm text-muted-foreground">تفعيل برنامج نقاط الولاء</p>
                </div>
              </div>
              <Switch
                checked={settings.loyalty_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, loyalty_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">نظام الإحالات</p>
                  <p className="text-sm text-muted-foreground">تفعيل مكافآت الإحالات</p>
                </div>
              </div>
              <Switch
                checked={settings.referral_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, referral_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guide">
            <Info className="h-4 w-4 ml-1" />
            الشرح
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <Crown className="h-4 w-4 ml-1" />
            المستويات
          </TabsTrigger>
          <TabsTrigger value="points">
            <Coins className="h-4 w-4 ml-1" />
            النقاط
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="h-4 w-4 ml-1" />
            الإحالات
          </TabsTrigger>
        </TabsList>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                كيف يعمل نظام الولاء؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-amber-700/10 border border-amber-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Medal className="h-5 w-5 text-amber-700" />
                    <span className="font-bold text-amber-700">برونزي</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• النقاط المطلوبة: {settings.bronze_min_points}+</li>
                    <li>• الخصم: {settings.bronze_discount}%</li>
                    <li>• مضاعف النقاط: {settings.bronze_multiplier}×</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-400/10 border border-slate-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-slate-500" />
                    <span className="font-bold text-slate-500">فضي</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• النقاط المطلوبة: {settings.silver_min_points}+</li>
                    <li>• الخصم: {settings.silver_discount}%</li>
                    <li>• مضاعف النقاط: {settings.silver_multiplier}×</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold text-yellow-500">ذهبي</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• النقاط المطلوبة: {settings.gold_min_points}+</li>
                    <li>• الخصم: {settings.gold_discount}%</li>
                    <li>• مضاعف النقاط: {settings.gold_multiplier}×</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  آلية كسب النقاط
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• يكسب العميل <strong>{settings.points_per_riyal} نقطة</strong> لكل ريال يدفعه</li>
                  <li>• قيمة كل نقطة = <strong>{settings.points_value_in_riyals} ريال</strong></li>
                  <li>• النقاط تتراكم تلقائياً مع كل طلب مكتمل</li>
                  <li>• الترقية للمستوى الأعلى تتم تلقائياً عند الوصول للحد المطلوب</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-500" />
                كيف يعمل نظام الإحالات؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <h4 className="font-semibold text-green-600 mb-2">المُحيل (صاحب الكود)</h4>
                  <p className="text-sm text-muted-foreground">
                    يحصل على <strong>{settings.referrer_bonus_points} نقطة</strong> عند تسجيل صديق باستخدام كوده
                  </p>
                </div>
                
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-semibold text-blue-600 mb-2">المُحال (الصديق الجديد)</h4>
                  <p className="text-sm text-muted-foreground">
                    يحصل على <strong>{settings.referred_bonus_points} نقطة</strong> عند التسجيل بكود إحالة
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">خطوات الإحالة:</h4>
                <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>يشارك العميل كود الإحالة الخاص به مع أصدقائه</li>
                  <li>الصديق يسجل في التطبيق ويدخل كود الإحالة</li>
                  <li>بعد إكمال أول طلب، كلاهما يحصل على النقاط</li>
                  <li>النقاط تضاف تلقائياً لرصيد كل منهما</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Descriptions */}
          <Card>
            <CardHeader>
              <CardTitle>نصوص الشرح للعملاء</CardTitle>
              <CardDescription>هذه النصوص تظهر للعملاء في صفحات الولاء والإحالات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>وصف برنامج الولاء</Label>
                <Textarea
                  value={settings.program_description_ar || ''}
                  onChange={(e) => setSettings({ ...settings, program_description_ar: e.target.value })}
                  placeholder="اكتب وصفاً لبرنامج الولاء..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>وصف برنامج الإحالات</Label>
                <Textarea
                  value={settings.referral_description_ar || ''}
                  onChange={(e) => setSettings({ ...settings, referral_description_ar: e.target.value })}
                  placeholder="اكتب وصفاً لبرنامج الإحالات..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bronze Settings */}
            <Card className="border-amber-700/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Medal className="h-5 w-5" />
                  المستوى البرونزي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>الحد الأدنى للنقاط</Label>
                  <Input
                    type="number"
                    value={settings.bronze_min_points}
                    onChange={(e) => setSettings({ ...settings, bronze_min_points: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>نسبة الخصم (%)</Label>
                  <Input
                    type="number"
                    value={settings.bronze_discount}
                    onChange={(e) => setSettings({ ...settings, bronze_discount: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>مضاعف النقاط</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.bronze_multiplier}
                    onChange={(e) => setSettings({ ...settings, bronze_multiplier: parseFloat(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Silver Settings */}
            <Card className="border-slate-400/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-500">
                  <Award className="h-5 w-5" />
                  المستوى الفضي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>الحد الأدنى للنقاط</Label>
                  <Input
                    type="number"
                    value={settings.silver_min_points}
                    onChange={(e) => setSettings({ ...settings, silver_min_points: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>نسبة الخصم (%)</Label>
                  <Input
                    type="number"
                    value={settings.silver_discount}
                    onChange={(e) => setSettings({ ...settings, silver_discount: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>مضاعف النقاط</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.silver_multiplier}
                    onChange={(e) => setSettings({ ...settings, silver_multiplier: parseFloat(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gold Settings */}
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-500">
                  <Crown className="h-5 w-5" />
                  المستوى الذهبي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>الحد الأدنى للنقاط</Label>
                  <Input
                    type="number"
                    value={settings.gold_min_points}
                    onChange={(e) => setSettings({ ...settings, gold_min_points: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>نسبة الخصم (%)</Label>
                  <Input
                    type="number"
                    value={settings.gold_discount}
                    onChange={(e) => setSettings({ ...settings, gold_discount: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>مضاعف النقاط</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.gold_multiplier}
                    onChange={(e) => setSettings({ ...settings, gold_multiplier: parseFloat(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                إعدادات النقاط
              </CardTitle>
              <CardDescription>تحكم في كيفية كسب واستبدال النقاط</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>نقاط لكل ريال</Label>
                  <p className="text-sm text-muted-foreground mb-2">كم نقطة يكسبها العميل مقابل كل ريال يدفعه</p>
                  <Input
                    type="number"
                    value={settings.points_per_riyal}
                    onChange={(e) => setSettings({ ...settings, points_per_riyal: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>قيمة النقطة بالريال</Label>
                  <p className="text-sm text-muted-foreground mb-2">كم ريال تساوي كل نقطة عند الاستبدال</p>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.points_value_in_riyals}
                    onChange={(e) => setSettings({ ...settings, points_value_in_riyals: parseFloat(e.target.value) || 0.1 })}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">مثال توضيحي:</h4>
                <p className="text-sm text-muted-foreground">
                  إذا طلب العميل بـ <strong>100 ريال</strong>، سيكسب <strong>{settings.points_per_riyal * 100} نقطة</strong>.
                  <br />
                  هذه النقاط تساوي <strong>{(settings.points_per_riyal * 100 * settings.points_value_in_riyals).toFixed(2)} ريال</strong> عند الاستبدال.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                مكافآت الإحالات
              </CardTitle>
              <CardDescription>تحديد النقاط التي يحصل عليها المُحيل والمُحال</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Label className="text-green-600">مكافأة المُحيل</Label>
                  <p className="text-sm text-muted-foreground mb-2">النقاط التي يحصل عليها صاحب كود الإحالة</p>
                  <Input
                    type="number"
                    value={settings.referrer_bonus_points}
                    onChange={(e) => setSettings({ ...settings, referrer_bonus_points: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Label className="text-blue-600">مكافأة المُحال</Label>
                  <p className="text-sm text-muted-foreground mb-2">النقاط التي يحصل عليها الصديق الجديد</p>
                  <Input
                    type="number"
                    value={settings.referred_bonus_points}
                    onChange={(e) => setSettings({ ...settings, referred_bonus_points: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">القيمة المالية للمكافآت:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">مكافأة المُحيل: </span>
                    <Badge variant="outline" className="mr-1">
                      {(settings.referrer_bonus_points * settings.points_value_in_riyals).toFixed(2)} ريال
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">مكافأة المُحال: </span>
                    <Badge variant="outline" className="mr-1">
                      {(settings.referred_bonus_points * settings.points_value_in_riyals).toFixed(2)} ريال
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
