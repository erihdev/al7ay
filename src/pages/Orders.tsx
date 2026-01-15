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
import { ClipboardList, Package, Truck, CheckCircle, Clock, XCircle, MapPin, RefreshCw, CalendarClock, ShoppingBag, Star, CreditCard, Banknote, ChefHat, ArrowLeft } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig = {
  pending: { 
    label: 'جديد', 
    icon: Clock, 
    color: 'bg-yellow-500',
    bgColor: 'from-yellow-500/20 to-yellow-500/5',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-500/30',
    description: 'بانتظار التأكيد'
  },
  preparing: { 
    label: 'قيد التحضير', 
    icon: ChefHat, 
    color: 'bg-blue-500',
    bgColor: 'from-blue-500/20 to-blue-500/5',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500/30',
    description: 'يتم تحضير طلبك الآن'
  },
  ready: { 
    label: 'جاهز', 
    icon: CheckCircle, 
    color: 'bg-green-500',
    bgColor: 'from-green-500/20 to-green-500/5',
    textColor: 'text-green-700',
    borderColor: 'border-green-500/30',
    description: 'طلبك جاهز للاستلام'
  },
  out_for_delivery: { 
    label: 'في الطريق', 
    icon: Truck, 
    color: 'bg-purple-500',
    bgColor: 'from-purple-500/20 to-purple-500/5',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-500/30',
    description: 'السائق في الطريق إليك'
  },
  completed: { 
    label: 'مكتمل', 
    icon: CheckCircle, 
    color: 'bg-primary',
    bgColor: 'from-primary/20 to-primary/5',
    textColor: 'text-primary',
    borderColor: 'border-primary/30',
    description: 'تم توصيل الطلب بنجاح'
  },
  cancelled: { 
    label: 'ملغي', 
    icon: XCircle, 
    color: 'bg-destructive',
    bgColor: 'from-destructive/20 to-destructive/5',
    textColor: 'text-destructive',
    borderColor: 'border-destructive/30',
    description: 'تم إلغاء الطلب'
  },
};

