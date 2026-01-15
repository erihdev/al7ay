import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, Store, Mail, Lock, User, Loader2 } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

const ProviderLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerEmail || !registerPassword || !registerFullName || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);

    try {
      // Check if this email has an approved application
      const { data: application, error: appError } = await supabase
        .from('service_provider_applications')
        .select('*')
        .eq('email', registerEmail)
        .eq('status', 'approved')
        .maybeSingle();

      if (appError) throw appError;

      if (!application) {
        toast.error('لم يتم العثور على طلب مقبول بهذا البريد الإلكتروني. يرجى التأكد من قبول طلبك أولاً.');
        setIsLoading(false);
        return;
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: window.location.origin + '/provider-login',
          data: {
            full_name: registerFullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Add service_provider role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'service_provider'
          });

        if (roleError) {
          console.error('Error adding role:', roleError);
        }

        // Create provider profile from application data
        const { error: providerError } = await supabase
          .from('service_providers')
          .insert({
            user_id: data.user.id,
            application_id: application.id,
            business_name: application.business_name,
            email: application.email,
            phone: application.phone,
            is_active: true,
            is_verified: false
          });

        if (providerError) {
          console.error('Error creating provider profile:', providerError);
        }
      }

      toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      
      // Reset form
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterFullName('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-arabic flex flex-col" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
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
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-arabic">بوابة مقدمي الخدمات</CardTitle>
            <CardDescription className="font-arabic">
              سجّل دخولك أو أنشئ حسابك الجديد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="font-arabic">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register" className="font-arabic">حساب جديد</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="font-arabic">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="font-arabic">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-arabic" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                    <p className="text-amber-800 dark:text-amber-200 font-arabic">
                      ⚠️ يجب أن يكون طلب انضمامك مقبولاً مسبقاً لتتمكن من إنشاء حساب
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="font-arabic">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        value={registerFullName}
                        onChange={(e) => setRegisterFullName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="pr-10 font-arabic"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="font-arabic">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="نفس البريد في طلب الانضمام"
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="font-arabic">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="font-arabic">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="أعد إدخال كلمة المرور"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-arabic" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      'إنشاء الحساب'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground font-arabic">
                ليس لديك طلب مقبول؟{' '}
                <Link to="/#apply" className="text-primary hover:underline">
                  قدّم طلب انضمام
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© 2024 منصة الحي. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};

export default ProviderLogin;
