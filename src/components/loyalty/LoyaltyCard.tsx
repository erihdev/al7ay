import { useLoyaltyTier } from '@/hooks/useLoyaltyTier';
import { LoyaltyTierBadge, tierConfigs, getNextTier } from '@/components/loyalty/LoyaltyTierBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gift, TrendingUp, Percent, Sparkles, Crown, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export function LoyaltyCard() {
  const { user } = useAuth();
  const { data: loyaltyData, isLoading } = useLoyaltyTier();

  // Don't show anything if user is not logged in - let them browse first
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-gold/20 via-gold-light/10 to-background border-gold/30">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="h-14 w-14 bg-gold/30 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gold/20 rounded w-24" />
              <div className="h-3 bg-gold/10 rounded w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tier = loyaltyData?.tier || 'bronze';
  const tierConfig = tierConfigs[tier];
  const nextTier = getNextTier(tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/25 via-gold-light/15 to-primary/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-2 left-4 text-gold">
            <Coins className="w-6 h-6" />
          </div>
          <div className="absolute bottom-4 right-6 text-gold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <CardContent className="relative p-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Tier Icon with Glow Effect */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`relative h-12 w-12 ${tierConfig.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <div className={`absolute inset-0 ${tierConfig.bgColor} rounded-2xl blur-md opacity-50`} />
                <tierConfig.icon className={`relative h-6 w-6 ${tierConfig.textColor}`} />
              </motion.div>
              
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold font-arabic text-sm text-foreground">نقاطي</h3>
                  <LoyaltyTierBadge tier={tier} size="sm" />
                </div>
                <motion.p 
                  key={loyaltyData?.totalPoints}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-bold bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent font-arabic"
                >
                  {loyaltyData?.totalPoints?.toLocaleString('ar-SA') || 0}
                  <span className="text-xs mr-1 text-muted-foreground">نقطة</span>
                </motion.p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-2">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="text-center bg-background/60 backdrop-blur-sm rounded-xl p-2 min-w-[60px] border border-border/50"
              >
                <Gift className="h-4 w-4 text-gold mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground font-arabic">للاستبدال</p>
                <p className="font-bold text-xs font-arabic text-foreground">
                  {Math.floor((loyaltyData?.totalPoints || 0) / 100)} ر.س
                </p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="text-center bg-background/60 backdrop-blur-sm rounded-xl p-2 min-w-[60px] border border-border/50"
              >
                <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground font-arabic">المجموع</p>
                <p className="font-bold text-xs font-arabic text-foreground">
                  {loyaltyData?.lifetimePoints?.toLocaleString('ar-SA') || 0}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Tier Benefits */}
          {(tierConfig.discount > 0 || tierConfig.pointsMultiplier > 1) && (
            <div className="flex gap-2 mb-4">
              {tierConfig.discount > 0 && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierConfig.bgColor} border border-${tier === 'gold' ? 'gold' : tier === 'silver' ? 'slate-400' : 'amber-700'}/20`}
                >
                  <Percent className={`h-3.5 w-3.5 ${tierConfig.textColor}`} />
                  <span className={`text-xs font-arabic font-medium ${tierConfig.textColor}`}>
                    خصم {tierConfig.discount}% على الطلبات
                  </span>
                </motion.div>
              )}
              {tierConfig.pointsMultiplier > 1 && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierConfig.bgColor} border border-${tier === 'gold' ? 'gold' : tier === 'silver' ? 'slate-400' : 'amber-700'}/20`}
                >
                  <Sparkles className={`h-3.5 w-3.5 ${tierConfig.textColor}`} />
                  <span className={`text-xs font-arabic font-medium ${tierConfig.textColor}`}>
                    نقاط ×{tierConfig.pointsMultiplier}
                  </span>
                </motion.div>
              )}
            </div>
          )}

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="bg-background/40 backdrop-blur-sm rounded-xl p-3 border border-border/30">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <Crown className={`h-3.5 w-3.5 ${tierConfigs[nextTier].textColor}`} />
                  <span className="text-muted-foreground font-arabic">
                    للوصول إلى <span className={`font-medium ${tierConfigs[nextTier].textColor}`}>{tierConfigs[nextTier].label}</span>
                  </span>
                </div>
                <span className="font-arabic font-bold text-foreground">
                  {loyaltyData?.pointsToNextTier?.toLocaleString('ar-SA')} نقطة
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={loyaltyData?.progressToNextTier || 0} 
                  className="h-2 bg-muted/50"
                />
                <div 
                  className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                  style={{ width: `${loyaltyData?.progressToNextTier || 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-arabic text-center mt-1.5">
                {Math.round(loyaltyData?.progressToNextTier || 0)}% مكتمل
              </p>
            </div>
          )}

          {!nextTier && (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-center p-3 bg-gradient-to-r from-gold/20 to-gold-light/20 rounded-xl border border-gold/30"
            >
              <div className="flex items-center justify-center gap-2">
                <Crown className="h-5 w-5 text-gold" />
                <p className="text-sm font-arabic text-gold font-bold">
                  أنت في أعلى مستوى! 🎉
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer Info */}
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground font-arabic">
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-gold" />
                10 نقاط مع كل طلب
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span className="flex items-center gap-1">
                <Gift className="h-3 w-3 text-primary" />
                100 نقطة = 1 ر.س
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
