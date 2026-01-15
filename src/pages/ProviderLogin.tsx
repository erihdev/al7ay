import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, Store, Mail, Lock, Loader2, UserPlus, LogIn, KeyRound, UserCheck } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

const ProviderLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');

  // Check URL params for signup action
  useEffect(() => {
    const action = searchParams.get('action');
    const emailParam = searchParams.get('email');
    
    if (action === 'signup') {
      setMode('signup');
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has service_provider role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'service_provider')
        .maybeSingle();

      if (roles) {
        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/provider-dashboard');
      } else {
        // Check if they are admin
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (adminRole) {
          toast.success('تم تسجيل الدخول بنجاح');
          navigate('/admin');
        } else {
          toast.error('هذا الحساب غير مسجل كمقدم خدمة');
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/provider-login',
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
      setMode('login');
      setPassword('');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الحساب');
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
        redirectTo: `${window.location.origin}/provider-login`,
      });

      if (error) throw error;

      toast.success('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
      setMode('login');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إرسال رابط الاستعادة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 font-arabic flex flex-col" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMDA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <AnimatedLogo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" size="sm" className="font-arabic">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <motion.div 
                className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-primary/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {mode === 'signup' ? (
                  <UserCheck className="h-10 w-10 text-primary" />
                ) : mode === 'forgot' ? (
                  <KeyRound className="h-10 w-10 text-primary" />
                ) : (
                  <Store className="h-10 w-10 text-primary" />
                )}
              </motion.div>
              <CardTitle className="text-2xl font-arabic">
                {mode === 'signup' ? 'إنشاء حساب مقدم خدمة' : mode === 'forgot' ? 'استعادة كلمة المرور' : 'بوابة مقدمي الخدمات'}
              </CardTitle>
              <CardDescription className="font-arabic">
                {mode === 'signup' 
                  ? 'أنشئ حسابك للوصول إلى لوحة التحكم'
                  : mode === 'forgot'
                    ? 'أدخل بريدك الإلكتروني لاستعادة كلمة المرور'
                    : 'سجّل دخولك للوصول إلى لوحة التحكم'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Login Form */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-arabic">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="font-arabic">كلمة المرور</Label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-primary hover:underline font-arabic"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-arabic h-11" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 ml-2" />
                        تسجيل الدخول
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Signup Form */}
              {mode === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="font-arabic">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      className="font-arabic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="font-arabic">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="font-arabic">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-arabic h-11" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 ml-2" />
                        إنشاء الحساب
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-sm text-primary hover:underline font-arabic"
                  >
                    لديك حساب بالفعل؟ سجّل دخولك
                  </button>
                </form>
              )}

              {/* Forgot Password Form */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="font-arabic">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-arabic h-11" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4 ml-2" />
                        إرسال رابط الاستعادة
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-sm text-primary hover:underline font-arabic"
                  >
                    العودة لتسجيل الدخول
                  </button>
                </form>
              )}

              {/* Divider - only show for login mode */}
              {mode === 'login' && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground font-arabic">
                        أو
                      </span>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="space-y-3">
                    <Link to="/#provider-form" className="block">
                      <Button variant="outline" className="w-full font-arabic h-11 gap-2">
                        <UserPlus className="h-4 w-4" />
                        قدّم طلب انضمام
                      </Button>
                    </Link>
                    
                    <p className="text-xs text-center text-muted-foreground font-arabic">
                      إذا لم يكن لديك حساب، قدّم طلب انضمام وسيتم إنشاء حسابك بعد الموافقة
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-muted-foreground">
        <p>© 2024 منصة الحي. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};

export default ProviderLogin;
