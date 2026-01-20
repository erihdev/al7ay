import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Receipt, 
  Upload, 
  Save, 
  Loader2, 
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Palette,
  QrCode,
  Eye,
  Info
} from 'lucide-react';

interface ProviderInvoiceSettingsProps {
  providerId: string;
  providerName: string;
  isEditable?: boolean;
}

interface InvoiceSettings {
  id?: string;
  provider_id: string;
  logo_url: string | null;
  business_name: string | null;
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

export function ProviderInvoiceSettings({ providerId, providerName, isEditable = true }: ProviderInvoiceSettingsProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // If not editable, show read-only notice
  const readOnlyMode = !isEditable;
  
  const [settings, setSettings] = useState<InvoiceSettings>({
    provider_id: providerId,
    logo_url: null,
    business_name: providerName,
    business_name_en: null,
    slogan: null,
    address: null,
    phone: null,
    email: null,
    vat_number: null,
    cr_number: null,
    footer_text: 'شكراً لتعاملكم معنا!',
    show_vat_number: true,
    show_qr_code: true,
    primary_color: '#1B4332'
  });

  // Fetch existing settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['provider-invoice-settings', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_invoice_settings')
        .select('*')
        .eq('provider_id', providerId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings({
        ...existingSettings,
        show_vat_number: existingSettings.show_vat_number ?? true,
        show_qr_code: existingSettings.show_qr_code ?? true,
        primary_color: existingSettings.primary_color || '#1B4332'
      });
    }
  }, [existingSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: InvoiceSettings) => {
      if (existingSettings?.id) {
        const { error } = await supabase
          .from('provider_invoice_settings')
          .update({
            logo_url: data.logo_url,
            business_name: data.business_name,
            business_name_en: data.business_name_en,
            slogan: data.slogan,
            address: data.address,
            phone: data.phone,
            email: data.email,
            vat_number: data.vat_number,
            cr_number: data.cr_number,
            footer_text: data.footer_text,
            show_vat_number: data.show_vat_number,
            show_qr_code: data.show_qr_code,
            primary_color: data.primary_color
          })
          .eq('id', existingSettings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('provider_invoice_settings')
          .insert({
            provider_id: providerId,
            logo_url: data.logo_url,
            business_name: data.business_name,
            business_name_en: data.business_name_en,
            slogan: data.slogan,
            address: data.address,
            phone: data.phone,
            email: data.email,
            vat_number: data.vat_number,
            cr_number: data.cr_number,
            footer_text: data.footer_text,
            show_vat_number: data.show_vat_number,
            show_qr_code: data.show_qr_code,
            primary_color: data.primary_color
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-invoice-settings', providerId] });
      toast.success('تم حفظ إعدادات الفاتورة بنجاح');
    },
    onError: (error) => {
      console.error('Error saving invoice settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    }
  });

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${providerId}-invoice-logo-${Date.now()}.${fileExt}`;
      const filePath = `provider-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setSettings(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('فشل في رفع الشعار');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                إعدادات الفاتورة
              </CardTitle>
              <CardDescription>
                {readOnlyMode 
                  ? 'بيانات الفاتورة المستخدمة - يتم استخدام فاتورة منصة الحي وسيتم تحويل المبالغ إليك'
                  : 'تخصيص شكل ومحتوى الفواتير الخاصة بمتجرك'
                }
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 ml-1" />
              {showPreview ? 'إخفاء المعاينة' : 'معاينة'}
            </Button>
          </div>
          
          {/* Read-only notice for non-EdfaPay providers */}
          {readOnlyMode && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>
                  أنت تستخدم فاتورة منصة الحي. لتخصيص فاتورتك الخاصة، يرجى الاشتراك في{' '}
                  <a href="/edfapay-guide" className="underline font-medium">بوابة EdfaPay</a>
                </span>
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              شعار المتجر
            </Label>
            <div className="flex items-center gap-4">
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="شعار المتجر"
                  className="h-16 w-16 object-contain rounded-lg border bg-white"
                />
              )}
              {!readOnlyMode && (
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    يفضل صورة مربعة بحجم 200x200 بكسل
                  </p>
                </div>
              )}
              {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>

          <Separator />

          {/* Business Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                اسم النشاط (عربي)
              </Label>
              <Input
                value={settings.business_name || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="اسم المتجر بالعربية"
                disabled={readOnlyMode}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم النشاط (إنجليزي)</Label>
              <Input
                value={settings.business_name_en || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, business_name_en: e.target.value }))}
                placeholder="Store Name in English"
                dir="ltr"
                disabled={readOnlyMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الشعار النصي / الوصف</Label>
            <Input
              value={settings.slogan || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, slogan: e.target.value }))}
              placeholder="مثال: أفضل القهوة المختصة"
              disabled={readOnlyMode}
            />
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                رقم الهاتف
              </Label>
              <Input
                value={settings.phone || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="05xxxxxxxx"
                dir="ltr"
                disabled={readOnlyMode}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </Label>
              <Input
                value={settings.email || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@store.com"
                dir="ltr"
                disabled={readOnlyMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              العنوان
            </Label>
            <Textarea
              value={settings.address || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
              placeholder="العنوان الكامل للمتجر"
              rows={2}
              disabled={readOnlyMode}
            />
          </div>

          <Separator />

          {/* Tax Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الرقم الضريبي (VAT)</Label>
              <Input
                value={settings.vat_number || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, vat_number: e.target.value }))}
                placeholder="رقم التسجيل الضريبي"
                dir="ltr"
                disabled={readOnlyMode}
              />
            </div>
            <div className="space-y-2">
              <Label>السجل التجاري / وثيقة العمل الحر</Label>
              <Input
                value={settings.cr_number || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, cr_number: e.target.value }))}
                placeholder="رقم السجل"
                dir="ltr"
                disabled={readOnlyMode}
              />
            </div>
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">خيارات العرض</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  إظهار الرقم الضريبي
                </Label>
                <p className="text-xs text-muted-foreground">
                  عرض الرقم الضريبي في الفاتورة
                </p>
              </div>
              <Switch
                checked={settings.show_vat_number}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, show_vat_number: checked }))}
                disabled={readOnlyMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  إظهار رمز QR
                </Label>
                <p className="text-xs text-muted-foreground">
                  عرض رمز QR للفاتورة الإلكترونية
                </p>
              </div>
              <Switch
                checked={settings.show_qr_code}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, show_qr_code: checked }))}
                disabled={readOnlyMode}
              />
            </div>
          </div>

          <Separator />

          {/* Color & Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                اللون الرئيسي
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-10 p-1 cursor-pointer"
                  disabled={readOnlyMode}
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1"
                  dir="ltr"
                  disabled={readOnlyMode}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>نص التذييل</Label>
              <Input
                value={settings.footer_text || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, footer_text: e.target.value }))}
                placeholder="شكراً لتعاملكم معنا!"
                disabled={readOnlyMode}
              />
            </div>
          </div>

          {/* Save Button - Only show for editable mode */}
          {!readOnlyMode && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ الإعدادات
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      {showPreview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">معاينة الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg p-6 bg-white text-black max-w-md mx-auto"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {/* Header */}
              <div className="text-center border-b pb-4 mb-4">
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="h-16 w-16 object-contain mx-auto mb-2"
                  />
                )}
                <h2 
                  className="text-xl font-bold"
                  style={{ color: settings.primary_color }}
                >
                  {settings.business_name || 'اسم المتجر'}
                </h2>
                {settings.business_name_en && (
                  <p className="text-sm text-gray-600">{settings.business_name_en}</p>
                )}
                {settings.slogan && (
                  <p className="text-xs text-gray-500 mt-1">{settings.slogan}</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="text-xs text-gray-600 text-center mb-4 space-y-1">
                {settings.address && <p>{settings.address}</p>}
                <div className="flex justify-center gap-4">
                  {settings.phone && <span>هاتف: {settings.phone}</span>}
                  {settings.email && <span>{settings.email}</span>}
                </div>
                {settings.show_vat_number && settings.vat_number && (
                  <p>الرقم الضريبي: {settings.vat_number}</p>
                )}
                {settings.cr_number && (
                  <p>السجل التجاري: {settings.cr_number}</p>
                )}
              </div>

              {/* Invoice Details (Sample) */}
              <div className="border-t border-b py-3 my-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span>رقم الفاتورة:</span>
                  <span className="font-mono">INV-2025-001234</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ:</span>
                  <span>{new Date().toLocaleDateString('ar-SA')}</span>
                </div>
              </div>

              {/* Sample Items */}
              <div className="text-sm mb-4">
                <div className="flex justify-between py-1 border-b">
                  <span>قهوة مختصة</span>
                  <span>25 ر.س</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span>كيكة الشوكولاتة</span>
                  <span>18 ر.س</span>
                </div>
                <div className="flex justify-between py-2 font-bold" style={{ color: settings.primary_color }}>
                  <span>الإجمالي (شامل الضريبة)</span>
                  <span>43 ر.س</span>
                </div>
              </div>

              {/* QR Code Placeholder */}
              {settings.show_qr_code && (
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Footer */}
              {settings.footer_text && (
                <p className="text-center text-xs text-gray-500 pt-2 border-t">
                  {settings.footer_text}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
