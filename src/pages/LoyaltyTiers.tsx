import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLoyaltyTier } from '@/hooks/useLoyaltyTier';
import { useAuth } from '@/contexts/AuthContext';
import { LoyaltyTierBadge, tierConfigs, LoyaltyTier } from '@/components/loyalty/LoyaltyTierBadge';
import { 
  Crown, Award, Medal, Star, Percent, Sparkles, Gift, 
  TrendingUp, CheckCircle, Lock, ArrowLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold'];

const tierBenefits: Record<LoyaltyTier, { icon: typeof Star; text: string }[]> = {
  bronze: [
    { icon: Star, text: 'اكسب 10 نقاط مع كل طلب' },
    { icon: Gift, text: 'استبدل النقاط بخصومات' },
  ],
  silver: [
    { icon: Star, text: 'اكسب 10 نقاط مع كل طلب' },
    { icon: Gift, text: 'استبدل النقاط بخصومات' },
    { icon: Percent, text: 'خصم 5% على جميع الطلبات' },
    { icon: Sparkles, text: 'مضاعف نقاط ×1.25' },
  ],
  gold: [
    { icon: Star, text: 'اكسب 10 نقاط مع كل طلب' },
    { icon: Gift, text: 'استبدل النقاط بخصومات' },
    { icon: Percent, text: 'خصم 10% على جميع الطلبات' },
    { icon: Sparkles, text: 'مضاعف نقاط ×1.5' },
    { icon: Crown, text: 'أولوية في التوصيل' },
    { icon: Gift, text: 'هدايا حصرية شهرية' },
  ],
};

export default function LoyaltyTiers() {
  const { user } = useAuth();
  const { data: loyaltyData, isLoading } = useLoyaltyTier();

  const currentTier = loyaltyData?.tier || 'bronze';

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">مستويات الولاء</h1>
        </div>

        {/* Current Status */}
        {user && loyaltyData && (
          <Card className="mb-6 bg-gradient-to-br from-gold/20 to-gold-light/10 border-gold/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">مستواك الحالي</p>
                  <LoyaltyTierBadge tier={currentTier} size="lg" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold text-gold">{loyaltyData.lifetimePoints}</p>
                  <p className="text-sm text-muted-foreground">نقطة مجموعة</p>
                </div>
              </div>

              {loyaltyData.nextTier && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>للمستوى {tierConfigs[loyaltyData.nextTier].label}</span>
                    <span className="font-bold">{loyaltyData.pointsToNextTier} نقطة متبقية</span>
                  </div>
                  <Progress value={loyaltyData.progressToNextTier} className="h-3" />
                </div>
              )}

              {!loyaltyData.nextTier && (
                <div className="text-center p-3 bg-gold/20 rounded-lg mt-4">
                  <p className="font-bold text-gold">🎉 مبروك! أنت في أعلى مستوى!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Login Prompt */}
        {!user && (
          <Card className="mb-6 border-primary/30">
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">انضم لبرنامج الولاء</h3>
              <p className="text-muted-foreground mb-4">
                سجل دخولك للبدء في جمع النقاط والاستفادة من المزايا
              </p>
              <Link to="/profile">
                <Button className="font-arabic">تسجيل الدخول</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Tiers Grid */}
        <div className="space-y-4">
          {tierOrder.map((tier) => {
            const config = tierConfigs[tier];
            const benefits = tierBenefits[tier];
            const isUnlocked = user && tierOrder.indexOf(currentTier) >= tierOrder.indexOf(tier);
            const isCurrent = tier === currentTier;

            return (
              <Card 
                key={tier} 
                className={`transition-all ${
                  isCurrent 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : isUnlocked 
                      ? 'opacity-90' 
                      : 'opacity-60'
                }`}
              >
                <CardHeader className={`pb-3 ${config.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-background`}>
                        <config.icon className={`h-6 w-6 ${config.textColor}`} />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {config.label}
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              مستواك
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {config.minPoints === 0 
                            ? 'المستوى الأساسي' 
                            : `من ${config.minPoints} نقطة`}
                        </p>
                      </div>
                    </div>
                    {isUnlocked ? (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                          <benefit.icon className={`h-4 w-4 ${config.textColor}`} />
                        </div>
                        <span className="text-sm">{benefit.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Discount & Multiplier Highlights */}
                  {(config.discount > 0 || config.pointsMultiplier > 1) && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      {config.discount > 0 && (
                        <Badge className={`${config.bgColor} ${config.textColor}`}>
                          <Percent className="h-3 w-3 ml-1" />
                          خصم {config.discount}%
                        </Badge>
                      )}
                      {config.pointsMultiplier > 1 && (
                        <Badge className={`${config.bgColor} ${config.textColor}`}>
                          <TrendingUp className="h-3 w-3 ml-1" />
                          نقاط ×{config.pointsMultiplier}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How it works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">كيف يعمل البرنامج؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-semibold">اطلب واكسب النقاط</p>
                <p className="text-sm text-muted-foreground">
                  احصل على 10 نقاط مع كل طلب تقوم به
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-semibold">ارتقِ بمستواك</p>
                <p className="text-sm text-muted-foreground">
                  كلما جمعت نقاط أكثر، ارتفع مستواك وزادت مزاياك
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-semibold">استمتع بالمزايا</p>
                <p className="text-sm text-muted-foreground">
                  استبدل نقاطك بخصومات أو استمتع بخصومات تلقائية حسب مستواك
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