// Status timeline steps
const statusSteps = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const { addItem, clearCart } = useCart();
  const { data: orders, isLoading } = useMyOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleReorder = (order: any) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error('لا توجد منتجات في هذا الطلب');
      return;
    }

    clearCart();
    
    order.order_items.forEach((item: any) => {
      addItem({
        id: item.product_id,
        name_ar: item.product_name,
        price: Number(item.unit_price),
      });
      
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

  const getStatusIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    return statusSteps.indexOf(status);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="container mx-auto px-4 py-8 pb-24">
          <Skeleton className="h-24 rounded-3xl mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
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
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 mb-8"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <h1 className="text-3xl font-bold relative z-10 flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              طلباتي
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-muted-foreground text-center mb-6">
              يرجى تسجيل الدخول لعرض طلباتك
            </p>
            <AuthForm />
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Separate active and completed orders
  const activeOrders = orders?.filter(o => ['pending', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)) || [];
  const completedOrders = orders?.filter(o => ['completed', 'cancelled'].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 mb-6"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-3 rounded-2xl">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">طلباتي</h1>
                <p className="text-sm text-muted-foreground">{orders?.length || 0} طلب</p>
              </div>
            </div>
            {activeOrders.length > 0 && (
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                {activeOrders.length} نشط
              </div>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : orders?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-muted to-muted/50 rounded-full p-8">
                <ClipboardList className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">لا توجد طلبات</h2>
            <p className="text-muted-foreground mb-6">طلباتك ستظهر هنا</p>
            <Button 
              size="lg" 
              className="font-arabic gap-2 rounded-full px-8"
              onClick={() => navigate('/')}
            >
              <ShoppingBag className="h-5 w-5" />
              تصفح القائمة
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  الطلبات النشطة
                </h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {activeOrders.map((order, index) => {
                      const status = statusConfig[order.status as keyof typeof statusConfig];
                      const StatusIcon = status.icon;
                      const currentStep = getStatusIndex(order.status);
                      const isTrackable = order.order_type === 'delivery';
                      const isExpanded = expandedOrderId === order.id;

                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className={`overflow-hidden border-2 ${status.borderColor} shadow-lg`}>
                            {/* Status Banner */}
                            <div className={`bg-gradient-to-r ${status.bgColor} px-4 py-3 border-b ${status.borderColor}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl ${status.color} text-white`}>
                                    <StatusIcon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className={`font-bold ${status.textColor}`}>{status.label}</p>
                                    <p className="text-xs text-muted-foreground">{status.description}</p>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="text-xl font-bold">{Number(order.total_amount).toFixed(0)} ر.س</p>
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-4">
                              {/* Progress Timeline */}
                              {order.status !== 'cancelled' && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between relative">
                                    {/* Progress Line */}
                                    <div className="absolute top-4 left-4 right-4 h-1 bg-muted rounded-full">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="h-full bg-primary rounded-full"
                                      />
                                    </div>
                                    
                                    {/* Steps */}
                                    {statusSteps.map((step, i) => {
                                      const stepConfig = statusConfig[step as keyof typeof statusConfig];
                                      const StepIcon = stepConfig.icon;
                                      const isActive = i <= currentStep;
                                      const isCurrent = i === currentStep;
                                      
                                      return (
                                        <div key={step} className="relative z-10 flex flex-col items-center">
                                          <motion.div 
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: isCurrent ? 1.1 : 1 }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                              isActive 
                                                ? `${stepConfig.color} text-white shadow-lg` 
                                                : 'bg-muted text-muted-foreground'
                                            } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}
                                          >
                                            <StepIcon className="h-4 w-4" />
                                          </motion.div>
                                          <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'text-muted-foreground'}`}>
                                            {stepConfig.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Order Info */}
                              <div className="flex items-center justify-between text-sm mb-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  {order.order_type === 'delivery' ? (
                                    <Truck className="h-4 w-4" />
                                  ) : (
                                    <Package className="h-4 w-4" />
                                  )}
                                  <span>{order.order_type === 'delivery' ? 'توصيل' : 'استلام'}</span>
                                </div>
                                <p className="text-muted-foreground">
                                  {format(new Date(order.created_at), 'dd MMM - hh:mm a', { locale: ar })}
                                </p>
                              </div>

                              {/* Scheduled Info */}
                              {order.scheduled_for && (
                                <div className="flex items-center gap-2 text-sm text-primary mb-3 p-3 bg-primary/10 rounded-xl">
                                  <CalendarClock className="h-4 w-4" />
                                  <span className="font-arabic font-semibold">
                                    موعد مجدول: {format(new Date(order.scheduled_for), 'dd MMM - hh:mm a', { locale: ar })}
                                  </span>
                                </div>
                              )}

                              {/* Items Preview */}
                              <Button
                                variant="ghost"
                                className="w-full justify-between p-3 h-auto bg-muted/30 rounded-xl hover:bg-muted/50"
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              >
                                <span className="text-sm text-muted-foreground">
                                  {order.order_items?.length || 0} منتجات
                                </span>
                                <ArrowLeft className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </Button>

                              <AnimatePresence>
                                {isExpanded && order.order_items && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 space-y-2">
                                      {order.order_items.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                                          <span className="text-sm font-medium">{item.product_name}</span>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="secondary">x{item.quantity}</Badge>
                                            <span className="text-sm font-bold">{Number(item.total_price).toFixed(0)} ر.س</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Action Buttons */}
                              {isTrackable && (
                                <Dialog
                                  open={selectedOrderId === order.id}
                                  onOpenChange={(open) => setSelectedOrderId(open ? order.id : null)}
                                >
                                  <DialogTrigger asChild>
                                    <Button className="w-full mt-4 font-arabic rounded-xl gap-2">
                                      <MapPin className="h-4 w-4" />
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
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Completed Orders Section */}
            {completedOrders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 mt-8">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  الطلبات السابقة
                </h2>
                <div className="space-y-3">
                  {completedOrders.map((order, index) => {
                    const status = statusConfig[order.status as keyof typeof statusConfig];
                    const StatusIcon = status.icon;
                    const isExpanded = expandedOrderId === order.id;

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${status.color} text-white`}>
                                  <StatusIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-bold">{Number(order.total_amount).toFixed(0)} ر.س</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ar })}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary" className={status.textColor}>
                                {status.label}
                              </Badge>
                            </div>

                            {/* Order Type & Payment */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                {order.order_type === 'delivery' ? (
                                  <Truck className="h-3 w-3" />
                                ) : (
                                  <Package className="h-3 w-3" />
                                )}
                                <span>{order.order_type === 'delivery' ? 'توصيل' : 'استلام'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {order.payment_method === 'online' ? (
                                  <CreditCard className="h-3 w-3" />
                                ) : (
                                  <Banknote className="h-3 w-3" />
                                )}
                                <span>{order.payment_method === 'online' ? 'إلكتروني' : 'نقدي'}</span>
                              </div>
                            </div>

                            {/* Points Earned */}
                            {order.points_earned > 0 && (
                              <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-500/10 px-3 py-2 rounded-lg mb-3">
                                <Star className="h-4 w-4 fill-yellow-500" />
                                <span className="font-semibold">+{order.points_earned} نقطة مكتسبة</span>
                              </div>
                            )}

                            {/* Items Preview */}
                            <Button
                              variant="ghost"
                              className="w-full justify-between p-2 h-auto hover:bg-muted/50 rounded-lg"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            >
                              <span className="text-xs text-muted-foreground">
                                {order.order_items?.length || 0} منتجات
                              </span>
                              <ArrowLeft className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>

                            <AnimatePresence>
                              {isExpanded && order.order_items && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 space-y-1">
                                    {order.order_items.map((item: any) => (
                                      <div key={item.id} className="flex items-center justify-between text-sm py-1">
                                        <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                                        <span>{Number(item.total_price).toFixed(0)} ر.س</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Reorder Button */}
                            {order.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3 font-arabic rounded-xl gap-2"
                                onClick={() => handleReorder(order)}
                              >
                                <RefreshCw className="h-4 w-4" />
                                تكرار الطلب
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Orders;
