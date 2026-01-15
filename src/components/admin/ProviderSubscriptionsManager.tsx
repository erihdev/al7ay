import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProviderSubscription {
  id: string;
  provider_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  is_trial: boolean;
  created_at: string;
  provider: {
    business_name: string;
    email: string;
    phone: string | null;
  };
  plan: {
    name_ar: string;
    price: number;
    duration_days: number;
  };
}

export function ProviderSubscriptionsManager() {
  const queryClient = useQueryClient();

  // Fetch subscriptions with provider and plan info
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['provider-subscriptions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_subscriptions')
        .select(`
          *,
          provider:service_providers(business_name, email, phone),
          plan:subscription_plans(name_ar, price, duration_days)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ProviderSubscription[];
    },
  });

  // Update subscription status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('provider_subscriptions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      // Also update provider subscription_status
      const subscription = subscriptions?.find(s => s.id === id);
      if (subscription) {
        await supabase
          .from('service_providers')
          .update({ 
            subscription_status: status === 'active' 
              ? (subscription.is_trial ? 'trial' : 'active') 
              : status 
          })
          .eq('id', subscription.provider_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-subscriptions-admin'] });
      toast.success('تم تحديث حالة الاشتراك');
    },
    onError: () => {
      toast.error('حدث خطأ');
    },
  });

  // Extend subscription
  const extendSubscription = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const subscription = subscriptions?.find(s => s.id === id);
      if (!subscription) throw new Error('Subscription not found');

      const currentEnd = new Date(subscription.ends_at);
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + days);

      const { error } = await supabase
        .from('provider_subscriptions')
        .update({ 
          ends_at: newEnd.toISOString(),
          status: 'active'
        })
        .eq('id', id);
      if (error) throw error;

      // Update provider status
      await supabase
        .from('service_providers')
        .update({ subscription_status: subscription.is_trial ? 'trial' : 'active' })
        .eq('id', subscription.provider_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-subscriptions-admin'] });
      toast.success('تم تمديد الاشتراك');
    },
    onError: () => {
      toast.error('حدث خطأ');
    },
  });

  const getStatusBadge = (status: string, endsAt: string) => {
    const isExpired = isPast(new Date(endsAt));
    const daysLeft = differenceInDays(new Date(endsAt), new Date());

    if (status === 'cancelled') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />ملغي</Badge>;
    }
    if (isExpired || status === 'expired') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 ml-1" />منتهي</Badge>;
    }
    if (daysLeft <= 3) {
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 ml-1" />ينتهي قريباً</Badge>;
    }
    return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />نشط</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeCount = subscriptions?.filter(s => s.status === 'active' && !isPast(new Date(s.ends_at))).length || 0;
  const trialCount = subscriptions?.filter(s => s.is_trial && s.status === 'active').length || 0;
  const expiredCount = subscriptions?.filter(s => s.status === 'expired' || isPast(new Date(s.ends_at))).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-muted-foreground">اشتراك نشط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{trialCount}</div>
            <div className="text-sm text-muted-foreground">فترة تجريبية</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            <div className="text-sm text-muted-foreground">منتهي</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            اشتراكات مقدمي الخدمات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد اشتراكات
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions?.map((sub) => {
                const daysLeft = differenceInDays(new Date(sub.ends_at), new Date());
                const isExpired = isPast(new Date(sub.ends_at));

                return (
                  <Card key={sub.id} className={isExpired ? 'border-destructive/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">{sub.provider?.business_name}</h3>
                            {getStatusBadge(sub.status, sub.ends_at)}
                            {sub.is_trial && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                تجريبي
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {sub.provider?.email} • {sub.provider?.phone || 'لا يوجد هاتف'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>
                              <strong>الخطة:</strong> {sub.plan?.name_ar}
                            </span>
                            <span>
                              <strong>السعر:</strong> {sub.plan?.price === 0 ? 'مجاني' : `${sub.plan?.price} ر.س`}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>
                              <Clock className="h-3 w-3 inline ml-1" />
                              من: {format(new Date(sub.starts_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                            <span>
                              إلى: {format(new Date(sub.ends_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                            {!isExpired && (
                              <span className={daysLeft <= 3 ? 'text-yellow-600 font-medium' : ''}>
                                ({daysLeft} يوم متبقي)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={sub.status}
                            onValueChange={(value) => updateStatus.mutate({ id: sub.id, status: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">نشط</SelectItem>
                              <SelectItem value="expired">منتهي</SelectItem>
                              <SelectItem value="cancelled">ملغي</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => extendSubscription.mutate({ id: sub.id, days: sub.plan?.duration_days || 30 })}
                            disabled={extendSubscription.isPending}
                          >
                            <RefreshCw className="h-3 w-3 ml-1" />
                            تمديد
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
