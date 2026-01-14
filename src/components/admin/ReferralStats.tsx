import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  useAdminReferralStats, 
  useTopReferrers, 
  useAllReferrals,
  useAdminLoyaltyStats,
  useAllLoyaltyUsers
} from '@/hooks/useAdminReferrals';
import { exportLoyaltyToExcel } from '@/utils/exportLoyaltyReports';
import { Users, Award, UserPlus, Gift, FileSpreadsheet, Loader2, Crown, Medal } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
};

const tierLabels: Record<string, string> = {
  bronze: 'برونزي',
  silver: 'فضي',
  gold: 'ذهبي',
};

export function ReferralStats() {
  const { data: referralStats, isLoading: statsLoading } = useAdminReferralStats();
  const { data: topReferrers, isLoading: topLoading } = useTopReferrers(10);
  const { data: allReferrals, isLoading: referralsLoading } = useAllReferrals();
  const { data: loyaltyStats, isLoading: loyaltyStatsLoading } = useAdminLoyaltyStats();
  const { data: loyaltyUsers, isLoading: loyaltyUsersLoading } = useAllLoyaltyUsers();

  const isLoading = statsLoading || topLoading || referralsLoading || loyaltyStatsLoading || loyaltyUsersLoading;

  const handleExport = () => {
    if (!loyaltyStats || !loyaltyUsers || !referralStats || !topReferrers || !allReferrals) {
      toast.error('البيانات غير متاحة للتصدير');
      return;
    }
    try {
      exportLoyaltyToExcel(loyaltyStats, loyaltyUsers, referralStats, topReferrers, allReferrals);
      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" className="font-arabic">
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          تصدير تقرير الولاء والإحالات
        </Button>
      </div>

      {/* Loyalty Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          إحصائيات الولاء
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الأعضاء</p>
                  <p className="text-2xl font-bold">{loyaltyStats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-600/20">
                  <Medal className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">برونزي</p>
                  <p className="text-2xl font-bold">{loyaltyStats?.bronzeUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-400/20">
                  <Medal className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">فضي</p>
                  <p className="text-2xl font-bold">{loyaltyStats?.silverUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Crown className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ذهبي</p>
                  <p className="text-2xl font-bold">{loyaltyStats?.goldUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Referral Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          إحصائيات الإحالات
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الإحالات</p>
                  <p className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <UserPlus className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إحالات مكتملة</p>
                  <p className="text-2xl font-bold">{referralStats?.completedReferrals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <Users className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إحالات معلقة</p>
                  <p className="text-2xl font-bold">{referralStats?.pendingReferrals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Gift className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">النقاط الممنوحة</p>
                  <p className="text-2xl font-bold">{referralStats?.totalPointsAwarded || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Referrers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            أفضل المُحيلين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topReferrers && topReferrers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">عدد الإحالات</TableHead>
                  <TableHead className="text-right">النقاط الممنوحة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReferrers.map((referrer, index) => (
                  <TableRow key={referrer.referrer_id}>
                    <TableCell className="font-medium">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </TableCell>
                    <TableCell>{referrer.full_name || 'مستخدم'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{referrer.referral_count} إحالة</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500">{referrer.total_points_awarded} نقطة</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد إحالات مكتملة بعد</p>
          )}
        </CardContent>
      </Card>

      {/* All Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل الإحالات</CardTitle>
        </CardHeader>
        <CardContent>
          {allReferrals && allReferrals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المُحيل</TableHead>
                    <TableHead className="text-right">المُحال</TableHead>
                    <TableHead className="text-right">كود الإحالة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReferrals.slice(0, 20).map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>{referral.referrer_name}</TableCell>
                      <TableCell>{referral.referred_name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {referral.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={referral.status === 'completed' ? 'default' : 'secondary'}
                          className={referral.status === 'completed' ? 'bg-green-500' : ''}
                        >
                          {referral.status === 'completed' ? 'مكتمل' : 'معلق'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(referral.created_at), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد إحالات بعد</p>
          )}
        </CardContent>
      </Card>

      {/* Loyalty Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">أعضاء برنامج الولاء</CardTitle>
        </CardHeader>
        <CardContent>
          {loyaltyUsers && loyaltyUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">النقاط الحالية</TableHead>
                    <TableHead className="text-right">النقاط المكتسبة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loyaltyUsers.slice(0, 20).map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.full_name || 'مستخدم'}</TableCell>
                      <TableCell>
                        <Badge className={`${tierColors[user.tier]} text-white`}>
                          {tierLabels[user.tier] || user.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.total_points}</TableCell>
                      <TableCell>{user.lifetime_points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا يوجد أعضاء بعد</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
