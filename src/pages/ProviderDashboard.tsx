import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useProviderOrderNotifications } from '@/hooks/useProviderOrderNotifications';
import ProviderProductsManager from '@/components/provider/ProviderProductsManager';
import ProviderOrdersManager from '@/components/provider/ProviderOrdersManager';
import ProviderSettingsManager from '@/components/provider/ProviderSettingsManager';
import ProviderStats from '@/components/provider/ProviderStats';
import { 
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
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

interface Provider {
  id: string;
  business_name: string;
  logo_url: string | null;
}

interface ProviderOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface ProviderProduct {
  id: string;
  is_available: boolean;
  is_featured: boolean;
}

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Simplified state management
  const [isLoading, setIsLoading] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Enable real-time order notifications
  useProviderOrderNotifications(provider?.id, soundEnabled);

  // Single effect to handle all initialization with retry logic
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeDashboard = async (): Promise<void> => {
      try {
        console.log('ProviderDashboard: Starting initialization... (attempt ' + (retryCount + 1) + ')');
        
        // Step 1: Get current session directly from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('فشل في التحقق من الجلسة');
        }
        
        if (!session?.user) {
          console.log('No session found, redirecting to login');
          if (isMounted) {
            window.location.href = '/provider-login';
          }
          return;
        }
        
        console.log('ProviderDashboard: User found:', session.user.id);
        
        // Step 2: Get provider profile
        const { data: providerData, error: providerError } = await supabase
          .from('service_providers')
          .select('id, business_name, logo_url')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (providerError) {
          console.error('Provider error:', providerError);
          throw new Error('فشل في تحميل بيانات المتجر');
        }
        
        if (!providerData) {
          console.log('No provider profile found');
          if (isMounted) {
            setProvider(null);
            setIsLoading(false);
          }
          return;
        }
        
        console.log('ProviderDashboard: Provider found:', providerData.id);
        
        // Step 3: Load products and orders in parallel
        const [productsResult, ordersResult] = await Promise.all([
          supabase
            .from('provider_products')
            .select('id, is_available, is_featured')
            .eq('provider_id', providerData.id),
          supabase
            .from('provider_orders')
            .select('id, status, total_amount, created_at')
            .eq('provider_id', providerData.id)
            .order('created_at', { ascending: false })
        ]);
        
        if (isMounted) {
          setProvider(providerData);
          setProducts(productsResult.data || []);
          setOrders(ordersResult.data || []);
          setIsLoading(false);
          setError(null);
          console.log('ProviderDashboard: Initialization complete');
        }
        
      } catch (err: any) {
        console.error('Dashboard initialization error:', err);
        
        // Check if it's an abort error and we can retry
        const isAbortError = err.message?.includes('aborted') || 
                            err.message?.includes('The operation was aborted') ||
                            err.name === 'AbortError' ||
                            err.message?.includes('Failed to fetch');
        
        if (isAbortError && retryCount < maxRetries && isMounted) {
          retryCount++;
          console.log(`Retrying... attempt ${retryCount + 1}`);
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return initializeDashboard();
        }
        
        if (isMounted) {
          setError(err.message || 'حدث خطأ غير متوقع');
          setIsLoading(false);
        }
      }
    };
    
    initializeDashboard();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        window.location.href = '/provider-login';
      }
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/provider-login', { replace: true });
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    window.location.reload();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="text-center space-y-4">
          <AnimatedLogo size="lg" showText={false} />
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-arabic">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} className="font-arabic">
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة المحاولة
                </Button>
                <Button variant="outline" onClick={handleLogout} className="font-arabic">
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // No provider profile state
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

  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
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
                      <span className="font-bold">{products.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">منتجات متاحة</span>
                      <span className="font-bold text-green-600">
                        {products.filter(p => p.is_available).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">منتجات مميزة</span>
                      <span className="font-bold text-yellow-600">
                        {products.filter(p => p.is_featured).length}
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
                      <span className="font-bold">{orders.length}</span>
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
              orders={orders as any} 
              products={products as any} 
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
            <ProviderSettingsManager provider={provider as any} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
