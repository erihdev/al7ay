import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationPickerDialog } from '@/components/landing/LocationPickerDialog';
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
  X,
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Feature tooltips mapping
const featureTooltips: Record<string, string> = {
  'لوحة تحكم كاملة': 'تحكم بجميع جوانب متجرك من مكان واحد - الطلبات، المنتجات، والإحصائيات',
  'إشعارات الطلبات': 'احصل على تنبيهات فورية عند وصول طلبات جديدة عبر الموقع والجوال',
  'متجر خاص': 'صفحة متجر مخصصة لعرض منتجاتك بشعارك وهويتك التجارية',
  'تقارير متقدمة': 'تحليلات مفصلة للمبيعات، الأداء، وسلوك العملاء',
  'دعم أولوي': 'خط دعم مباشر مع أولوية في الرد وحل المشكلات',
  'تخصيص الشعار': 'ارفع شعار نشاطك التجاري ليظهر في متجرك',
  'منتجات محدودة': 'عدد المنتجات المسموح إضافتها في الخطة',
  'منتجات غير محدودة': 'أضف عدد لا نهائي من المنتجات لمتجرك',
  '10 منتجات': 'يمكنك إضافة حتى 10 منتجات في هذه الخطة',
  '50 منتج': 'يمكنك إضافة حتى 50 منتج في هذه الخطة',
  'منتجات لا محدودة': 'أضف أي عدد من المنتجات بدون قيود',
};

