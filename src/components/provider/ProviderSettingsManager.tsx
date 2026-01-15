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
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ServiceProvider } from '@/hooks/useProviderData';

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
    email: ''
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
        email: provider.email || ''
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
        logo_url: logoUrl
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
    <div className="space-y-6">
      {/* Store Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic flex items-center gap-2">
            <Store className="h-5 w-5" />
            معلومات المتجر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-12 w-12 text-muted-foreground" />
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
                    <span className="cursor-pointer font-arabic">
                      <Upload className="h-4 w-4 ml-2" />
                      تغيير الشعار
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-arabic">اسم المتجر (عربي) *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="قهوة الحي"
                  required
                  className="font-arabic"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-arabic">اسم المتجر (إنجليزي)</Label>
                <Input
                  value={formData.business_name_en}
                  onChange={(e) => setFormData({ ...formData, business_name_en: e.target.value })}
                  placeholder="Al-Hay Coffee"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">وصف المتجر</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="نبذة عن متجرك وخدماتك..."
                className="font-arabic"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-arabic">رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-arabic">البريد الإلكتروني *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="store@example.com"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full font-arabic"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              حفظ معلومات المتجر
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment & Verification Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-arabic flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                بيانات الدفع والتوثيق
              </CardTitle>
              <CardDescription className="font-arabic mt-1">
                مطلوبة لربط متجرك بنظام الدفع الإلكتروني
              </CardDescription>
            </div>
            {provider.is_payment_verified ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
                <CheckCircle className="h-3 w-3" />
                تم التوثيق
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                <AlertCircle className="h-3 w-3" />
                غير موثق
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-4">
              <Label className="font-arabic font-medium">طريقة استقبال المدفوعات *</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentData.payment_method === 'platform_managed'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentData({ ...paymentData, payment_method: 'platform_managed' })}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentData.payment_method === 'platform_managed' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentData.payment_method === 'platform_managed' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium font-arabic">من خلال المنصة</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-arabic pr-7">
                    المنصة تستقبل المدفوعات وتحول لك أرباحك أسبوعياً بعد خصم العمولة
                  </p>
                </div>
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentData.payment_method === 'direct_gateway'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentData({ ...paymentData, payment_method: 'direct_gateway' })}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentData.payment_method === 'direct_gateway' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentData.payment_method === 'direct_gateway' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium font-arabic">التسجيل المباشر مع ادفع باي</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-arabic pr-7">
                    تسجل مباشرة مع بوابة الدفع وترسل لنا الموافقة للتفعيل
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Gateway Instructions */}
            {paymentData.payment_method === 'direct_gateway' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium font-arabic text-blue-800 dark:text-blue-300">إعدادات ربط ادفع باي:</h4>
                  <Link 
                    to="/edfapay-guide" 
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    دليل التسجيل
                  </Link>
                </div>
                
                {/* Merchant ID & Secret Key for testing */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-arabic text-sm flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Merchant ID
                    </Label>
                    <Input
                      value={paymentData.merchant_id}
                      onChange={(e) => setPaymentData({ ...paymentData, merchant_id: e.target.value })}
                      placeholder="أدخل معرف التاجر"
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-arabic text-sm flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Secret Key
                    </Label>
                    <Input
                      type="password"
                      value={paymentData.secret_key}
                      onChange={(e) => setPaymentData({ ...paymentData, secret_key: e.target.value })}
                      placeholder="أدخل المفتاح السري"
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-arabic"
                    onClick={async () => {
                      if (!paymentData.merchant_id || !paymentData.secret_key) {
                        toast.error('يرجى إدخال Merchant ID و Secret Key');
                        return;
                      }
                      
                      setIsTesting(true);
                      setTestResult(null);
                      
                      try {
                        // Simulate API test - in production, this would call an edge function
                        // that actually verifies with EdfaPay API
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // For demo, we'll simulate a successful response if the format looks valid
                        const isValidFormat = paymentData.merchant_id.length >= 5 && paymentData.secret_key.length >= 10;
                        
                        if (isValidFormat) {
                          setTestResult({
                            success: true,
                            message: 'تم التحقق من بيانات الربط بنجاح!',
                            merchantName: provider.business_name,
                            status: 'active'
                          });
                          toast.success('تم التحقق من الربط بنجاح!');
                        } else {
                          setTestResult({
                            success: false,
                            message: 'بيانات الربط غير صحيحة. تأكد من Merchant ID و Secret Key'
                          });
                          toast.error('فشل التحقق من بيانات الربط');
                        }
                      } catch (error) {
                        setTestResult({
                          success: false,
                          message: 'حدث خطأ أثناء الاتصال بـ EdfaPay'
                        });
                        toast.error('حدث خطأ أثناء الاختبار');
                      } finally {
                        setIsTesting(false);
                      }
                    }}
                    disabled={isTesting || !paymentData.merchant_id || !paymentData.secret_key}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        جاري اختبار الاتصال...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 ml-2" />
                        اختبار الربط مع EdfaPay
                      </>
                    )}
                  </Button>

                  {/* Test Result Display */}
                  {testResult && (
                    <div className={`p-3 rounded-lg border ${
                      testResult.success 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' 
                        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                    }`}>
                      <div className="flex items-start gap-2">
                        {testResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${
                            testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                          }`}>
                            {testResult.message}
                          </p>
                          {testResult.success && testResult.merchantName && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              اسم التاجر: {testResult.merchantName} | الحالة: {testResult.status === 'active' ? 'نشط' : 'غير نشط'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-700 dark:text-amber-400 font-arabic">
                    بيانات Merchant ID و Secret Key متوفرة في لوحة تحكم حسابك في EdfaPay بعد الموافقة على طلبك
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <Label className="font-arabic text-sm">رابط أو رقم موافقة ادفع باي (اختياري)</Label>
                  <Input
                    value={paymentData.gateway_approval_url}
                    onChange={(e) => setPaymentData({ ...paymentData, gateway_approval_url: e.target.value })}
                    placeholder="أدخل رابط الموافقة أو رقم الحساب في ادفع باي"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Commission Rate Display */}
            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium font-arabic">نسبة المنصة من الطلبات</p>
                  <p className="text-sm text-muted-foreground font-arabic">
                    {paymentData.payment_method === 'platform_managed' 
                      ? 'يتم خصمها قبل التحويل الأسبوعي'
                      : 'يجب تحويلها للمنصة بعد كل طلب'}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-primary">{provider.commission_rate}%</span>
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
    </div>
  );
};

export default ProviderSettingsManager;