import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Apple Pay type declarations
interface ApplePayLineItem {
  label: string;
  amount: string;
  type: 'final' | 'pending';
}

interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: ApplePayLineItem;
  lineItems?: ApplePayLineItem[];
}

interface ApplePayPaymentToken {
  paymentData: any;
  paymentMethod: any;
  transactionIdentifier: string;
}

interface ApplePayPayment {
  token: ApplePayPaymentToken;
  billingContact?: any;
  shippingContact?: any;
}

interface ApplePayValidateMerchantEvent {
  validationURL: string;
}

interface ApplePayPaymentAuthorizedEvent {
  payment: ApplePayPayment;
}

interface ApplePaySessionClass {
  new(version: number, paymentRequest: ApplePayPaymentRequest): ApplePaySessionInstance;
  canMakePayments(): boolean;
  STATUS_SUCCESS: number;
  STATUS_FAILURE: number;
}

interface ApplePaySessionInstance {
  begin(): void;
  abort(): void;
  completeMerchantValidation(merchantSession: any): void;
  completePayment(status: number): void;
  onvalidatemerchant: ((event: ApplePayValidateMerchantEvent) => void) | null;
  onpaymentauthorized: ((event: ApplePayPaymentAuthorizedEvent) => void) | null;
  oncancel: (() => void) | null;
}

// Extend window to include ApplePaySession
declare global {
  interface Window {
    ApplePaySession?: ApplePaySessionClass;
  }
}

interface ApplePayOrderData {
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
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedOptions?: any;
  }>;
}

interface ApplePayResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

export function useApplePay() {
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if Apple Pay is available
    const checkApplePayAvailability = () => {
      if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
        setIsApplePayAvailable(true);
      } else {
        setIsApplePayAvailable(false);
      }
    };

    checkApplePayAvailability();
  }, []);

  const initiateApplePayPayment = async (orderData: ApplePayOrderData): Promise<ApplePayResult> => {
    if (!isApplePayAvailable) {
      toast.error('Apple Pay غير متاح على هذا الجهاز');
      return { success: false, error: 'Apple Pay not available' };
    }

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
          payment_method: 'apple_pay',
          items: orderData.items
        })
        .select()
        .single();

      if (pendingError) {
        console.error('Error creating pending order:', pendingError);
        toast.error('فشل في إنشاء الطلب المعلق');
        setIsProcessing(false);
        return { success: false, error: pendingError.message };
      }

      // Create Apple Pay payment request
      const paymentRequest: ApplePayPaymentRequest = {
        countryCode: 'SA',
        currencyCode: 'SAR',
        supportedNetworks: ['visa', 'masterCard', 'mada'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: 'الحي',
          amount: orderData.totalAmount.toFixed(2),
          type: 'final'
        },
        lineItems: orderData.items.map(item => ({
          label: item.productName,
          amount: item.totalPrice.toFixed(2),
          type: 'final' as const
        }))
      };

      return new Promise((resolve) => {
        try {
          if (!window.ApplePaySession) {
            setIsProcessing(false);
            resolve({ success: false, error: 'Apple Pay not available' });
            return;
          }
          
          const session = new window.ApplePaySession(3, paymentRequest);

          session.onvalidatemerchant = async (event) => {
            try {
              // Call our edge function to validate merchant with EdfaPay
              const { data, error } = await supabase.functions.invoke('edfapay-applepay-validate', {
                body: {
                  validationURL: event.validationURL
                }
              });

              if (error || !data.merchantSession) {
                console.error('Merchant validation failed:', error);
                session.abort();
                toast.error('فشل في التحقق من التاجر');
                setIsProcessing(false);
                resolve({ success: false, error: 'Merchant validation failed' });
                return;
              }

              session.completeMerchantValidation(data.merchantSession);
            } catch (err) {
              console.error('Merchant validation error:', err);
              session.abort();
              setIsProcessing(false);
              resolve({ success: false, error: 'Merchant validation error' });
            }
          };

          session.onpaymentauthorized = async (event) => {
            try {
              // Get the Apple Pay token
              const applePayToken = event.payment.token;

              // Send token to our edge function to process payment with EdfaPay
              const { data, error } = await supabase.functions.invoke('edfapay-applepay-process', {
                body: {
                  pendingOrderId: pendingOrder.id,
                  amount: orderData.totalAmount,
                  customerName: orderData.customerName,
                  customerPhone: orderData.customerPhone,
                  customerEmail: orderData.customerEmail || '',
                  applePayToken: JSON.stringify(applePayToken)
                }
              });

              if (error || !data.success) {
                console.error('Payment processing failed:', error || data.error);
                session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
                toast.error('فشل في معالجة الدفع');
                setIsProcessing(false);
                resolve({ success: false, error: data?.error || 'Payment processing failed' });
                return;
              }

              // Payment successful
              session.completePayment(window.ApplePaySession!.STATUS_SUCCESS);
              toast.success('تم الدفع بنجاح!');
              setIsProcessing(false);
              resolve({
                success: true,
                orderId: data.orderId,
                orderNumber: data.orderNumber
              });
            } catch (err) {
              console.error('Payment authorization error:', err);
              session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
              setIsProcessing(false);
              resolve({ success: false, error: 'Payment authorization error' });
            }
          };

          session.oncancel = () => {
            console.log('Apple Pay cancelled');
            setIsProcessing(false);
            
            // Delete the pending order since payment was cancelled
            supabase.from('pending_orders').delete().eq('id', pendingOrder.id);
            
            resolve({ success: false, error: 'Payment cancelled' });
          };

          session.begin();
        } catch (err) {
          console.error('Error starting Apple Pay session:', err);
          toast.error('خطأ في بدء جلسة Apple Pay');
          setIsProcessing(false);
          resolve({ success: false, error: 'Failed to start Apple Pay session' });
        }
      });
    } catch (error) {
      console.error('Apple Pay error:', error);
      toast.error('حدث خطأ في Apple Pay');
      setIsProcessing(false);
      return { success: false, error: 'Apple Pay error' };
    }
  };

  return {
    isApplePayAvailable,
    initiateApplePayPayment,
    isProcessing,
  };
}
