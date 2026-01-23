import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Users, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BulkNotificationDialog } from './BulkNotificationDialog';

export function NotificationsLogManager() {
  // Fetch total customers count
  const { data: customersCount } = useQuery({
    queryKey: ['customers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch notifications log
  const { data: logs, isLoading } = useQuery({
    queryKey: ['notifications-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    }
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'admin_message': return 'رسالة إدارية';
      case 'bulk_notification': return 'إشعار جماعي';
      case 'order_status': return 'حالة طلب';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bulk_notification': return 'bg-purple-500/20 text-purple-600';
      case 'admin_message': return 'bg-blue-500/20 text-blue-600';
      default: return 'bg-gray-500/20 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with bulk send button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سجل الإشعارات</h2>
          <p className="text-muted-foreground">إدارة وإرسال الإشعارات للعملاء</p>
        </div>
        <BulkNotificationDialog totalCustomers={customersCount || 0} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{logs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">إجمالي الإشعارات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold">
              {logs?.filter(l => l.is_bulk).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">إشعارات جماعية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">
              {logs?.filter(l => !l.is_bulk).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">إشعارات فردية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">
              {logs?.filter(l => l.status === 'sent').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">تم الإرسال</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            آخر الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            log.is_bulk ? 'bg-purple-500/10' : 'bg-blue-500/10'
                          }`}>
                            {log.is_bulk ? (
                              <Users className="h-5 w-5 text-purple-600" />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-semibold truncate">{log.title}</p>
                              <Badge className={getTypeColor(log.notification_type)}>
                                {getTypeLabel(log.notification_type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{log.body}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(log.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                              </span>
                              {log.is_bulk && log.bulk_recipients_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {log.bulk_recipients_count} مستلم
                                </span>
                              )}
                              {log.sent_via && log.sent_via.length > 0 && (
                                <span>عبر: {log.sent_via.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          {log.status === 'sent' ? (
                            <Badge className="bg-green-500/20 text-green-600">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              تم الإرسال
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-600">
                              <XCircle className="h-3 w-3 ml-1" />
                              فشل
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد إشعارات مرسلة</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
