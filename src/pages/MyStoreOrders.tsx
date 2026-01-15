import { useState, useEffect } from 'react';
import { useMyProviderOrders, ProviderOrder } from '@/hooks/useProviderOrders';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthForm } from '@/components/auth/AuthForm';
import { StoreNavigationMap } from '@/components/store/StoreNavigationMap';
import { ProviderOrderTrackingMap } from '@/components/store/ProviderOrderTrackingMap';
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
  Navigation2
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
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">طلباتي من المتاجر</h1>
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
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  الطلبات النشطة ({activeOrders.length})
                </h2>
                
                <AnimatePresence>
                  {activeOrders.map((order, index) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const currentStep = getStatusIndex(order.status);
                    const isExpanded = expandedOrder === order.id;
                    
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <CardContent className="p-4 space-y-4">
                            {/* Provider Info */}
                            <div className="flex items-center gap-3">
                              {order.service_providers?.logo_url ? (
                                <img 
                                  src={order.service_providers.logo_url} 
                                  alt={order.service_providers.business_name}
                                  className="w-12 h-12 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <StoreIcon className="h-6 w-6 text-primary" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold">{order.service_providers?.business_name || 'متجر'}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(order.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                                </p>
                              </div>
                              <Badge className={`${status.bgColor} ${status.color} border-0`}>
                                <StatusIcon className="h-3 w-3 ml-1" />
                                {status.label}
                              </Badge>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center justify-between px-2">
                              {statusSteps.slice(0, order.order_type === 'pickup' ? 3 : 4).map((step, i) => {
                                const stepStatus = statusConfig[step];
                                const StepIcon = stepStatus.icon;
                                const isActive = i <= currentStep;
                                const isCurrent = i === currentStep;
                                
                                return (
                                  <div key={step} className="flex items-center">
                                    <motion.div
                                      initial={false}
                                      animate={{ 
                                        scale: isCurrent ? 1.2 : 1,
                                        backgroundColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                                      }}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                                      }`}
                                    >
                                      <StepIcon className="h-4 w-4" />
                                    </motion.div>
                                    {i < (order.order_type === 'pickup' ? 2 : 3) && (
                                      <div className={`w-8 h-1 mx-1 rounded ${
                                        i < currentStep ? 'bg-primary' : 'bg-muted'
                                      }`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Order Summary */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                {order.provider_order_items?.length || 0} منتجات
                              </span>
                              <span className="font-bold text-primary">
                                {order.total_amount} ر.س
                              </span>
                            </div>

                            {/* Auto-show Delivery Tracking Map for out_for_delivery orders */}
                            {order.order_type === 'delivery' && 
                             order.status === 'out_for_delivery' && 
                             order.delivery_lat && 
                             order.delivery_lng && (
                              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                <ProviderOrderTrackingMap orderId={order.id} />
                              </div>
                            )}

                            {/* Auto-show Navigation Map for pickup orders when ready */}
                            {order.order_type === 'pickup' && 
                             order.status === 'ready' && 
                             order.service_providers?.active_neighborhoods?.lat && 
                             order.service_providers?.active_neighborhoods?.lng && (
                              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                <StoreNavigationMap
                                  storeLocation={{
                                    lat: order.service_providers.active_neighborhoods.lat,
                                    lng: order.service_providers.active_neighborhoods.lng
                                  }}
                                  storeName={order.service_providers.business_name}
                                  storePhone={order.service_providers.phone}
                                />
                              </div>
                            )}

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4 border-t space-y-3">
                                    {/* Order Items */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">المنتجات:</h4>
                                      {order.provider_order_items?.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                                          <span>{item.product_name} × {item.quantity}</span>
                                          <span>{item.total_price} ر.س</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Delivery Info */}
                                    <div className="flex items-center gap-2 text-sm">
                                      {order.order_type === 'delivery' ? (
                                        <>
                                          <MapPin className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">
                                            {order.delivery_address || 'توصيل'}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <StoreIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">استلام من المتجر</span>
                                        </>
                                      )}
                                    </div>

                                    {/* Navigation Map for Pickup Orders */}
                                    {order.order_type === 'pickup' && 
                                     order.service_providers?.active_neighborhoods?.lat && 
                                     order.service_providers?.active_neighborhoods?.lng && (
                                      <div className="space-y-2">
                                        <Button 
                                          variant="default" 
                                          size="sm" 
                                          className="w-full gap-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMapForOrder(showMapForOrder === order.id ? null : order.id);
                                          }}
                                        >
                                          <Navigation2 className="h-4 w-4" />
                                          {showMapForOrder === order.id ? 'إخفاء الخريطة' : 'عرض خريطة الوصول للمتجر'}
                                        </Button>
                                        
                                        <AnimatePresence>
                                          {showMapForOrder === order.id && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <StoreNavigationMap
                                                storeLocation={{
                                                  lat: order.service_providers.active_neighborhoods.lat,
                                                  lng: order.service_providers.active_neighborhoods.lng
                                                }}
                                                storeName={order.service_providers.business_name}
                                                storePhone={order.service_providers.phone}
                                              />
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )}

                                    {/* Contact Provider */}
                                    {order.service_providers?.phone && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.location.href = `tel:${order.service_providers?.phone}`;
                                        }}
                                      >
                                        <Phone className="h-4 w-4 ml-2" />
                                        اتصل بالمتجر
                                      </Button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  الطلبات السابقة ({completedOrders.length})
                </h2>
                
                {completedOrders.slice(0, 5).map((order, index) => {
                  const status = statusConfig[order.status] || statusConfig.completed;
                  const StatusIcon = status.icon;
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {order.service_providers?.logo_url ? (
                              <img 
                                src={order.service_providers.logo_url} 
                                alt={order.service_providers.business_name}
                                className="w-10 h-10 rounded-lg object-cover grayscale"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <StoreIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{order.service_providers?.business_name || 'متجر'}</h3>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ar })}
                              </p>
                            </div>
                            <div className="text-left">
                              <Badge variant="secondary" className={status.color}>
                                <StatusIcon className="h-3 w-3 ml-1" />
                                {status.label}
                              </Badge>
                              <p className="text-sm font-semibold mt-1">{order.total_amount} ر.س</p>
                            </div>
                          </div>
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
