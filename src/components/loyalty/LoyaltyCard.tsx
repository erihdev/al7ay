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

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-gold/20 to-gold-light/10 border-gold/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gold/20 rounded-full flex items-center justify-center">
              <Star className="h-6 w-6 text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold font-arabic text-foreground">برنامج الولاء</h3>
              <p className="text-sm text-muted-foreground font-arabic">
                سجل دخولك لتجمع النقاط!
              </p>
            </div>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="font-arabic">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
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
      <CardContent className="p-4">
        {/* Header with Tier Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 ${tierConfig.bgColor} rounded-full flex items-center justify-center`}>
              <tierConfig.icon className={`h-6 w-6 ${tierConfig.textColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-arabic text-foreground">نقاطي</h3>
                <LoyaltyTierBadge tier={tier} size="sm" />
              </div>
              <p className="text-2xl font-bold text-gold font-arabic">
                {loyaltyData?.totalPoints || 0}
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div>
              <Gift className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground font-arabic">للاستبدال</p>
              <p className="font-bold text-sm font-arabic">
                {Math.floor((loyaltyData?.totalPoints || 0) / 100)} ر.س
              </p>
            </div>
            <div>
              <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground font-arabic">المجموع</p>
              <p className="font-bold text-sm font-arabic">
                {loyaltyData?.lifetimePoints || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {tierConfig.discount > 0 && (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${tierConfig.bgColor}`}>
              <Percent className={`h-4 w-4 ${tierConfig.textColor}`} />
              <span className="text-xs font-arabic">خصم {tierConfig.discount}% على الطلبات</span>
            </div>
          )}
          {tierConfig.pointsMultiplier > 1 && (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${tierConfig.bgColor}`}>
              <Sparkles className={`h-4 w-4 ${tierConfig.textColor}`} />
              <span className="text-xs font-arabic">نقاط ×{tierConfig.pointsMultiplier}</span>
            </div>
          )}
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-arabic">
                للمستوى {tierConfigs[nextTier].label}
              </span>
              <span className="font-arabic font-bold">
                {loyaltyData?.pointsToNextTier} نقطة متبقية
              </span>
            </div>
            <Progress value={loyaltyData?.progressToNextTier || 0} className="h-2" />
          </div>
        )}

        {!nextTier && (
          <div className="text-center p-2 bg-gold/20 rounded-lg">
            <p className="text-sm font-arabic text-gold font-bold">
              🎉 أنت في أعلى مستوى!
            </p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gold/20">
          <p className="text-xs text-muted-foreground font-arabic text-center">
            اكسب 10 نقاط مع كل طلب • كل 100 نقطة = 1 ر.س خصم
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
