import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Trash2,
  AlertCircle,
  Send
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ScheduledNotificationsList() {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['scheduled-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*, active_neighborhoods(name)')
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      toast.success('تم إلغاء الإشعار المجدول');
      setCancellingId(null);
    },
    onError: () => toast.error('فشل في إلغاء الإشعار')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      toast.success('تم حذف الإشعار');
    },
    onError: () => toast.error('فشل في حذف الإشعار')
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600">
            <Clock className="h-3 w-3 ml-1" />
            في الانتظار
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-green-500/20 text-green-600">
            <CheckCircle className="h-3 w-3 ml-1" />
            تم الإرسال
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-500/20 text-gray-600">
            <XCircle className="h-3 w-3 ml-1" />
            ملغي
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-600">
            <AlertCircle className="h-3 w-3 ml-1" />
            فشل
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = notifications?.filter(n => n.status === 'pending').length || 0;
  const sentCount = notifications?.filter(n => n.status === 'sent').length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            الإشعارات المجدولة
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} في الانتظار</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                <p className="text-xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">في الانتظار</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-3 text-center">
                <Send className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-xl font-bold">{sentCount}</p>
                <p className="text-xs text-muted-foreground">تم الإرسال</p>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[350px]">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const scheduledDate = new Date(notification.scheduled_at);
                  const isOverdue = notification.status === 'pending' && isPast(scheduledDate);
                  
                  return (
                    <Card 
                      key={notification.id} 
                      className={`hover:bg-accent/50 transition-colors ${isOverdue ? 'border-yellow-500/50' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold truncate">{notification.title}</p>
                              {getStatusBadge(notification.status)}
                              {isOverdue && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                                  متأخر
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.body}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(scheduledDate, 'dd MMM yyyy - HH:mm', { locale: ar })}
                              </span>
                              {notification.tier_filter && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.tier_filter === 'gold' ? 'ذهبي' : 
                                   notification.tier_filter === 'silver' ? 'فضي' : 'برونزي'}
                                </Badge>
                              )}
                              {notification.active_neighborhoods?.name && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.active_neighborhoods.name}
                                </Badge>
                              )}
                              {notification.status === 'sent' && notification.recipients_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {notification.recipients_count} مستلم
                                </span>
                              )}
                            </div>
                            {notification.error_message && (
                              <p className="text-xs text-red-500 mt-1">
                                خطأ: {notification.error_message}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {notification.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-yellow-600 hover:text-yellow-700"
                                onClick={() => setCancellingId(notification.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {(notification.status === 'cancelled' || notification.status === 'failed') && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteMutation.mutate(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد إشعارات مجدولة</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={!!cancellingId} onOpenChange={() => setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الإشعار المجدول؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إلغاء هذا الإشعار ولن يتم إرساله في الموعد المحدد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellingId && cancelMutation.mutate(cancellingId)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              إلغاء الإشعار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
