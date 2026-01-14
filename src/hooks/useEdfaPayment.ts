import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentData {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  description?: string;
}

interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export function useEdfaPayment() {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = async (paymentData: PaymentData): Promise<PaymentResult> => {
    setIsProcessing(true);

    try {
      const returnUrl = `${window.location.origin}/payment-result`;

      const { data, error } = await supabase.functions.invoke('edfapay-payment', {
        body: {
          ...paymentData,
          returnUrl,
        },
      });

      if (error) {
        console.error('Payment initiation error:', error);
        toast.error('فشل في بدء عملية الدفع');
        return { success: false, error: error.message };
      }

      if (data.error) {
        toast.error(data.message || 'فشل في بدء عملية الدفع');
        return { success: false, error: data.error };
      }

      // Redirect to payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }

      return {
        success: true,
        paymentUrl: data.paymentUrl,
        transactionId: data.transactionId,
      };

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('حدث خطأ في معالجة الدفع');
      return { success: false, error: 'Payment processing failed' };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    initiatePayment,
    isProcessing,
  };
}
