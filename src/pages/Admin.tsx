import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  Settings, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  ArrowRight,
  Home,
  Navigation,
  MapPin,
  UserPlus,
  Volume2,
  VolumeX,
  BarChart3,
  Ticket,
  CreditCard,
  FileText,
  LogOut,
  Users,
  Rocket,
  Shield,
  ChevronDown,
  Megaphone,
  Building,
  Wallet,
  Cog,
  Lock,
  Receipt,
  Bell
} from 'lucide-react';
import { CouponManager } from '@/components/admin/CouponManager';
import { SalesReports } from '@/components/admin/SalesReports';
import { ProductStats } from '@/components/admin/ProductStats';
import { AdvancedStats } from '@/components/admin/AdvancedStats';
import { OffersManager } from '@/components/admin/OffersManager';
import { ReferralStats } from '@/components/admin/ReferralStats';
import LoyaltySettingsManager from '@/components/admin/LoyaltySettingsManager';
import { PaymentsManager } from '@/components/admin/PaymentsManager';
import ApplicationsManager from '@/components/admin/ApplicationsManager';
import NeighborhoodsManager from '@/components/admin/NeighborhoodsManager';
import { SuggestedNeighborhoodsManager } from '@/components/admin/SuggestedNeighborhoodsManager';
import RegisteredProvidersManager from '@/components/admin/RegisteredProvidersManager';
import { VersionManager } from '@/components/admin/VersionManager';
import { SubscriptionPlansManager } from '@/components/admin/SubscriptionPlansManager';
import { ProviderSubscriptionsManager } from '@/components/admin/ProviderSubscriptionsManager';
import { ProviderVerificationManager } from '@/components/admin/ProviderVerificationManager';
import { ProviderCommissionsManager } from '@/components/admin/ProviderCommissionsManager';
import { ProviderPayoutsManager } from '@/components/admin/ProviderPayoutsManager';
import { EdfaPayVerificationManager } from '@/components/admin/EdfaPayVerificationManager';
import { EdfaPayReports } from '@/components/admin/EdfaPayReports';
import { LoginAttemptsManager } from '@/components/admin/LoginAttemptsManager';
import { EmployeesManager } from '@/components/admin/EmployeesManager';
import { ActivityLogManager } from '@/components/admin/ActivityLogManager';
import { EmployeePerformanceStats } from '@/components/admin/EmployeePerformanceStats';
import { EmployeePointsManager } from '@/components/admin/EmployeePointsManager';
import { ContactSettingsManager } from '@/components/admin/ContactSettingsManager';
import CommissionSettingsManager from '@/components/admin/CommissionSettingsManager';
import { PlatformRevenueManager } from '@/components/admin/PlatformRevenueManager';
import { ProviderContractsManager } from '@/components/admin/ProviderContractsManager';
import EdfaPayFeaturesManager from '@/components/admin/EdfaPayFeaturesManager';
import { PasswordChangeForm } from '@/components/admin/PasswordChangeForm';
import InvoiceSettingsManager from '@/components/admin/InvoiceSettingsManager';
import { CustomersManager } from '@/components/admin/CustomersManager';
import { NotificationsLogManager } from '@/components/admin/NotificationsLogManager';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { useUpdateDeliveryLocation } from '@/hooks/useOrderTracking';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const statusFlow: { status: OrderStatus; label: string; icon: any; color: string }[] = [
  { status: 'pending', label: 'جديد', icon: Clock, color: 'bg-yellow-500' },
  { status: 'preparing', label: 'قيد التحضير', icon: Package, color: 'bg-blue-500' },
  { status: 'ready', label: 'جاهز', icon: CheckCircle, color: 'bg-green-500' },
  { status: 'out_for_delivery', label: 'في الطريق', icon: Truck, color: 'bg-purple-500' },
  { status: 'completed', label: 'مكتمل', icon: CheckCircle, color: 'bg-primary' },
];

