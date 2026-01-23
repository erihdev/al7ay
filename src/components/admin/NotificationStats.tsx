import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, MousePointerClick, Eye, Send, TrendingUp, Users } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationLog {
  id: string;
  is_bulk: boolean;
  bulk_recipients_count: number | null;
  delivered_count: number | null;
  opened_count: number | null;
  clicked_count: number | null;
  created_at: string;
  status: string;
}

export function NotificationStats() {
  // Fetch aggregated stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30)).toISOString();
      
      // Get all notifications from last 30 days
      const { data, error } = await supabase
        .from('notifications_log')
        .select('*')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const notifications = (data as unknown) as NotificationLog[] | null;
      
      const totalSent = notifications?.length || 0;
      const bulkNotifications = notifications?.filter(n => n.is_bulk) || [];
      const successfulNotifications = notifications?.filter(n => n.status === 'sent') || [];
      
      // Calculate totals
      let totalRecipients = 0;
      let totalDelivered = 0;
      let totalOpened = 0;
      let totalClicked = 0;
      
      notifications?.forEach(n => {
        if (n.is_bulk && n.bulk_recipients_count) {
          totalRecipients += n.bulk_recipients_count;
        } else if (!n.is_bulk) {
          totalRecipients += 1;
        }
        totalDelivered += n.delivered_count || 0;
        totalOpened += n.opened_count || 0;
        totalClicked += n.clicked_count || 0;
      });
      
      // Calculate rates
      const deliveryRate = totalRecipients > 0 ? (totalDelivered / totalRecipients) * 100 : 0;
      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
      
      // Get daily breakdown for chart
      const dailyStats: Record<string, { sent: number; opened: number; clicked: number }> = {};
      
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyStats[date] = { sent: 0, opened: 0, clicked: 0 };
      }
      
      notifications?.forEach(n => {
        const date = format(new Date(n.created_at), 'yyyy-MM-dd');
        if (dailyStats[date]) {
          dailyStats[date].sent += n.is_bulk ? (n.bulk_recipients_count || 0) : 1;
          dailyStats[date].opened += n.opened_count || 0;
          dailyStats[date].clicked += n.clicked_count || 0;
        }
      });
      
      return {
        totalSent,
        totalRecipients,
        totalDelivered,
        totalOpened,
        totalClicked,
        deliveryRate,
        openRate,
        clickRate,
        bulkCount: bulkNotifications.length,
        successRate: totalSent > 0 ? (successfulNotifications.length / totalSent) * 100 : 0,
        dailyStats
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المرسل',
      value: stats?.totalRecipients || 0,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      subtitle: `${stats?.totalSent || 0} إشعار`
    },
    {
      title: 'معدل التوصيل',
      value: `${(stats?.deliveryRate || 0).toFixed(1)}%`,
      icon: Bell,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      subtitle: `${stats?.totalDelivered || 0} تم توصيله`
    },
    {
      title: 'معدل الفتح',
      value: `${(stats?.openRate || 0).toFixed(1)}%`,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      subtitle: `${stats?.totalOpened || 0} مرة فتح`
    },
    {
      title: 'معدل التفاعل',
      value: `${(stats?.clickRate || 0).toFixed(1)}%`,
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      subtitle: `${stats?.totalClicked || 0} نقرة`
    }
  ];

  // Daily chart data
  const dailyData = stats?.dailyStats ? Object.entries(stats.dailyStats).map(([date, data]) => ({
    date: format(new Date(date), 'EEE', { locale: ar }),
    ...data
  })) : [];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            أداء آخر 7 أيام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dailyData.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-muted-foreground mb-2">{day.date}</p>
                <div className="space-y-1">
                  <div 
                    className="bg-blue-500/20 rounded-sm mx-auto transition-all"
                    style={{ 
                      height: `${Math.max(4, Math.min(40, day.sent / 2))}px`,
                      width: '100%'
                    }}
                    title={`مرسل: ${day.sent}`}
                  />
                  <div 
                    className="bg-purple-500/40 rounded-sm mx-auto transition-all"
                    style={{ 
                      height: `${Math.max(2, Math.min(30, day.opened))}px`,
                      width: '80%'
                    }}
                    title={`مفتوح: ${day.opened}`}
                  />
                  <div 
                    className="bg-orange-500/60 rounded-sm mx-auto transition-all"
                    style={{ 
                      height: `${Math.max(2, Math.min(20, day.clicked))}px`,
                      width: '60%'
                    }}
                    title={`نقرات: ${day.clicked}`}
                  />
                </div>
                <div className="mt-2 text-xs">
                  <p className="text-blue-600">{day.sent}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500/20 rounded-sm" />
              <span>مرسل</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500/40 rounded-sm" />
              <span>مفتوح</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500/60 rounded-sm" />
              <span>نقرات</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإشعارات الجماعية</p>
                <p className="text-xl font-bold">{stats?.bulkCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">معدل النجاح</p>
                <p className="text-xl font-bold">{(stats?.successRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
