import { useMyOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrderTrackingCard } from '@/components/tracking/OrderTrackingCard';
import { ClipboardList, Package, Truck, CheckCircle, Clock, XCircle, MapPin, RefreshCw } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'جديد', icon: Clock, color: 'bg-yellow-500' },
  preparing: { label: 'قيد التحضير', icon: Package, color: 'bg-blue-500' },
  ready: { label: 'جاهز', icon: CheckCircle, color: 'bg-green-500' },
  out_for_delivery: { label: 'في الطريق', icon: Truck, color: 'bg-purple-500' },
  completed: { label: 'مكتمل', icon: CheckCircle, color: 'bg-primary' },
  cancelled: { label: 'ملغي', icon: XCircle, color: 'bg-destructive' },
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const { addItem, clearCart } = useCart();
  const { data: orders, isLoading } = useMyOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleReorder = (order: any) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error('لا توجد منتجات في هذا الطلب');
      return;
    }

    // Clear current cart and add items from the order
    clearCart();
    
    order.order_items.forEach((item: any) => {
      addItem({
        id: item.product_id,
        name_ar: item.product_name,
        price: Number(item.unit_price),
      });
      
      // Update quantity if more than 1
      // This is handled by addItem which increases quantity
      for (let i = 1; i < item.quantity; i++) {
        addItem({
          id: item.product_id,
          name_ar: item.product_name,
          price: Number(item.unit_price),
        });
      }
    });

    toast.success('تمت إضافة الطلب السابق للسلة');
    navigate('/cart');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="container mx-auto px-4 py-8 pb-24">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="container mx-auto px-4 py-8 pb-24">
          <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
          <p className="text-muted-foreground text-center mb-6">
            يرجى تسجيل الدخول لعرض طلباتك
          </p>
          <AuthForm />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <div className="container mx-auto px-4 py-8 pb-24">
        <h1 className="text-2xl font-bold mb-6">طلباتي</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">لا توجد طلبات</h2>
            <p className="text-muted-foreground">طلباتك ستظهر هنا</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;
              const isTrackable = order.order_type === 'delivery' && 
                ['pending', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);

              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'dd MMM yyyy - hh:mm a', {
                            locale: ar,
                          })}
                        </p>
                        <p className="font-semibold text-lg">
                          {Number(order.total_amount).toFixed(0)} ر.س
                        </p>
                      </div>
                      <Badge className={`${status.color} text-white`}>
                        <StatusIcon className="h-3 w-3 ml-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {order.order_type === 'delivery' ? (
                          <>
                            <Truck className="h-4 w-4" />
                            <span>توصيل</span>
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4" />
                            <span>استلام</span>
                          </>
                        )}
                      </div>

                      {order.order_items && order.order_items.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {order.order_items.map((item: any, index: number) => (
                            <span key={item.id}>
                              {item.product_name} × {item.quantity}
                              {index < order.order_items.length - 1 && '، '}
                            </span>
                          ))}
                        </div>
                      )}

                      {order.points_earned > 0 && (
                        <p className="text-xs text-gold mt-2">
                          +{order.points_earned} نقاط مكتسبة
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        {/* Reorder Button */}
                        {order.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 font-arabic"
                            onClick={() => handleReorder(order)}
                          >
                            <RefreshCw className="h-4 w-4 ml-2" />
                            تكرار الطلب
                          </Button>
                        )}

                        {/* Track Order Button */}
                        {isTrackable && (
                          <Dialog
                            open={selectedOrderId === order.id}
                            onOpenChange={(open) => setSelectedOrderId(open ? order.id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 font-arabic"
                              >
                                <MapPin className="h-4 w-4 ml-2" />
                                تتبع الطلب
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="font-arabic">تتبع الطلب</DialogTitle>
                              </DialogHeader>
                              <OrderTrackingCard orderId={order.id} />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Orders;
