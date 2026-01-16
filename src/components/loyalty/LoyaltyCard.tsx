import { useLoyaltyTier } from '@/hooks/useLoyaltyTier';
import { LoyaltyTierBadge, tierConfigs, getNextTier } from '@/components/loyalty/LoyaltyTierBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Gift, TrendingUp, Percent, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LoyaltyCard() {
  const { user } = useAuth();
  const { data: loyaltyData, isLoading } = useLoyaltyTier();

  // Don't show anything if user is not logged in - let them browse first
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gold/20 to-gold-light/10 border-gold/30">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="h-12 w-12 bg-gold/30 rounded-full" />
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
    <Card className="bg-gradient-to-br from-gold/20 to-gold-light/10 border-gold/30 overflow-hidden">
      <CardContent className="p-3">
        {/* Header with Tier Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 ${tierConfig.bgColor} rounded-full flex items-center justify-center`}>
              <tierConfig.icon className={`h-5 w-5 ${tierConfig.textColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold font-arabic text-sm text-foreground">نقاطي</h3>
                <LoyaltyTierBadge tier={tier} size="sm" />
              </div>
              <p className="text-xl font-bold text-gold font-arabic">
                {loyaltyData?.totalPoints || 0}
              </p>
            </div>
          </div>

          <div className="flex gap-3 text-center">
            <div>
              <Gift className="h-4 w-4 text-muted-foreground mx-auto mb-0.5" />
              <p className="text-[10px] text-muted-foreground font-arabic">للاستبدال</p>
              <p className="font-bold text-xs font-arabic">
                {Math.floor((loyaltyData?.totalPoints || 0) / 100)} ر.س
              </p>
            </div>
            <div>
              <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-0.5" />
              <p className="text-[10px] text-muted-foreground font-arabic">المجموع</p>
              <p className="font-bold text-xs font-arabic">
                {loyaltyData?.lifetimePoints || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {tierConfig.discount > 0 && (
            <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${tierConfig.bgColor}`}>
              <Percent className={`h-3 w-3 ${tierConfig.textColor}`} />
              <span className="text-[10px] font-arabic">خصم {tierConfig.discount}%</span>
            </div>
          )}
          {tierConfig.pointsMultiplier > 1 && (
            <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${tierConfig.bgColor}`}>
              <Sparkles className={`h-3 w-3 ${tierConfig.textColor}`} />
              <span className="text-[10px] font-arabic">نقاط ×{tierConfig.pointsMultiplier}</span>
            </div>
          )}
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-arabic">
                للمستوى {tierConfigs[nextTier].label}
              </span>
              <span className="font-arabic font-bold">
                {loyaltyData?.pointsToNextTier} نقطة
              </span>
            </div>
            <Progress value={loyaltyData?.progressToNextTier || 0} className="h-1.5" />
          </div>
        )}

        {!nextTier && (
          <div className="text-center p-1.5 bg-gold/20 rounded-lg">
            <p className="text-xs font-arabic text-gold font-bold">
              🎉 أنت في أعلى مستوى!
            </p>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gold/20">
          <p className="text-[10px] text-muted-foreground font-arabic text-center">
            10 نقاط مع كل طلب • 100 نقطة = 1 ر.س
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
