import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

export interface DailySales {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_items: number;
}

export interface CategorySales {
  category: string;
  total_revenue: number;
  total_items: number;
}

export interface SalesStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  total_items_sold: number;
  total_points_earned: number;
  total_points_redeemed: number;
  total_discounts: number;
}

export function useDailySalesReport(days: number = 7) {
  return useQuery({
    queryKey: ['sales-report', 'daily', days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity');

      if (itemsError) throw itemsError;

      // Create a map of all days in range
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyData: Record<string, DailySales> = {};

      daysInRange.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        dailyData[dateKey] = {
          date: format(day, 'EEE', { locale: ar }),
          total_orders: 0,
          total_revenue: 0,
          total_items: 0,
        };
      });

      // Aggregate orders by day
      orders?.forEach(order => {
        const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (dailyData[dateKey]) {
          dailyData[dateKey].total_orders += 1;
          dailyData[dateKey].total_revenue += Number(order.total_amount);

          const items = orderItems?.filter(i => i.order_id === order.id) || [];
          dailyData[dateKey].total_items += items.reduce((sum, i) => sum + i.quantity, 0);
        }
      });

      return Object.values(dailyData);
    },
  });
}

export function useMonthlySalesReport() {
  return useQuery({
    queryKey: ['sales-report', 'monthly'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity, total_price, product_id');

      if (itemsError) throw itemsError;

      // Get products for category info
      const { data: products } = await supabase
        .from('products')
        .select('id, category');

      const productCategories = new Map(products?.map(p => [p.id, p.category]));

      // Calculate stats
      const stats: SalesStats = {
        total_orders: orders?.length || 0,
        total_revenue: orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
        average_order_value: 0,
        total_items_sold: 0,
        total_points_earned: orders?.reduce((sum, o) => sum + o.points_earned, 0) || 0,
        total_points_redeemed: orders?.reduce((sum, o) => sum + o.points_redeemed, 0) || 0,
        total_discounts: orders?.reduce((sum, o) => sum + Number(o.discount_amount) + Number(o.coupon_discount || 0), 0) || 0,
      };

      // Calculate items sold
      const orderIds = orders?.map(o => o.id) || [];
      const relevantItems = orderItems?.filter(i => orderIds.includes(i.order_id)) || [];
      stats.total_items_sold = relevantItems.reduce((sum, i) => sum + i.quantity, 0);
      stats.average_order_value = stats.total_orders > 0 ? stats.total_revenue / stats.total_orders : 0;

      // Category breakdown
      const categoryMap: Record<string, CategorySales> = {
        coffee: { category: 'قهوة', total_revenue: 0, total_items: 0 },
        sweets: { category: 'حلويات', total_revenue: 0, total_items: 0 },
        cold_drinks: { category: 'مشروبات باردة', total_revenue: 0, total_items: 0 },
      };

      relevantItems.forEach(item => {
        const category = productCategories.get(item.product_id || '') || 'coffee';
        if (categoryMap[category]) {
          categoryMap[category].total_revenue += Number(item.total_price);
          categoryMap[category].total_items += item.quantity;
        }
      });

      return {
        stats,
        categoryBreakdown: Object.values(categoryMap),
        monthName: format(now, 'MMMM yyyy', { locale: ar }),
      };
    },
  });
}

export function useOrderStatusBreakdown() {
  return useQuery({
    queryKey: ['sales-report', 'status-breakdown'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('status');

      if (error) throw error;

      const statusLabels: Record<string, string> = {
        pending: 'قيد الانتظار',
        preparing: 'قيد التحضير',
        ready: 'جاهز',
        out_for_delivery: 'في الطريق',
        completed: 'مكتمل',
        cancelled: 'ملغي',
      };

      const breakdown = orders?.reduce((acc, order) => {
        const status = order.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(breakdown).map(([status, count]) => ({
        status: statusLabels[status] || status,
        count,
      }));
    },
  });
}
