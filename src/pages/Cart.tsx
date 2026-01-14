import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useLoyaltyPoints, useCreateOrder } from '@/hooks/useOrders';
import { useLoyaltyTier } from '@/hooks/useLoyaltyTier';
import { useValidateCoupon, useRecordCouponUsage, Coupon } from '@/hooks/useCoupons';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DeliveryMapPicker } from '@/components/map/DeliveryMapPicker';
import { OrderScheduler } from '@/components/scheduling/OrderScheduler';
import { LoyaltyTierBadge, tierConfigs } from '@/components/loyalty/LoyaltyTierBadge';
import { Minus, Plus, Trash2, ShoppingBag, MapPin, Truck, Star, Map, CheckCircle2, Ticket, Loader2, X, Crown, CreditCard, Banknote } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEdfaPayment } from '@/hooks/useEdfaPayment';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const { isWithinDeliveryZone, userLocation } = useLocation();
  const { data: loyaltyPoints } = useLoyaltyPoints();
  const { data: loyaltyTier } = useLoyaltyTier();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>(
    isWithinDeliveryZone ? 'delivery' : 'pickup'
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon: Coupon; discount: number } | null>(null);
  const validateCoupon = useValidateCoupon();
  const recordCouponUsage = useRecordCouponUsage();
  
  // Order scheduling
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const { initiatePayment, isProcessing: isPaymentProcessing } = useEdfaPayment();

  const availablePoints = loyaltyPoints?.total_points || 0;
  const maxRedeemablePoints = Math.min(availablePoints, Math.floor(totalAmount * 100));
  const pointsDiscount = usePoints ? maxRedeemablePoints / 100 : 0;
  const couponDiscount = appliedCoupon?.discount || 0;
  
  // Tier discount
  const tierDiscount = loyaltyTier?.discount || 0;
  const tierDiscountAmount = (totalAmount * tierDiscount) / 100;
  const finalAmount = Math.max(0, totalAmount - pointsDiscount - couponDiscount - tierDiscountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      const result = await validateCoupon.mutateAsync({
        code: couponCode,
        orderAmount: totalAmount - pointsDiscount,
      });
      setAppliedCoupon(result);
      toast.success(`تم تطبيق الكوبون: خصم ${result.discount.toFixed(0)} ر.س`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      navigate('/profile');
      return;
    }

    if (!customerName || !customerPhone) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    if (orderType === 'delivery' && !deliveryLocation) {
      toast.error('يرجى تحديد موقع التوصيل على الخريطة');
      return;
    }

    try {
      const orderResult = await createOrder.mutateAsync({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        total_amount: finalAmount,
        order_type: orderType,
        notes,
        points_redeemed: usePoints ? maxRedeemablePoints : 0,
        discount_amount: pointsDiscount + tierDiscountAmount,
        delivery_address: deliveryLocation?.address || null,
        delivery_lat: deliveryLocation?.lat || null,
        delivery_lng: deliveryLocation?.lng || null,
        coupon_id: appliedCoupon?.coupon.id || null,
        coupon_discount: couponDiscount,
        scheduled_for: scheduledFor?.toISOString() || null,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
        items: items.map((item) => ({
          product_id: item.id.split('-')[0],
          product_name: item.name_ar,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          selected_options: item.selected_options || [],
        })),
      });

      // Record coupon usage if applied
      if (appliedCoupon) {
        await recordCouponUsage.mutateAsync({
          couponId: appliedCoupon.coupon.id,
          orderId: orderResult.id,
        });
      }

      // If online payment, redirect to payment page
      if (paymentMethod === 'online') {
        const paymentResult = await initiatePayment({
          orderId: orderResult.id,
          amount: finalAmount,
          customerEmail: customerEmail || `${customerPhone}@temp.local`,
          customerName: customerName,
          customerPhone: customerPhone,
          description: `طلب رقم ${orderResult.id.slice(-6)}`,
        });

        if (!paymentResult.success) {
          toast.error('فشل بدء عملية الدفع، يمكنك الدفع عند الاستلام');
        }
        // Payment redirect happens in useEdfaPayment
        return;
      }

      toast.success('تم إرسال طلبك بنجاح!');
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ ما');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="container mx-auto px-4 py-8 pb-24">
          <h1 className="text-2xl font-bold mb-6">السلة</h1>
          
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">السلة فارغة</h2>
            <p className="text-muted-foreground mb-4">أضف بعض المنتجات للبدء</p>
            <Link to="/">
              <Button className="font-arabic">تصفح القائمة</Button>
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <div className="container mx-auto px-4 py-8 pb-32">
        <h1 className="text-2xl font-bold mb-6">السلة</h1>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name_ar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        ☕
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name_ar}</h3>
                    {item.selected_options && item.selected_options.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.selected_options.map(o => o.value_name).join(' • ')}
                      </p>
                    )}
                    <p className="text-primary font-bold">
                      {(item.price * item.quantity).toFixed(0)} ر.س
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Type */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">طريقة الاستلام</h3>
            <RadioGroup
              value={orderType}
              onValueChange={(v) => {
                setOrderType(v as 'pickup' | 'delivery');
                if (v === 'pickup') {
                  setDeliveryLocation(null);
                }
              }}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2 flex-1">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="h-4 w-4" />
                  استلام
                </Label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <RadioGroupItem
                  value="delivery"
                  id="delivery"
                  disabled={!isWithinDeliveryZone}
                />
                <Label
                  htmlFor="delivery"
                  className={`flex items-center gap-2 cursor-pointer ${
                    !isWithinDeliveryZone ? 'opacity-50' : ''
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  توصيل
                </Label>
              </div>
            </RadioGroup>
            {!isWithinDeliveryZone && (
              <p className="text-xs text-muted-foreground mt-2">
                التوصيل غير متاح لموقعك الحالي
              </p>
            )}
          </CardContent>
        </Card>

        {/* Delivery Location Map */}
        {orderType === 'delivery' && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">موقع التوصيل</h3>
              
              {deliveryLocation ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">تم تحديد الموقع</p>
                      <p className="text-sm text-muted-foreground">{deliveryLocation.address}</p>
                    </div>
                  </div>
                  <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full font-arabic">
                        <Map className="h-4 w-4 ml-2" />
                        تغيير الموقع
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-arabic">تحديد موقع التوصيل</DialogTitle>
                      </DialogHeader>
                      <DeliveryMapPicker
                        initialLocation={deliveryLocation}
                        onLocationSelect={(location) => {
                          setDeliveryLocation(location);
                          setIsMapOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full font-arabic">
                      <Map className="h-4 w-4 ml-2" />
                      تحديد الموقع على الخريطة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-arabic">تحديد موقع التوصيل</DialogTitle>
                    </DialogHeader>
                    <DeliveryMapPicker
                      initialLocation={userLocation || undefined}
                      onLocationSelect={(location) => {
                        setDeliveryLocation(location);
                        setIsMapOpen(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Scheduling */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <OrderScheduler
              scheduledFor={scheduledFor}
              onScheduleChange={setScheduledFor}
            />
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">معلومات التواصل</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="أدخل اسمك"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="05XXXXXXXX"
              dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                للحصول على تحديثات الطلب عبر البريد
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات خاصة بطلبك"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tier Discount Info */}
        {user && loyaltyTier && loyaltyTier.discount > 0 && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">خصم المستوى</p>
                    <LoyaltyTierBadge tier={loyaltyTier.tier} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    تحصل على خصم {loyaltyTier.discount}% = {tierDiscountAmount.toFixed(0)} ر.س
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loyalty Points Redemption */}
        {user && availablePoints >= 100 && (
          <Card className="mb-6 border-gold/30 bg-gold/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-semibold">استخدام النقاط</p>
                    <p className="text-sm text-muted-foreground">
                      لديك {availablePoints} نقطة ({(availablePoints / 100).toFixed(0)} ر.س)
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={usePoints}
                  onCheckedChange={(checked) => setUsePoints(!!checked)}
                />
              </div>
              {usePoints && (
                <p className="text-sm text-gold mt-2">
                  سيتم خصم {maxRedeemablePoints} نقطة = {pointsDiscount.toFixed(0)} ر.س
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Method */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">طريقة الدفع</h3>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as 'cash' | 'online')}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="cash" id="cash-payment" />
                <Label htmlFor="cash-payment" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">الدفع عند الاستلام</p>
                    <p className="text-xs text-muted-foreground">ادفع نقداً عند استلام طلبك</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="online" id="online-payment" />
                <Label htmlFor="online-payment" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">الدفع الإلكتروني</p>
                    <p className="text-xs text-muted-foreground">بطاقة ائتمان / مدى / Apple Pay</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Coupon Code */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              كود الخصم
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div>
                  <p className="font-mono font-bold">{appliedCoupon.coupon.code}</p>
                  <p className="text-sm text-primary">خصم {appliedCoupon.discount.toFixed(0)} ر.س</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemoveCoupon}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="أدخل كود الخصم"
                  dir="ltr"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={handleApplyCoupon}
                  disabled={validateCoupon.isPending || !couponCode.trim()}
                >
                  {validateCoupon.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'تطبيق'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">ملخص الطلب</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>المجموع الفرعي</span>
                <span>{totalAmount.toFixed(0)} ر.س</span>
              </div>
              {usePoints && pointsDiscount > 0 && (
                <div className="flex justify-between text-gold">
                  <span>خصم النقاط</span>
                  <span>-{pointsDiscount.toFixed(0)} ر.س</span>
                </div>
              )}
              {tierDiscountAmount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    خصم المستوى ({tierDiscount}%)
                  </span>
                  <span>-{tierDiscountAmount.toFixed(0)} ر.س</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>خصم الكوبون</span>
                  <span>-{couponDiscount.toFixed(0)} ر.س</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>الإجمالي</span>
                <span className="text-primary">{finalAmount.toFixed(0)} ر.س</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full h-12 text-lg font-arabic"
          onClick={handleSubmitOrder}
          disabled={createOrder.isPending || isPaymentProcessing}
        >
          {createOrder.isPending || isPaymentProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
          ) : null}
          {createOrder.isPending ? 'جاري الإرسال...' : isPaymentProcessing ? 'جاري التحويل للدفع...' : paymentMethod === 'online' ? 'الدفع الآن' : 'تأكيد الطلب'}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-3">
          {paymentMethod === 'cash' ? 'الدفع عند الاستلام' : 'ستتم إعادة توجيهك لصفحة الدفع'}
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;
