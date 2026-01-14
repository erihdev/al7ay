import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMyReferralCode, useReferralStats, useApplyReferralCode } from '@/hooks/useReferrals';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Copy, Gift, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReferralCard() {
  const { user } = useAuth();
  const { data: referralCode, isLoading: isLoadingCode } = useMyReferralCode();
  const { data: stats } = useReferralStats();
  const applyReferral = useApplyReferralCode();
  const [inputCode, setInputCode] = useState('');
  const [showInput, setShowInput] = useState(false);

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success('تم نسخ الكود!');
    }
  };

  const shareCode = () => {
    if (referralCode) {
      const shareText = `انضم لتطبيق الحي واحصل على 25 نقطة مجانية! استخدم كود الإحالة: ${referralCode}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'دعوة للانضمام',
          text: shareText,
        });
      } else {
        navigator.clipboard.writeText(shareText);
        toast.success('تم نسخ رسالة الدعوة!');
      }
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    
    try {
      await applyReferral.mutateAsync(inputCode);
      toast.success('تم تطبيق كود الإحالة! حصلت على 25 نقطة');
      setInputCode('');
      setShowInput(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!user) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-bold font-arabic">ادعُ أصدقاءك</h3>
              <p className="text-sm text-muted-foreground font-arabic">
                سجل دخولك للحصول على كود الإحالة الخاص بك
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-arabic">
          <Users className="h-5 w-5 text-primary" />
          ادعُ أصدقاءك
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Your Referral Code */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2 font-arabic">كود الإحالة الخاص بك</p>
          <div className="flex items-center gap-2">
            {isLoadingCode ? (
              <div className="h-10 bg-muted animate-pulse rounded flex-1" />
            ) : (
              <>
                <div className="flex-1 bg-background rounded-lg p-3 text-center">
                  <span className="font-mono font-bold text-xl tracking-wider">
                    {referralCode || '---'}
                  </span>
                </div>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <Button 
            className="w-full mt-3 font-arabic" 
            onClick={shareCode}
          >
            مشاركة الدعوة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-lg font-bold">{stats?.totalReferrals || 0}</p>
            <p className="text-xs text-muted-foreground font-arabic">إحالات</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-lg font-bold">{stats?.completedReferrals || 0}</p>
            <p className="text-xs text-muted-foreground font-arabic">مكتملة</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-lg font-bold text-gold">{stats?.totalPointsEarned || 0}</p>
            <p className="text-xs text-muted-foreground font-arabic">نقاط</p>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="font-arabic">أنت تحصل على <b>50 نقطة</b> لكل صديق يسجل</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="font-arabic">صديقك يحصل على <b>25 نقطة</b> عند التسجيل</span>
          </div>
        </div>

        {/* Apply Referral Code */}
        <div className="border-t pt-4">
          {!showInput ? (
            <Button 
              variant="outline" 
              className="w-full font-arabic"
              onClick={() => setShowInput(true)}
            >
              لديك كود إحالة؟
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="أدخل كود الإحالة"
                  dir="ltr"
                  className="font-mono"
                />
                <Button 
                  onClick={handleApplyCode}
                  disabled={applyReferral.isPending || !inputCode.trim()}
                >
                  {applyReferral.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'تطبيق'
                  )}
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full font-arabic"
                onClick={() => setShowInput(false)}
              >
                إلغاء
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
