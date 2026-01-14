import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { 
  ReferralStats, 
  TopReferrer, 
  ReferralRecord,
  LoyaltyStats,
  LoyaltyUserRecord 
} from '@/hooks/useAdminReferrals';

export function exportLoyaltyToExcel(
  loyaltyStats: LoyaltyStats,
  loyaltyUsers: LoyaltyUserRecord[],
  referralStats: ReferralStats,
  topReferrers: TopReferrer[],
  allReferrals: ReferralRecord[]
) {
  const workbook = XLSX.utils.book_new();

  // Loyalty Stats Sheet
  const loyaltyStatsData = [
    ['إحصائيات الولاء', ''],
    ['إجمالي الأعضاء', loyaltyStats.totalUsers],
    ['الأعضاء البرونزيين', loyaltyStats.bronzeUsers],
    ['الأعضاء الفضيين', loyaltyStats.silverUsers],
    ['الأعضاء الذهبيين', loyaltyStats.goldUsers],
    ['إجمالي النقاط الحالية', loyaltyStats.totalPoints],
    ['إجمالي النقاط المكتسبة', loyaltyStats.totalLifetimePoints],
  ];
  const loyaltyStatsSheet = XLSX.utils.aoa_to_sheet(loyaltyStatsData);
  XLSX.utils.book_append_sheet(workbook, loyaltyStatsSheet, 'إحصائيات الولاء');

  // Loyalty Users Sheet
  const loyaltyUsersData = [
    ['الاسم', 'المستوى', 'النقاط الحالية', 'النقاط المكتسبة', 'آخر تحديث'],
    ...loyaltyUsers.map(u => [
      u.full_name || 'مستخدم',
      getTierLabel(u.tier),
      u.total_points,
      u.lifetime_points,
      format(new Date(u.updated_at), 'yyyy-MM-dd'),
    ])
  ];
  const loyaltyUsersSheet = XLSX.utils.aoa_to_sheet(loyaltyUsersData);
  XLSX.utils.book_append_sheet(workbook, loyaltyUsersSheet, 'أعضاء الولاء');

  // Referral Stats Sheet
  const referralStatsData = [
    ['إحصائيات الإحالات', ''],
    ['إجمالي الإحالات', referralStats.totalReferrals],
    ['الإحالات المكتملة', referralStats.completedReferrals],
    ['الإحالات المعلقة', referralStats.pendingReferrals],
    ['إجمالي النقاط الممنوحة', referralStats.totalPointsAwarded],
  ];
  const referralStatsSheet = XLSX.utils.aoa_to_sheet(referralStatsData);
  XLSX.utils.book_append_sheet(workbook, referralStatsSheet, 'إحصائيات الإحالات');

  // Top Referrers Sheet
  const topReferrersData = [
    ['الاسم', 'عدد الإحالات', 'النقاط الممنوحة'],
    ...topReferrers.map(r => [
      r.full_name || 'مستخدم',
      r.referral_count,
      r.total_points_awarded,
    ])
  ];
  const topReferrersSheet = XLSX.utils.aoa_to_sheet(topReferrersData);
  XLSX.utils.book_append_sheet(workbook, topReferrersSheet, 'أفضل المحيلين');

  // All Referrals Sheet
  const allReferralsData = [
    ['المُحيل', 'المُحال', 'كود الإحالة', 'الحالة', 'نقاط المحيل', 'نقاط المحال', 'التاريخ'],
    ...allReferrals.map(r => [
      r.referrer_name || 'مستخدم',
      r.referred_name || 'مستخدم',
      r.referral_code,
      getStatusLabel(r.status),
      r.referrer_points_awarded || 0,
      r.referred_points_awarded || 0,
      format(new Date(r.created_at), 'yyyy-MM-dd'),
    ])
  ];
  const allReferralsSheet = XLSX.utils.aoa_to_sheet(allReferralsData);
  XLSX.utils.book_append_sheet(workbook, allReferralsSheet, 'جميع الإحالات');

  // Download
  const fileName = `تقرير_الولاء_والإحالات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case 'gold': return 'ذهبي';
    case 'silver': return 'فضي';
    case 'bronze': return 'برونزي';
    default: return tier;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'مكتمل';
    case 'pending': return 'معلق';
    default: return status;
  }
}
