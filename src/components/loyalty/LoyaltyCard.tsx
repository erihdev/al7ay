import { useLoyaltyPoints } from '@/hooks/useOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Gift, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LoyaltyCard() {
  const { user } = useAuth();
  const { data: points, isLoading } = useLoyaltyPoints();

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

  return (
    <Card className="bg-gradient-to-br from-gold/20 to-gold-light/10 border-gold/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gold/30 rounded-full flex items-center justify-center">
              <Star className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h3 className="font-bold font-arabic text-foreground">نقاطي</h3>
              <p className="text-2xl font-bold text-gold font-arabic">
                {points?.total_points || 0}
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div>
              <Gift className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground font-arabic">للاستبدال</p>
              <p className="font-bold text-sm font-arabic">
                {Math.floor((points?.total_points || 0) / 100)} ر.س
              </p>
            </div>
            <div>
              <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground font-arabic">المجموع</p>
              <p className="font-bold text-sm font-arabic">
                {points?.lifetime_points || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gold/20">
          <p className="text-xs text-muted-foreground font-arabic text-center">
            اكسب 10 نقاط مع كل طلب • كل 100 نقطة = 1 ر.س خصم
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
