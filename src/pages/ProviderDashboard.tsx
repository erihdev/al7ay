import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useProviderProfile, useProviderProducts, useProviderOrders } from '@/hooks/useProviderData';
import { useAutoFixProviderRole } from '@/hooks/useAutoFixProviderRole';
import { useProviderOrderNotifications } from '@/hooks/useProviderOrderNotifications';
import ProviderProductsManager from '@/components/provider/ProviderProductsManager';
import ProviderOrdersManager from '@/components/provider/ProviderOrdersManager';
import ProviderSettingsManager from '@/components/provider/ProviderSettingsManager';
import ProviderStats from '@/components/provider/ProviderStats';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  LogOut,
  Coffee,
  Clock,
  CheckCircle,
  Settings,
  AlertCircle,
  Volume2,
  VolumeX,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

const ProviderDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Check if user has service_provider role and auto-fix if needed
  const { hasRole: hasProviderRole, hasProfile, isLoading: roleLoading, checkComplete } = useAutoFixProviderRole();

  const { data: provider, isLoading: providerLoading } = useProviderProfile();
  const { data: products } = useProviderProducts(provider?.id);
  const { data: orders } = useProviderOrders(provider?.id);

  // Enable real-time order notifications
  useProviderOrderNotifications(provider?.id, soundEnabled);

  useEffect(() => {
    // Only redirect after all checks are complete
    if (!authLoading && checkComplete) {
      if (!user) {
        // Use window.location for more reliable redirect on mobile
        window.location.href = '/provider-login';
      } else if (!hasProviderRole && !hasProfile) {
        // Only redirect if user has neither role nor profile
        toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
        window.location.href = '/provider-login';
      }
    }
  }, [user, authLoading, checkComplete, hasProviderRole, hasProfile]);

  const handleLogout = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/provider-login');
  };

  if (authLoading || roleLoading || providerLoading) {
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

  // If no provider profile exists, show setup message
  if (!provider) {
    return (
      <div className="min-h-screen bg-background font-arabic flex flex-col" dir="rtl">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <AnimatedLogo size="md" showText={true} />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="font-arabic">
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">حسابك قيد الإعداد</h2>
              <p className="text-muted-foreground mb-4">
                يقوم فريقنا بتجهيز متجرك. سيتم إعلامك عند اكتمال الإعداد.
              </p>
              <Button variant="outline" onClick={handleLogout} className="font-arabic">
                تسجيل الخروج
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const todayOrders = orders?.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  }) || [];

  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
  const preparingOrders = orders?.filter(o => o.status === 'preparing').length || 0;
  const completedToday = todayOrders.filter(o => o.status === 'completed').length;
  const todayRevenue = todayOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {provider.logo_url ? (
              <img src={provider.logo_url} alt={provider.business_name} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <AnimatedLogo size="md" showText={false} />
            )}
            <div>
              <span className="text-xl font-bold text-primary">{provider.business_name}</span>
              <p className="text-xs text-muted-foreground">لوحة التحكم</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <div className="flex items-center gap-2 px-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'إيقاف صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="font-arabic">
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="font-arabic">
              <TrendingUp className="h-4 w-4 ml-2" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="stats" className="font-arabic">
              <BarChart3 className="h-4 w-4 ml-2" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="orders" className="font-arabic">
              <ShoppingBag className="h-4 w-4 ml-2" />
              الطلبات
              {pendingOrders > 0 && (
                <span className="mr-2 bg-red-500 text-white text-xs rounded-full px-2">
                  {pendingOrders}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="font-arabic">
              <Coffee className="h-4 w-4 ml-2" />
              المنتجات
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-arabic">
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{todayOrders.length}</p>
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
                      <p className="text-2xl font-bold">{pendingOrders + preparingOrders}</p>
                      <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
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
                      <p className="text-2xl font-bold">{completedToday}</p>
                      <p className="text-xs text-muted-foreground">مكتملة اليوم</p>
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
                      <p className="text-2xl font-bold">{todayRevenue} ر.س</p>
                      <p className="text-xs text-muted-foreground">إيرادات اليوم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    المنتجات
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">إجمالي المنتجات</span>
                      <span className="font-bold">{products?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">منتجات متاحة</span>
                      <span className="font-bold text-green-600">
                        {products?.filter(p => p.is_available).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">منتجات مميزة</span>
                      <span className="font-bold text-yellow-600">
                        {products?.filter(p => p.is_featured).length || 0}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 font-arabic"
                    onClick={() => setActiveTab('products')}
                  >
                    إدارة المنتجات
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    الطلبات
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">إجمالي الطلبات</span>
                      <span className="font-bold">{orders?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">طلبات جديدة</span>
                      <span className="font-bold text-yellow-600">{pendingOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">قيد التحضير</span>
                      <span className="font-bold text-blue-600">{preparingOrders}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 font-arabic"
                    onClick={() => setActiveTab('orders')}
                  >
                    عرض الطلبات
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <ProviderStats 
              orders={orders || []} 
              products={products || []} 
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <ProviderOrdersManager providerId={provider.id} />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProviderProductsManager providerId={provider.id} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <ProviderSettingsManager provider={provider} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
