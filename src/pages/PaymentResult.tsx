import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Home, ShoppingBag } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';

type PaymentStatus = 'success' | 'failed' | 'pending' | 'unknown';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('unknown');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Parse payment result from URL parameters
    const statusParam = searchParams.get('status');
    const orderIdParam = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');

    console.log('Payment result params:', { statusParam, orderIdParam, transactionId });

    setOrderId(orderIdParam);

    // Map status from EdfaPay response
    switch (statusParam?.toLowerCase()) {
      case 'success':
      case 'approved':
      case 'completed':
        setStatus('success');
        break;
      case 'failed':
      case 'declined':
      case 'error':
        setStatus('failed');
        break;
      case 'pending':
      case 'processing':
        setStatus('pending');
        break;
      default:
        setStatus('unknown');
    }
  }, [searchParams]);

  const getStatusContent = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="h-20 w-20 text-green-500" />,
          title: 'تم الدفع بنجاح!',
          description: 'شكراً لك! تم استلام طلبك وسيتم تحضيره قريباً.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-20 w-20 text-red-500" />,
          title: 'فشلت عملية الدفع',
          description: 'لم تتم عملية الدفع. يرجى المحاولة مرة أخرى أو استخدام طريقة دفع أخرى.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      case 'pending':
        return {
          icon: <Clock className="h-20 w-20 text-yellow-500" />,
          title: 'جاري معالجة الدفع',
          description: 'يتم حالياً معالجة عملية الدفع. سيتم تحديث حالة طلبك قريباً.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
      default:
        return {
          icon: <Clock className="h-20 w-20 text-gray-500" />,
          title: 'حالة غير معروفة',
          description: 'لم نتمكن من تحديد حالة الدفع. يرجى التحقق من طلباتك.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className={`w-full max-w-md ${content.bgColor} border-none shadow-lg`}>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="flex justify-center mb-6">
                {content.icon}
              </div>
              
              <h1 className={`text-2xl font-bold mb-3 ${content.color}`}>
                {content.title}
              </h1>
              
              <p className="text-muted-foreground mb-6">
                {content.description}
              </p>

              {orderId && (
                <p className="text-sm text-muted-foreground mb-6">
                  رقم الطلب: <span className="font-mono font-semibold">{orderId.slice(0, 8)}</span>
                </p>
              )}

              <div className="flex flex-col gap-3">
                {status === 'success' && (
                  <Button 
                    onClick={() => navigate('/orders')}
                    className="w-full"
                  >
                    <ShoppingBag className="h-4 w-4 ml-2" />
                    تتبع طلبك
                  </Button>
                )}

                {status === 'failed' && (
                  <Button 
                    onClick={() => navigate('/cart')}
                    className="w-full"
                  >
                    المحاولة مرة أخرى
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  <Home className="h-4 w-4 ml-2" />
                  العودة للرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
