import { useMyOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  const { data: orders, isLoading } = useMyOrders();

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
