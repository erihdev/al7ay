import { useEffect, useState } from 'react';
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
  RefreshCw,
  Loader2
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

type LoadingState = 'loading' | 'no-session' | 'no-provider' | 'ready' | 'error';

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [state, setState] = useState<LoadingState>('loading');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useProviderOrderNotifications(provider?.id, soundEnabled);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const load = async () => {
      console.log('[Dashboard] Starting load...');
      
      // Set a maximum timeout of 8 seconds
      timeoutId = setTimeout(() => {
        if (!cancelled && state === 'loading') {
          console.log('[Dashboard] Timeout reached - forcing error state');
          setErrorMessage('انتهت المهلة - الاتصال بطيء');
          setState('error');
        }
      }, 8000);

      try {
        // 1. Check session
        console.log('[Dashboard] Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[Dashboard] Session result:', session?.user?.id, sessionError);
        
        if (sessionError) {
          console.error('[Dashboard] Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session?.user) {
          console.log('[Dashboard] No session - redirecting');
          if (!cancelled) setState('no-session');
          return;
        }

        // 2. Get provider
        console.log('[Dashboard] Getting provider for user:', session.user.id);
        const { data: providerData, error: providerError } = await supabase
          .from('service_providers')
          .select('id, business_name, logo_url')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('[Dashboard] Provider result:', providerData, providerError);

        if (providerError) throw providerError;
        
        if (!providerData) {
          console.log('[Dashboard] No provider found');
          if (!cancelled) setState('no-provider');
          return;
        }

        // 3. Get products and orders (don't fail if these fail)
        console.log('[Dashboard] Getting products and orders...');
        const [productsRes, ordersRes] = await Promise.all([
          supabase.from('provider_products').select('id, is_available, is_featured').eq('provider_id', providerData.id),
          supabase.from('provider_orders').select('id, status, total_amount, created_at').eq('provider_id', providerData.id).order('created_at', { ascending: false })
        ]);

        console.log('[Dashboard] Products:', productsRes.data?.length, 'Orders:', ordersRes.data?.length);

        if (!cancelled) {
          clearTimeout(timeoutId);
          setProvider(providerData);
          setProducts(productsRes.data || []);
          setOrders(ordersRes.data || []);
          setState('ready');
          console.log('[Dashboard] Ready!');
        }
      } catch (err: any) {
        console.error('[Dashboard] Error:', err);
        clearTimeout(timeoutId);
        if (!cancelled) {
          setErrorMessage(err.message || 'حدث خطأ');
          setState('error');
        }
      }
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Dashboard] Auth state change:', event, session?.user?.id);
      if (event === 'SIGNED_OUT') {
        window.location.href = '/provider-login';
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    window.location.href = '/provider-login';
  };

  // Loading
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // No session - redirect
  if (state === 'no-session') {
    window.location.href = '/provider-login';
    return null;
  }

  // Error
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No provider profile
  if (state === 'no-provider') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">حسابك قيد الإعداد</h2>
            <p className="text-muted-foreground mb-4">يقوم فريقنا بتجهيز متجرك.</p>
            <Button variant="outline" onClick={handleLogout}>
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready - show dashboard
  if (!provider) return null;

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const completedToday = todayOrders.filter(o => o.status === 'completed').length;
  const todayRevenue = todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0);

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
            <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? 'إيقاف الصوت' : 'تفعيل الصوت'}>
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="overview"><TrendingUp className="h-4 w-4 ml-2" />نظرة عامة</TabsTrigger>
            <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 ml-2" />الإحصائيات</TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingBag className="h-4 w-4 ml-2" />الطلبات
              {pendingOrders > 0 && <span className="mr-2 bg-red-500 text-white text-xs rounded-full px-2">{pendingOrders}</span>}
            </TabsTrigger>
            <TabsTrigger value="products"><Coffee className="h-4 w-4 ml-2" />المنتجات</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 ml-2" />الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Coffee className="h-5 w-5" />المنتجات</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">إجمالي المنتجات</span><span className="font-bold">{products.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">منتجات متاحة</span><span className="font-bold text-green-600">{products.filter(p => p.is_available).length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">منتجات مميزة</span><span className="font-bold text-yellow-600">{products.filter(p => p.is_featured).length}</span></div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('products')}>إدارة المنتجات</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><ShoppingBag className="h-5 w-5" />الطلبات</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الطلبات</span><span className="font-bold">{orders.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">طلبات جديدة</span><span className="font-bold text-yellow-600">{pendingOrders}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">قيد التحضير</span><span className="font-bold text-blue-600">{preparingOrders}</span></div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('orders')}>عرض الطلبات</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <ProviderStats orders={orders as any} products={products as any} />
          </TabsContent>

          <TabsContent value="orders">
            <ProviderOrdersManager providerId={provider.id} />
          </TabsContent>

          <TabsContent value="products">
            <ProviderProductsManager providerId={provider.id} />
          </TabsContent>

          <TabsContent value="settings">
            <ProviderSettingsManager provider={provider as any} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
