import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, ArrowLeft, ArrowRight, KeyRound, Phone, Car, Camera, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

// Car brands and models data
const carBrands: Record<string, string[]> = {
  'تويوتا': ['كامري', 'كورولا', 'لاند كروزر', 'برادو', 'هايلكس', 'يارس', 'افالون', 'فورتشنر', 'راف فور', 'هايلاندر'],
  'هوندا': ['اكورد', 'سيفيك', 'سي آر في', 'بايلوت', 'اتش آر في'],
  'نيسان': ['التيما', 'باترول', 'صني', 'اكس تريل', 'مكسيما', 'باثفايندر', 'سنترا'],
  'هيونداي': ['سوناتا', 'النترا', 'توسان', 'سانتافي', 'اكسنت', 'كريتا', 'كونا'],
  'كيا': ['اوبتيما', 'سبورتاج', 'سورينتو', 'سيراتو', 'كارنيفال', 'سيلتوس'],
  'شيفروليه': ['ماليبو', 'تاهو', 'سيلفرادو', 'ترافيرس', 'كابتيفا', 'ايكوينوكس'],
  'فورد': ['توروس', 'اكسبلورر', 'اكسبيديشن', 'فيوجن', 'ايدج', 'اف 150'],
  'مرسيدس': ['S-Class', 'E-Class', 'C-Class', 'GLE', 'GLC', 'A-Class', 'GLA'],
  'بي ام دبليو': ['الفئة الثالثة', 'الفئة الخامسة', 'الفئة السابعة', 'X3', 'X5', 'X7'],
  'لكزس': ['ES', 'LS', 'RX', 'LX', 'NX', 'GX', 'IS'],
  'جي ام سي': ['يوكن', 'سييرا', 'اكاديا', 'تيرين'],
  'جيب': ['شيروكي', 'جراند شيروكي', 'رانجلر', 'كومباس'],
  'مازدا': ['مازدا 3', 'مازدا 6', 'CX-5', 'CX-9', 'CX-30'],
  'ميتسوبيشي': ['باجيرو', 'مونتيرو', 'لانسر', 'اوتلاندر', 'اكليبس كروس'],
  // السيارات الصينية
  'شانجان': ['CS35', 'CS55', 'CS75', 'CS85', 'CS95', 'ايدو', 'يونيت', 'هنتر'],
  'جيلي': ['امجراند', 'كولراي', 'ازكارا', 'توجيلا', 'مونجارو', 'ستاري'],
  'شيري': ['تيجو 2', 'تيجو 4', 'تيجو 7', 'تيجو 8', 'اريزو 5', 'اريزو 6'],
  'هافال': ['H6', 'H9', 'جوليان', 'داراجو', 'جولي'],
  'ام جي': ['5', '6', 'ZS', 'HS', 'RX5', 'RX8', 'GT'],
  'جاك': ['S2', 'S3', 'S4', 'S7', 'JS4', 'JS6'],
  'بي واي دي': ['F3', 'سونج', 'تانج', 'هان', 'سيل', 'دولفين', 'اتو 3'],
  'جريت وول': ['وينجل', 'باور', 'بوير'],
  'فاو': ['X40', 'X80', 'بيسترن T77'],
  'دونغ فينغ': ['AX7', 'T5', 'ريتش'],
  'زوتي': ['T300', 'T500', 'T600', 'T700'],
  'فوتون': ['تونلاند', 'ساب'],
  'أخرى': ['موديل آخر'],
};

const carYears = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

type AuthMode = 'login' | 'signup' | 'forgot-password';

interface AuthFormProps {
  redirectTo?: string;
}

