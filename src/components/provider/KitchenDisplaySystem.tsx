import { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useProviderOrders, useUpdateProviderOrder, ProviderOrder } from '@/hooks/useProviderData';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Update time every minute for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (order: ProviderOrder, newStatus: string) => {
    try {
      await updateOrderMutation.mutateAsync({ 
        id: order.id, 
        providerId, 
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
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="flex gap-2 pt-2">
              {nextStatus && (
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
          )}
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
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