interface SubscriptionPlan {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  duration_days: number;
  price: number;
  is_trial: boolean;
  features: string[];
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
  const [step, setStep] = useState<'plan' | 'info' | 'payment'>('plan');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [comparePlans, setComparePlans] = useState<SubscriptionPlan[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  
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
    customNeighborhood: ''
  });
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [useCustomNeighborhood, setUseCustomNeighborhood] = useState(false);

  // Toggle plan in compare list
  const toggleCompare = (plan: SubscriptionPlan) => {
    playClickSound();
    setComparePlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) {
        return prev.filter(p => p.id !== plan.id);
      }
      if (prev.length >= 2) {
        toast.info('يمكنك مقارنة خطتين فقط');
        return prev;
      }
      return [...prev, plan];
    });
  };

  // Handle plan selection with sound
  const handlePlanSelectWithSound = (plan: SubscriptionPlan) => {
    playClickSound();
    handleSelectPlan(plan);
  };

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
        
        console.log('Fetched plans:', data, error);
        
        if (!error && data) {
          setPlans(data.map(plan => ({
            ...plan,
            features: Array.isArray(plan.features) 
              ? (plan.features as unknown as string[]) 
              : []
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

  const handleSelectPlan = (plan: SubscriptionPlan) => {
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
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل إنشاء الحساب');

      // 2. Create service provider profile
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

      // If paid plan, go to payment
      if (selectedPlan.price > 0 && !selectedPlan.is_trial) {
        setStep('payment');
        // Here you would integrate with EdfaPay
        toast.success('تم إنشاء الحساب! يرجى إكمال الدفع');
      } else {
        toast.success('تم إنشاء حسابك بنجاح! مرحباً بك في منصة الحي');
        navigate('/provider-dashboard');
      }
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
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <AnimatedLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/provider-login">
                <Button variant="outline" size="sm">
                  لديك حساب؟ سجل دخول
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['plan', 'info', 'payment'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-primary text-primary-foreground' : 
                ['plan', 'info', 'payment'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                'bg-muted text-muted-foreground'
              }`}>
                {['plan', 'info', 'payment'].indexOf(step) > i ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${step === s ? 'font-bold' : 'text-muted-foreground'}`}>
                {s === 'plan' ? 'اختر الخطة' : s === 'info' ? 'معلوماتك' : 'الدفع'}
              </span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Plan */}
        {step === 'plan' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">اختر خطة الاشتراك</h1>
              <p className="text-muted-foreground">ابدأ مجاناً أو اختر خطة تناسب احتياجاتك</p>
            </div>

            {/* Loading State with Shimmer Animation */}
            {isLoadingPlans ? (
              <motion.div 
                className="grid md:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <Card className="p-4 overflow-hidden relative">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <Skeleton className="h-5 w-3/4 mb-3 animate-pulse" />
                      <Skeleton className="h-3 w-full mb-1 animate-pulse" />
                      <Skeleton className="h-3 w-2/3 mb-4 animate-pulse" />
                      <Skeleton className="h-8 w-1/2 mb-4 animate-pulse" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-full animate-pulse" />
                        <Skeleton className="h-3 w-5/6 animate-pulse" />
                      </div>
                      <Skeleton className="h-8 w-full mt-4 animate-pulse" />
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : plans.length === 0 ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-6 w-6 mx-auto mb-3 text-primary" />
                </motion.div>
                <p className="text-muted-foreground text-sm">جاري تحميل الخطط...</p>
              </motion.div>
            ) : (
              /* Plans Cards with Stagger Animation */
              <motion.div 
                className="grid grid-cols-3 gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      ...((!plan.is_trial && index === 1) && {
                        boxShadow: [
                          "0 0 0 0 hsl(var(--primary) / 0)",
                          "0 0 0 4px hsl(var(--primary) / 0.15)",
                          "0 0 0 0 hsl(var(--primary) / 0)"
                        ]
                      })
                    }}
                    transition={{ 
                      delay: index * 0.1, 
                      duration: 0.4,
                      type: "spring",
                      stiffness: 100,
                      boxShadow: {
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut"
                      }
                    }}
                    whileHover={{ 
                      scale: 1.03, 
                      y: -4,
                      transition: { duration: 0.2, type: "spring", stiffness: 300 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    {/* Pulse ring for popular plan */}
                    {!plan.is_trial && index === 1 && (
                      <motion.div
                        className="absolute -inset-0.5 rounded-lg bg-primary/20 -z-10"
                        animate={{
                          scale: [1, 1.01, 1],
                          opacity: [0.4, 0.6, 0.4]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                    
                  <Card 
                    className={`cursor-pointer transition-all duration-300 h-full ${
                      plan.is_trial ? 'border-green-500 ring-1 ring-green-500/20 relative overflow-hidden hover:ring-green-500/40 hover:shadow-md' : 
                      index === 1 ? 'border-primary ring-1 ring-primary/20 relative overflow-hidden hover:ring-primary/40 hover:shadow-md' : 
                      'hover:border-primary/50 hover:shadow-md'
                    } ${comparePlans.find(p => p.id === plan.id) ? 'ring-1 ring-amber-500' : ''}`}
                    onClick={() => handlePlanSelectWithSound(plan)}
                  >
                    {plan.is_trial && (
                      <motion.div 
                        className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold py-1 text-center"
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ backgroundSize: "200% 200%" }}
                      >
                        ✨ ابدأ مجاناً
                      </motion.div>
                    )}
                    {!plan.is_trial && index === 1 && (
                      <motion.div 
                        className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary via-primary/80 to-primary text-primary-foreground text-[10px] font-bold py-1 text-center"
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ backgroundSize: "200% 200%" }}
                      >
                        🔥 الأكثر شعبية
                      </motion.div>
                    )}
                    <CardContent className={`p-3 ${(plan.is_trial || index === 1) ? 'pt-7' : ''}`}>
                      <motion.div 
                        className="flex items-center gap-1.5 mb-1"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {plan.is_trial ? (
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Gift className="h-4 w-4 text-green-500" />
                          </motion.div>
                        ) : (
                          <CreditCard className="h-4 w-4 text-primary" />
                        )}
                        <h3 className="text-sm font-bold">{plan.name_ar}</h3>
                      </motion.div>
                      
                      <p className="text-xs text-muted-foreground mb-2 min-h-[28px] line-clamp-2">
                        {plan.description_ar}
                      </p>

                      <motion.div 
                        className="flex items-baseline gap-0.5 mb-3"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          {plan.price === 0 ? 'مجاني' : plan.price}
                        </span>
                        {plan.price > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">ر.س</span>
                            <span className="text-muted-foreground text-[10px]">/ {plan.duration_days === 30 ? 'شهر' : plan.duration_days === 365 ? 'سنة' : `${plan.duration_days} يوم`}</span>
                          </>
                        )}
                      </motion.div>

                      <ul className="space-y-1.5 mb-3">
                        {plan.features.map((feature, i) => {
                          // Find matching tooltip
                          const tooltipText = Object.entries(featureTooltips).find(
                            ([key]) => feature.includes(key)
                          )?.[1];
                          
                          return (
                            <TooltipProvider key={i} delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.li 
                                    className="flex items-center gap-1.5 text-xs cursor-help group"
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + i * 0.03 }}
                                    whileHover={{ x: 3, transition: { duration: 0.2 } }}
                                  >
                                    <motion.div 
                                      className="h-3.5 w-3.5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0"
                                      whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--primary) / 0.2)" }}
                                    >
                                      <Check className="h-2 w-2 text-green-500" />
                                    </motion.div>
                                    <span className="flex-1 line-clamp-1">{feature}</span>
                                    {tooltipText && (
                                      <Info className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                  </motion.li>
                                </TooltipTrigger>
                                {tooltipText && (
                                  <TooltipContent 
                                    side="top" 
                                    className="max-w-[200px] text-center bg-popover/95 backdrop-blur-sm"
                                  >
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <p className="text-[10px]">{tooltipText}</p>
                                    </motion.div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </ul>

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className="w-full text-xs h-8" 
                          variant={plan.is_trial || index === 1 ? 'default' : 'outline'}
                          size="sm"
                        >
                          {plan.is_trial ? 'ابدأ مجاناً' : 'اختر الخطة'}
                          <motion.span
                            animate={{ x: [0, 2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                          </motion.span>
                        </Button>
                      </motion.div>
                      
                      {/* Compare Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-1 text-[10px] h-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(plan);
                        }}
                      >
                        <ArrowLeftRight className="h-2.5 w-2.5 ml-1" />
                        {comparePlans.find(p => p.id === plan.id) ? 'إزالة من المقارنة' : 'أضف للمقارنة'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </motion.div>
            )}

            {/* Floating Compare Button */}
            <AnimatePresence>
              {comparePlans.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
                >
                  <Button
                    onClick={() => {
                      playClickSound();
                      setShowCompareModal(true);
                    }}
                    className="shadow-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-full"
                    size="lg"
                  >
                    <ArrowLeftRight className="h-5 w-5 ml-2" />
                    قارن الخطط ({comparePlans.length})
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compare Modal */}
            <AnimatePresence>
              {showCompareModal && comparePlans.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowCompareModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-primary" />
                        مقارنة الخطط
                      </h2>
                      <Button variant="ghost" size="icon" onClick={() => setShowCompareModal(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="p-4">
                      {/* Plan Headers */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="font-bold text-muted-foreground">المميزات</div>
                        {comparePlans.map(plan => (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                          >
                            <div className="font-bold text-lg">{plan.name_ar}</div>
                            <Badge variant={plan.is_trial ? 'default' : 'secondary'} className={plan.is_trial ? 'bg-green-500' : ''}>
                              {plan.price === 0 ? 'مجاني' : `${plan.price} ر.س`}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>

                      {/* Comparison Rows */}
                      <div className="space-y-3">
                        {[
                          { label: '📦 عدد المنتجات', tooltip: 'عدد المنتجات المسموح إضافتها في خطتك', getValue: (idx: number) => idx === 0 ? '10' : idx === 1 ? '50' : 'غير محدود', bestIdx: 2 },
                          { label: '📊 لوحة التحكم', tooltip: 'تحكم بجميع جوانب متجرك من مكان واحد', getValue: () => '✓', bestIdx: -1 },
                          { label: '📱 إشعارات الطلبات', tooltip: 'تنبيهات فورية عند وصول طلبات جديدة', getValue: () => '✓', bestIdx: -1 },
                          { label: '🏪 متجر خاص', tooltip: 'صفحة متجر مخصصة بشعارك وهويتك', getValue: (idx: number) => idx === 0 ? '✗' : '✓', bestIdx: 1 },
                          { label: '📈 تقارير متقدمة', tooltip: 'تحليلات مفصلة للمبيعات والأداء', getValue: (idx: number) => idx < 2 ? '✗' : '✓', bestIdx: 2 },
                          { label: '🎨 تخصيص الشعار', tooltip: 'ارفع شعار نشاطك التجاري', getValue: (idx: number) => idx === 0 ? '✗' : '✓', bestIdx: 1 },
                          { label: '💬 دعم أولوي', tooltip: 'خط دعم مباشر مع أولوية في الرد', getValue: (idx: number) => idx < 2 ? '✗' : '✓', bestIdx: 2 },
                        ].map((row, rowIdx) => (
                          <motion.div
                            key={rowIdx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: rowIdx * 0.05 }}
                            className="grid grid-cols-3 gap-4 py-3 border-b last:border-0 hover:bg-muted/30 rounded-lg px-2 transition-colors"
                          >
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="font-medium flex items-center gap-1.5 cursor-help group">
                                    <span>{row.label}</span>
                                    <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent 
                                  side="top" 
                                  className="max-w-[220px] text-center"
                                  asChild
                                >
                                  <motion.div
                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                  >
                                    <p className="text-xs">{row.tooltip}</p>
                                  </motion.div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {comparePlans.map((plan) => {
                              const planIndex = plans.findIndex(p => p.id === plan.id);
                              const value = row.getValue(planIndex);
                              const isBest = row.bestIdx !== -1 && planIndex >= row.bestIdx;
                              return (
                                <div key={plan.id} className={`text-center relative ${isBest ? 'py-1' : ''}`}>
                                  {isBest && (
                                    <motion.div
                                      className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-lg -z-10"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: rowIdx * 0.05 + 0.2 }}
                                    />
                                  )}
                                  {value === '✓' ? (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: rowIdx * 0.05 + 0.1 }}
                                      className="flex items-center justify-center gap-1"
                                    >
                                      <Check className={`h-5 w-5 ${isBest ? 'text-primary' : 'text-green-500'} mx-auto`} />
                                      {isBest && (
                                        <motion.span
                                          initial={{ opacity: 0, x: -5 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          className="text-[10px] text-primary font-bold"
                                        >
                                          الأفضل
                                        </motion.span>
                                      )}
                                    </motion.div>
                                  ) : value === '✗' ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <span className={`font-bold ${isBest ? 'text-primary' : 'text-foreground'}`}>{value}</span>
                                      {isBest && (
                                        <motion.span
                                          initial={{ opacity: 0, scale: 0 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold"
                                        >
                                          ⭐
                                        </motion.span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </motion.div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                        {comparePlans.map(plan => (
                          <motion.div key={plan.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              className="w-full"
                              variant={plan.is_trial ? 'default' : 'outline'}
                              onClick={() => {
                                playClickSound();
                                setShowCompareModal(false);
                                handleSelectPlan(plan);
                              }}
                            >
                              اختر {plan.name_ar}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Features Comparison Table */}
            {plans.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="text-center flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      مقارنة تفصيلية للخطط
                    </CardTitle>
                    <CardDescription className="text-center">
                      اطلع على جميع المميزات المتاحة في كل خطة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-right p-4 font-bold min-w-[200px]">المميزات</th>
                            {plans.map((plan) => (
                              <th key={plan.id} className="p-4 text-center min-w-[150px]">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-bold text-lg">{plan.name_ar}</span>
                                  <Badge variant={plan.is_trial ? 'default' : 'secondary'} className={plan.is_trial ? 'bg-green-500' : ''}>
                                    {plan.price === 0 ? 'مجاني' : `${plan.price} ر.س`}
                                  </Badge>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Common Features Comparison with Tooltips */}
                          {[
                            { label: '📦 عدد المنتجات', tooltip: 'عدد المنتجات المسموح إضافتها في خطتك', getValue: (idx: number) => idx === 0 ? '10' : idx === 1 ? '50' : 'غير محدود', type: 'value', bestIdx: 2 },
                            { label: '📊 لوحة التحكم', tooltip: 'تحكم بجميع جوانب متجرك من مكان واحد - الطلبات، المنتجات، والإحصائيات', getValue: () => true, type: 'check', bestIdx: -1 },
                            { label: '📱 إشعارات الطلبات', tooltip: 'احصل على تنبيهات فورية عند وصول طلبات جديدة عبر الموقع والجوال', getValue: () => true, type: 'check', bestIdx: -1 },
                            { label: '🏪 متجر خاص', tooltip: 'صفحة متجر مخصصة لعرض منتجاتك بشعارك وهويتك التجارية', getValue: (idx: number) => idx > 0, type: 'check', bestIdx: 1 },
                            { label: '📈 تقارير متقدمة', tooltip: 'تحليلات مفصلة للمبيعات، الأداء، وسلوك العملاء', getValue: (idx: number) => idx >= 2, type: 'check', bestIdx: 2 },
                            { label: '🎨 تخصيص المتجر', tooltip: 'خصص ألوان وتصميم متجرك ليتناسب مع هويتك', getValue: (idx: number) => idx >= 2, type: 'check', bestIdx: 2 },
                            { label: '💬 دعم فني', tooltip: 'فريق دعم متخصص لمساعدتك في أي وقت', getValue: (idx: number) => idx === 0 ? 'أساسي' : idx === 1 ? 'بريد إلكتروني' : 'أولوية 24/7', type: 'value', bestIdx: 2 },
                            { label: '🏷️ كوبونات خصم', tooltip: 'أنشئ كوبونات خصم لعملائك لزيادة المبيعات', getValue: (idx: number) => idx > 0, type: 'check', bestIdx: 1 },
                            { label: '📍 عرض في الخريطة', tooltip: 'يظهر متجرك على خريطة المنطقة ليجدك العملاء بسهولة', getValue: () => true, type: 'check', bestIdx: -1 },
                          ].map((row, rowIdx) => (
                            <tr key={rowIdx} className={`${rowIdx < 8 ? 'border-b' : ''} hover:bg-muted/20 transition-colors`}>
                              <td className="p-4 font-medium">
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1.5 cursor-help group">
                                        {row.label}
                                        <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="top" 
                                      className="max-w-[250px] text-center"
                                      asChild
                                    >
                                      <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                      >
                                        <p className="text-xs">{row.tooltip}</p>
                                      </motion.div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                              {plans.map((plan, idx) => {
                                const value = row.getValue(idx);
                                const isBest = row.bestIdx !== -1 && idx === row.bestIdx;
                                return (
                                  <td key={plan.id} className={`p-4 text-center relative ${isBest ? 'bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5' : ''}`}>
                                    {row.type === 'check' ? (
                                      value ? (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: rowIdx * 0.03 }}
                                          className="flex items-center justify-center gap-1"
                                        >
                                          <Check className={`h-5 w-5 ${isBest ? 'text-primary' : 'text-green-500'}`} />
                                          {isBest && (
                                            <motion.span
                                              initial={{ opacity: 0, scale: 0 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              transition={{ delay: rowIdx * 0.03 + 0.1 }}
                                              className="text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded font-bold"
                                            >
                                              الأفضل
                                            </motion.span>
                                          )}
                                        </motion.div>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )
                                    ) : (
                                      <div className="flex items-center justify-center gap-1">
                                        <span className={isBest ? 'text-primary font-bold' : 'font-bold text-foreground'}>
                                          {value}
                                        </span>
                                        {isBest && (
                                          <motion.span
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: rowIdx * 0.03 + 0.1 }}
                                            className="text-xs"
                                          >
                                            ⭐
                                          </motion.span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/50">
                            <td className="p-4"></td>
                            {plans.map((plan) => (
                              <td key={plan.id} className="p-4 text-center">
                                <Button 
                                  onClick={() => handleSelectPlan(plan)}
                                  variant={plan.is_trial ? 'default' : 'outline'}
                                  className="w-full"
                                >
                                  {plan.is_trial ? 'ابدأ مجاناً' : 'اختر الخطة'}
                                </Button>
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-500" />
                  هل التجربة المجانية ملزمة؟
                </h3>
                <p className="text-muted-foreground text-sm">
                  لا، يمكنك إلغاء اشتراكك في أي وقت خلال فترة التجربة المجانية دون أي رسوم.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  ما هي طرق الدفع المتاحة؟
                </h3>
                <p className="text-muted-foreground text-sm">
                  نقبل الدفع عبر البطاقات الائتمانية (فيزا، ماستركارد) وأبل باي ومدى.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  هل يمكنني ترقية خطتي لاحقاً؟
                </h3>
                <p className="text-muted-foreground text-sm">
                  نعم، يمكنك الترقية في أي وقت وستحصل على خصم نسبي عن المدة المتبقية في خطتك الحالية.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  هل يمكنني العمل في أكثر من حي؟
                </h3>
                <p className="text-muted-foreground text-sm">
                  نعم، الخطط المدفوعة تتيح لك إضافة أكثر من موقع وتوسيع نطاق خدماتك.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Registration Form */}
        {step === 'info' && selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {selectedPlan.is_trial ? (
                      <><Gift className="h-3 w-3 ml-1" />تجربة مجانية</>
                    ) : (
                      <>{selectedPlan.name_ar}</>
                    )}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setStep('plan')}>
                    تغيير
                  </Button>
                </div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  أنشئ حسابك
                </CardTitle>
                <CardDescription>
                  أدخل معلوماتك لإنشاء حساب مقدم خدمة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل *</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pr-10"
                        placeholder="أحمد محمد"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pr-10"
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pr-10"
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور *</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pr-10"
                        placeholder="••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="pr-10"
                        placeholder="••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">اسم النشاط التجاري *</Label>
                  <div className="relative">
                    <Store className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="pr-10"
                      placeholder="مثال: مقهى الحي"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المدينة *</Label>
                    {useCustomCity ? (
                      <div className="space-y-2">
                        <Input
                          value={formData.customCity}
                          onChange={(e) => setFormData({ ...formData, customCity: e.target.value })}
                          placeholder="أدخل اسم المدينة"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
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
                  <div className="space-y-2">
                    <Label>الحي *</Label>
                    {useCustomNeighborhood ? (
                      <div className="space-y-2">
                        <Input
                          value={formData.customNeighborhood}
                          onChange={(e) => setFormData({ ...formData, customNeighborhood: e.target.value })}
                          placeholder="أدخل اسم الحي"
                        />
                        <div className="flex gap-2">
                          {!useCustomCity && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setUseCustomNeighborhood(false)}
                            >
                              اختر من القائمة
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLocationPicker(true)}
                          >
                            <MapPin className="h-3 w-3 ml-1" />
                            حدد الموقع
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
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <MapPin className="h-4 w-4 inline ml-1" />
                    {customLocation.address}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('plan')}
                  >
                    رجوع
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'جاري التسجيل...' : selectedPlan.price > 0 ? 'متابعة للدفع' : 'إنشاء الحساب'}
                    <Sparkles className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Payment / Success */}
        {step === 'payment' && selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-8 text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="h-10 w-10" />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  تم التسجيل بنجاح! 🎉
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90"
                >
                  مرحباً بك في منصة الحي
                </motion.p>
              </div>

              <CardContent className="p-6 space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formData.businessName}</p>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-muted-foreground">الخطة:</span>
                    <span className="font-medium">{selectedPlan.name_ar}</span>
                  </div>
                  {selectedPlan.is_trial && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">الفترة:</span>
                      <Badge variant="secondary" className="text-xs">
                        <Gift className="h-3 w-3 ml-1" />
                        {selectedPlan.duration_days} يوم مجاناً
                      </Badge>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Button 
                    className="w-full font-arabic" 
                    size="lg"
                    onClick={() => navigate('/provider-login')}
                  >
                    تسجيل الدخول الآن
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full font-arabic" 
                    onClick={() => navigate('/provider-dashboard')}
                  >
                    الذهاب للوحة التحكم مباشرة
                  </Button>
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-muted-foreground text-center pt-2"
                >
                  يمكنك الآن إضافة منتجاتك وبدء استقبال الطلبات
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        )}
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
