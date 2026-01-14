import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsAwarded: number;
}

export interface TopReferrer {
  referrer_id: string;
  full_name: string | null;
  email: string | null;
  referral_count: number;
  total_points_awarded: number;
}

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  referrer_points_awarded: number;
  referred_points_awarded: number;
  created_at: string;
  completed_at: string | null;
  referrer_name?: string;
  referred_name?: string;
}

export function useAdminReferralStats() {
  return useQuery({
    queryKey: ['admin-referral-stats'],
    queryFn: async (): Promise<ReferralStats> => {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*');

      if (error) throw error;

      const totalReferrals = referrals?.length || 0;
      const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
      const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
      const totalPointsAwarded = referrals?.reduce((sum, r) => 
        sum + (r.referrer_points_awarded || 0) + (r.referred_points_awarded || 0), 0) || 0;

      return {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalPointsAwarded,
      };
    },
  });
}

export function useTopReferrers(limit: number = 10) {
  return useQuery({
    queryKey: ['top-referrers', limit],
    queryFn: async (): Promise<TopReferrer[]> => {
      // Get all completed referrals
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('referrer_id, referrer_points_awarded')
        .eq('status', 'completed');

      if (refError) throw refError;

      // Aggregate by referrer
      const referrerMap = new Map<string, { count: number; points: number }>();
      referrals?.forEach(ref => {
        const existing = referrerMap.get(ref.referrer_id) || { count: 0, points: 0 };
        referrerMap.set(ref.referrer_id, {
          count: existing.count + 1,
          points: existing.points + (ref.referrer_points_awarded || 0),
        });
      });

      // Get profile info for top referrers
      const referrerIds = Array.from(referrerMap.keys());
      if (referrerIds.length === 0) return [];

      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', referrerIds);

      if (profError) throw profError;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Build and sort result
      const topReferrers: TopReferrer[] = Array.from(referrerMap.entries())
        .map(([referrer_id, data]) => ({
          referrer_id,
          full_name: profileMap.get(referrer_id) || null,
          email: null,
          referral_count: data.count,
          total_points_awarded: data.points,
        }))
        .sort((a, b) => b.referral_count - a.referral_count)
        .slice(0, limit);

      return topReferrers;
    },
  });
}

export function useAllReferrals() {
  return useQuery({
    queryKey: ['admin-all-referrals'],
    queryFn: async (): Promise<ReferralRecord[]> => {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all unique user IDs
      const userIds = new Set<string>();
      referrals?.forEach(r => {
        userIds.add(r.referrer_id);
        userIds.add(r.referred_id);
      });

      // Fetch profile names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return referrals?.map(r => ({
        ...r,
        referrer_name: profileMap.get(r.referrer_id) || 'مستخدم',
        referred_name: profileMap.get(r.referred_id) || 'مستخدم',
      })) || [];
    },
  });
}

export interface LoyaltyStats {
  totalUsers: number;
  bronzeUsers: number;
  silverUsers: number;
  goldUsers: number;
  totalPoints: number;
  totalLifetimePoints: number;
}

export interface LoyaltyUserRecord {
  user_id: string;
  full_name: string | null;
  tier: string;
  total_points: number;
  lifetime_points: number;
  updated_at: string;
}

export function useAdminLoyaltyStats() {
  return useQuery({
    queryKey: ['admin-loyalty-stats'],
    queryFn: async (): Promise<LoyaltyStats> => {
      const { data: loyaltyData, error } = await supabase
        .from('loyalty_points')
        .select('*');

      if (error) throw error;

      const totalUsers = loyaltyData?.length || 0;
      const bronzeUsers = loyaltyData?.filter(l => l.tier === 'bronze').length || 0;
      const silverUsers = loyaltyData?.filter(l => l.tier === 'silver').length || 0;
      const goldUsers = loyaltyData?.filter(l => l.tier === 'gold').length || 0;
      const totalPoints = loyaltyData?.reduce((sum, l) => sum + l.total_points, 0) || 0;
      const totalLifetimePoints = loyaltyData?.reduce((sum, l) => sum + l.lifetime_points, 0) || 0;

      return {
        totalUsers,
        bronzeUsers,
        silverUsers,
        goldUsers,
        totalPoints,
        totalLifetimePoints,
      };
    },
  });
}

export function useAllLoyaltyUsers() {
  return useQuery({
    queryKey: ['admin-all-loyalty-users'],
    queryFn: async (): Promise<LoyaltyUserRecord[]> => {
      const { data: loyaltyData, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .order('lifetime_points', { ascending: false });

      if (error) throw error;

      const userIds = loyaltyData?.map(l => l.user_id) || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return loyaltyData?.map(l => ({
        user_id: l.user_id,
        full_name: profileMap.get(l.user_id) || null,
        tier: l.tier,
        total_points: l.total_points,
        lifetime_points: l.lifetime_points,
        updated_at: l.updated_at,
      })) || [];
    },
  });
}
