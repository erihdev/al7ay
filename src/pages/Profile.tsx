import { useAuth } from '@/contexts/AuthContext';
import { useLoyaltyPoints, usePointsHistory } from '@/hooks/useOrders';
import { useLoyaltyTier } from '@/hooks/useLoyaltyTier';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthForm } from '@/components/auth/AuthForm';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { LocalNotificationSettings } from '@/components/notifications/LocalNotificationSettings';
import { ReferralCard } from '@/components/referral/ReferralCard';
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
import { FloatingParticles } from '@/components/ui/InteractiveBackground';

const Profile = () => {
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const { data: loyaltyPoints, isLoading: pointsLoading } = useLoyaltyPoints();
  const { data: loyaltyTier } = useLoyaltyTier();
  const { data: pointsHistory, isLoading: historyLoading } = usePointsHistory();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="container mx-auto px-4 py-8 pb-24">
          <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto mb-8" />
          <Skeleton className="h-48 mb-4" />
          <Skeleton className="h-32" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
          <FloatingParticles count={8} />
          <div className="container mx-auto px-4 py-8 pb-24">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
      : 'from-orange-600 to-orange-400';

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
        <FloatingParticles count={8} />
        
        {/* Hero Header */}
        <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pt-8 pb-16">
          <motion.div 
            className="container mx-auto px-4 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Avatar */}
            <motion.div 
              className="relative inline-block mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${tierColor} p-1 shadow-lg`}>
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
              </div>
              {/* Tier Badge */}
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

            {/* User Info */}
            <motion.h1 
              className="text-xl font-bold mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {user.email?.split('@')[0]}
            </motion.h1>
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              عضو منذ {format(new Date(user.created_at), 'MMMM yyyy', { locale: ar })}
            </motion.p>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 pb-24 -mt-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {/* Loyalty Points Card - Premium Design */}
            <motion.div variants={fadeInUp}>
              <Link to="/loyalty">
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
                  <CardContent className="p-0">
                    <div className="p-5 relative">
                      {/* Decorative elements */}
                      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2" />
                      
                      <div className="relative flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Crown className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-semibold text-muted-foreground">نقاط الولاء</span>
                          </div>
                          
                          {pointsLoading ? (
                            <Skeleton className="h-12 w-24" />
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                                {loyaltyPoints?.total_points || 0}
                              </span>
                              <span className="text-muted-foreground">نقطة</span>
                            </div>
                          )}
                        </div>
                        
                        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      {loyaltyTier && loyaltyTier.nextTier && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              للمستوى {tierConfigs[loyaltyTier.nextTier].label}
                            </span>
                            <span>{loyaltyTier.pointsToNextTier} نقطة متبقية</span>
                          </div>
                          <Progress value={loyaltyTier.progressToNextTier} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-primary/5 px-5 py-3 text-xs text-muted-foreground flex items-center justify-between">
                      <span>كل 100 نقطة = 1 ر.س خصم</span>
                      <span className="text-primary font-medium">اضغط للمزيد</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3">
              <Link to="/install">
                <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <Download className="h-6 w-6 text-accent" />
                    </div>
                    <span className="font-medium text-sm">تثبيت التطبيق</span>
                  </CardContent>
                </Card>
              </Link>
              
              {isAdmin ? (
                <Link to="/admin">
                  <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 bg-primary/5">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium text-sm">لوحة التحكم</span>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Link to="/favorites">
                  <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Star className="h-6 w-6 text-red-500" />
                      </div>
                      <span className="font-medium text-sm">المفضلة</span>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </motion.div>

            {/* Referral Card */}
            <motion.div variants={fadeInUp}>
              <ReferralCard />
            </motion.div>

            {/* Points History */}
            <motion.div variants={fadeInUp}>
              <Card>
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
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">لا توجد معاملات بعد</p>
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
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                الإعدادات
              </h3>
              <div className="space-y-3">
                <NotificationSettings />
                <LocalNotificationSettings />
              </div>
            </motion.div>

            {/* Sign Out Button */}
            <motion.div variants={fadeInUp}>
              <Button
                variant="outline"
                className="w-full mt-4 h-12 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5 ml-2" />
                تسجيل الخروج
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default Profile;