import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'signup';

interface AuthFormProps {
  redirectTo?: string;
}

export function AuthForm({ redirectTo = '/app' }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success('تم إنشاء الحساب بنجاح!');
        navigate(redirectTo);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('تم تسجيل الدخول بنجاح!');
        navigate(redirectTo);
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ ما');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في تسجيل الدخول بـ Google');
      setIsGoogleLoading(false);
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
        <div className={`bg-gradient-to-r ${mode === 'login' ? 'from-primary to-primary/80' : 'from-green-500 to-emerald-400'} p-6 text-white`}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              {mode === 'login' ? (
                <Lock className="h-8 w-8" />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <h2 className="text-2xl font-bold">
              {mode === 'login' ? 'مرحباً بعودتك!' : 'انضم إلينا'}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {mode === 'login' ? 'سجل دخولك للاستمتاع بالتطبيق' : 'أنشئ حسابك واستمتع بالمميزات'}
            </p>
          </motion.div>
        </div>

        <CardContent className="p-6">
          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 mb-4 rounded-xl gap-3 font-arabic text-base border-2 hover:bg-muted/50 transition-all"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
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
                className="space-y-2"
              >
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
              <Label htmlFor="password" className="font-arabic flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                كلمة المرور
              </Label>
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
                  {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-primary hover:underline font-arabic font-semibold transition-colors"
            >
              {mode === 'login'
                ? '✨ ليس لديك حساب؟ سجل الآن'
                : '🔑 لديك حساب بالفعل؟ سجل دخولك'}
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
