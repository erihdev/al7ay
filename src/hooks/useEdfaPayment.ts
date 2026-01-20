import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingOrderData {
  providerId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  notes?: string;
  totalAmount: number;
  paymentMethod?: 'card' | 'apple_pay';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedOptions?: any;
  }>;
}

interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  pendingOrderId?: string;
  error?: string;
}

export function useEdfaPayment() {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = async (orderData: PendingOrderData): Promise<PaymentResult> => {
    setIsProcessing(true);

    try {
      // First, create a pending order
      const { data: pendingOrder, error: pendingError } = await supabase
        .from('pending_orders')
        .insert({
          provider_id: orderData.providerId || null,
          customer_id: orderData.customerId || null,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          customer_email: orderData.customerEmail || null,
          order_type: orderData.orderType,
          delivery_address: orderData.deliveryAddress || null,
          delivery_lat: orderData.deliveryLat || null,
          delivery_lng: orderData.deliveryLng || null,
          notes: orderData.notes || null,
          total_amount: orderData.totalAmount,
          payment_method: 'online',
          items: orderData.items
        })
        .select()
        .single();

      if (pendingError) {
        console.error('Error creating pending order:', pendingError);
        toast.error('فشل في إنشاء الطلب المعلق');
        return { success: false, error: pendingError.message };
      }

      const returnUrl = `${window.location.origin}/payment-result`;

      const { data, error } = await supabase.functions.invoke('edfapay-payment', {
        body: {
          pendingOrderId: pendingOrder.id,
          amount: orderData.totalAmount,
          customerEmail: orderData.customerEmail || '',
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          description: `طلب من ${orderData.customerName}`,
          returnUrl,
          paymentMethod: orderData.paymentMethod || 'card',
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
      const redirectUrl = data.paymentUrl || data.redirect_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

      return {
        success: true,
        paymentUrl: redirectUrl,
        pendingOrderId: pendingOrder.id,
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
