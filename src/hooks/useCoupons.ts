import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, orderAmount }: { code: string; orderAmount: number }) => {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        throw new Error('كود الخصم غير صالح');
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('كود الخصم منتهي الصلاحية');
      }

      // Check max uses
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw new Error('تم استخدام هذا الكود الحد الأقصى من المرات');
      }

      // Check minimum order amount
      if (orderAmount < Number(coupon.min_order_amount)) {
        throw new Error(`الحد الأدنى للطلب ${Number(coupon.min_order_amount)} ر.س`);
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (orderAmount * Number(coupon.discount_value)) / 100;
      } else {
        discount = Number(coupon.discount_value);
      }

      // Don't exceed order amount
      discount = Math.min(discount, orderAmount);

      return {
        coupon: coupon as Coupon,
        discount: Math.round(discount * 100) / 100,
      };
    },
  });
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, 'id' | 'created_at' | 'current_uses'>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          ...coupon,
          code: coupon.code.toUpperCase(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });
}

export function useRecordCouponUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ couponId, orderId }: { couponId: string; orderId: string }) => {
      // Record usage
      const { error: usageError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          user_id: user?.id || null,
          order_id: orderId,
        });

      if (usageError) throw usageError;

      // Get current count and increment
      const { data: coupon } = await supabase
        .from('coupons')
        .select('current_uses')
        .eq('id', couponId)
        .single();

      if (coupon) {
        await supabase
          .from('coupons')
          .update({ current_uses: coupon.current_uses + 1 })
          .eq('id', couponId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });
}
