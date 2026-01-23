import { useAuth } from '@/contexts/AuthContext';
import { useLoyaltyPoints, usePointsHistory } from '@/hooks/useOrders';
import { useLoyaltyTier } from '@/hooks/useLoyaltyTier';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthForm } from '@/components/auth/AuthForm';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { LocalNotificationSettings } from '@/components/notifications/LocalNotificationSettings';
import { VolumeControl } from '@/components/notifications/VolumeControl';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { VehicleInfo } from '@/components/profile/VehicleInfo';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { LoyaltyTierBadge, tierConfigs } from '@/components/loyalty/LoyaltyTierBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { LogOut, Star, User, History, Settings, ChevronLeft, Download, Crown, Gift, Bell, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition, fadeInUp, staggerContainer } from '@/components/ui/PageTransition';

const Profile = () => {
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const { data: loyaltyPoints, isLoading: pointsLoading } = useLoyaltyPoints();
  const { data: loyaltyTier } = useLoyaltyTier(user?.id);
  const { data: pointsHistory, isLoading: historyLoading } = usePointsHistory();
  
  // Fetch profile data for avatar
  const { data: profileData } = useQuery({
    queryKey: ['profile-avatar', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic overflow-x-hidden" dir="rtl">
        <div className="w-full max-w-lg mx-auto px-3 py-6 pb-28">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background font-arabic relative overflow-x-hidden" dir="rtl">
          <div className="w-full max-w-lg mx-auto px-3 py-6 pb-28">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">مرحباً بك</h1>
              <p className="text-muted-foreground mt-2">سجل دخولك للاستمتاع بجميع المميزات</p>
            </motion.div>
            <AuthForm />
          </div>
          <BottomNav />
        </div>
      </PageTransition>
    );
  }

  const tierColor = loyaltyTier?.tier === 'gold' 
    ? 'from-amber-500 to-yellow-400' 
    : loyaltyTier?.tier === 'silver' 
      ? 'from-gray-400 to-gray-300' 
      : 'from-primary to-primary/70';

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background font-arabic overflow-x-hidden" dir="rtl">
        {/* Compact Hero Header */}
        <div className="relative pt-[env(safe-area-inset-top)] pb-4 px-4">
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <motion.div 
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tierColor} p-0.5 shadow-lg`}>
                  <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                    {profileData?.avatar_url ? (
                      <img 
                        src={profileData.avatar_url} 
                        alt="صورة شخصية"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>
                {loyaltyTier && (
                  <motion.div 
                    className="absolute -bottom-1 -right-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <LoyaltyTierBadge tier={loyaltyTier.tier} size="sm" />
                  </motion.div>
                )}
              </motion.div>
              
              <div>
                <motion.h1 
                  className="text-lg font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  مرحباً {profileData?.full_name ? profileData.full_name.split(' ')[0] : ''} 👋
                </motion.h1>
                <motion.p 
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  عضو منذ {format(new Date(user.created_at), 'MMM yyyy', { locale: ar })}
                </motion.p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <div className="w-full max-w-lg mx-auto px-3 pb-28">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {/* Profile Info Card */}
            <motion.div variants={fadeInUp}>
              <ProfileInfo />
            </motion.div>

            {/* Loyalty Points Card - Compact Premium Design */}
            <motion.div variants={fadeInUp}>
              <Link to="/loyalty">
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Crown className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">نقاط الولاء</p>
                          {pointsLoading ? (
                            <Skeleton className="h-7 w-16" />
                          ) : (
                            <p className="text-2xl font-bold text-primary">
                              {loyaltyPoints?.total_points || 0}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    {loyaltyTier && loyaltyTier.nextTier && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {tierConfigs[loyaltyTier.nextTier].label}
                          </span>
                          <span>{loyaltyTier.pointsToNextTier} نقطة</span>
                        </div>
                        <Progress value={loyaltyTier.progressToNextTier} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3">
              <Link to="/install">
                <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 border-0 shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Download className="h-5 w-5 text-accent" />
                    </div>
                    <span className="font-medium text-sm">تثبيت التطبيق</span>
                  </CardContent>
                </Card>
              </Link>
              
              {isAdmin ? (
                <Link to="/admin">
                  <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 bg-primary/5 border-0 shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Settings className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-sm">لوحة التحكم</span>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Link to="/favorites">
                  <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 border-0 shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <Star className="h-5 w-5 text-red-500" />
                      </div>
                      <span className="font-medium text-sm">المفضلة</span>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </motion.div>

            {/* Vehicle Info */}
            <motion.div variants={fadeInUp}>
              <VehicleInfo />
            </motion.div>

            {/* Referral Card */}
            <motion.div variants={fadeInUp}>
              <ReferralCard />
            </motion.div>

            {/* Points History */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-5 w-5 text-primary" />
                    سجل النقاط
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {historyLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14" />
                      ))}
                    </div>
                  ) : pointsHistory?.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Gift className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground font-medium">لا توجد معاملات بعد</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">اطلب الآن لتجمع النقاط!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pointsHistory?.slice(0, 5).map((record, index) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              record.points_change > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                            }`}>
                              {record.points_change > 0 ? (
                                <Star className="h-4 w-4 text-green-600" />
                              ) : (
                                <Gift className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{record.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(record.created_at), 'dd MMM yyyy', { locale: ar })}
                              </p>
                            </div>
                          </div>
                          <span className={`font-bold text-lg ${
                            record.points_change > 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {record.points_change > 0 ? '+' : ''}{record.points_change}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Settings Section */}
            <motion.div variants={fadeInUp}>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">الإعدادات</h3>
              </div>
              <div className="space-y-3">
                <Card className="border-0 shadow">
                  <CardContent className="p-4">
                    <VolumeControl />
                  </CardContent>
                </Card>
                <NotificationSettings />
                <LocalNotificationSettings />
              </div>
            </motion.div>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default Profile;
