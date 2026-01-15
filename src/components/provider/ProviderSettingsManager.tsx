import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Store, 
  Upload,
  Loader2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ServiceProvider, useUpdateProviderProfile } from '@/hooks/useProviderData';

interface ProviderSettingsManagerProps {
  provider: ServiceProvider;
  onUpdate?: (provider: ServiceProvider) => void;
}

const ProviderSettingsManager = ({ provider, onUpdate }: ProviderSettingsManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_name_en: '',
    description: '',
    phone: '',
    email: ''
  });

  const updateProfileMutation = useUpdateProviderProfile();

  useEffect(() => {
    if (provider) {
      setFormData({
        business_name: provider.business_name || '',
        business_name_en: provider.business_name_en || '',
        description: provider.description || '',
        phone: provider.phone || '',
        email: provider.email || ''
      });
      if (provider.logo_url) {
        setLogoPreview(provider.logo_url);
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

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return provider.logo_url;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${provider.id}-logo.${fileExt}`;
    const filePath = `provider-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, logoFile, { upsert: true });

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
        logoUrl = await uploadLogo();
      }

      await updateProfileMutation.mutateAsync({
        id: provider.id,
        data: {
          business_name: formData.business_name,
          business_name_en: formData.business_name_en || null,
          description: formData.description || null,
          phone: formData.phone || null,
          email: formData.email,
          logo_url: logoUrl
        }
      });

      // Update parent component with new data
      if (onUpdate) {
        onUpdate({
          ...provider,
          business_name: formData.business_name,
          business_name_en: formData.business_name_en || null,
          description: formData.description || null,
          phone: formData.phone || null,
          email: formData.email,
          logo_url: logoUrl
        });
      }

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
              حفظ الإعدادات
            </Button>
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
