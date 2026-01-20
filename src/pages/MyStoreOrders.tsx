import { useState, useEffect } from 'react';
import { useMyProviderOrders, ProviderOrder } from '@/hooks/useProviderOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerAimtellTag } from '@/hooks/useAimtellTags';
import { useAutoNotificationPermission } from '@/hooks/useAutoNotificationPermission';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthForm } from '@/components/auth/AuthForm';
import { StoreNavigationMap } from '@/components/store/StoreNavigationMap';
import { ProviderOrderTrackingMap } from '@/components/store/ProviderOrderTrackingMap';
import { PullUpStyleOrderCard } from '@/components/store/PullUpStyleOrderCard';
import ProviderReviewDialog from '@/components/reviews/ProviderReviewDialog';
import { 
  Package, 
  Clock, 
  MapPin, 
  Store as StoreIcon, 
  Phone,
  ChefHat,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowRight,
  Loader2,
  ShoppingBag,
  Navigation2,
  RefreshCw,
  Star,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: { 
    label: 'قيد الانتظار', 
    icon: Clock, 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  preparing: { 
    label: 'جاري التحضير', 
    icon: ChefHat, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  ready: { 
    label: 'جاهز للاستلام', 
    icon: CheckCircle2, 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  out_for_delivery: { 
    label: 'في الطريق', 
    icon: Truck, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  completed: { 
    label: 'مكتمل', 
    icon: CheckCircle2, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  cancelled: { 
    label: 'ملغي', 
    icon: XCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  }
};

const statusSteps = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];

const MyStoreOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: orders, isLoading, refetch } = useMyProviderOrders();
  const navigate = useNavigate();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showMapForOrder, setShowMapForOrder] = useState<string | null>(null);
  const [defaultStoreLocation, setDefaultStoreLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Register Aimtell tag for customer push notifications
  useCustomerAimtellTag(user?.id);
  
  // Auto-request notification permission
  useAutoNotificationPermission();

  // Fetch default store settings for fallback location
  useEffect(() => {
    const fetchStoreSettings = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('store_location_lat, store_location_lng')
        .single();
      
      if (data) {
        setDefaultStoreLocation({
          lat: data.store_location_lat,
          lng: data.store_location_lng
        });
      }
    };
    fetchStoreSettings();
  }, []);

  // Set up realtime subscription for order updates
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('my-provider-orders-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'provider_orders',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          const order = payload.new as ProviderOrder;
          const status = statusConfig[order.status];
          
          // Play notification sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleA0AYIHPxalxGQBAlNK8l2UAAEmT06J5DQBEm9WtiycASZfUpH0RAEiY0qaGHQBKl9CjhB4ASJXPoYQeAEiU0KCEHwBJlNCghB8ASZPP');
          audio.volume = 0.5;
          audio.play().catch(() => {});
          
          toast.success(`تحديث الطلب`, {
            description: `حالة طلبك الآن: ${status?.label || order.status}`,
            duration: 5000,
          });
          
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const getStatusIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    return statusSteps.indexOf(status);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 font-arabic" dir="rtl">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">طلباتي من المتاجر</h1>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-semibold">سجل الدخول لعرض طلباتك</h2>
              <p className="text-sm text-muted-foreground">
                يمكنك تتبع جميع طلباتك من المتاجر بعد تسجيل الدخول
              </p>
              <AuthForm />
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 font-arabic" dir="rtl">
        <div className="max-w-md mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  const activeOrders = orders?.filter(o => !['completed', 'cancelled'].includes(o.status)) || [];
  const completedOrders = orders?.filter(o => ['completed', 'cancelled'].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-background pb-20 font-arabic" dir="rtl">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-base sm:text-xl font-bold flex-1">طلباتي من المتاجر</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => window.location.reload()}
            title="تحديث الصفحة"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {orders?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">لا توجد طلبات</h2>
              <p className="text-sm text-muted-foreground">
                لم تقم بأي طلبات من المتاجر بعد
              </p>
              <Button onClick={() => navigate('/')} className="mt-4">
                تصفح المتاجر
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm sm:text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  الطلبات النشطة ({activeOrders.length})
                </h2>
                
                <div className="space-y-3">
                  {activeOrders.map((order) => {
                    // Priority: 1) store_lat/lng 2) active_neighborhoods 3) defaultStoreLocation
                    const provider = order.service_providers;
                    const storeLocation = 
                      (provider?.store_lat && provider?.store_lng)
                        ? { lat: provider.store_lat, lng: provider.store_lng }
                        : (provider?.active_neighborhoods?.lat)
                          ? { lat: provider.active_neighborhoods.lat, lng: provider.active_neighborhoods.lng || 0 }
                          : defaultStoreLocation || { lat: 24.7136, lng: 46.6753 };
                    
                    return (
                      <PullUpStyleOrderCard
                        key={order.id}
                        order={order}
                        storeLocation={storeLocation}
                        onDetailsClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm sm:text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  الطلبات السابقة ({completedOrders.length})
                </h2>
                
                {completedOrders.slice(0, 5).map((order, index) => {
                  const status = statusConfig[order.status] || statusConfig.completed;
                  const StatusIcon = status.icon;
                  const isCompleted = order.status === 'completed';
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                        <CardContent className="p-2.5 sm:p-4">
                          <div className="flex items-center gap-2">
                            {order.service_providers?.logo_url ? (
                              <img 
                                src={order.service_providers.logo_url} 
                                alt={order.service_providers.business_name}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover grayscale"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center">
                                <StoreIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-xs sm:text-sm truncate">{order.service_providers?.business_name || 'متجر'}</h3>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ar })}
                              </p>
                            </div>
                            <div className="text-left shrink-0">
                              <Badge variant="secondary" className={`${status.color} text-[10px] sm:text-xs px-1.5 py-0.5`}>
                                <StatusIcon className="h-2.5 w-2.5 ml-0.5" />
                                {status.label}
                              </Badge>
                              <p className="text-xs sm:text-sm font-semibold mt-0.5">{order.total_amount} ر.س</p>
                            </div>
                          </div>
                          
                          {/* Review Button for Completed Orders */}
                          {isCompleted && order.service_providers && (
                            <div className="mt-3 pt-3 border-t flex items-center justify-between">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                شاركنا رأيك في تجربتك
                              </p>
                              <ProviderReviewDialog 
                                providerId={order.service_providers.id}
                                providerName={order.service_providers.business_name}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 rounded-full"
                                  >
                                    <Star className="h-3 w-3" />
                                    قيّم المتجر
                                  </Button>
                                }
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default MyStoreOrders;
