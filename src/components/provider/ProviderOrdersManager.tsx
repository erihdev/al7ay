import { useState } from 'react';
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
  Navigation2
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useProviderOrders, useUpdateProviderOrder, ProviderOrder } from '@/hooks/useProviderOrders';
import { ProviderDeliveryTracker } from './ProviderDeliveryTracker';

interface ProviderOrdersManagerProps {
  providerId: string;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: { label: 'جديد', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  preparing: { label: 'قيد التحضير', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ready: { label: 'جاهز', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  out_for_delivery: { label: 'في الطريق', icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  completed: { label: 'مكتمل', icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
  cancelled: { label: 'ملغي', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
};

const statusFlow = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];

const ProviderOrdersManager = ({ providerId }: ProviderOrdersManagerProps) => {
  const { data: orders, isLoading } = useProviderOrders(providerId);
  const updateOrderMutation = useUpdateProviderOrder();
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const activeOrders = orders?.filter(o => ['preparing', 'ready', 'out_for_delivery'].includes(o.status)) || [];
  const completedOrders = orders?.filter(o => ['completed', 'cancelled'].includes(o.status)) || [];

  const OrderCard = ({ order }: { order: ProviderOrder }) => {
    const config = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = config.icon;
    const nextStatus = getNextStatus(order.status);

    return (
      <Card className="overflow-hidden">
        <div className={`h-1 ${config.bgColor}`} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold">#{order.id.slice(-6)}</span>
                <Badge className={`${config.bgColor} ${config.color} border-0`}>
                  <StatusIcon className="h-3 w-3 ml-1" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
              </p>
            </div>
            <p className="font-bold text-lg text-primary">{order.total_amount} ر.س</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span dir="ltr">{order.customer_phone}</span>
            </div>
            {order.delivery_address && (
              <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{order.delivery_address}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">
              {order.order_type === 'delivery' ? 'توصيل' : 'استلام'}
            </Badge>
          </div>

          {order.notes && (
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded mb-3">
              📝 {order.notes}
            </p>
          )}

          {/* Delivery Tracker for out_for_delivery orders */}
          {order.status === 'out_for_delivery' && order.order_type === 'delivery' && (
            <div className="mb-3">
              <ProviderDeliveryTracker
                orderId={order.id}
                customerName={order.customer_name}
                customerPhone={order.customer_phone}
                deliveryAddress={order.delivery_address}
                onDeliveryComplete={() => handleStatusChange(order, 'completed')}
              />
            </div>
          )}

          {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'out_for_delivery' && (
            <div className="flex gap-2">
              {nextStatus && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(order, nextStatus)}
                  disabled={updateOrderMutation.isPending}
                  className="flex-1 font-arabic"
                >
                  {statusConfig[nextStatus]?.label || nextStatus}
                </Button>
              )}
              {order.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(order, 'cancelled')}
                  disabled={updateOrderMutation.isPending}
                  className="text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            طلبات جديدة ({pendingOrders.length})
          </h3>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            طلبات قيد التنفيذ ({activeOrders.length})
          </h3>
          <div className="space-y-3">
            {activeOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            طلبات منتهية ({completedOrders.length})
          </h3>
          <div className="space-y-3">
            {completedOrders.slice(0, 10).map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {orders?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">لا توجد طلبات</h3>
            <p className="text-muted-foreground">ستظهر الطلبات الجديدة هنا</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderOrdersManager;
