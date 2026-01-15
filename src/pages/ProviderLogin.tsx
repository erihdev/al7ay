import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, Store, Mail, Lock, Loader2, LogIn, KeyRound } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

const ProviderLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && isMounted) {
        // Check if user is a provider
        const { data: provider } = await supabase
          .from('service_providers')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (provider && isMounted) {
          navigate('/provider-dashboard', { replace: true });
          return;
        }
      }
      
      if (isMounted) {
        setIsInitializing(false);
      }
    };

    initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && isMounted) {
          // Check if user is a provider
          const { data: provider } = await supabase
            .from('service_providers')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (provider && isMounted) {
            navigate('/provider-dashboard', { replace: true });
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else {
          toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
        }
        setIsLoading(false);
        return;
      }

      if (data.session?.user) {
        // Check if user is a provider
        const { data: provider } = await supabase
          .from('service_providers')
          .select('id')
          .eq('user_id', data.session.user.id)
          .maybeSingle();
        
        if (!provider) {
          await supabase.auth.signOut();
          toast.error('هذا الحساب ليس مسجلاً كمقدم خدمة');
          setIsLoading(false);
          return;
        }

        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/provider-dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('حدث خطأ غير متوقع');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/provider-login`,
      });

      if (error) {
        toast.error(error.message || 'حدث خطأ');
      } else {
        toast.success('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
        setShowForgotPassword(false);
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 font-arabic flex flex-col" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <AnimatedLogo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {showForgotPassword ? (
                <KeyRound className="h-8 w-8 text-primary" />
              ) : (
                <Store className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {showForgotPassword ? 'استعادة كلمة المرور' : 'بوابة مقدمي الخدمات'}
            </CardTitle>
            <CardDescription>
              {showForgotPassword 
                ? 'أدخل بريدك الإلكتروني لاستعادة كلمة المرور'
                : 'سجّل دخولك للوصول إلى لوحة التحكم'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
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
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال رابط الاستعادة'
                  )}
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isLoading}
                >
                  العودة لتسجيل الدخول
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="pr-10"
                      dir="ltr"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">كلمة المرور</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                      disabled={isLoading}
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">أو</span>
              </div>
            </div>

            <Link to="/provider-register" className="block">
              <Button variant="outline" className="w-full">
                <Store className="h-4 w-4 ml-2" />
                التسجيل كمقدم خدمة جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        © 2024 منصة الحي. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
};

export default ProviderLogin;