export function AuthForm({ redirectTo = '/app' }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState(1); // 1: basic info, 2: vehicle info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin and redirect to /admin, otherwise to redirectTo
  const checkRoleAndNavigate = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { navigate(redirectTo); return; }
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .maybeSingle();
      navigate(adminRole ? '/admin' : redirectTo);
    } catch {
      navigate(redirectTo);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, avatarFile, { upsert: true });

    if (error) {
      console.error('Avatar upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && step === 1) {
      // Move to step 2 for vehicle info
      setStep(2);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        // Wait a bit for the user to be created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Upload avatar if provided
          const avatarUrl = await uploadAvatar(user.id);

          // Update profile with additional info
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              phone,
              vehicle_brand: vehicleBrand,
              vehicle_model: vehicleModel,
              vehicle_color: vehicleColor,
              vehicle_plate: vehiclePlate,
              vehicle_year: vehicleYear,
            })
            .eq('user_id', user.id);

          if (profileError) {
            console.error('Profile update error:', profileError);
          }
        }

        toast.success('تم إنشاء الحساب بنجاح!');
        navigate(redirectTo);
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('تم تسجيل الدخول بنجاح!');
        await checkRoleAndNavigate();
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ ما');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile?reset=true`,
      });
      if (error) throw error;
      toast.success('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
      setMode('login');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في إرسال رابط الاستعادة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في تسجيل الدخول بـ Google');
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في تسجيل الدخول بـ Apple');
      setIsAppleLoading(false);
    }
  };

  const getHeaderConfig = () => {
    switch (mode) {
      case 'signup':
        return {
          gradient: 'from-green-500 to-emerald-400',
          icon: step === 1 ? <User className="h-8 w-8" /> : <Car className="h-8 w-8" />,
          title: step === 1 ? 'انضم إلينا' : 'معلومات السيارة',
          subtitle: step === 1 ? 'أنشئ حسابك واستمتع بالمميزات' : 'أضف معلومات سيارتك للتوصيل',
        };
      case 'forgot-password':
        return {
          gradient: 'from-amber-500 to-orange-400',
          icon: <KeyRound className="h-8 w-8" />,
          title: 'استعادة كلمة المرور',
          subtitle: 'سنرسل لك رابط لإعادة تعيين كلمة المرور',
        };
      default:
        return {
          gradient: 'from-primary to-primary/80',
          icon: <Lock className="h-8 w-8" />,
          title: 'مرحباً بعودتك!',
          subtitle: 'سجل دخولك للاستمتاع بالتطبيق',
        };
    }
  };

  const headerConfig = getHeaderConfig();

  const goBack = () => {
    if (mode === 'signup' && step === 2) {
      setStep(1);
    } else {
      setMode('login');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto border-0 shadow-xl overflow-hidden">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${headerConfig.gradient} p-6 text-white`}>
          <motion.div
            key={`${mode}-${step}`}
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              {headerConfig.icon}
            </div>
            <h2 className="text-2xl font-bold">{headerConfig.title}</h2>
            <p className="text-white/80 text-sm mt-1">{headerConfig.subtitle}</p>

            {/* Step indicator for signup */}
            {mode === 'signup' && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className={`w-8 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`w-8 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
              </div>
            )}
          </motion.div>
        </div>

        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {mode === 'forgot-password' ? (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="font-arabic flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      dir="ltr"
                      className="rounded-xl h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-arabic h-12 text-base rounded-xl gap-2 shadow-lg bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        إرسال رابط الاستعادة
                        <Mail className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-sm text-muted-foreground hover:text-primary font-arabic transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <ArrowRight className="h-4 w-4" />
                    العودة لتسجيل الدخول
                  </button>
                </form>
              </motion.div>
            ) : mode === 'signup' && step === 2 ? (
              <motion.div
                key="signup-step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Avatar Upload */}
                  <div className="flex justify-center mb-4">
                    <label htmlFor="avatar" className="cursor-pointer">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary transition-colors">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Camera className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-center text-sm text-muted-foreground -mt-2 mb-4">اضغط لإضافة صورتك</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="font-arabic flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        ماركة السيارة
                      </Label>
                      <Select
                        value={vehicleBrand}
                        onValueChange={(value) => {
                          setVehicleBrand(value);
                          setVehicleModel(''); // Reset model when brand changes
                        }}
                      >
                        <SelectTrigger className="rounded-xl h-11 font-arabic">
                          <SelectValue placeholder="اختر الماركة" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50 max-h-60">
                          {Object.keys(carBrands).map((brand) => (
                            <SelectItem key={brand} value={brand} className="font-arabic">
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-arabic flex items-center gap-2 text-sm">
                        الموديل
                      </Label>
                      <Select
                        value={vehicleModel}
                        onValueChange={setVehicleModel}
                        disabled={!vehicleBrand}
                      >
                        <SelectTrigger className="rounded-xl h-11 font-arabic">
                          <SelectValue placeholder="اختر الموديل" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50 max-h-60">
                          {vehicleBrand && carBrands[vehicleBrand]?.map((model) => (
                            <SelectItem key={model} value={model} className="font-arabic">
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleColor" className="font-arabic flex items-center gap-2 text-sm">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        اللون
                      </Label>
                      <Input
                        id="vehicleColor"
                        type="text"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        placeholder="أبيض"
                        className="font-arabic text-right rounded-xl h-11"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-arabic flex items-center gap-2 text-sm">
                        السنة
                      </Label>
                      <Select value={vehicleYear} onValueChange={setVehicleYear}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="اختر السنة" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50 max-h-60">
                          {carYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehiclePlate" className="font-arabic flex items-center gap-2">
                      رقم اللوحة
                    </Label>
                    <Input
                      id="vehiclePlate"
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="أ ب ج 1234"
                      className="font-arabic text-center rounded-xl h-12 text-lg"
                      dir="rtl"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 font-arabic h-12 rounded-xl"
                      onClick={goBack}
                    >
                      <ArrowRight className="h-4 w-4 ml-2" />
                      رجوع
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 font-arabic h-12 text-base rounded-xl gap-2 shadow-lg bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          إنشاء حساب
                          <ArrowLeft className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Google Login Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 mb-3 rounded-xl gap-3 font-arabic text-base border-2 hover:bg-muted/50 transition-all"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isAppleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {mode === 'login' ? 'تسجيل الدخول بـ Google' : 'التسجيل بـ Google'}
                    </>
                  )}
                </Button>

                {/* Apple Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 mb-4 rounded-xl gap-3 font-arabic text-base border-2 hover:bg-muted/50 transition-all bg-black text-white hover:bg-gray-800 hover:text-white"
                  onClick={handleAppleLogin}
                  disabled={isAppleLoading || isGoogleLoading}
                >
                  {isAppleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      {mode === 'login' ? 'تسجيل الدخول بـ Apple' : 'التسجيل بـ Apple'}
                    </>
                  )}
                </Button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">أو</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="font-arabic flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          الاسم الكامل
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="أدخل اسمك"
                          required
                          className="font-arabic text-right rounded-xl h-12"
                          dir="rtl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-arabic flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          رقم الجوال
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05xxxxxxxx"
                          required
                          className="rounded-xl h-12"
                          dir="ltr"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-arabic flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      dir="ltr"
                      className="rounded-xl h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="font-arabic flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        كلمة المرور
                      </Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-xs text-primary hover:underline font-arabic"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      dir="ltr"
                      className="rounded-xl h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-arabic h-12 text-base rounded-xl gap-2 shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' ? 'تسجيل الدخول' : 'التالي'}
                        <ArrowLeft className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setStep(1);
                    }}
                    className="text-sm text-primary hover:underline font-arabic font-semibold transition-colors"
                  >
                    {mode === 'login'
                      ? '✨ ليس لديك حساب؟ سجل الآن'
                      : '🔑 لديك حساب بالفعل؟ سجل دخولك'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}