// تجميع التبويبات في فئات
const TAB_CATEGORIES = [
  {
    id: 'operations',
    label: 'العمليات',
    icon: Package,
    tabs: [
      { value: 'orders', label: 'الطلبات', icon: Package },
      { value: 'stats', label: 'الإحصائيات', icon: BarChart3 },
      { value: 'reports', label: 'التقارير', icon: BarChart3 },
    ],
  },
  {
    id: 'marketing',
    label: 'التسويق',
    icon: Megaphone,
    tabs: [
      { value: 'offers', label: 'العروض', icon: Ticket },
      { value: 'referrals', label: 'الإحالات', icon: UserPlus },
      { value: 'loyalty-settings', label: 'إعدادات الولاء', icon: Settings },
      { value: 'coupons', label: 'الكوبونات', icon: Ticket },
    ],
  },
  {
    id: 'customers',
    label: 'العملاء',
    icon: Users,
    tabs: [
      { value: 'customers', label: 'جميع العملاء', icon: Users },
      { value: 'notifications', label: 'الإشعارات', icon: Bell },
    ],
  },
  {
    id: 'providers',
    label: 'مقدمو الخدمات',
    icon: Building,
    tabs: [
      { value: 'applications', label: 'طلبات الانضمام', icon: FileText },
      { value: 'registered-providers', label: 'المزودين المسجلين', icon: Users },
      { value: 'provider-verification', label: 'التوثيق', icon: Shield },
      { value: 'provider-contracts', label: 'العقود', icon: FileText },
      { value: 'neighborhoods', label: 'الأحياء', icon: MapPin },
      { value: 'suggested-neighborhoods', label: 'اقتراحات الأحياء', icon: MapPin },
    ],
  },
  {
    id: 'finance',
    label: 'المالية',
    icon: Wallet,
    tabs: [
      { value: 'platform-revenue', label: 'إيرادات المنصة', icon: Wallet },
      { value: 'payments', label: 'المدفوعات', icon: CreditCard },
      { value: 'subscriptions', label: 'الاشتراكات', icon: CreditCard },
      { value: 'commissions', label: 'العمولات', icon: CreditCard },
      { value: 'payouts', label: 'التحويلات', icon: CreditCard },
      { value: 'edfapay-verification', label: 'ربط EdfaPay', icon: CreditCard },
      { value: 'edfapay-reports', label: 'تقارير EdfaPay', icon: BarChart3 },
      { value: 'edfapay-features', label: 'ميزات EdfaPay', icon: Settings },
    ],
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: Cog,
    tabs: [
      { value: 'employees', label: 'الموظفين', icon: Users },
      { value: 'employee-performance', label: 'أداء الموظفين', icon: BarChart3 },
      { value: 'employee-points', label: 'نقاط الموظفين', icon: UserPlus },
      { value: 'activity-log', label: 'سجل النشاطات', icon: FileText },
      { value: 'invoice-settings', label: 'إعدادات الفاتورة', icon: Receipt },
      { value: 'contact-settings', label: 'معلومات التواصل', icon: MapPin },
      { value: 'commission-settings', label: 'إعدادات العمولة', icon: CreditCard },
      { value: 'password-change', label: 'تغيير كلمة المرور', icon: Lock },
      { value: 'versions', label: 'الإصدارات', icon: Rocket },
      { value: 'login-attempts', label: 'سجل الدخول', icon: Shield },
      { value: 'settings', label: 'إعدادات المتجر', icon: Settings },
    ],
  },
];

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateLocation } = useUpdateDeliveryLocation();
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [verifiedAdmin, setVerifiedAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [openCategories, setOpenCategories] = useState<string[]>(['operations']);
  
  // Enable audio notifications for new orders
  const { playNotificationSound } = useOrderNotifications(isAdmin && soundEnabled);

  // Verify admin role directly from database
  useEffect(() => {
    const verifyAdminRole = async () => {
      if (!user) {
        setVerifiedAdmin(false);
        return;
      }
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setVerifiedAdmin(!!roles);
    };
    
    if (!authLoading) {
      verifyAdminRole();
    }
  }, [user, authLoading]);

  // Redirect non-admin users
  useEffect(() => {
    if (verifiedAdmin === false) {
      toast.error('غير مصرح لك بالوصول إلى هذه الصفحة');
      navigate('/');
    }
  }, [verifiedAdmin, navigate]);

  // Fetch store settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<typeof settings>) => {
      const { error } = await supabase
        .from('store_settings')
        .update(newSettings)
        .eq('id', settings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('تم تحديث الإعدادات');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التحديث');
    },
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status, customerId, customerEmail, customerName }: { 
      orderId: string; 
      status: OrderStatus; 
      customerId: string | null;
      customerEmail?: string | null;
      customerName?: string;
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;

      // Send push notification to customer
      if (customerId) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: { orderId, status, customerId },
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      // Send email notification for status update
      if (customerEmail && customerName) {
        try {
          await supabase.functions.invoke('send-order-email', {
            body: {
              type: 'status_update',
              orderId,
              customerEmail,
              customerName,
              status,
            },
          });
        } catch (emailError) {
          console.error('Error sending status email:', emailError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('تم تحديث حالة الطلب');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التحديث');
    },
  });

  // Settings form state
  const [storeName, setStoreName] = useState('');
  const [storeLat, setStoreLat] = useState('');
  const [storeLng, setStoreLng] = useState('');
  const [deliveryRadius, setDeliveryRadius] = useState('');
  const [pointsPerOrder, setPointsPerOrder] = useState('');

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setStoreLat(settings.store_location_lat.toString());
      setStoreLng(settings.store_location_lng.toString());
      setDeliveryRadius(settings.delivery_radius_meters.toString());
      setPointsPerOrder(settings.points_per_order.toString());
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings.mutate({
      store_name: storeName,
      store_location_lat: parseFloat(storeLat),
      store_location_lng: parseFloat(storeLng),
      delivery_radius_meters: parseInt(deliveryRadius),
      points_per_order: parseInt(pointsPerOrder),
    });
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const currentIndex = statusFlow.findIndex((s) => s.status === currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1].status;
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Auto-open the category containing this tab
    const category = TAB_CATEGORIES.find((cat) =>
      cat.tabs.some((tab) => tab.value === value)
    );
    if (category && !openCategories.includes(category.id)) {
      setOpenCategories((prev) => [...prev, category.id]);
    }
  };

  if (authLoading || verifiedAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-32 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!verifiedAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
      <InteractiveBackground variant="geometric" intensity="subtle" />
      <header className="bg-card/80 backdrop-blur-sm border-b border-border p-4 relative z-10">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">لوحة التحكم</h1>
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) {
                  playNotificationSound();
                }
              }}
              title={soundEnabled ? 'إيقاف الصوت' : 'تفعيل الصوت'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 ml-2" />
              العودة للمتجر
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={async () => {
                await signOut();
                navigate('/');
                toast.success('تم تسجيل الخروج بنجاح');
              }}
            >
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <Card className="sticky top-6">
              <CardContent className="p-4 space-y-2">
                {TAB_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  const isOpen = openCategories.includes(category.id);
                  const hasActiveTab = category.tabs.some((t) => t.value === activeTab);
                  
                  return (
                    <Collapsible
                      key={category.id}
                      open={isOpen}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div
                          className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${
                            hasActiveTab
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CategoryIcon className="h-5 w-5" />
                            <span className="font-medium">{category.label}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1 mr-4 space-y-1">
                        {category.tabs.map((tab) => {
                          const TabIcon = tab.icon;
                          return (
                            <button
                              key={tab.value}
                              onClick={() => handleTabChange(tab.value)}
                              className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm transition-colors ${
                                activeTab === tab.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <TabIcon className="h-4 w-4" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden w-full mb-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="flex flex-wrap gap-2 h-auto p-2">
                {TAB_CATEGORIES.flatMap((cat) =>
                  cat.tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-1 text-xs px-3 py-2"
                      >
                        <TabIcon className="h-3 w-3" />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              {/* Login Attempts Tab */}
              <TabsContent value="login-attempts">
                <LoginAttemptsManager />
              </TabsContent>

              {/* Employees Tab */}
              <TabsContent value="employees">
                <EmployeesManager />
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customers">
                <CustomersManager />
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <NotificationsLogManager />
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-40" />
                    ))}
                  </div>
                ) : orders?.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      لا توجد طلبات
                    </CardContent>
                  </Card>
                ) : (
                  orders?.map((order) => {
                    const statusInfo = statusFlow.find((s) => s.status === order.status);
                    const StatusIcon = statusInfo?.icon || Clock;
                    const nextStatus = getNextStatus(order.status);

                    return (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.customer_phone}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(order.created_at), 'dd MMM yyyy - hh:mm a', {
                                  locale: ar,
                                })}
                              </p>
                            </div>
                            <div className="text-left">
                              <Badge className={`${statusInfo?.color} text-white`}>
                                <StatusIcon className="h-3 w-3 ml-1" />
                                {statusInfo?.label}
                              </Badge>
                              <p className="font-bold text-lg mt-1">
                                {Number(order.total_amount).toFixed(0)} ر.س
                              </p>
                            </div>
                          </div>

                          <div className="border-t pt-3 mb-3">
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <Badge variant="outline">
                                {order.order_type === 'delivery' ? 'توصيل' : 'استلام'}
                              </Badge>
                              {order.order_type === 'delivery' && order.delivery_address && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {order.delivery_address.slice(0, 30)}...
                                </span>
                              )}
                            </div>
                            {order.order_items?.map((item: any) => (
                              <p key={item.id} className="text-sm text-muted-foreground">
                                {item.product_name} × {item.quantity}
                              </p>
                            ))}
                            {order.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                ملاحظات: {order.notes}
                              </p>
                            )}
                          </div>

                          {/* Live Location Tracking for Delivery Orders */}
                          {order.order_type === 'delivery' && order.status === 'out_for_delivery' && (
                            <div className="mb-3">
                              {trackingOrderId === order.id ? (
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Navigation className="h-4 w-4 text-primary animate-pulse" />
                                    <span className="text-sm font-medium text-primary">
                                      تتبع الموقع نشط
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    يتم تحديث موقعك تلقائياً للعميل
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setTrackingOrderId(null);
                                      toast.info('تم إيقاف تتبع الموقع');
                                    }}
                                  >
                                    إيقاف التتبع
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="w-full"
                                  onClick={() => {
                                    if ('geolocation' in navigator) {
                                      setTrackingOrderId(order.id);
                                      toast.success('تم تفعيل تتبع الموقع');
                                      
                                      // Start tracking
                                      const watchId = navigator.geolocation.watchPosition(
                                        (position) => {
                                          updateLocation(
                                            order.id,
                                            position.coords.latitude,
                                            position.coords.longitude,
                                            position.coords.heading || 0,
                                            (position.coords.speed || 0) * 3.6 // m/s to km/h
                                          );
                                        },
                                        (error) => {
                                          console.error('Geolocation error:', error);
                                          toast.error('خطأ في تحديد الموقع');
                                        },
                                        {
                                          enableHighAccuracy: true,
                                          maximumAge: 5000,
                                          timeout: 10000,
                                        }
                                      );

                                      // Store watchId in sessionStorage to clear later
                                      sessionStorage.setItem(`tracking-${order.id}`, watchId.toString());
                                    } else {
                                      toast.error('الجهاز لا يدعم تحديد الموقع');
                                    }
                                  }}
                                >
                                  <Navigation className="h-4 w-4 ml-2" />
                                  بدء تتبع الموقع
                                </Button>
                              )}
                            </div>
                          )}

                          {nextStatus && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateOrderStatus.mutate({
                                    orderId: order.id,
                                    status: nextStatus,
                                    customerId: order.customer_id,
                                    customerEmail: order.customer_email,
                                    customerName: order.customer_name,
                                  })
                                }
                                disabled={updateOrderStatus.isPending}
                              >
                                <ArrowRight className="h-4 w-4 ml-1" />
                                {statusFlow.find((s) => s.status === nextStatus)?.label}
                              </Button>
                              {order.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    updateOrderStatus.mutate({
                                      orderId: order.id,
                                      status: 'cancelled',
                                      customerId: order.customer_id,
                                      customerEmail: order.customer_email,
                                      customerName: order.customer_name,
                                    })
                                  }
                                  disabled={updateOrderStatus.isPending}
                                >
                                  <XCircle className="h-4 w-4 ml-1" />
                                  إلغاء
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-6">
                <AdvancedStats />
                <ProductStats />
              </TabsContent>

              {/* Offers Tab */}
              <TabsContent value="offers">
                <OffersManager />
              </TabsContent>

              {/* Referrals Tab */}
              <TabsContent value="referrals">
                <ReferralStats />
              </TabsContent>

              {/* Loyalty Settings Tab */}
              <TabsContent value="loyalty-settings">
                <LoyaltySettingsManager />
              </TabsContent>

              {/* Coupons Tab */}
              <TabsContent value="coupons">
                <CouponManager />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports">
                <SalesReports />
              </TabsContent>

              {/* Platform Revenue Tab */}
              <TabsContent value="platform-revenue">
                <PlatformRevenueManager />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>إعدادات المتجر</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="h-12" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="storeName">اسم المتجر</Label>
                          <Input
                            id="storeName"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            dir="rtl"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="storeLat">خط العرض (Latitude)</Label>
                            <Input
                              id="storeLat"
                              value={storeLat}
                              onChange={(e) => setStoreLat(e.target.value)}
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="storeLng">خط الطول (Longitude)</Label>
                            <Input
                              id="storeLng"
                              value={storeLng}
                              onChange={(e) => setStoreLng(e.target.value)}
                              dir="ltr"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="deliveryRadius">نطاق التوصيل (بالمتر)</Label>
                          <Input
                            id="deliveryRadius"
                            type="number"
                            value={deliveryRadius}
                            onChange={(e) => setDeliveryRadius(e.target.value)}
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pointsPerOrder">النقاط لكل طلب</Label>
                          <Input
                            id="pointsPerOrder"
                            type="number"
                            value={pointsPerOrder}
                            onChange={(e) => setPointsPerOrder(e.target.value)}
                            dir="ltr"
                          />
                        </div>

                        <Button
                          onClick={handleSaveSettings}
                          disabled={updateSettings.isPending}
                          className="w-full"
                        >
                          حفظ الإعدادات
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments">
                <PaymentsManager />
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications">
                <ApplicationsManager />
              </TabsContent>

              {/* Registered Providers Tab */}
              <TabsContent value="registered-providers">
                <RegisteredProvidersManager />
              </TabsContent>

              {/* Provider Verification Tab */}
              <TabsContent value="provider-verification">
                <ProviderVerificationManager />
              </TabsContent>

              {/* Provider Contracts Tab */}
              <TabsContent value="provider-contracts">
                <ProviderContractsManager />
              </TabsContent>

              {/* Neighborhoods Tab */}
              <TabsContent value="neighborhoods">
                <NeighborhoodsManager />
              </TabsContent>

              {/* Suggested Neighborhoods Tab */}
              <TabsContent value="suggested-neighborhoods">
                <SuggestedNeighborhoodsManager />
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-6">
                <SubscriptionPlansManager />
                <ProviderSubscriptionsManager />
              </TabsContent>

              {/* Commissions Tab */}
              <TabsContent value="commissions">
                <ProviderCommissionsManager />
              </TabsContent>

              {/* Payouts Tab */}
              <TabsContent value="payouts">
                <ProviderPayoutsManager />
              </TabsContent>

              {/* EdfaPay Verification Tab */}
              <TabsContent value="edfapay-verification">
                <EdfaPayVerificationManager />
              </TabsContent>

              {/* EdfaPay Reports Tab */}
              <TabsContent value="edfapay-reports">
                <EdfaPayReports />
              </TabsContent>

              {/* EdfaPay Features Tab */}
              <TabsContent value="edfapay-features">
                <EdfaPayFeaturesManager />
              </TabsContent>

              {/* Versions Tab */}
              <TabsContent value="versions">
                <VersionManager />
              </TabsContent>

              {/* Employee Performance Tab */}
              <TabsContent value="employee-performance">
                <EmployeePerformanceStats />
              </TabsContent>

              {/* Activity Log Tab */}
              <TabsContent value="activity-log">
                <ActivityLogManager />
              </TabsContent>

              {/* Employee Points Tab */}
              <TabsContent value="employee-points">
                <EmployeePointsManager />
              </TabsContent>

              {/* Invoice Settings Tab */}
              <TabsContent value="invoice-settings">
                <InvoiceSettingsManager />
              </TabsContent>

              {/* Contact Settings Tab */}
              <TabsContent value="contact-settings">
                <ContactSettingsManager />
              </TabsContent>

              {/* Commission Settings Tab */}
              <TabsContent value="commission-settings">
                <CommissionSettingsManager />
              </TabsContent>

              {/* Password Change Tab */}
              <TabsContent value="password-change">
                <PasswordChangeForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
