import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoyaltyTier, tierConfigs, getPointsToNextTier, getNextTier } from '@/components/loyalty/LoyaltyTierBadge';

interface LoyaltyData {
  tier: LoyaltyTier;
  totalPoints: number;
  lifetimePoints: number;
  discount: number;
  pointsMultiplier: number;
  pointsToNextTier: number;
  nextTier: LoyaltyTier | null;
  progressToNextTier: number; // percentage
}

export function useLoyaltyTier() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-tier', user?.id],
    queryFn: async (): Promise<LoyaltyData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('total_points, lifetime_points, tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          tier: 'bronze',
          totalPoints: 0,
          lifetimePoints: 0,
          discount: 0,
          pointsMultiplier: 1,
          pointsToNextTier: 500,
          nextTier: 'silver',
          progressToNextTier: 0,
        };
      }

      const tier = (data.tier as LoyaltyTier) || 'bronze';
      const tierConfig = tierConfigs[tier];
      const nextTier = getNextTier(tier);
      const pointsToNextTier = getPointsToNextTier(data.lifetime_points, tier);
      
      let progressToNextTier = 100;
      if (nextTier) {
        const currentTierMin = tierConfig.minPoints;
        const nextTierMin = tierConfigs[nextTier].minPoints;
        const pointsInCurrentTier = data.lifetime_points - currentTierMin;
        const pointsNeededForNext = nextTierMin - currentTierMin;
        progressToNextTier = Math.min(100, (pointsInCurrentTier / pointsNeededForNext) * 100);
      }

      return {
        tier,
        totalPoints: data.total_points,
        lifetimePoints: data.lifetime_points,
        discount: tierConfig.discount,
        pointsMultiplier: tierConfig.pointsMultiplier,
        pointsToNextTier,
        nextTier,
        progressToNextTier,
      };
    },
    enabled: !!user,
  });
}
