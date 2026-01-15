import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  Package,
  Phone,
  MapPin,
  User,
  ChefHat,
  Timer,
  Flame,
  Bell,
  ArrowRight,
  ShoppingBag,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Printer,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useProviderOrders, useUpdateProviderOrder, ProviderOrder } from '@/hooks/useProviderOrders';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useProviderOrderNotifications, NotificationSoundType } from '@/hooks/useProviderOrderNotifications';

interface SelectedOption {
  optionName: string;
  valueName: string;
  priceModifier: number;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options?: SelectedOption[] | null;
}

interface KitchenDisplaySystemProps {
  providerId: string;
}

const statusConfig: Record<string, { 
  label: string; 
  icon: any; 
  color: string; 
  bgColor: string;
  borderColor: string;
  gradient: string;
}> = {
  pending: { 
    label: 'جديد', 
    icon: Bell, 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-400',
    gradient: 'from-amber-500 to-orange-500'
  },
  preparing: { 
    label: 'قيد التحضير', 
    icon: ChefHat, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-400',
    gradient: 'from-blue-500 to-cyan-500'
  },
  ready: { 
    label: 'جاهز للاستلام', 
    icon: CheckCircle, 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-400',
    gradient: 'from-emerald-500 to-green-500'
  },
  out_for_delivery: { 
    label: 'في الطريق', 
    icon: Truck, 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    borderColor: 'border-purple-400',
    gradient: 'from-purple-500 to-pink-500'
  },
  completed: { 
    label: 'مكتمل', 
    icon: CheckCircle, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    gradient: 'from-primary to-primary/80'
  },
  cancelled: { 
    label: 'ملغي', 
    icon: XCircle, 
    color: 'text-red-700', 
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    borderColor: 'border-red-400',
    gradient: 'from-red-500 to-rose-500'
  },
};

const statusFlow = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];

