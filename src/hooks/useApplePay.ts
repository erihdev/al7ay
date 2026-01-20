import { useState, useEffect, useCallback } from 'react';
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

  // This function MUST be called directly from a click handler (synchronously)
  const initiateApplePayPayment = useCallback((orderData: ApplePayOrderData): Promise<ApplePayResult> => {
    if (!isApplePayAvailable || !window.ApplePaySession) {
      toast.error('Apple Pay غير متاح على هذا الجهاز');
      return Promise.resolve({ success: false, error: 'Apple Pay not available' });
    }

    setIsProcessing(true);

    // Create Apple Pay payment request SYNCHRONOUSLY - before any async operations
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

    // Create the session SYNCHRONOUSLY from user gesture
    let session: ApplePaySessionInstance;
    try {
      session = new window.ApplePaySession(3, paymentRequest);
    } catch (err) {
      console.error('Error creating Apple Pay session:', err);
      toast.error('خطأ في بدء Apple Pay');
      setIsProcessing(false);
      return Promise.resolve({ success: false, error: 'Failed to create Apple Pay session' });
    }

    // Store order data for use in callbacks
    let pendingOrderId: string | null = null;

    return new Promise((resolve) => {
      session.onvalidatemerchant = async (event) => {
        try {
          console.log('Apple Pay: Validating merchant...', event.validationURL);
          
          // Create pending order during merchant validation (async is OK here)
          if (!pendingOrderId) {
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
              session.abort();
              toast.error('فشل في إنشاء الطلب');
              setIsProcessing(false);
              resolve({ success: false, error: pendingError.message });
              return;
            }
            pendingOrderId = pendingOrder.id;
          }

          // Call our edge function to validate merchant with EdfaPay
          const { data, error } = await supabase.functions.invoke('edfapay-applepay-validate', {
            body: {
              validationURL: event.validationURL
            }
          });

          if (error || !data?.merchantSession) {
            console.error('Merchant validation failed:', error, data);
            session.abort();
            toast.error('فشل في التحقق من التاجر');
            setIsProcessing(false);
            // Clean up pending order
            if (pendingOrderId) {
              await supabase.from('pending_orders').delete().eq('id', pendingOrderId);
            }
            resolve({ success: false, error: 'Merchant validation failed' });
            return;
          }

          console.log('Apple Pay: Merchant validated successfully');
          session.completeMerchantValidation(data.merchantSession);
        } catch (err) {
          console.error('Merchant validation error:', err);
          session.abort();
          setIsProcessing(false);
          if (pendingOrderId) {
            await supabase.from('pending_orders').delete().eq('id', pendingOrderId);
          }
          resolve({ success: false, error: 'Merchant validation error' });
        }
      };

      session.onpaymentauthorized = async (event) => {
        try {
          console.log('Apple Pay: Payment authorized, processing...');
          
          // Get the Apple Pay token
          const applePayToken = event.payment.token;

          if (!pendingOrderId) {
            console.error('No pending order ID');
            session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
            setIsProcessing(false);
            resolve({ success: false, error: 'No pending order' });
            return;
          }

          // Send token to our edge function to process payment with EdfaPay
          const { data, error } = await supabase.functions.invoke('edfapay-applepay-process', {
            body: {
              pendingOrderId: pendingOrderId,
              amount: orderData.totalAmount,
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
              customerEmail: orderData.customerEmail || '',
              applePayToken: JSON.stringify(applePayToken)
            }
          });

          if (error || !data?.success) {
            console.error('Payment processing failed:', error || data?.error);
            session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
            toast.error(data?.message || 'فشل في معالجة الدفع');
            setIsProcessing(false);
            resolve({ success: false, error: data?.error || 'Payment processing failed' });
            return;
          }

          // Payment successful
          console.log('Apple Pay: Payment successful!', data);
          session.completePayment(window.ApplePaySession!.STATUS_SUCCESS);
          toast.success('تم الدفع بنجاح!');
          setIsProcessing(false);
          resolve({
            success: true,
            orderId: data.orderId,
            orderNumber: data.orderNumber?.toString()
          });
        } catch (err) {
          console.error('Payment authorization error:', err);
          session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
          setIsProcessing(false);
          resolve({ success: false, error: 'Payment authorization error' });
        }
      };

      session.oncancel = async () => {
        console.log('Apple Pay: Cancelled by user');
        setIsProcessing(false);
        
        // Delete the pending order since payment was cancelled
        if (pendingOrderId) {
          await supabase.from('pending_orders').delete().eq('id', pendingOrderId);
        }
        
        resolve({ success: false, error: 'Payment cancelled' });
      };

      // Start the Apple Pay session
      console.log('Apple Pay: Starting session...');
      session.begin();
    });
  }, [isApplePayAvailable]);

  return {
    isApplePayAvailable,
    initiateApplePayPayment,
    isProcessing,
  };
}
