import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Payment {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  provider_response: any;
  created_at: string;
  updated_at: string;
  order?: {
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
  };
}

export function usePayments() {
  return useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(customer_name, customer_phone, customer_email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status, payment_method, created_at');

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const monthlyPayments = payments?.filter(p => 
        new Date(p.created_at) >= startOfMonth && p.status === 'paid'
      ) || [];

      const dailyPayments = payments?.filter(p => 
        new Date(p.created_at) >= startOfDay && p.status === 'paid'
      ) || [];

      const totalPaid = payments?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const dailyTotal = dailyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const byMethod = payments?.reduce((acc, p) => {
        if (p.status === 'paid') {
          acc[p.payment_method] = (acc[p.payment_method] || 0) + Number(p.amount);
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const byStatus = payments?.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalPaid,
        monthlyTotal,
        dailyTotal,
        totalTransactions: payments?.length || 0,
        successfulTransactions: payments?.filter(p => p.status === 'paid').length || 0,
        failedTransactions: payments?.filter(p => p.status === 'failed').length || 0,
        byMethod,
        byStatus,
      };
    },
  });
}