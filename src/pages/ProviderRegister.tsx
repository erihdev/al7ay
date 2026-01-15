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
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [step, setStep] = useState<'plan' | 'info' | 'payment'>('plan');
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
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
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (!error && data) {
        setPlans(data.map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) 
            ? (plan.features as unknown as string[]) 
            : []
        })));
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
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">اختر خطة الاشتراك</h1>
              <p className="text-muted-foreground">ابدأ مجاناً أو اختر خطة تناسب احتياجاتك</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    plan.is_trial ? 'border-green-500 ring-2 ring-green-500/20' : ''
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <CardContent className="p-6">
                    {plan.is_trial && (
                      <Badge className="bg-green-500 mb-4">
                        <Gift className="h-3 w-3 ml-1" />
                        مجاني لمدة {plan.duration_days} أيام
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      {plan.is_trial ? (
                        <Gift className="h-6 w-6 text-green-500" />
                      ) : (
                        <CreditCard className="h-6 w-6 text-primary" />
                      )}
                      <h3 className="text-xl font-bold">{plan.name_ar}</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description_ar}
                    </p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? 'مجاني' : plan.price}
                      </span>
                      {plan.price > 0 && (
                        <>
                          <span className="text-lg">ر.س</span>
                          <span className="text-muted-foreground">/ {plan.duration_days === 30 ? 'شهر' : plan.duration_days === 365 ? 'سنة' : `${plan.duration_days} يوم`}</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button className="w-full" variant={plan.is_trial ? 'default' : 'outline'}>
                      {plan.is_trial ? 'ابدأ مجاناً' : 'اختر الخطة'}
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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

        {/* Step 3: Payment (if applicable) */}
        {step === 'payment' && selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <Card>
              <CardContent className="p-8">
                <CreditCard className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">إتمام الدفع</h2>
                <p className="text-muted-foreground mb-6">
                  سيتم توجيهك لإتمام الدفع عبر بوابة الدفع الآمنة
                </p>
                <div className="p-4 bg-muted rounded-lg mb-6">
                  <div className="flex justify-between mb-2">
                    <span>الخطة:</span>
                    <span className="font-bold">{selectedPlan.name_ar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ:</span>
                    <span className="font-bold text-lg">{selectedPlan.price} ر.س</span>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 ml-2" />
                  الدفع الآن
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full mt-2"
                  onClick={() => navigate('/provider-dashboard')}
                >
                  الدفع لاحقاً (ابدأ بالتجربة المجانية)
                </Button>
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
