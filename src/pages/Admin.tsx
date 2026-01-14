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
import { Switch } from '@/components/ui/switch';
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
  Coffee,
  Navigation,
  MapPin,
  Volume2,
  VolumeX,
  BarChart3,
  Ticket
} from 'lucide-react';
import { ProductList } from '@/components/admin/ProductList';
import { CouponManager } from '@/components/admin/CouponManager';
import { SalesReports } from '@/components/admin/SalesReports';
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

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateLocation } = useUpdateDeliveryLocation();
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Enable audio notifications for new orders
  const { playNotificationSound } = useOrderNotifications(isAdmin && soundEnabled);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

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
    mutationFn: async ({ orderId, status, customerId }: { orderId: string; status: OrderStatus; customerId: string | null }) => {
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
          // Don't fail the order update if notification fails
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

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-32 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <header className="bg-card border-b border-border p-4">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders" className="font-arabic">
              <Package className="h-4 w-4 ml-2" />
              الطلبات
            </TabsTrigger>
            <TabsTrigger value="products" className="font-arabic">
              <Coffee className="h-4 w-4 ml-2" />
              المنتجات
            </TabsTrigger>
            <TabsTrigger value="coupons" className="font-arabic">
              <Ticket className="h-4 w-4 ml-2" />
              الكوبونات
            </TabsTrigger>
            <TabsTrigger value="reports" className="font-arabic">
              <BarChart3 className="h-4 w-4 ml-2" />
              التقارير
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-arabic">
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

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

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductList />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <CouponManager />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <SalesReports />
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
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
