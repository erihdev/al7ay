import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const REFERRER_BONUS_POINTS = 50;
const REFERRED_BONUS_POINTS = 25;

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  referrer_points_awarded: number;
  referred_points_awarded: number;
  created_at: string;
  completed_at: string | null;
}

export function useMyReferralCode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data?.referral_code;
    },
    enabled: !!user,
  });
}

export function useMyReferrals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!user,
  });
}

export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return { totalReferrals: 0, completedReferrals: 0, totalPointsEarned: 0 };

      const { data, error } = await supabase
        .from('referrals')
        .select('status, referrer_points_awarded')
        .eq('referrer_id', user.id);

      if (error) throw error;

      const totalReferrals = data?.length || 0;
      const completedReferrals = data?.filter(r => r.status === 'rewarded').length || 0;
      const totalPointsEarned = data?.reduce((sum, r) => sum + (r.referrer_points_awarded || 0), 0) || 0;

      return { totalReferrals, completedReferrals, totalPointsEarned };
    },
    enabled: !!user,
  });
}

export function useApplyReferralCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referralCode: string) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      // Check if user already used a referral code
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', user.id)
        .maybeSingle();

      if (existingReferral) {
        throw new Error('لقد استخدمت كود إحالة مسبقاً');
      }

      // Find the referrer by code
      const { data: referrerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (profileError || !referrerProfile) {
        throw new Error('كود الإحالة غير صالح');
      }

      if (referrerProfile.user_id === user.id) {
        throw new Error('لا يمكنك استخدام كود الإحالة الخاص بك');
      }

      // Create the referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerProfile.user_id,
          referred_id: user.id,
          referral_code: referralCode.toUpperCase(),
          status: 'completed',
          referrer_points_awarded: REFERRER_BONUS_POINTS,
          referred_points_awarded: REFERRED_BONUS_POINTS,
          completed_at: new Date().toISOString(),
        });

      if (referralError) throw referralError;

      // Award points to the referred user (current user)
      const { data: referredPoints } = await supabase
        .from('loyalty_points')
        .select('total_points, lifetime_points')
        .eq('user_id', user.id)
        .single();

      if (referredPoints) {
        await supabase
          .from('loyalty_points')
          .update({
            total_points: referredPoints.total_points + REFERRED_BONUS_POINTS,
            lifetime_points: referredPoints.lifetime_points + REFERRED_BONUS_POINTS,
          })
          .eq('user_id', user.id);

        await supabase.from('points_history').insert({
          user_id: user.id,
          points_change: REFERRED_BONUS_POINTS,
          transaction_type: 'referral_bonus',
          description: 'مكافأة التسجيل بكود إحالة',
        });
      }

      // Award points to the referrer
      const { data: referrerPoints } = await supabase
        .from('loyalty_points')
        .select('total_points, lifetime_points')
        .eq('user_id', referrerProfile.user_id)
        .single();

      if (referrerPoints) {
        await supabase
          .from('loyalty_points')
          .update({
            total_points: referrerPoints.total_points + REFERRER_BONUS_POINTS,
            lifetime_points: referrerPoints.lifetime_points + REFERRER_BONUS_POINTS,
          })
          .eq('user_id', referrerProfile.user_id);

        await supabase.from('points_history').insert({
          user_id: referrerProfile.user_id,
          points_change: REFERRER_BONUS_POINTS,
          transaction_type: 'referral_bonus',
          description: 'مكافأة إحالة صديق جديد',
        });
      }

      // Update referral status to rewarded
      await supabase
        .from('referrals')
        .update({ status: 'rewarded' })
        .eq('referred_id', user.id);

      return { referrerBonus: REFERRER_BONUS_POINTS, referredBonus: REFERRED_BONUS_POINTS };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
  });
}
