import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useProviderOrderNotifications } from '@/hooks/useProviderOrderNotifications';
import ProviderProductsManager from '@/components/provider/ProviderProductsManager';
import KitchenDisplaySystem from '@/components/provider/KitchenDisplaySystem';
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
  Loader2,
  ChefHat,
  DollarSign,
  Store
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface Provider {
  id: string;
  user_id: string;
  application_id: string | null;
  business_name: string;
  business_name_en: string | null;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  email: string;
  neighborhood_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  subscription_status: string | null;
  store_settings: {
    primary_color: string;
    accent_color: string;
  } | null;
  created_at: string;
  updated_at: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [activeTab, setActiveTab] = useState('kitchen');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useProviderOrderNotifications(provider?.id, soundEnabled);

  // Load provider data - simplified direct fetch
  const loadProviderData = async (userId: string, accessToken: string) => {
    console.log('loadProviderData with token for userId:', userId);
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const headers = {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    try {
      // Fetch provider - get all fields needed for settings
      const providerRes = await fetch(
        `${baseUrl}/rest/v1/service_providers?user_id=eq.${userId}&select=*`,
        { headers }
      );
      
      if (!providerRes.ok) {
        console.error('Provider fetch failed:', providerRes.status);
        setError('فشل في تحميل بيانات المتجر');
        setLoading(false);
        return;
      }
      
      const providerData = await providerRes.json();
      console.log('Provider data:', providerData);
      
      if (!providerData || providerData.length === 0) {
        setError('لم يتم العثور على حساب مقدم خدمة');
        setLoading(false);
        return;
      }
      
      const providerInfo = providerData[0];
      
      // Fetch products and orders in parallel
      const [productsRes, ordersRes] = await Promise.all([
        fetch(
          `${baseUrl}/rest/v1/provider_products?provider_id=eq.${providerInfo.id}&select=id,is_available,is_featured`,
          { headers }
        ),
        fetch(
          `${baseUrl}/rest/v1/provider_orders?provider_id=eq.${providerInfo.id}&select=id,status,total_amount,created_at&order=created_at.desc`,
          { headers }
        )
      ]);
      
      const productsData = productsRes.ok ? await productsRes.json() : [];
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      
      console.log('Loaded:', productsData.length, 'products,', ordersData.length, 'orders');
      
      setProvider(providerInfo);
      setProducts(productsData);
      setOrders(ordersData);
      setLoading(false);
    } catch (err) {
      console.error('Load error:', err);
      setError('حدث خطأ أثناء تحميل البيانات');
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      // First try to get session from Supabase client (with short timeout)
      const timeout = setTimeout(() => {
        if (mounted && loading) {
          console.log('Supabase client timeout, trying localStorage...');
          tryLocalStorage();
        }
      }, 3000);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeout);
        
        if (session?.user && session?.access_token) {
          console.log('Got session from Supabase client');
          await loadProviderData(session.user.id, session.access_token);
        } else {
          await tryLocalStorage();
        }
      } catch (e) {
        clearTimeout(timeout);
        console.error('getSession error:', e);
        await tryLocalStorage();
      }
    };
    
    const tryLocalStorage = async () => {
      if (!mounted) return;
      
      const storedSession = localStorage.getItem('sb-hmnpraslunhnuigeetoe-auth-token');
      if (!storedSession) {
        navigate('/provider-login', { replace: true });
        return;
      }
      
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed?.access_token && parsed?.user?.id) {
          console.log('Using token from localStorage');
          await loadProviderData(parsed.user.id, parsed.access_token);
        } else {
          navigate('/provider-login', { replace: true });
        }
      } catch (e) {
        console.error('Parse error:', e);
        navigate('/provider-login', { replace: true });
      }
    };
    
    init();
    
    // Listen for sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        navigate('/provider-login', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadDashboard = async () => {
    if (!provider) return;
    
    setLoading(true);
    setError(null);

    try {
      const [productsRes, ordersRes] = await Promise.all([
        supabase.from('provider_products').select('id, is_available, is_featured').eq('provider_id', provider.id),
        supabase.from('provider_orders').select('id, status, total_amount, created_at').eq('provider_id', provider.id).order('created_at', { ascending: false })
      ]);

      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error('Refresh error:', err);
      toast.error('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    navigate('/provider-login', { replace: true });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-primary/5 via-background to-background flex items-center justify-center" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-bl from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ChefHat className="h-10 w-10 text-white animate-pulse" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
          <p className="text-muted-foreground font-medium">جاري تحميل لوحة التحكم...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-red-50 via-background to-background flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full border-red-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={loadDashboard} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // No provider
  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-amber-50 via-background to-background flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full border-amber-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">لم يتم العثور على متجرك</h2>
            <p className="text-muted-foreground mb-6">يرجى التواصل مع الإدارة لتفعيل حسابك</p>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard calculations
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const completedToday = todayOrders.filter(o => o.status === 'completed').length;
  const todayRevenue = todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-bl from-primary/5 via-background to-background font-arabic" dir="rtl">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {provider.logo_url ? (
                  <img 
                    src={provider.logo_url} 
                    alt={provider.business_name} 
                    className="h-12 w-12 rounded-xl object-cover ring-2 ring-primary/20 shadow-md" 
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-bl from-primary to-primary/80 flex items-center justify-center shadow-md">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{provider.business_name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />
                    متصل
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{todayOrders.length}</p>
                <p className="text-xs text-muted-foreground">طلبات اليوم</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{todayRevenue} <span className="text-sm">ر.س</span></p>
                <p className="text-xs text-muted-foreground">إيرادات اليوم</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant={soundEnabled ? "default" : "outline"} 
                size="icon" 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={soundEnabled ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Modern Tab Navigation */}
          <div className="mb-6">
            <TabsList className="w-full h-auto p-1.5 bg-muted/50 rounded-2xl grid grid-cols-5 gap-1">
              <TabsTrigger 
                value="kitchen" 
                className="rounded-xl data-[state=active]:bg-gradient-to-l data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg py-3 gap-2 transition-all"
              >
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">المطبخ</span>
                {pendingOrders > 0 && (
                  <Badge className="bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center animate-pulse">
                    {pendingOrders}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg py-3 gap-2 transition-all"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">نظرة عامة</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg py-3 gap-2 transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">الإحصائيات</span>
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg py-3 gap-2 transition-all"
              >
                <Coffee className="h-4 w-4" />
                <span className="hidden sm:inline">المنتجات</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg py-3 gap-2 transition-all"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">الإعدادات</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Kitchen Display System - Main Screen */}
          <TabsContent value="kitchen" className="mt-0">
            <KitchenDisplaySystem providerId={provider.id} />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-bl from-blue-500 to-cyan-500 text-white overflow-hidden">
                  <CardContent className="p-5 relative">
                    <div className="relative z-10">
                      <p className="text-blue-100 text-sm font-medium">طلبات اليوم</p>
                      <p className="text-4xl font-bold mt-1">{todayOrders.length}</p>
                    </div>
                    <ShoppingBag className="absolute -left-2 -bottom-2 h-16 w-16 text-white/20" />
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-bl from-amber-500 to-orange-500 text-white overflow-hidden">
                  <CardContent className="p-5 relative">
                    <div className="relative z-10">
                      <p className="text-amber-100 text-sm font-medium">قيد التنفيذ</p>
                      <p className="text-4xl font-bold mt-1">{pendingOrders + preparingOrders}</p>
                    </div>
                    <Clock className="absolute -left-2 -bottom-2 h-16 w-16 text-white/20" />
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-bl from-emerald-500 to-green-500 text-white overflow-hidden">
                  <CardContent className="p-5 relative">
                    <div className="relative z-10">
                      <p className="text-emerald-100 text-sm font-medium">مكتملة اليوم</p>
                      <p className="text-4xl font-bold mt-1">{completedToday}</p>
                    </div>
                    <CheckCircle className="absolute -left-2 -bottom-2 h-16 w-16 text-white/20" />
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-bl from-primary to-primary/80 text-white overflow-hidden">
                  <CardContent className="p-5 relative">
                    <div className="relative z-10">
                      <p className="text-primary-foreground/80 text-sm font-medium">إيرادات اليوم</p>
                      <p className="text-3xl font-bold mt-1">{todayRevenue} <span className="text-lg">ر.س</span></p>
                    </div>
                    <DollarSign className="absolute -left-2 -bottom-2 h-16 w-16 text-white/20" />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Coffee className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">المنتجات</h3>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <span className="text-muted-foreground">إجمالي المنتجات</span>
                      <span className="font-bold text-lg">{products.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                      <span className="text-green-700 dark:text-green-400">منتجات متاحة</span>
                      <span className="font-bold text-lg text-green-700">{products.filter(p => p.is_available).length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                      <span className="text-amber-700 dark:text-amber-400">منتجات مميزة</span>
                      <span className="font-bold text-lg text-amber-700">{products.filter(p => p.is_featured).length}</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => setActiveTab('products')}>
                    إدارة المنتجات
                  </Button>
                </CardContent>
              </Card>

              <Card className="border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg">الطلبات</h3>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <span className="text-muted-foreground">إجمالي الطلبات</span>
                      <span className="font-bold text-lg">{orders.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                      <span className="text-amber-700 dark:text-amber-400">طلبات جديدة</span>
                      <span className="font-bold text-lg text-amber-700">{pendingOrders}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                      <span className="text-blue-700 dark:text-blue-400">قيد التحضير</span>
                      <span className="font-bold text-lg text-blue-700">{preparingOrders}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-l from-amber-500 to-orange-500 hover:opacity-90" onClick={() => setActiveTab('kitchen')}>
                    <ChefHat className="h-4 w-4 ml-2" />
                    فتح شاشة المطبخ
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <ProviderStats orders={orders as any} products={products as any} />
          </TabsContent>

          <TabsContent value="products">
            <ProviderProductsManager providerId={provider.id} />
          </TabsContent>

          <TabsContent value="settings">
            <ProviderSettingsManager 
              provider={provider} 
              onUpdate={(updatedProvider) => setProvider(updatedProvider)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
