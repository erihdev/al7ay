import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationPickerDialog } from '@/components/landing/LocationPickerDialog';
import { SimpleLocationPicker } from '@/components/provider/SimpleLocationPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { useClickSound } from '@/hooks/useClickSound';
import { 
  Check, 
  Gift, 
  CreditCard, 
  ArrowRight, 
  Store, 
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Sparkles,
  Loader2,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionPlan {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  duration_days: number;
  price: number;
  is_trial: boolean;
  features: string[];
  discount_percent?: number;
}

interface Neighborhood {
  id: string;
  name: string;
  city: string;
}

const ProviderRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playClickSound } = useClickSound();
  const [step, setStep] = useState<'plan' | 'info'>('plan');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedNeighborhood, setDetectedNeighborhood] = useState<{ id: string; name: string; city: string; distance: number } | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    city: '',
    neighborhood: '',
    customCity: '',
    customNeighborhood: '',
    store_lat: null as number | null,
    store_lng: null as number | null
  });
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [useCustomNeighborhood, setUseCustomNeighborhood] = useState(false);

  // Redirect if already logged in as provider
  useEffect(() => {
    if (user) {
      checkExistingProvider();
    }
  }, [user]);

  const checkExistingProvider = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      navigate('/provider-dashboard');
    }
  };

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        
        if (error || !data || data.length === 0) {
          // Use default plans with comprehensive features
          setPlans([
            {
              id: 'default-trial',
              name_ar: 'تجربة مجانية',
              name_en: 'Free Trial',
              description_ar: 'جرّب المنصة مجاناً لمدة 14 يوم',
              duration_days: 14,
              price: 0,
              is_trial: true,
              features: [
                'إدارة المنتجات',
                'استقبال الطلبات',
                'صفحة متجر خاصة',
                'استقبال المدفوعات (نقد + إلكتروني)',
                'Apple Pay و بطاقات الائتمان',
                'تتبع التوصيل على الخريطة',
                'حساب وقت التوصيل (ETA)',
                'محادثة مباشرة مع العملاء',
                'تقييمات ومراجعات العملاء',
                'نظام العروض والكوبونات',
                'إشعارات الطلبات الفورية',
                'لوحة إحصائيات أساسية',
                'تحويل أسبوعي للأرباح'
              ]
            },
            {
              id: 'default-monthly',
              name_ar: 'اشتراك شهري',
              name_en: 'Monthly',
              description_ar: 'اشتراك شهري مع جميع المميزات',
              duration_days: 30,
              price: 99,
              is_trial: false,
              features: [
                'جميع مميزات التجربة',
                'إدارة غير محدودة للمنتجات',
                'تقارير مبيعات متقدمة',
                'نظام عرض المطبخ (KDS)',
                'جدولة الطلبات المسبقة',
                'إشعارات مجدولة للعملاء',
                'فواتير احترافية',
                'تنبيهات صوتية للطلبات',
                'دعم فني عبر الواتساب',
                'تحويل أسبوعي للأرباح'
              ]
            },
            {
              id: 'default-yearly',
              name_ar: 'اشتراك سنوي',
              name_en: 'Yearly',
              description_ar: 'اشتراك سنوي بخصم مميز',
              duration_days: 365,
              price: 950,
              is_trial: false,
              discount_percent: 20,
              features: [
                'جميع مميزات الاشتراك الشهري',
                'التسجيل المباشر في EdfaPay',
                'استلام الأموال فوراً في حسابك',
                'تخصيص هوية المتجر (ألوان، شعار، خلفية)',
                'ملاحة ثلاثية الأبعاد للتوصيل',
                'تقارير أداء شاملة',
                'إحصائيات متقدمة',
                'أولوية في الدعم الفني',
                'شارة مزود معتمد'
              ]
            }
          ]);
        } else {
          setPlans(data.map(plan => ({
            ...plan,
            features: Array.isArray(plan.features) 
              ? (plan.features as unknown as string[]) 
              : [],
            discount_percent: (plan as any).discount_percent || 0
          })));
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Fetch neighborhoods
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

  const handleCityChange = (value: string) => {
    if (value === 'other') {
      setUseCustomCity(true);
      setUseCustomNeighborhood(true);
      setFormData(prev => ({ ...prev, city: '', neighborhood: '' }));
    } else {
      setUseCustomCity(false);
      setUseCustomNeighborhood(false);
      setFormData(prev => ({ ...prev, city: value, neighborhood: '' }));
    }
  };

  const handleNeighborhoodChange = (value: string) => {
    if (value === 'other') {
      setUseCustomNeighborhood(true);
      setFormData(prev => ({ ...prev, neighborhood: '' }));
    } else {
      setUseCustomNeighborhood(false);
      setFormData(prev => ({ ...prev, neighborhood: value }));
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const detectNearestNeighborhood = async () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsDetectingLocation(true);
    setDetectedNeighborhood(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const { data: neighborhoodsWithCoords, error } = await supabase
          .from('active_neighborhoods')
          .select('id, name, city, lat, lng')
          .eq('is_active', true);

        if (error || !neighborhoodsWithCoords) {
          toast.error('حدث خطأ في تحميل الأحياء');
          setIsDetectingLocation(false);
          return;
        }

        let nearest: { id: string; name: string; city: string; distance: number } | null = null;
        
        for (const neighborhood of neighborhoodsWithCoords) {
          if (neighborhood.lat && neighborhood.lng) {
            const distance = calculateDistance(userLat, userLng, neighborhood.lat, neighborhood.lng);
            if (!nearest || distance < nearest.distance) {
              nearest = {
                id: neighborhood.id,
                name: neighborhood.name,
                city: neighborhood.city,
                distance
              };
            }
          }
        }

        if (nearest) {
          setDetectedNeighborhood(nearest);
          setFormData(prev => ({
            ...prev,
            city: nearest!.city,
            neighborhood: nearest!.id
          }));
          setUseCustomCity(false);
          setUseCustomNeighborhood(false);
          
          const distanceKm = (nearest.distance / 1000).toFixed(1);
          toast.success(`تم تحديد موقعك: ${nearest.name}، ${nearest.city} (${distanceKm} كم)`);
        } else {
          toast.error('لم نتمكن من تحديد الحي الأقرب');
        }

        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('يرجى السماح بالوصول للموقع');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    playClickSound();
    setSelectedPlan(plan);
    setStep('info');
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone || !formData.businessName) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    const finalCity = useCustomCity ? formData.customCity : formData.city;
    const finalNeighborhood = useCustomNeighborhood ? formData.customNeighborhood : formData.neighborhood;
    if (!finalCity || !finalNeighborhood) {
      toast.error('يرجى تحديد المدينة والحي');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedPlan) return;

    setIsLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: formData.fullName },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل إنشاء الحساب');

      // 2. Create service provider profile (always platform_managed by default)
      const finalCity = useCustomCity ? formData.customCity : formData.city;
      const finalNeighborhood = useCustomNeighborhood ? formData.customNeighborhood : formData.neighborhood;
      
      let neighborhoodId: string | null = null;
      if (!useCustomNeighborhood && formData.neighborhood) {
        neighborhoodId = formData.neighborhood;
      }

      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .insert({
          user_id: authData.user.id,
          business_name: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          neighborhood_id: neighborhoodId,
          is_active: true,
          subscription_status: selectedPlan.is_trial ? 'trial' : 'active',
          payment_method: 'platform_managed', // Always default to platform managed
          payout_frequency: 'weekly',
          store_lat: formData.store_lat,
          store_lng: formData.store_lng
        })
        .select()
        .single();

      if (providerError) throw providerError;

      // 3. Add service_provider role
      await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'service_provider'
        });

      // 4. Create subscription
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + selectedPlan.duration_days);

      await supabase
        .from('provider_subscriptions')
        .insert({
          provider_id: providerData.id,
          plan_id: selectedPlan.id,
          is_trial: selectedPlan.is_trial,
          ends_at: endsAt.toISOString(),
          status: 'active',
        });

      // 5. If custom neighborhood, save suggestion
      if (useCustomNeighborhood || useCustomCity) {
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
            status: 'pending'
          });
      }

      toast.success('تم إنشاء حسابك بنجاح!');
      navigate('/provider-dashboard', { replace: true });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
      <InteractiveBackground variant="gradient" intensity="subtle" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Link to="/">
              <AnimatedLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/provider-login">
                <Button variant="outline" size="sm" className="text-xs">
                  لديك حساب؟
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl relative z-10">
        {/* Progress Steps - Simplified */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {['plan', 'info'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-primary text-primary-foreground scale-110' : 
                ['plan', 'info'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                'bg-muted text-muted-foreground'
              }`}>
                {['plan', 'info'].indexOf(step) > i ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${step === s ? 'font-bold' : 'text-muted-foreground'}`}>
                {s === 'plan' ? 'الخطة' : 'المعلومات'}
              </span>
              {i < 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Plan */}
        <AnimatePresence mode="wait">
          {step === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-1">اختر خطتك</h1>
                <p className="text-muted-foreground text-sm">ابدأ مجاناً أو اختر خطة تناسب احتياجاتك</p>
              </div>

              {isLoadingPlans ? (
                <div className="grid md:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-5 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-full mb-3" />
                      <Skeleton className="h-8 w-1/2 mb-3" />
                      <Skeleton className="h-9 w-full" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-3">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all h-full ${
                          plan.is_trial ? 'border-green-500 ring-1 ring-green-500/30' : 
                          index === 1 ? 'border-primary ring-1 ring-primary/30' : 
                          'hover:border-primary/50'
                        }`}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {plan.is_trial && (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold py-1.5 text-center rounded-t-lg">
                            ✨ ابدأ مجاناً
                          </div>
                        )}
                        {!plan.is_trial && plan.discount_percent && plan.discount_percent > 0 && (
                          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold py-1.5 text-center rounded-t-lg">
                            🎉 خصم {plan.discount_percent}%
                          </div>
                        )}
                        {!plan.is_trial && !plan.discount_percent && index === 1 && (
                          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold py-1.5 text-center rounded-t-lg">
                            🔥 الأكثر شعبية
                          </div>
                        )}
                        <CardContent className={`p-4 ${(plan.is_trial || index === 1) ? '' : 'pt-4'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {plan.is_trial ? (
                              <Gift className="h-4 w-4 text-green-500" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-primary" />
                            )}
                            <h3 className="font-bold">{plan.name_ar}</h3>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {plan.description_ar}
                          </p>

                          <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-2xl font-bold text-primary">
                              {plan.price === 0 ? 'مجاني' : plan.price}
                            </span>
                            {plan.price > 0 && (
                              <>
                                <span className="text-xs text-muted-foreground">ر.س</span>
                                <span className="text-xs text-muted-foreground">
                                  / {plan.duration_days === 30 ? 'شهر' : plan.duration_days === 365 ? 'سنة' : `${plan.duration_days} يوم`}
                                </span>
                              </>
                            )}
                          </div>

                          <ul className="space-y-1.5 mb-4">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs">
                                <Check className="h-3 w-3 text-green-500 shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button 
                            className="w-full" 
                            variant={plan.is_trial || index === 1 ? 'default' : 'outline'}
                            size="sm"
                          >
                            {plan.is_trial ? 'ابدأ مجاناً' : 'اختر الخطة'}
                            <ArrowRight className="h-3 w-3 mr-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Simple FAQ */}
              <div className="grid md:grid-cols-2 gap-3 pt-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-500" />
                    هل التجربة ملزمة؟
                  </h4>
                  <p className="text-xs text-muted-foreground">لا، يمكنك الإلغاء في أي وقت بدون رسوم</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    هل يمكنني الترقية لاحقاً؟
                  </h4>
                  <p className="text-xs text-muted-foreground">نعم، يمكنك الترقية في أي وقت من الإعدادات</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Registration Form */}
          {step === 'info' && selectedPlan && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={selectedPlan.is_trial ? 'default' : 'secondary'} className={selectedPlan.is_trial ? 'bg-green-500' : ''}>
                      {selectedPlan.is_trial ? (
                        <><Gift className="h-3 w-3 ml-1" />تجربة مجانية</>
                      ) : (
                        selectedPlan.name_ar
                      )}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setStep('plan')}>
                      تغيير الخطة
                    </Button>
                  </div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    أنشئ حسابك
                  </CardTitle>
                  <CardDescription className="text-sm">
                    أدخل معلوماتك لإنشاء حساب مقدم خدمة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">الاسم الكامل *</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="pr-9 h-9 text-sm"
                          placeholder="أحمد محمد"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">رقم الهاتف *</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pr-9 h-9 text-sm"
                          placeholder="05xxxxxxxx"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">البريد الإلكتروني *</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pr-9 h-9 text-sm"
                        placeholder="email@example.com"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">كلمة المرور *</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pr-9 h-9 text-sm"
                          placeholder="••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">تأكيد كلمة المرور *</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pr-9 h-9 text-sm"
                          placeholder="••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="pt-3 border-t">
                    <div className="space-y-1.5">
                      <Label className="text-sm">اسم النشاط التجاري *</Label>
                      <div className="relative">
                        <Store className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="pr-9 h-9 text-sm"
                          placeholder="مثال: مقهى الحي"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Detection */}
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium">تحديد الموقع تلقائياً</p>
                      <p className="text-xs text-muted-foreground">اضغط لتحديد الحي الأقرب</p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={detectNearestNeighborhood}
                      disabled={isDetectingLocation}
                      className="gap-1.5"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                      {isDetectingLocation ? 'جارٍ...' : 'حدد موقعي'}
                    </Button>
                  </div>

                  {detectedNeighborhood && (
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {detectedNeighborhood.name}، {detectedNeighborhood.city}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* City & Neighborhood */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">المدينة *</Label>
                      {useCustomCity ? (
                        <div className="space-y-1.5">
                          <Input
                            value={formData.customCity}
                            onChange={(e) => setFormData({ ...formData, customCity: e.target.value })}
                            placeholder="اسم المدينة"
                            className="h-9 text-sm"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setUseCustomCity(false);
                              setUseCustomNeighborhood(false);
                            }}
                          >
                            اختر من القائمة
                          </Button>
                        </div>
                      ) : (
                        <SearchableSelect
                          options={[
                            ...cities.map(city => ({ value: city, label: city })),
                            { value: 'other', label: 'مدينة أخرى...' }
                          ]}
                          value={formData.city}
                          onValueChange={handleCityChange}
                          placeholder="اختر المدينة"
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">الحي *</Label>
                      {useCustomNeighborhood ? (
                        <div className="space-y-1.5">
                          <Input
                            value={formData.customNeighborhood}
                            onChange={(e) => setFormData({ ...formData, customNeighborhood: e.target.value })}
                            placeholder="اسم الحي"
                            className="h-9 text-sm"
                          />
                          <div className="flex gap-1.5">
                            {!useCustomCity && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setUseCustomNeighborhood(false)}
                              >
                                اختر من القائمة
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setShowLocationPicker(true)}
                            >
                              <MapPin className="h-3 w-3 ml-1" />
                              الخريطة
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <SearchableSelect
                          options={[
                            ...filteredNeighborhoods.map(n => ({ value: n.id, label: n.name })),
                            { value: 'other', label: 'حي آخر...' }
                          ]}
                          value={formData.neighborhood}
                          onValueChange={handleNeighborhoodChange}
                          placeholder="اختر الحي"
                          disabled={!formData.city}
                        />
                      )}
                    </div>
                  </div>

                  {customLocation && (
                    <div className="p-2.5 bg-muted rounded-lg text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-xs">{customLocation.address}</span>
                    </div>
                  )}

                  {/* Store Location */}
                  <SimpleLocationPicker
                    location={formData.store_lat && formData.store_lng ? { lat: formData.store_lat, lng: formData.store_lng } : null}
                    onLocationChange={(location) => setFormData({ ...formData, store_lat: location.lat, store_lng: location.lng })}
                  />

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep('plan')}
                      className="h-10"
                    >
                      رجوع
                    </Button>
                    <Button
                      className="flex-1 h-10"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          جاري التسجيل...
                        </>
                      ) : (
                        <>
                          إنشاء الحساب
                          <Sparkles className="h-4 w-4 mr-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <LocationPickerDialog
        open={showLocationPicker}
        onOpenChange={setShowLocationPicker}
        onLocationSelect={(location) => {
          setCustomLocation(location);
          setShowLocationPicker(false);
        }}
      />
    </div>
  );
};

export default ProviderRegister;
