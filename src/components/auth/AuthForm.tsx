import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">أو</span>
              </div>
            </div>

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
