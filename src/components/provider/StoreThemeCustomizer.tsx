import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Palette, 
  Save, 
  Loader2, 
  Eye,
  RotateCcw,
  Type,
  Square,
  Circle,
  Sparkles,
  Upload,
  Image,
  X,
  Trash2,
  Lock,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ServiceProvider, StoreTheme } from '@/hooks/useProviderData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

interface StoreThemeCustomizerProps {
  provider: ServiceProvider;
  onUpdate?: (provider: ServiceProvider) => void;
}

const defaultTheme: StoreTheme = {
  primary_color: '#2A9D8F',
  secondary_color: '#264653',
  accent_color: '#E9C46A',
  background_color: '#FFFFFF',
  text_color: '#1A1A1A',
  header_style: 'gradient',
  header_image_url: '',
  header_overlay_opacity: 50,
  header_blur: false,
  font_family: 'Tajawal',
  border_radius: 'medium',
  button_style: 'rounded'
};

const fontOptions = [
  { value: 'Tajawal', label: 'تجوال (الافتراضي)' },
  { value: 'Cairo', label: 'القاهرة' },
  { value: 'Almarai', label: 'المراعي' },
  { value: 'Noto Kufi Arabic', label: 'نوتو كوفي' },
  { value: 'Amiri', label: 'أميري' }
];

const presetThemes = [
  { 
    name: 'أخضر كلاسيكي', 
    theme: { ...defaultTheme } 
  },
  { 
    name: 'أزرق عصري', 
    theme: { 
      ...defaultTheme, 
      primary_color: '#1E40AF', 
      secondary_color: '#3B82F6',
      accent_color: '#F59E0B'
    } 
  },
  { 
    name: 'بنفسجي أنيق', 
    theme: { 
      ...defaultTheme, 
      primary_color: '#6D28D9', 
      secondary_color: '#8B5CF6',
      accent_color: '#EC4899'
    } 
  },
  { 
    name: 'قهوة دافئة', 
    theme: { 
      ...defaultTheme, 
      primary_color: '#78350F', 
      secondary_color: '#A16207',
      accent_color: '#CA8A04'
    } 
  },
  { 
    name: 'داكن عصري', 
    theme: { 
      ...defaultTheme, 
      primary_color: '#18181B', 
      secondary_color: '#27272A',
      accent_color: '#EAB308',
      background_color: '#09090B',
      text_color: '#FAFAFA'
    } 
  },
  { 
    name: 'وردي ناعم', 
    theme: { 
      ...defaultTheme, 
      primary_color: '#BE185D', 
      secondary_color: '#DB2777',
      accent_color: '#F472B6'
    } 
  }
];

const StoreThemeCustomizer = ({ provider, onUpdate }: StoreThemeCustomizerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState<StoreTheme>(defaultTheme);
  const [showPreview, setShowPreview] = useState(false);

  // Check if provider has professional subscription (not trial)
  const isProfessionalPlan = provider?.subscription_status === 'active';
  const isTrialPlan = provider?.subscription_status === 'trial';

  useEffect(() => {
    if (provider?.store_theme) {
      setTheme({
        ...defaultTheme,
        ...provider.store_theme
      });
    }
  }, [provider]);

  const handleColorChange = (key: keyof StoreTheme, value: string | number | boolean) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${provider.id}-header-${Date.now()}.${fileExt}`;
      const filePath = `provider-headers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setTheme(prev => ({ 
        ...prev, 
        header_image_url: publicUrl,
        header_style: 'image' 
      }));
      
      toast.success('تم رفع صورة الخلفية بنجاح');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const removeHeaderImage = () => {
    setTheme(prev => ({ 
      ...prev, 
      header_image_url: '',
      header_style: 'solid'
    }));
    toast.info('تم إزالة صورة الخلفية');
  };

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setTheme(preset.theme);
    toast.success(`تم تطبيق ثيم "${preset.name}"`);
  };

  const resetToDefault = () => {
    setTheme(defaultTheme);
    toast.info('تم إعادة الثيم للإعدادات الافتراضية');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('service_providers')
        .update({ store_theme: theme } as any)
        .eq('id', provider.id);

      if (error) throw error;

      if (onUpdate) {
        onUpdate({
          ...provider,
          store_theme: theme
        });
      }

      toast.success('تم حفظ تخصيصات الثيم بنجاح');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('حدث خطأ أثناء حفظ الثيم');
    } finally {
      setIsLoading(false);
    }
  };

  const getBorderRadiusValue = (radius: string) => {
    const values: Record<string, string> = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '16px',
      full: '9999px'
    };
    return values[radius] || '8px';
  };

  // If not professional plan, show upgrade message
  if (!isProfessionalPlan) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-arabic flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            تخصيص الهوية البصرية
          </CardTitle>
          <CardDescription className="font-arabic mt-1">
            خصص ألوان وشكل متجرك ليتناسب مع علامتك التجارية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Lock className="h-5 w-5 text-amber-600" />
            <AlertTitle className="font-arabic text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              ميزة حصرية للاشتراك الاحترافي
            </AlertTitle>
            <AlertDescription className="font-arabic text-amber-700 dark:text-amber-300 mt-2">
              {isTrialPlan ? (
                <>
                  أنت حالياً في الفترة التجريبية. قم بالترقية إلى الاشتراك الاحترافي للوصول إلى:
                </>
              ) : (
                <>
                  هذه الميزة متاحة فقط للمشتركين في الخطة الاحترافية. قم بالاشتراك للوصول إلى:
                </>
              )}
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>تخصيص الألوان والثيمات</li>
                <li>رفع صورة خلفية مخصصة للهيدر</li>
                <li>اختيار الخطوط وأنماط الأزرار</li>
                <li>ثيمات جاهزة احترافية</li>
                <li>معاينة فورية للتغييرات</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          {/* Preview of what they could have */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-arabic text-muted-foreground">معاينة مقفلة</p>
              </div>
            </div>
            <div className="opacity-50 pointer-events-none">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {presetThemes.slice(0, 3).map((preset, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border flex items-center gap-2"
                  >
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.theme.primary_color }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.theme.accent_color }}
                      />
                    </div>
                    <span className="text-xs font-arabic">{preset.name}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 bg-muted rounded animate-pulse" />
                <div className="h-10 bg-muted rounded animate-pulse" />
                <div className="h-10 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-arabic flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              تخصيص الهوية البصرية
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="h-3 w-3" />
                احترافي
              </span>
            </CardTitle>
            <CardDescription className="font-arabic mt-1">
              خصص ألوان وشكل متجرك ليتناسب مع علامتك التجارية
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="font-arabic"
          >
            <Eye className="h-4 w-4 ml-1" />
            {showPreview ? 'إخفاء المعاينة' : 'معاينة'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preset Themes */}
          <div className="space-y-3">
            <Label className="font-arabic font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              ثيمات جاهزة
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {presetThemes.map((preset, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="justify-start gap-2 font-arabic h-auto py-2"
                >
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.theme.primary_color }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.theme.accent_color }}
                    />
                  </div>
                  <span className="text-xs">{preset.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="space-y-4">
            <Label className="font-arabic font-medium">الألوان</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-arabic text-sm text-muted-foreground">اللون الأساسي</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="font-mono text-sm flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-arabic text-sm text-muted-foreground">اللون الثانوي</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.secondary_color}
                    onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.secondary_color}
                    onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                    className="font-mono text-sm flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-arabic text-sm text-muted-foreground">لون التمييز</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.accent_color}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.accent_color}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    className="font-mono text-sm flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-arabic text-sm text-muted-foreground">لون الخلفية</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    className="font-mono text-sm flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-arabic text-sm text-muted-foreground">لون النص</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    className="font-mono text-sm flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-arabic flex items-center gap-2">
                <Type className="h-4 w-4" />
                الخط
              </Label>
              <Select
                value={theme.font_family}
                onValueChange={(value) => handleColorChange('font_family', value)}
              >
                <SelectTrigger className="font-arabic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="font-arabic">
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">نمط الهيدر</Label>
              <Select
                value={theme.header_style}
                onValueChange={(value: 'solid' | 'gradient' | 'transparent' | 'image') => 
                  handleColorChange('header_style', value)
                }
              >
                <SelectTrigger className="font-arabic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid" className="font-arabic">لون موحد</SelectItem>
                  <SelectItem value="gradient" className="font-arabic">تدرج لوني</SelectItem>
                  <SelectItem value="transparent" className="font-arabic">شفاف</SelectItem>
                  <SelectItem value="image" className="font-arabic">صورة خلفية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Header Image Upload */}
          {theme.header_style === 'image' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <Label className="font-arabic font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                صورة خلفية الهيدر
              </Label>
              
              {theme.header_image_url ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden aspect-[3/1]">
                    <img 
                      src={theme.header_image_url} 
                      alt="Header background" 
                      className="w-full h-full object-cover"
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        backgroundColor: theme.primary_color,
                        opacity: (theme.header_overlay_opacity || 50) / 100
                      }}
                    />
                    {theme.header_blur && (
                      <div className="absolute inset-0 backdrop-blur-sm" />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-8 w-8"
                      onClick={removeHeaderImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Overlay Controls */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="font-arabic text-sm">
                        شفافية التراكب: {theme.header_overlay_opacity || 50}%
                      </Label>
                      <Slider
                        value={[theme.header_overlay_opacity || 50]}
                        onValueChange={([value]) => handleColorChange('header_overlay_opacity', value)}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-arabic text-sm">تأثير الضبابية</Label>
                      <Switch
                        checked={theme.header_blur || false}
                        onCheckedChange={(checked) => handleColorChange('header_blur', checked)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                    <Image className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-arabic mb-3">
                      ارفع صورة لخلفية الهيدر (حجم أقصى 5 ميجابايت)
                    </p>
                    <input
                      type="file"
                      id="header-image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="header-image-upload">
                      <Button 
                        type="button" 
                        variant="outline" 
                        asChild
                        disabled={isUploading}
                      >
                        <span className="cursor-pointer font-arabic">
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 ml-2" />
                          )}
                          {isUploading ? 'جاري الرفع...' : 'رفع صورة'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* More Style Options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-arabic flex items-center gap-2">
                <Square className="h-4 w-4" />
                استدارة الحواف
              </Label>
              <Select
                value={theme.border_radius}
                onValueChange={(value: 'none' | 'small' | 'medium' | 'large' | 'full') => 
                  handleColorChange('border_radius', value)
                }
              >
                <SelectTrigger className="font-arabic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-arabic">بدون استدارة</SelectItem>
                  <SelectItem value="small" className="font-arabic">استدارة صغيرة</SelectItem>
                  <SelectItem value="medium" className="font-arabic">استدارة متوسطة</SelectItem>
                  <SelectItem value="large" className="font-arabic">استدارة كبيرة</SelectItem>
                  <SelectItem value="full" className="font-arabic">دائري كامل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic flex items-center gap-2">
                <Circle className="h-4 w-4" />
                شكل الأزرار
              </Label>
              <Select
                value={theme.button_style}
                onValueChange={(value: 'square' | 'rounded' | 'pill') => 
                  handleColorChange('button_style', value)
                }
              >
                <SelectTrigger className="font-arabic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square" className="font-arabic">مربع</SelectItem>
                  <SelectItem value="rounded" className="font-arabic">مستدير</SelectItem>
                  <SelectItem value="pill" className="font-arabic">كبسولة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-3">
              <Label className="font-arabic font-medium">معاينة الثيم</Label>
              <div 
                className="p-6 rounded-lg border overflow-hidden"
                style={{ 
                  backgroundColor: theme.background_color,
                  fontFamily: theme.font_family
                }}
              >
                {/* Preview Header */}
                <div 
                  className="p-4 -m-6 mb-4"
                  style={{ 
                    background: theme.header_style === 'gradient' 
                      ? `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})`
                      : theme.primary_color
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      <Palette className="h-5 w-5" style={{ color: theme.primary_color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{provider.business_name}</h3>
                      <p className="text-xs text-white/70">معاينة الثيم</p>
                    </div>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="space-y-4">
                  <h4 
                    className="font-bold text-lg"
                    style={{ color: theme.text_color }}
                  >
                    عنوان المنتج
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: `${theme.text_color}99` }}
                  >
                    هذا نص توضيحي لوصف المنتج يظهر كيف سيبدو النص في متجرك
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      style={{ 
                        backgroundColor: theme.primary_color,
                        color: '#FFFFFF',
                        borderRadius: getBorderRadiusValue(theme.button_style === 'pill' ? 'full' : theme.border_radius)
                      }}
                    >
                      زر أساسي
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      style={{ 
                        borderColor: theme.accent_color,
                        color: theme.accent_color,
                        borderRadius: getBorderRadiusValue(theme.button_style === 'pill' ? 'full' : theme.border_radius)
                      }}
                    >
                      زر ثانوي
                    </Button>
                  </div>
                  <div 
                    className="p-3"
                    style={{ 
                      backgroundColor: `${theme.accent_color}20`,
                      borderRadius: getBorderRadiusValue(theme.border_radius)
                    }}
                  >
                    <span 
                      className="text-sm font-medium"
                      style={{ color: theme.accent_color }}
                    >
                      ٢٥ ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 font-arabic"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              حفظ الثيم
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetToDefault}
              className="font-arabic"
            >
              <RotateCcw className="h-4 w-4 ml-1" />
              إعادة تعيين
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoreThemeCustomizer;
