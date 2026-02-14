import { useForm } from 'react-hook-form';
<parameter name="zodResolver">{zodResolver} from '@hookform/resolvers/zod';
    import {loginSchema, LoginForm} from '@/lib/validations';
    import {Button} from '@/components/ui/button';
    import {Input} from '@/components/ui/input';
    import {Label} from '@/components/ui/label';
    import {Card} from '@/components/ui/card';
    import {Mail, Lock, Loader2} from 'lucide-react';
    import {useState} from 'react';
    import {useToast} from '@/hooks/use-toast';

    /**
     * مكون تسجيل الدخول محسّن
     * يستخدم React Hook Form + Zod للـ validation
     */

    interface LoginFormProps {
        onSuccess ?: () => void;
}

    export function EnhancedLoginForm({onSuccess}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
    const {toast} = useToast();

    const {
        register,
        handleSubmit,
        formState: {errors},
  } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
            setIsLoading(true);
        try {
            // هنا يتم استدعاء API تسجيل الدخول
            console.log('Login data:', data);

      // محاكاة API call
      await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: 'تم تسجيل الدخول',
        description: 'مرحباً بك مرة أخرى!',
      });

        onSuccess?.();
    } catch (error) {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.',
                variant: 'destructive',
            });
    } finally {
            setIsLoading(false);
    }
  };

        return (
        <Card className="p-8 glass-effect max-w-md w-full animate-scale-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gradient-premium mb-2">
                    تسجيل الدخول
                </h2>
                <p className="text-muted-foreground">
                    أدخل بياناتك للوصول إلى حسابك
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        البريد الإلكتروني
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        كلمة المرور
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span>تذكرني</span>
                    </label>
                    <a href="/forgot-password" className="text-primary hover:underline">
                        نسيت كلمة المرور؟
                    </a>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-gradient-accent hover-scale"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري تسجيل الدخول...
                        </>
                    ) : (
                        'تسجيل الدخول'
                    )}
                </Button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-muted-foreground">
                    ليس لديك حساب؟{' '}
                    <a href="/register" className="text-primary hover:underline font-semibold">
                        سجل الآن
                    </a>
                </p>
            </form>
        </Card>
        );
}
