import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FileText, 
  Save, 
  Loader2, 
  Upload, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Receipt,
  Palette,
  QrCode,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

interface InvoiceSettings {
  id: string;
  logo_url: string | null;
  business_name: string;
  business_name_en: string | null;
  slogan: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  vat_number: string | null;
  cr_number: string | null;
  footer_text: string | null;
  show_vat_number: boolean;
  show_qr_code: boolean;
  primary_color: string;
}

const InvoiceSettingsManager = () => {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
      toast.error('خطأ في تحميل إعدادات الفاتورة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setSettings(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('خطأ في رفع الشعار');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('invoice_settings')
        .update({
          logo_url: settings.logo_url,
          business_name: settings.business_name,
          business_name_en: settings.business_name_en,
          slogan: settings.slogan,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          vat_number: settings.vat_number,
          cr_number: settings.cr_number,
          footer_text: settings.footer_text,
          show_vat_number: settings.show_vat_number,
          show_qr_code: settings.show_qr_code,
          primary_color: settings.primary_color
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('تم حفظ إعدادات الفاتورة بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('خطأ في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        لا توجد إعدادات فاتورة
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            إعدادات الفاتورة
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            تخصيص شكل ومحتوى الفاتورة
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ التغييرات
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logo & Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5" />
              الشعار والعلامة التجارية
            </CardTitle>
            <CardDescription>شعار النشاط التجاري واللون الرئيسي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>شعار الفاتورة</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30 overflow-hidden">
                  {settings.logo_url ? (
                    <img 
                      src={settings.logo_url} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span className="text-sm">رفع شعار</span>
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG أو SVG (مقاس مقترح: 200×200)
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Primary Color */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                اللون الرئيسي
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-12 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#1B4332"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              بيانات النشاط التجاري
            </CardTitle>
            <CardDescription>المعلومات الأساسية التي تظهر في الفاتورة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم النشاط (عربي) *</Label>
                <Input
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  placeholder="الحي"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم النشاط (إنجليزي)</Label>
                <Input
                  value={settings.business_name_en || ''}
                  onChange={(e) => setSettings({ ...settings, business_name_en: e.target.value })}
                  placeholder="Al-Hay"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                الشعار النصي
              </Label>
              <Input
                value={settings.slogan || ''}
                onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                placeholder="الحي يحيييك"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم السجل التجاري</Label>
                <Input
                  value={settings.cr_number || ''}
                  onChange={(e) => setSettings({ ...settings, cr_number: e.target.value })}
                  placeholder="1010XXXXXX"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الرقم الضريبي</Label>
                <Input
                  value={settings.vat_number || ''}
                  onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })}
                  placeholder="3XXXXXXXXXXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5" />
              بيانات التواصل
            </CardTitle>
            <CardDescription>معلومات الاتصال والعنوان</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                العنوان
              </Label>
              <Textarea
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="المملكة العربية السعودية، الرياض، حي..."
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف
                </Label>
                <Input
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="info@example.com"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer & Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              نص التذييل والخيارات
            </CardTitle>
            <CardDescription>النص الختامي وخيارات العرض</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>نص تذييل الفاتورة</Label>
              <Textarea
                value={settings.footer_text || ''}
                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                placeholder="شكراً لتعاملكم معنا • نتمنى لكم تجربة ممتعة"
                className="resize-none"
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    إظهار الرقم الضريبي
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    عرض الرقم الضريبي في الفاتورة
                  </p>
                </div>
                <Switch
                  checked={settings.show_vat_number}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_vat_number: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    إظهار رمز QR
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    عرض رمز QR للتحقق من الفاتورة
                  </p>
                </div>
                <Switch
                  checked={settings.show_qr_code}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_qr_code: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معاينة الفاتورة</CardTitle>
          <CardDescription>شكل الفاتورة بالإعدادات الحالية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm mx-auto bg-background rounded-2xl border shadow-lg overflow-hidden">
            {/* Invoice Header */}
            <div 
              className="p-4 border-b text-center relative overflow-hidden" 
              style={{ background: `linear-gradient(135deg, ${settings.primary_color}15 0%, ${settings.primary_color}05 100%)` }}
            >
              <div 
                className="absolute top-0 left-0 w-16 h-16 rounded-full opacity-20" 
                style={{ background: settings.primary_color, transform: 'translate(-30%, -30%)' }} 
              />
              <div 
                className="absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-10" 
                style={{ background: settings.primary_color, transform: 'translate(30%, 30%)' }} 
              />
              
              <div className="relative">
                {settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                )}
                <div className="text-[10px] font-medium text-muted-foreground mb-1">فاتورة ضريبية مبسطة</div>
                <div className="font-bold text-lg" style={{ color: settings.primary_color }}>
                  {settings.business_name}
                </div>
                {settings.slogan && (
                  <div className="text-xs text-muted-foreground mt-1">{settings.slogan}</div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date().toLocaleDateString('ar-SA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Invoice Numbers */}
            <div className="grid grid-cols-2 divide-x divide-x-reverse border-b">
              <div className="p-3 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">رقم الفاتورة</div>
                <p className="font-mono text-xs font-bold" style={{ color: settings.primary_color }}>
                  INV-260120-XXXX
                </p>
              </div>
              <div className="p-3 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">رقم الطلب</div>
                <p className="font-mono text-xs font-bold" style={{ color: settings.primary_color }}>
                  ORD-XXXXXX-XXX
                </p>
              </div>
            </div>

            {/* Business Info */}
            {(settings.address || settings.phone || settings.email) && (
              <div className="p-3 border-b bg-muted/20 text-xs text-muted-foreground space-y-1">
                {settings.address && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {settings.address}</div>}
                {settings.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {settings.phone}</div>}
                {settings.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {settings.email}</div>}
              </div>
            )}

            {/* VAT Number */}
            {settings.show_vat_number && settings.vat_number && (
              <div className="p-2 border-b bg-muted/10 text-center">
                <span className="text-[10px] text-muted-foreground">الرقم الضريبي: </span>
                <span className="text-[10px] font-mono font-medium">{settings.vat_number}</span>
              </div>
            )}

            {/* Sample Items */}
            <div className="p-3 border-b">
              <div className="text-[10px] font-medium text-muted-foreground mb-2">تفاصيل الطلب</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">1. قهوة عربية × 2</span>
                  <span className="font-medium">30 ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">2. حلى تمر × 1</span>
                  <span className="font-medium">25 ر.س</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="p-4" style={{ background: `${settings.primary_color}10` }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">المبلغ الإجمالي</span>
                  <div className="text-[10px] text-muted-foreground">شامل الضريبة</div>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold" style={{ color: settings.primary_color }}>55</span>
                  <span className="text-sm mr-1 font-medium">ر.س</span>
                </div>
              </div>
            </div>

            {/* QR Code placeholder */}
            {settings.show_qr_code && (
              <div className="p-3 border-t flex justify-center">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Footer */}
            {settings.footer_text && (
              <div className="p-2 border-t bg-muted/30 text-center">
                <p className="text-[9px] text-muted-foreground">{settings.footer_text}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSettingsManager;