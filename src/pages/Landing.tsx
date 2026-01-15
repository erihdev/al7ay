import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationPickerDialog } from '@/components/landing/LocationPickerDialog';
import { 
  MapPin, 
  Coffee, 
  Users, 
  Truck, 
  Star, 
  CheckCircle2, 
  ArrowLeft,
  Store,
  Smartphone,
  Shield,
  Send,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import NeighborhoodsMap from '@/components/landing/NeighborhoodsMap';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
}

const Landing = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    businessName: '',
    city: '',
    neighborhood: '',
    customCity: '',
    customNeighborhood: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [useCustomNeighborhood, setUseCustomNeighborhood] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      const { data, error } = await supabase
        .from('active_neighborhoods')
        .select('id, name, city')
        .eq('is_active', true)
        .order('city')
        .order('name');
      
      if (!error && data) {
        setNeighborhoods(data);
        const uniqueCities = [...new Set(data.map(n => n.city))];
        setCities(uniqueCities);
      }
    };
    fetchNeighborhoods();
  }, []);

  useEffect(() => {
    if (formData.city) {
      setFilteredNeighborhoods(neighborhoods.filter(n => n.city === formData.city));
    } else {
      setFilteredNeighborhoods([]);
    }
  }, [formData.city, neighborhoods]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (value: string) => {
    if (value === 'other') {
      setUseCustomCity(true);
      setUseCustomNeighborhood(true);
      setFormData(prev => ({ ...prev, city: '', neighborhood: '', customCity: '', customNeighborhood: '' }));
    } else {
      setUseCustomCity(false);
      setUseCustomNeighborhood(false);
      setFormData(prev => ({ ...prev, city: value, neighborhood: '', customCity: '', customNeighborhood: '' }));
    }
  };

  const handleNeighborhoodChange = (value: string) => {
    if (value === 'other') {
      setUseCustomNeighborhood(true);
      setFormData(prev => ({ ...prev, neighborhood: '', customNeighborhood: '' }));
    } else {
      setUseCustomNeighborhood(false);
      setFormData(prev => ({ ...prev, neighborhood: value, customNeighborhood: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCity = useCustomCity ? formData.customCity : formData.city;
    const finalNeighborhood = useCustomNeighborhood ? formData.customNeighborhood : formData.neighborhood;
    
    if (!formData.fullName || !formData.phone || !formData.email || !formData.businessName || !finalCity || !finalNeighborhood) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    let neighborhoodName: string;
    if (useCustomNeighborhood) {
      neighborhoodName = `${formData.customNeighborhood}، ${finalCity}`;
    } else {
      const selectedNeighborhood = filteredNeighborhoods.find(n => n.id === formData.neighborhood);
      neighborhoodName = selectedNeighborhood ? `${selectedNeighborhood.name}، ${finalCity}` : finalNeighborhood;
    }

    setIsSubmitting(true);

    try {
      // Insert application
      const { data: appData, error } = await supabase
        .from('service_provider_applications')
        .insert({
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          business_name: formData.businessName,
          neighborhood: neighborhoodName,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // If custom neighborhood was entered, save it as a suggestion
      if (useCustomNeighborhood || useCustomCity) {
        try {
          await supabase
            .from('suggested_neighborhoods')
            .insert({
              name: useCustomNeighborhood ? formData.customNeighborhood : finalNeighborhood,
              city: finalCity,
              lat: customLocation?.lat || null,
              lng: customLocation?.lng || null,
              address: customLocation?.address || null,
              suggested_by_email: formData.email,
              suggested_by_name: formData.fullName,
              application_id: appData?.id || null,
              status: 'pending'
            });

          // Send notification about new neighborhood suggestion
          await supabase.functions.invoke('send-application-email', {
            body: {
              type: 'neighborhood_suggestion',
              email: formData.email,
              fullName: formData.fullName,
              businessName: formData.businessName,
              neighborhood: neighborhoodName,
              phone: formData.phone,
              customNeighborhood: formData.customNeighborhood || finalNeighborhood,
              customCity: finalCity,
            },
          });
        } catch (suggestionError) {
          console.error('Error saving neighborhood suggestion:', suggestionError);
        }
      }

      // Send email notification to admin
      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            type: 'admin_notification',
            email: formData.email,
            fullName: formData.fullName,
            businessName: formData.businessName,
            neighborhood: neighborhoodName,
            phone: formData.phone,
          },
        });
      } catch (emailError) {
        console.error('Error sending admin notification:', emailError);
      }

      setIsSubmitted(true);
      toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Store,
      title: 'متجرك الخاص',
      description: 'أنشئ متجرك الإلكتروني بسهولة وابدأ ببيع منتجاتك لجيرانك'
    },
    {
      icon: MapPin,
      title: 'خدمة الحي',
      description: 'قدم خدماتك لسكان حيّك واستفد من قربك منهم'
    },
    {
      icon: Truck,
      title: 'توصيل سريع',
      description: 'نظام توصيل متكامل مع تتبع مباشر للطلبات'
    },
    {
      icon: Smartphone,
      title: 'تطبيق سهل',
      description: 'واجهة بسيطة وسهلة الاستخدام للعملاء والبائعين'
    },
    {
      icon: Users,
      title: 'نظام ولاء',
      description: 'برنامج نقاط ومكافآت لزيادة ولاء عملائك'
    },
    {
      icon: Shield,
      title: 'دفع آمن',
      description: 'خيارات دفع متعددة وآمنة لراحة عملائك'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'قدّم طلبك',
      description: 'املأ نموذج التسجيل بمعلوماتك ومعلومات نشاطك التجاري'
    },
    {
      step: 2,
      title: 'المراجعة والتفعيل',
      description: 'سيقوم فريقنا بمراجعة طلبك وتفعيل حسابك في الحي المطلوب'
    },
    {
      step: 3,
      title: 'أضف منتجاتك',
      description: 'أضف منتجاتك وحدد أسعارك وابدأ في استقبال الطلبات'
    },
    {
      step: 4,
      title: 'استقبل الطلبات',
      description: 'تابع طلباتك وقم بتوصيلها لعملائك في الحي'
    }
  ];

  const testimonials = [
    {
      name: 'أم محمد',
      role: 'صاحبة مشروع منزلي',
      content: 'منصة الحي غيّرت طريقة بيعي لمنتجاتي. الآن أصل لعملاء أكثر في حيّي!',
      rating: 5
    },
    {
      name: 'أبو عبدالله',
      role: 'باريستا منزلي',
      content: 'أفضل منصة للخدمات المحلية. سهلة الاستخدام ودعم فني ممتاز.',
      rating: 5
    },
    {
      name: 'سارة',
      role: 'صاحبة حلويات منزلية',
      content: 'زاد دخلي بشكل كبير بعد انضمامي للمنصة. أنصح بها بشدة!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <AnimatedLogo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Link to="/install" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="text-primary">
                <Download className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/provider-login">
              <Button variant="outline" className="font-arabic text-xs sm:text-sm">
                دخول مقدمي الخدمات
              </Button>
            </Link>
            <Link to="/app">
              <Button className="font-arabic text-xs sm:text-sm">
                دخول العملاء
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
              <Coffee className="h-4 w-4" />
              <span>منصة الخدمات المحلية الأولى</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              قدّم خدماتك لـ
              <span className="text-primary"> جيرانك </span>
              بسهولة
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              منصة الحي تمكّنك من بيع منتجاتك وتقديم خدماتك لسكان حيّك. 
              سواء كنت تصنع القهوة، الحلويات، أو أي منتج منزلي.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 font-arabic" asChild>
                <a href="#apply">
                  انضم الآن
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                <a href="#features">
                  تعرّف على المنصة
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">لماذا تختار منصة الحي؟</h2>
            <p className="text-muted-foreground text-lg">كل ما تحتاجه لإدارة مشروعك المحلي</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">كيف تبدأ؟</h2>
            <p className="text-muted-foreground text-lg">أربع خطوات بسيطة للانضمام</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods Map Section */}
      <NeighborhoodsMap />

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">ماذا يقول عملاؤنا؟</h2>
            <p className="text-muted-foreground text-lg">تجارب حقيقية من أصحاب الخدمات</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">انضم إلى منصة الحي</h2>
              <p className="text-muted-foreground text-lg">
                قدّم طلبك الآن وسنتواصل معك خلال 24 ساعة
              </p>
            </div>
            
            {isSubmitted ? (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2 text-green-800 dark:text-green-200">
                    تم إرسال طلبك بنجاح!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    سيقوم فريقنا بمراجعة طلبك والتواصل معك قريباً على رقم الهاتف أو البريد الإلكتروني المسجل.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-arabic">نموذج طلب الانضمام</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="font-arabic">الاسم الكامل *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="أدخل اسمك الكامل"
                          className="font-arabic"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-arabic">رقم الهاتف *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="05XXXXXXXX"
                          className="font-arabic"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-arabic">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="example@email.com"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="font-arabic">اسم النشاط التجاري *</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="مثال: قهوة أم محمد"
                        className="font-arabic"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="font-arabic">المدينة *</Label>
                        {useCustomCity ? (
                          <div className="space-y-2">
                            <Input
                              id="customCity"
                              name="customCity"
                              value={formData.customCity}
                              onChange={handleInputChange}
                              placeholder="أدخل اسم المدينة"
                              className="font-arabic"
                            />
                            <div className="flex gap-2">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs font-arabic"
                                onClick={() => {
                                  setUseCustomCity(false);
                                  setUseCustomNeighborhood(false);
                                  setFormData(prev => ({ ...prev, customCity: '', customNeighborhood: '' }));
                                  setCustomLocation(null);
                                }}
                              >
                                العودة للقائمة
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="text-xs font-arabic"
                                onClick={() => setShowLocationPicker(true)}
                              >
                                <MapPin className="h-3 w-3 ml-1" />
                                حدد على الخريطة
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <SearchableSelect
                            options={cities.map(city => ({ value: city, label: city }))}
                            value={formData.city}
                            onValueChange={handleCityChange}
                            placeholder="اختر المدينة"
                            searchPlaceholder="ابحث عن مدينة..."
                            emptyMessage="لا توجد نتائج"
                            extraOption={{ value: 'other', label: '+ مدينة أخرى' }}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood" className="font-arabic">الحي *</Label>
                        {useCustomNeighborhood ? (
                          <div className="space-y-2">
                            <Input
                              id="customNeighborhood"
                              name="customNeighborhood"
                              value={formData.customNeighborhood}
                              onChange={handleInputChange}
                              placeholder="أدخل اسم الحي"
                              className="font-arabic"
                            />
                            <div className="flex gap-2">
                              {!useCustomCity && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs font-arabic"
                                  onClick={() => {
                                    setUseCustomNeighborhood(false);
                                    setFormData(prev => ({ ...prev, customNeighborhood: '' }));
                                    setCustomLocation(null);
                                  }}
                                >
                                  العودة للقائمة
                                </Button>
                              )}
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="text-xs font-arabic"
                                onClick={() => setShowLocationPicker(true)}
                              >
                                <MapPin className="h-3 w-3 ml-1" />
                                حدد على الخريطة
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <SearchableSelect
                            options={filteredNeighborhoods.map(n => ({ value: n.id, label: n.name }))}
                            value={formData.neighborhood}
                            onValueChange={handleNeighborhoodChange}
                            placeholder={formData.city ? "اختر الحي" : "اختر المدينة أولاً"}
                            searchPlaceholder="ابحث عن حي..."
                            emptyMessage="لا توجد أحياء"
                            disabled={!formData.city}
                            extraOption={{ value: 'other', label: '+ حي آخر' }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Show selected location from map */}
                    {customLocation && (useCustomCity || useCustomNeighborhood) && (
                      <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                        <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm">{customLocation.address}</p>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full font-arabic" 
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'جاري الإرسال...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 ml-2" />
                          إرسال الطلب
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Location Picker Dialog */}
            <LocationPickerDialog
              open={showLocationPicker}
              onOpenChange={setShowLocationPicker}
              onLocationSelect={(location) => {
                setCustomLocation(location);
                // Extract city and neighborhood from address if possible
                const addressParts = location.address.split('،').map(p => p.trim());
                if (addressParts.length >= 2) {
                  setFormData(prev => ({
                    ...prev,
                    customNeighborhood: prev.customNeighborhood || addressParts[0],
                    customCity: prev.customCity || addressParts[addressParts.length - 2] || addressParts[1],
                  }));
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <AnimatedLogo size="sm" showText={true} textClassName="!text-lg" />
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="flex items-center gap-4 text-sm">
                <Link to="/install" className="text-muted-foreground hover:text-primary transition-colors">
                  تثبيت التطبيق
                </Link>
                <Link to="/changelog" className="text-muted-foreground hover:text-primary transition-colors">
                  سجل التحديثات
                </Link>
              </div>
              <p className="text-muted-foreground text-sm">
                © 2025 منصة الحي. جميع الحقوق محفوظة.
              </p>
              <Link to="/changelog" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">
                الإصدار 1.1.0
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
