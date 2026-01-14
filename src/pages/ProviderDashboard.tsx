import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  LogOut,
  ArrowRight,
  Coffee,
  Clock,
  CheckCircle,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const ProviderDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Check if user has service_provider role
  const { data: hasProviderRole, isLoading: roleLoading } = useQuery({
    queryKey: ['provider-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['service_provider', 'admin'])
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/provider-login');
      } else if (!hasProviderRole) {
        toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
        navigate('/provider-login');
      }
    }
  }, [user, authLoading, roleLoading, hasProviderRole, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/provider-login');
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background p-4" dir="rtl">
        <div className="container mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-16 rounded-lg" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="الحي" className="h-10 w-10 rounded-xl" />
            <div>
              <span className="text-xl font-bold text-primary">لوحة التحكم</span>
              <p className="text-xs text-muted-foreground">مقدم الخدمة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="font-arabic">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">مرحباً بك! 👋</h1>
          <p className="text-muted-foreground">إدارة متجرك وطلباتك من مكان واحد</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">طلبات اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">قيد التحضير</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0 ر.س</p>
                  <p className="text-xs text-muted-foreground">إيرادات اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                <Coffee className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-arabic">إدارة المنتجات</CardTitle>
              <CardDescription className="font-arabic">
                أضف وعدّل منتجاتك وأسعارك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full font-arabic">
                عرض المنتجات
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="font-arabic">الطلبات</CardTitle>
              <CardDescription className="font-arabic">
                تابع وأدِر طلبات العملاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full font-arabic">
                عرض الطلبات
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-2">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle className="font-arabic">إعدادات المتجر</CardTitle>
              <CardDescription className="font-arabic">
                تخصيص متجرك وبياناتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full font-arabic">
                الإعدادات
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-muted/50">
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">قريباً!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              نعمل على تطوير لوحة تحكم كاملة لمقدمي الخدمات. ستتمكن قريباً من إدارة منتجاتك وطلباتك وتتبع إيراداتك.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProviderDashboard;
