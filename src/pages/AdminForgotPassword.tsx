import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Loader2, 
  Mail, 
  ArrowRight,
  KeyRound,
  CheckCircle
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import logo from '@/assets/logo.png';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin-login`,
      });
      
      if (error) throw error;
      
      setIsEmailSent(true);
      toast.success('تم إرسال رابط استعادة كلمة المرور');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الرابط');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 font-arabic" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMDA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <Link to="/admin-login">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            تسجيل الدخول
          </Button>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg border border-primary/20">
              <img src={logo} alt="الحيّ" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-2xl font-bold mb-2">استعادة كلمة المرور</h1>
            <p className="text-muted-foreground text-sm">
              أدخل بريدك الإلكتروني لاستعادة كلمة المرور
            </p>
          </div>

          {/* Form Card */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {isEmailSent ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">تم إرسال الرابط</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEmailSent(false)}
                    className="mt-2"
                  >
                    إرسال مرة أخرى
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      البريد الإلكتروني
                    </Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                        className="pr-10 h-11"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium gap-2" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        إرسال رابط الاستعادة
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              تذكرت كلمة المرور؟{' '}
              <Link to="/admin-login" className="text-primary hover:underline font-medium">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminForgotPassword;
