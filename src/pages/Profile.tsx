import { useAuth } from '@/contexts/AuthContext';
import { useLoyaltyPoints, usePointsHistory } from '@/hooks/useOrders';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthForm } from '@/components/auth/AuthForm';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Star, User, History, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const { data: loyaltyPoints, isLoading: pointsLoading } = useLoyaltyPoints();
  const { data: pointsHistory, isLoading: historyLoading } = usePointsHistory();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="container mx-auto px-4 py-8 pb-24">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 mb-4" />
          <Skeleton className="h-32" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="container mx-auto px-4 py-8 pb-24">
          <h1 className="text-2xl font-bold mb-6">حسابي</h1>
          <AuthForm />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <div className="container mx-auto px-4 py-8 pb-24">
        <h1 className="text-2xl font-bold mb-6">حسابي</h1>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{user.email}</h2>
                <p className="text-sm text-muted-foreground">عضو منذ {format(new Date(user.created_at), 'MMM yyyy', { locale: ar })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Points Card */}
        <Card className="mb-6 border-gold/30 bg-gradient-to-br from-gold/10 to-gold-light/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-gold" />
              نقاط الولاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pointsLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gold">
                  {loyaltyPoints?.total_points || 0}
                </span>
                <span className="text-muted-foreground">نقطة</span>
              </div>
            )}
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">مجموع النقاط المكتسبة:</span>
              <span className="font-semibold">{loyaltyPoints?.lifetime_points || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-gold/20">
              كل 100 نقطة = 1 ر.س خصم على طلبك
            </p>
          </CardContent>
        </Card>

        {/* Points History */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              سجل النقاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : pointsHistory?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                لا توجد معاملات بعد
              </p>
            ) : (
              <div className="space-y-3">
                {pointsHistory?.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm">{record.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.created_at), 'dd MMM yyyy', { locale: ar })}
                      </p>
                    </div>
                    <span
                      className={`font-bold ${
                        record.points_change > 0 ? 'text-green-600' : 'text-destructive'
                      }`}
                    >
                      {record.points_change > 0 ? '+' : ''}
                      {record.points_change}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <div className="mb-6">
          <NotificationSettings />
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <Link to="/admin">
            <Card className="mb-6 border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary" />
                <span className="font-semibold">لوحة التحكم</span>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Sign Out Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
