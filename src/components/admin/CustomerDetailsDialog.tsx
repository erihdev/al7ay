import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ShoppingBag, 
  Coins, 
  User, 
  Phone, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string;
  avatar_url: string | null;
  referral_code: string | null;
  created_at: string;
  orders_count: number;
  total_spent: number;
  loyalty_points: number;
  tier: string;
}

interface CustomerDetailsDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'gold': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    case 'silver': return 'bg-gray-400/20 text-gray-600 border-gray-400/30';
    default: return 'bg-amber-700/20 text-amber-700 border-amber-700/30';
  }
};

const getTierLabel = (tier: string) => {
  switch (tier) {
    case 'gold': return 'ذهبي';
    case 'silver': return 'فضي';
    default: return 'برونزي';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500/20 text-green-600';
    case 'cancelled': return 'bg-red-500/20 text-red-600';
    case 'pending': return 'bg-yellow-500/20 text-yellow-600';
    case 'preparing': return 'bg-blue-500/20 text-blue-600';
    case 'ready': return 'bg-purple-500/20 text-purple-600';
    case 'out_for_delivery': return 'bg-orange-500/20 text-orange-600';
    default: return 'bg-gray-500/20 text-gray-600';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'مكتمل';
    case 'cancelled': return 'ملغي';
    case 'pending': return 'قيد الانتظار';
    case 'preparing': return 'قيد التحضير';
    case 'ready': return 'جاهز';
    case 'out_for_delivery': return 'في الطريق';
    default: return status;
  }
};

const getPointsTypeLabel = (type: string) => {
  switch (type) {
    case 'earned': return 'مكتسبة';
    case 'redeemed': return 'مستبدلة';
    case 'referral_bonus': return 'مكافأة إحالة';
    case 'admin_add': return 'إضافة يدوية';
    case 'admin_subtract': return 'خصم يدوي';
    case 'tier_bonus': return 'مكافأة مستوى';
    default: return type;
  }
};

export function CustomerDetailsDialog({ customer, open, onOpenChange }: CustomerDetailsDialogProps) {
  // Fetch customer orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', customer?.user_id],
    queryFn: async () => {
      if (!customer?.user_id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_id', customer.user_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.user_id && open
  });

  // Fetch points history
  const { data: pointsHistory, isLoading: pointsLoading } = useQuery({
    queryKey: ['customer-points-history', customer?.user_id],
    queryFn: async () => {
      if (!customer?.user_id) return [];
      
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', customer.user_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.user_id && open
  });

  if (!customer) return null;

  const totalEarned = pointsHistory?.filter(p => p.points_change > 0).reduce((sum, p) => sum + p.points_change, 0) || 0;
  const totalRedeemed = pointsHistory?.filter(p => p.points_change < 0).reduce((sum, p) => sum + Math.abs(p.points_change), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{customer.full_name || 'بدون اسم'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getTierColor(customer.tier)}>
                  <Star className="h-3 w-3 ml-1" />
                  {getTierLabel(customer.tier)}
                </Badge>
                {customer.phone && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 text-center">
              <ShoppingBag className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{customer.orders_count}</p>
              <p className="text-xs text-muted-foreground">الطلبات</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <p className="text-2xl font-bold">{customer.total_spent.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">إجمالي الإنفاق (ر.س)</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-3 text-center">
              <Coins className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
              <p className="text-2xl font-bold">{customer.loyalty_points}</p>
              <p className="text-xs text-muted-foreground">النقاط الحالية</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-3 text-center">
              <Calendar className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <p className="text-sm font-bold">
                {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: ar })}
              </p>
              <p className="text-xs text-muted-foreground">تاريخ التسجيل</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              سجل الطلبات ({orders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              سجل النقاط ({pointsHistory?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Card key={order.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">طلب #{order.order_number}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(order.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {item.product_name} × {item.quantity}
                                  </Badge>
                                ))}
                                {order.order_items?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{order.order_items.length - 3} أخرى
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status === 'completed' ? (
                                <CheckCircle className="h-3 w-3 ml-1" />
                              ) : order.status === 'cancelled' ? (
                                <XCircle className="h-3 w-3 ml-1" />
                              ) : null}
                              {getStatusLabel(order.status)}
                            </Badge>
                            <p className="text-lg font-bold mt-2">{Number(order.total_amount).toFixed(2)} ر.س</p>
                            {order.points_earned > 0 && (
                              <p className="text-xs text-green-600">+{order.points_earned} نقطة</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد طلبات</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="points" className="mt-4">
            {/* Points Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-3 flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-xl font-bold text-green-600">+{totalEarned}</p>
                    <p className="text-xs text-muted-foreground">إجمالي المكتسبة</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="p-3 flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-xl font-bold text-red-600">-{totalRedeemed}</p>
                    <p className="text-xs text-muted-foreground">إجمالي المستبدلة</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="h-[340px] pr-4">
              {pointsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pointsHistory && pointsHistory.length > 0 ? (
                <div className="space-y-2">
                  {pointsHistory.map((record) => (
                    <Card key={record.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            record.points_change > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}>
                            {record.points_change > 0 ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{getPointsTypeLabel(record.transaction_type)}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.description || '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(record.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                            </p>
                          </div>
                        </div>
                        <p className={`text-xl font-bold ${
                          record.points_change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.points_change > 0 ? '+' : ''}{record.points_change}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا يوجد سجل نقاط</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
