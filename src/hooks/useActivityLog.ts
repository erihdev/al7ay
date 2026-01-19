import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

type ActionType = 
  | 'order_status_change'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'coupon_create'
  | 'coupon_update'
  | 'coupon_delete'
  | 'provider_approve'
  | 'provider_reject'
  | 'provider_update'
  | 'employee_create'
  | 'employee_update'
  | 'employee_permissions_update'
  | 'payout_process'
  | 'settings_update'
  | 'neighborhood_create'
  | 'neighborhood_update'
  | 'offer_create'
  | 'offer_update'
  | 'offer_delete'
  | 'login'
  | 'logout'
  | 'other';

interface LogActivityParams {
  actionType: ActionType;
  actionDescription: string;
  targetTable?: string;
  targetId?: string;
  details?: Json;
}

export const useActivityLog = () => {
  const { user } = useAuth();

  const logActivity = async ({
    actionType,
    actionDescription,
    targetTable,
    targetId,
    details = {}
  }: LogActivityParams) => {
    if (!user) return;

    try {
      // Get employee ID if exists
      const { data: employee } = await supabase
        .from('admin_employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      await supabase.from('employee_activity_log').insert({
        user_id: user.id,
        action_type: actionType,
        action_description: actionDescription,
        target_table: targetTable,
        target_id: targetId,
        details,
        employee_id: employee?.id
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return { logActivity };
};