const KitchenDisplaySystem = ({ providerId }: KitchenDisplaySystemProps) => {
  const { data: orders, isLoading, refetch } = useProviderOrders(providerId);
  const updateOrderMutation = useUpdateProviderOrder();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playNotificationSound } = useProviderOrderNotifications(providerId, soundEnabled);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Test sound buttons
  const testSound = (type: NotificationSoundType) => {
    playNotificationSound(type);
    toast.info(`تشغيل صوت: ${type === 'delivery' ? 'توصيل' : type === 'pickup' ? 'استلام' : 'عاجل'}`);
  };

  // Fetch order items for all orders
  const orderIds = orders?.map(o => o.id) || [];
  const { data: orderItems } = useQuery({
    queryKey: ['provider-order-items', orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return {};
      const { data, error } = await supabase
        .from('provider_order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (error) throw error;
      
      // Group items by order_id
      const grouped: Record<string, OrderItem[]> = {};
      data?.forEach(item => {
        if (!grouped[item.order_id]) {
          grouped[item.order_id] = [];
        }
        grouped[item.order_id].push({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          selected_options: item.selected_options as unknown as SelectedOption[] | null,
        });
      });
      return grouped;
    },
    enabled: orderIds.length > 0,
  });

  // Track alerted orders to avoid duplicate alerts
  const alertedOrdersRef = useRef<Set<string>>(new Set());
  const DELAY_THRESHOLD_MINUTES = 15;

  // Update time every minute for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto alert for delayed orders
  useEffect(() => {
    if (!soundEnabled || !orders) return;

    const checkDelayedOrders = () => {
      const now = new Date();
      orders.forEach(order => {
        // Only check pending or preparing orders
        if (order.status !== 'pending' && order.status !== 'preparing') return;
        
        const elapsed = (now.getTime() - new Date(order.created_at).getTime()) / 1000 / 60;
        
        // If order exceeds threshold and hasn't been alerted yet
        if (elapsed > DELAY_THRESHOLD_MINUTES && !alertedOrdersRef.current.has(order.id)) {
          alertedOrdersRef.current.add(order.id);
          playNotificationSound('urgent');
          toast.warning(`⚠️ تنبيه تأخير!`, {
            description: `الطلب #${order.id.slice(-4)} متأخر منذ ${Math.round(elapsed)} دقيقة`,
            duration: 15000,
          });
        }
      });
    };

    // Check immediately and then every minute
    checkDelayedOrders();
    const interval = setInterval(checkDelayedOrders, 60000);
    return () => clearInterval(interval);
  }, [orders, soundEnabled, playNotificationSound]);

  // Print order ticket
  const printOrderTicket = useCallback((order: ProviderOrder) => {
    const items = orderItems?.[order.id] || [];
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const orderDate = format(new Date(order.created_at), 'yyyy/MM/dd - HH:mm', { locale: ar });
    const orderTypeLabel = order.order_type === 'delivery' ? 'توصيل' : 'استلام';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تذكرة الطلب #${order.id.slice(-4)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Tajawal', 'Arial', sans-serif; 
            padding: 20px; 
            max-width: 300px; 
            margin: 0 auto;
            font-size: 14px;
          }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 15px; margin-bottom: 15px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header .order-num { font-size: 32px; font-weight: bold; }
          .header .date { color: #666; font-size: 12px; }
          .section { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ccc; }
          .section-title { font-weight: bold; margin-bottom: 8px; font-size: 16px; }
          .customer-info p { margin-bottom: 4px; }
          .items { width: 100%; }
          .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #eee; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; font-weight: bold; }
          .item-price { width: 60px; text-align: left; }
          .item-options { font-size: 11px; color: #666; margin-top: 2px; }
          .total { display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; padding-top: 10px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
          .badge-delivery { background: #E9D5FF; color: #7C3AED; }
          .badge-pickup { background: #DBEAFE; color: #2563EB; }
          .notes { background: #FEF3C7; padding: 10px; border-radius: 8px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍕 تذكرة طلب</h1>
          <div class="order-num">#${order.id.slice(-4)}</div>
          <div class="date">${orderDate}</div>
          <span class="badge ${order.order_type === 'delivery' ? 'badge-delivery' : 'badge-pickup'}">${orderTypeLabel}</span>
        </div>
        
        <div class="section customer-info">
          <div class="section-title">👤 معلومات العميل</div>
          <p><strong>${order.customer_name}</strong></p>
          <p>📞 ${order.customer_phone}</p>
          ${order.delivery_address ? `<p>📍 ${order.delivery_address}</p>` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">🛒 المنتجات</div>
          <div class="items">
            ${items.map(item => `
              <div class="item">
                <span class="item-qty">${item.quantity}x</span>
                <span class="item-name">
                  ${item.product_name}
                  ${item.selected_options?.length ? `<div class="item-options">${item.selected_options.map(o => `${o.optionName}: ${o.valueName}`).join(' | ')}</div>` : ''}
                </span>
                <span class="item-price">${item.total_price} ر.س</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>المجموع</span>
            <span>${order.total_amount} ر.س</span>
          </div>
        </div>
        
        ${order.notes ? `<div class="notes">📝 <strong>ملاحظات:</strong> ${order.notes}</div>` : ''}
        
        <div class="footer">
          <p>شكراً لكم ❤️</p>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [orderItems]);

  const handleStatusChange = async (order: ProviderOrder, newStatus: string) => {
    try {
      await updateOrderMutation.mutateAsync({ 
        orderId: order.id, 
        status: newStatus 
      });
      toast.success('تم تحديث حالة الطلب');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1];
  };

  const getElapsedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { locale: ar, addSuffix: false });
  };

  const getUrgencyLevel = (createdAt: string): 'normal' | 'warning' | 'urgent' => {
    const elapsed = (currentTime.getTime() - new Date(createdAt).getTime()) / 1000 / 60;
    if (elapsed > 20) return 'urgent';
    if (elapsed > 10) return 'warning';
    return 'normal';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const preparingOrders = orders?.filter(o => o.status === 'preparing') || [];
  const readyOrders = orders?.filter(o => o.status === 'ready' || o.status === 'out_for_delivery') || [];

  const OrderTicket = ({ order, isNew = false }: { order: ProviderOrder; isNew?: boolean }) => {
    const config = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = config.icon;
    const nextStatus = getNextStatus(order.status);
    const urgency = getUrgencyLevel(order.created_at);
    const items = orderItems?.[order.id] || [];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`
          relative overflow-hidden rounded-2xl border-2 transition-all duration-300
          ${config.borderColor} ${config.bgColor}
          ${isNew ? 'ring-4 ring-amber-400/50 animate-pulse' : ''}
          ${urgency === 'urgent' ? 'ring-2 ring-red-500' : ''}
          ${urgency === 'warning' ? 'ring-2 ring-yellow-500' : ''}
        `}
      >
        {/* Status Header */}
        <div className={`bg-gradient-to-l ${config.gradient} p-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2 text-white">
            <StatusIcon className="h-5 w-5" />
            <span className="font-bold">{config.label}</span>
          </div>
          <span className="text-white/90 font-mono font-bold text-lg">
            #{order.id.slice(-4)}
          </span>
        </div>

        {/* Order Content */}
        <div className="p-4 space-y-3">
          {/* Customer Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{order.customer_phone}</span>
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-primary">{order.total_amount}</p>
              <p className="text-xs text-muted-foreground">ر.س</p>
            </div>
          </div>

          {/* Products List */}
          {items.length > 0 && (
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/50 pb-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>المنتجات ({items.length})</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-muted/50 rounded-lg px-2 py-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-foreground">{item.product_name}</span>
                      </div>
                      <span className="text-muted-foreground font-mono text-xs shrink-0">
                        {item.total_price} ر.س
                      </span>
                    </div>
                    {/* Selected Options */}
                    {item.selected_options && item.selected_options.length > 0 && (
                      <div className="mt-1.5 mr-8 flex flex-wrap gap-1">
                        {item.selected_options.map((option, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                          >
                            <span className="font-medium">{option.optionName}:</span>
                            <span>{option.valueName}</span>
                            {option.priceModifier > 0 && (
                              <span className="text-primary/70">(+{option.priceModifier})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Type Badge */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${order.order_type === 'delivery' ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
            >
              {order.order_type === 'delivery' ? (
                <>
                  <Truck className="h-3 w-3 ml-1" />
                  توصيل
                </>
              ) : (
                <>
                  <Package className="h-3 w-3 ml-1" />
                  استلام
                </>
              )}
            </Badge>
            
            {/* Timer */}
            <div className={`
              flex items-center gap-1 text-xs px-2 py-1 rounded-full
              ${urgency === 'urgent' ? 'bg-red-100 text-red-700' : ''}
              ${urgency === 'warning' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${urgency === 'normal' ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              <Timer className="h-3 w-3" />
              <span>{getElapsedTime(order.created_at)}</span>
            </div>
          </div>

          {/* Address for delivery */}
          {order.delivery_address && order.order_type === 'delivery' && (
            <div className="flex items-start gap-2 text-sm bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground line-clamp-2">{order.delivery_address}</span>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="text-sm bg-amber-100/80 dark:bg-amber-900/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="font-medium">📝 ملاحظة:</span> {order.notes}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {/* Print Button */}
            <Button
              size="lg"
              variant="outline"
              onClick={() => printOrderTicket(order)}
              className="gap-1"
            >
              <Printer className="h-5 w-5" />
            </Button>
            
            {order.status !== 'completed' && order.status !== 'cancelled' && nextStatus && (
              <Button
                size="lg"
                onClick={() => handleStatusChange(order, nextStatus)}
                disabled={updateOrderMutation.isPending}
                className={`flex-1 font-bold text-base bg-gradient-to-l ${statusConfig[nextStatus]?.gradient || 'from-primary to-primary/80'} hover:opacity-90 transition-opacity`}
              >
                <ArrowRight className="h-5 w-5 ml-2" />
                {statusConfig[nextStatus]?.label || nextStatus}
              </Button>
            )}
            {order.status === 'pending' && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleStatusChange(order, 'cancelled')}
                disabled={updateOrderMutation.isPending}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Urgency Flame */}
        {urgency === 'urgent' && order.status !== 'completed' && order.status !== 'cancelled' && (
          <div className="absolute top-2 left-2">
            <Flame className="h-6 w-6 text-red-500 animate-pulse" />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-6 bg-background min-h-screen' : ''}`}>
      {/* Control Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="gap-2"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? 'الصوت مفعل' : 'الصوت معطل'}
          </Button>
          
          {/* Test Sounds */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testSound('pickup')}
              className="text-xs h-7 px-2"
            >
              <Package className="h-3 w-3 ml-1" />
              استلام
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testSound('delivery')}
              className="text-xs h-7 px-2"
            >
              <Truck className="h-3 w-3 ml-1" />
              توصيل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testSound('urgent')}
              className="text-xs h-7 px-2 text-red-600"
            >
              <Flame className="h-3 w-3 ml-1" />
              عاجل
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="gap-2"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-3' : 'grid-cols-3'}`}>
        <Card className="bg-gradient-to-bl from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">طلبات جديدة</p>
              <p className="text-4xl font-bold">{pendingOrders.length}</p>
            </div>
            <Bell className="h-10 w-10 text-amber-200" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-bl from-blue-500 to-cyan-500 text-white border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">قيد التحضير</p>
              <p className="text-4xl font-bold">{preparingOrders.length}</p>
            </div>
            <ChefHat className="h-10 w-10 text-blue-200" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-bl from-emerald-500 to-green-500 text-white border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">جاهز</p>
              <p className="text-4xl font-bold">{readyOrders.length}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-emerald-200" />
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid - KDS Style */}
      <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        <AnimatePresence mode="popLayout">
          {/* Pending Orders First (Priority) */}
          {pendingOrders.map(order => (
            <OrderTicket key={order.id} order={order} isNew />
          ))}
          
          {/* Preparing Orders */}
          {preparingOrders.map(order => (
            <OrderTicket key={order.id} order={order} />
          ))}
          
          {/* Ready Orders */}
          {readyOrders.map(order => (
            <OrderTicket key={order.id} order={order} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {orders?.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <ChefHat className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">لا توجد طلبات نشطة</h3>
            <p className="text-muted-foreground">ستظهر الطلبات الجديدة هنا تلقائياً</p>
          </CardContent>
        </Card>
      )}

      {/* No Active Orders but has completed */}
      {pendingOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0 && (orders?.length ?? 0) > 0 && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">جميع الطلبات مكتملة</h3>
            <p className="text-muted-foreground text-sm">لا توجد طلبات نشطة حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KitchenDisplaySystem;
