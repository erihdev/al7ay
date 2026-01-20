import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Upload,
  Loader2,
  Save,
  FileText,
  Building2,
  MapPin,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Percent,
  ExternalLink,
  Zap,
  RefreshCw,
  Info,
  Globe,
  MapPinned,
  Bell,
  Receipt
} from 'lucide-react';
import { VolumeControl } from '@/components/notifications/VolumeControl';
import { ProviderInvoiceSettings } from './ProviderInvoiceSettings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ServiceProvider } from '@/hooks/useProviderData';
import { SimpleLocationPicker } from './SimpleLocationPicker';

interface ProviderSettingsManagerProps {
  provider: ServiceProvider;
  onUpdate?: (provider: ServiceProvider) => void;
}

interface EdfaPayTestResult {
  success: boolean;
  message: string;
  merchantName?: string;
  status?: string;
}

const ProviderSettingsManager = ({ provider, onUpdate }: ProviderSettingsManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<EdfaPayTestResult | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_name_en: '',
    description: '',
    phone: '',
    email: '',
    delivery_scope: 'neighborhood' as 'neighborhood' | 'city',
    store_lat: null as number | null,
    store_lng: null as number | null,
    delivery_radius_km: 5
  });

  const [paymentData, setPaymentData] = useState({
    bank_name: '',
    iban: '',
    national_address: '',
    payment_method: 'platform_managed' as 'direct_gateway' | 'platform_managed',
    gateway_approval_url: '',
    merchant_id: '',
    secret_key: ''
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        business_name: provider.business_name || '',
        business_name_en: provider.business_name_en || '',
        description: provider.description || '',
        phone: provider.phone || '',
        email: provider.email || '',
        delivery_scope: provider.delivery_scope || 'neighborhood',
        store_lat: provider.store_lat || null,
        store_lng: provider.store_lng || null,
        delivery_radius_km: provider.delivery_radius_km ?? 5
      });
      setPaymentData({
        bank_name: provider.bank_name || '',
        iban: provider.iban || '',
        national_address: provider.national_address || '',
        payment_method: provider.payment_method || 'platform_managed',
        gateway_approval_url: provider.gateway_approval_url || '',
        merchant_id: '',
        secret_key: ''
      });
      if (provider.logo_url) {
        setLogoPreview(provider.logo_url);
      }
      if (provider.freelance_certificate_url) {
        setCertificatePreview(provider.freelance_certificate_url);
      }
    }
  }, [provider]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertificateFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificatePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, folder: string, prefix: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${provider.id}-${prefix}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let logoUrl = provider.logo_url;
      
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'provider-logos', 'logo');
      }

      const updatedData = {
        business_name: formData.business_name,
        business_name_en: formData.business_name_en || null,
        description: formData.description || null,
        phone: formData.phone || null,
        email: formData.email,
        logo_url: logoUrl,
        delivery_scope: formData.delivery_scope,
        store_lat: formData.store_lat,
        store_lng: formData.store_lng,
        delivery_radius_km: formData.delivery_radius_km
      };

      if (onUpdate) {
        onUpdate({
          ...provider,
          ...updatedData
        });
      }

      const { error } = await supabase
        .from('service_providers')
        .update(updatedData)
        .eq('id', provider.id);

      if (error) throw error;

      toast.success('تم حفظ معلومات المتجر بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
      if (onUpdate) {
        onUpdate(provider);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaymentLoading(true);

    try {
      let certificateUrl = provider.freelance_certificate_url;
      
      if (certificateFile) {
        certificateUrl = await uploadFile(certificateFile, 'provider-certificates', 'certificate');
      }

      // Validate IBAN format (Saudi IBAN: SA + 22 digits)
      const ibanClean = paymentData.iban.replace(/\s/g, '').toUpperCase();
      if (ibanClean && !ibanClean.match(/^SA\d{22}$/)) {
        toast.error('صيغة الآيبان غير صحيحة. يجب أن يبدأ بـ SA متبوعاً بـ 22 رقم');
        setIsPaymentLoading(false);
        return;
      }

      const updatedData = {
        bank_name: paymentData.bank_name || null,
        iban: ibanClean || null,
        national_address: paymentData.national_address || null,
        freelance_certificate_url: certificateUrl,
        payment_method: paymentData.payment_method,
        gateway_approval_url: paymentData.gateway_approval_url || null
      };

      if (onUpdate) {
        onUpdate({
          ...provider,
          ...updatedData
        });
      }

      const { error } = await supabase
        .from('service_providers')
        .update(updatedData)
        .eq('id', provider.id);

      if (error) throw error;

      toast.success('تم حفظ بيانات الدفع بنجاح');
    } catch (error) {
      console.error('Error saving payment info:', error);
      toast.error('حدث خطأ أثناء حفظ بيانات الدفع');
      if (onUpdate) {
        onUpdate(provider);
      }
    } finally {
      setIsPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Store Information Card */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="font-arabic flex items-center gap-2 text-base">
            <Store className="h-4 w-4" />
            معلومات المتجر
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload - Compact */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label htmlFor="logo-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer font-arabic text-xs">
                      <Upload className="h-3.5 w-3.5 ml-1.5" />
                      تغيير الشعار
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-arabic text-sm">اسم المتجر (عربي) *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="قهوة الحي"
                  required
                  className="font-arabic h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-arabic text-sm">اسم المتجر (إنجليزي)</Label>
                <Input
                  value={formData.business_name_en}
                  onChange={(e) => setFormData({ ...formData, business_name_en: e.target.value })}
                  placeholder="Al-Hay Coffee"
                  dir="ltr"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-arabic text-sm">وصف المتجر</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="نبذة عن متجرك وخدماتك..."
                className="font-arabic text-sm min-h-[60px]"
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-arabic text-sm">رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-arabic text-sm">البريد الإلكتروني *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="store@example.com"
                  required
                  dir="ltr"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Delivery Scope Setting - Compact */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <Label className="font-arabic font-medium flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                نطاق استقبال الطلبات
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`p-2.5 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.delivery_scope === 'neighborhood'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, delivery_scope: 'neighborhood' })}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      formData.delivery_scope === 'neighborhood' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {formData.delivery_scope === 'neighborhood' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <MapPinned className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium font-arabic text-xs">الحي فقط</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-arabic pr-5 leading-tight">
                    الطلبات من نفس الحي
                  </p>
                </div>
                <div
                  className={`p-2.5 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.delivery_scope === 'city'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, delivery_scope: 'city' })}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      formData.delivery_scope === 'city' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {formData.delivery_scope === 'city' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium font-arabic text-xs">كل المدينة</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-arabic pr-5 leading-tight">
                    الطلبات من جميع الأحياء
                  </p>
                </div>
              </div>
            </div>

            {/* Store Location Picker - Simplified */}
            <SimpleLocationPicker 
              location={formData.store_lat && formData.store_lng ? { lat: formData.store_lat, lng: formData.store_lng } : null}
              onLocationChange={(location) => setFormData({ ...formData, store_lat: location.lat, store_lng: location.lng })}
            />

            {/* Delivery Radius Setting - Compact */}
            {formData.store_lat && formData.store_lng && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                <Label className="font-arabic font-medium flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  نطاق التوصيل
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={formData.delivery_radius_km}
                    onChange={(e) => setFormData({ ...formData, delivery_radius_km: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.delivery_radius_km}
                      onChange={(e) => setFormData({ ...formData, delivery_radius_km: Math.min(50, Math.max(1, Number(e.target.value))) })}
                      className="w-14 h-8 text-center text-sm"
                    />
                    <span className="text-xs text-muted-foreground font-arabic">كم</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit" 
              className="w-full font-arabic h-9 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin ml-1.5" />
              ) : (
                <Save className="h-3.5 w-3.5 ml-1.5" />
              )}
              حفظ معلومات المتجر
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment & Verification Card */}
      <Card className="border-primary/20">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-arabic flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                بيانات الدفع والتوثيق
              </CardTitle>
              <CardDescription className="font-arabic mt-0.5 text-xs">
                مطلوبة لربط متجرك بنظام الدفع
              </CardDescription>
            </div>
            {provider.is_payment_verified ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1 text-[10px]">
                <CheckCircle className="h-2.5 w-2.5" />
                موثق
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-[10px]">
                <AlertCircle className="h-2.5 w-2.5" />
                غير موثق
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {/* Payment Method Selection - Compact */}
            <div className="space-y-2">
              <Label className="font-arabic font-medium text-sm">طريقة استقبال المدفوعات *</Label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`p-2.5 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentData.payment_method === 'platform_managed'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentData({ ...paymentData, payment_method: 'platform_managed' })}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      paymentData.payment_method === 'platform_managed' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentData.payment_method === 'platform_managed' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium font-arabic text-xs">من خلال المنصة</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-arabic pr-5 leading-tight">
                    تحويل أرباحك أسبوعياً
                  </p>
                </div>
                <div
                  className={`p-2.5 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentData.payment_method === 'direct_gateway'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentData({ ...paymentData, payment_method: 'direct_gateway' })}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      paymentData.payment_method === 'direct_gateway' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentData.payment_method === 'direct_gateway' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium font-arabic text-xs">ادفع باي مباشر</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-arabic pr-5 leading-tight">
                    ربط حسابك مباشرة
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Gateway Instructions - Compact */}
            {paymentData.payment_method === 'direct_gateway' && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium font-arabic text-blue-800 dark:text-blue-300 text-sm">إعدادات ربط ادفع باي:</h4>
                  <Link 
                    to="/edfapay-guide" 
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    دليل التسجيل
                  </Link>
                </div>
                
                {/* Merchant ID & Secret Key for testing - Compact */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="font-arabic text-xs flex items-center gap-1">
                      <CreditCard className="h-2.5 w-2.5" />
                      Merchant ID
                    </Label>
                    <Input
                      value={paymentData.merchant_id}
                      onChange={(e) => setPaymentData({ ...paymentData, merchant_id: e.target.value })}
                      placeholder="معرف التاجر"
                      dir="ltr"
                      className="font-mono text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-arabic text-xs flex items-center gap-1">
                      <CreditCard className="h-2.5 w-2.5" />
                      Secret Key
                    </Label>
                    <Input
                      type="password"
                      value={paymentData.secret_key}
                      onChange={(e) => setPaymentData({ ...paymentData, secret_key: e.target.value })}
                      placeholder="المفتاح السري"
                      dir="ltr"
                      className="font-mono text-xs h-8"
                    />
                  </div>
                </div>

                {/* Test Connection Button - Compact */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-arabic h-8 text-xs"
                    onClick={async () => {
                      if (!paymentData.merchant_id || !paymentData.secret_key) {
                        toast.error('يرجى إدخال Merchant ID و Secret Key');
                        return;
                      }
                      
                      setIsTesting(true);
                      setTestResult(null);
                      
                      try {
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
                              merchantId: paymentData.merchant_id,
                              secretKey: paymentData.secret_key,
                              providerEmail: provider.email,
                              providerName: provider.business_name
                            })
                          }
                        );
                        
                        const result = await response.json();
                        
                        if (result.success) {
                          setTestResult({
                            success: true,
                            message: result.message || 'تم التحقق والحفظ بنجاح!',
                            merchantName: result.merchantName || provider.business_name,
                            status: 'active'
                          });
                          toast.success('تم التحقق والحفظ بنجاح!');
                        } else {
                          setTestResult({
                            success: false,
                            message: result.message || 'بيانات الربط غير صحيحة'
                          });
                          toast.error('فشل التحقق');
                        }
                      } catch (error) {
                        console.error('Error verifying EdfaPay:', error);
                        setTestResult({
                          success: false,
                          message: 'خطأ في الاتصال'
                        });
                        toast.error('خطأ في الاختبار');
                      } finally {
                        setIsTesting(false);
                      }
                    }}
                    disabled={isTesting || !paymentData.merchant_id || !paymentData.secret_key}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                        جاري الاختبار...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 ml-1" />
                        اختبار وحفظ
                      </>
                    )}
                  </Button>

                  {/* Test Result Display - Compact */}
                  {testResult && (
                    <div className={`p-2 rounded-lg border text-xs ${
                      testResult.success 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200' 
                        : 'bg-red-50 dark:bg-red-950/30 border-red-200'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {testResult.success ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        )}
                        <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                          {testResult.message}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <Label className="font-arabic text-xs">رابط موافقة ادفع باي (اختياري)</Label>
                  <Input
                    value={paymentData.gateway_approval_url}
                    onChange={(e) => setPaymentData({ ...paymentData, gateway_approval_url: e.target.value })}
                    placeholder="رابط أو رقم الحساب"
                    dir="ltr"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Commission Rate Display - Compact */}
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium font-arabic text-sm">نسبة المنصة</p>
                  <p className="text-[11px] text-muted-foreground font-arabic">
                    {paymentData.payment_method === 'platform_managed' ? 'تخصم أسبوعياً' : 'تحول بعد كل طلب'}
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold text-primary">{provider.commission_rate}%</span>
            </div>

            {/* Freelance Certificate Upload */}
            <div className="space-y-3">
              <Label className="font-arabic flex items-center gap-2">
                <FileText className="h-4 w-4" />
                شهادة العمل الحر *
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {certificatePreview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      {certificatePreview.includes('data:image') || certificatePreview.includes('.jpg') || certificatePreview.includes('.png') || certificatePreview.includes('.jpeg') ? (
                        <img 
                          src={certificatePreview} 
                          alt="شهادة العمل الحر" 
                          className="max-h-40 rounded-lg mx-auto"
                        />
                      ) : (
                        <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <span className="font-arabic text-sm">تم رفع الشهادة</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="certificate-upload"
                      accept="image/*,.pdf"
                      onChange={handleCertificateChange}
                      className="hidden"
                    />
                    <label htmlFor="certificate-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span className="cursor-pointer font-arabic">
                          <Upload className="h-4 w-4 ml-2" />
                          تغيير الشهادة
                        </span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-arabic">
                      ارفق صورة شهادة العمل الحر الصادرة من منصة العمل الحر
                    </p>
                    <input
                      type="file"
                      id="certificate-upload"
                      accept="image/*,.pdf"
                      onChange={handleCertificateChange}
                      className="hidden"
                    />
                    <label htmlFor="certificate-upload">
                      <Button type="button" variant="outline" asChild>
                        <span className="cursor-pointer font-arabic">
                          <Upload className="h-4 w-4 ml-2" />
                          رفع الشهادة
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Information */}
            <div className="space-y-4">
              <Label className="font-arabic flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                معلومات الحساب البنكي
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-arabic text-sm text-muted-foreground">اسم البنك *</Label>
                  <Input
                    value={paymentData.bank_name}
                    onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                    placeholder="مثال: البنك الأهلي"
                    className="font-arabic"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-arabic text-sm text-muted-foreground">رقم الآيبان (IBAN) *</Label>
                  <Input
                    value={paymentData.iban}
                    onChange={(e) => setPaymentData({ ...paymentData, iban: e.target.value })}
                    placeholder="SA0000000000000000000000"
                    dir="ltr"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* National Address */}
            <div className="space-y-2">
              <Label className="font-arabic flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                العنوان الوطني *
              </Label>
              <Textarea
                value={paymentData.national_address}
                onChange={(e) => setPaymentData({ ...paymentData, national_address: e.target.value })}
                placeholder="أدخل العنوان الوطني الكامل (الرمز البريدي، المدينة، الحي، رقم المبنى)"
                className="font-arabic"
                rows={2}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-arabic bg-gradient-to-l from-primary to-primary/80"
              disabled={isPaymentLoading}
            >
              {isPaymentLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              حفظ بيانات الدفع
            </Button>

            {!provider.is_payment_verified && (
              <p className="text-xs text-center text-muted-foreground font-arabic">
                بعد إكمال البيانات، سيتم مراجعتها من قبل إدارة المنصة وتفعيل حسابك للدفع الإلكتروني
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Store Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic">معاينة المتجر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-background overflow-hidden flex items-center justify-center">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {formData.business_name || 'اسم المتجر'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formData.description || 'وصف المتجر'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إعدادات الإشعارات
          </CardTitle>
          <CardDescription className="font-arabic">
            تحكم في مستوى صوت ونغمة إشعارات الطلبات الجديدة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VolumeControl />
        </CardContent>
      </Card>

      {/* Invoice Settings - Show for all providers, editable only for EdfaPay verified */}
      <ProviderInvoiceSettings 
        providerId={provider.id} 
        providerName={provider.business_name}
        isEditable={provider.edfapay_credentials_verified || false}
      />
    </div>
  );
};

export default ProviderSettingsManager;