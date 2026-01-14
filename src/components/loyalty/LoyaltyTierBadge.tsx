import { Crown, Award, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

interface TierConfig {
  label: string;
  icon: typeof Crown;
  bgColor: string;
  textColor: string;
  minPoints: number;
  discount: number; // percentage discount
  pointsMultiplier: number;
}

export const tierConfigs: Record<LoyaltyTier, TierConfig> = {
  bronze: {
    label: 'برونزي',
    icon: Medal,
    bgColor: 'bg-amber-700/20',
    textColor: 'text-amber-700',
    minPoints: 0,
    discount: 0,
    pointsMultiplier: 1,
  },
  silver: {
    label: 'فضي',
    icon: Award,
    bgColor: 'bg-slate-400/20',
    textColor: 'text-slate-500',
    minPoints: 500,
    discount: 5,
    pointsMultiplier: 1.25,
  },
  gold: {
    label: 'ذهبي',
    icon: Crown,
    bgColor: 'bg-gold/20',
    textColor: 'text-gold',
    minPoints: 1500,
    discount: 10,
    pointsMultiplier: 1.5,
  },
};

export function getTierFromPoints(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= 1500) return 'gold';
  if (lifetimePoints >= 500) return 'silver';
  return 'bronze';
}

export function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  if (currentTier === 'bronze') return 'silver';
  if (currentTier === 'silver') return 'gold';
  return null;
}

export function getPointsToNextTier(lifetimePoints: number, currentTier: LoyaltyTier): number {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 0;
  return tierConfigs[nextTier].minPoints - lifetimePoints;
}

interface LoyaltyTierBadgeProps {
  tier: LoyaltyTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function LoyaltyTierBadge({ tier, size = 'md', showLabel = true }: LoyaltyTierBadgeProps) {
  const config = tierConfigs[tier];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Badge className={`${config.bgColor} ${config.textColor} gap-1 font-arabic`}>
      <IconComponent className={sizeClasses[size]} />
      {showLabel && config.label}
    </Badge>
  );
}
