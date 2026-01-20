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
import { SimpleDeliveryPicker } from '@/components/location/SimpleDeliveryPicker';
import { OrderScheduler } from '@/components/scheduling/OrderScheduler';
import { LoyaltyTierBadge, tierConfigs } from '@/components/loyalty/LoyaltyTierBadge';
import { Minus, Plus, Trash2, ShoppingBag, MapPin, Truck, Star, Map, CheckCircle2, Ticket, Loader2, X, Crown, CreditCard, Banknote, Sparkles, Gift, Clock, User, Phone, Mail, FileText } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEdfaPayment } from '@/hooks/useEdfaPayment';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const { isWithinDeliveryZone, userLocation } = useLocation();
  const { data: loyaltyPoints } = useLoyaltyPoints();
  const { data: loyaltyTier } = useLoyaltyTier(user?.id);
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
      // If online payment, redirect to payment first (Payment First Policy)
      if (paymentMethod === 'online') {
        const paymentResult = await initiatePayment({
          customerId: user?.id,
          customerName: customerName,
          customerPhone: customerPhone,
          customerEmail: customerEmail || `${customerPhone}@temp.local`,
          orderType: orderType,
          deliveryAddress: deliveryLocation?.address || undefined,
          deliveryLat: deliveryLocation?.lat,
          deliveryLng: deliveryLocation?.lng,
          notes: notes,
          totalAmount: finalAmount,
          items: items.map((item) => ({
            productId: item.id.split('-')[0],
            productName: item.name_ar,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            selectedOptions: item.selected_options || [],
          })),
        });

        if (!paymentResult.success) {
          toast.error('فشل بدء عملية الدفع، يمكنك الدفع عند الاستلام');
        }
        // Payment redirect happens in useEdfaPayment
        // Order will be created after successful payment via webhook
        return;
      }

      // For cash payment, create order immediately
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
        payment_status: 'pending',
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

      toast.success('تم إرسال طلبك بنجاح!');
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ ما');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background font-arabic pt-[env(safe-area-inset-top)]" dir="rtl">
        <div className="container mx-auto px-4 py-4 pb-24">
          {/* Empty Cart Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 mb-8"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <h1 className="text-3xl font-bold relative z-10 flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              السلة
            </h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-muted to-muted/50 rounded-full p-8">
                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">السلة فارغة</h2>
            <p className="text-muted-foreground mb-6">أضف بعض المنتجات للبدء</p>
            <Link to="/">
              <Button size="lg" className="font-arabic gap-2 rounded-full px-8">
                <Sparkles className="h-5 w-5" />
                تصفح القائمة
              </Button>
            </Link>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic pt-[env(safe-area-inset-top)]" dir="rtl">
      <div className="container mx-auto px-4 py-4 pb-32">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 mb-6"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-3 rounded-2xl">
                <ShoppingBag className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">السلة</h1>
                <p className="text-sm text-muted-foreground">{items.length} منتجات</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">الإجمالي</p>
              <p className="text-2xl font-bold text-primary">{finalAmount.toFixed(0)} ر.س</p>
            </div>
          </div>
        </motion.div>

        {/* Cart Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-6"
        >
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-primary" />
            المنتجات
          </h2>
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 shrink-0 relative overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name_ar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            ☕
                          </div>
                        )}
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                          x{item.quantity}
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-base line-clamp-1">{item.name_ar}</h3>
                          {item.selected_options && item.selected_options.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.selected_options.map(o => o.value_name).join(' • ')}
                            </p>
                          )}
                        </div>
                        <p className="text-primary font-bold text-lg">
                          {(item.price * item.quantity).toFixed(0)} ر.س
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-center justify-center gap-1 p-2 bg-muted/30">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-primary/20"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-bold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-primary/20"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 mt-1"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Order Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                طريقة الاستلام
              </h3>
            </div>
            <CardContent className="p-4">
              <RadioGroup
                value={orderType}
                onValueChange={(v) => {
                  setOrderType(v as 'pickup' | 'delivery');
                  if (v === 'pickup') {
                    setDeliveryLocation(null);
                  }
                }}
                className="grid grid-cols-2 gap-3"
              >
                <Label 
                  htmlFor="pickup" 
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    orderType === 'pickup' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                  <div className={`p-3 rounded-full ${orderType === 'pickup' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">استلام</span>
                </Label>
                
                <Label 
                  htmlFor="delivery" 
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    !isWithinDeliveryZone ? 'opacity-50 cursor-not-allowed' : 
                    orderType === 'delivery' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="delivery" id="delivery" disabled={!isWithinDeliveryZone} className="sr-only" />
                  <div className={`p-3 rounded-full ${orderType === 'delivery' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Truck className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">توصيل</span>
                </Label>
              </RadioGroup>
              {!isWithinDeliveryZone && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  التوصيل غير متاح لموقعك الحالي
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivery Location Map */}
        {orderType === 'delivery' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="mb-6 border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/10 to-transparent px-4 py-3 border-b">
                <h3 className="font-bold flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-600" />
                  موقع التوصيل
                </h3>
              </div>
              <CardContent className="p-4">
                <SimpleDeliveryPicker
                  location={deliveryLocation}
                  onLocationChange={setDeliveryLocation}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order Scheduling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="mb-6 border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/10 to-transparent px-4 py-3 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                جدولة الطلب
              </h3>
            </div>
            <CardContent className="p-4">
              <OrderScheduler
                scheduledFor={scheduledFor}
                onScheduleChange={setScheduledFor}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6 border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500/10 to-transparent px-4 py-3 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                معلومات التواصل
              </h3>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  الاسم
                </Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسمك"
                  dir="rtl"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  رقم الهاتف
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  البريد الإلكتروني (اختياري)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                  dir="ltr"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  للحصول على تحديثات الطلب عبر البريد
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  ملاحظات (اختياري)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات خاصة بطلبك"
                  dir="rtl"
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tier Discount Info */}
        {user && loyaltyTier && loyaltyTier.discount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="mb-6 border-0 shadow-lg overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/20 p-3 rounded-2xl">
                    <Crown className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">خصم المستوى</p>
                      <LoyaltyTierBadge tier={loyaltyTier.tier} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تحصل على خصم {loyaltyTier.discount}% = {tierDiscountAmount.toFixed(0)} ر.س
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loyalty Points Redemption */}
        {user && availablePoints >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-6 border-0 shadow-lg overflow-hidden bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-500/20 p-3 rounded-2xl">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-bold">استخدام النقاط</p>
                      <p className="text-sm text-muted-foreground">
                        لديك {availablePoints} نقطة ({(availablePoints / 100).toFixed(0)} ر.س)
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={usePoints}
                    onCheckedChange={(checked) => setUsePoints(!!checked)}
                    className="h-6 w-6"
                  />
                </div>
                {usePoints && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-yellow-700 mt-3 bg-yellow-500/10 p-3 rounded-xl"
                  >
                    سيتم خصم {maxRedeemablePoints} نقطة = {pointsDiscount.toFixed(0)} ر.س
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="mb-6 border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500/10 to-transparent px-4 py-3 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                طريقة الدفع
              </h3>
            </div>
            <CardContent className="p-4">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as 'cash' | 'online')}
                className="space-y-3"
              >
                <Label 
                  htmlFor="cash-payment"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-muted hover:border-green-500/50'
                  }`}
                >
                  <RadioGroupItem value="cash" id="cash-payment" className="sr-only" />
                  <div className={`p-3 rounded-xl ${paymentMethod === 'cash' ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">الدفع عند الاستلام</p>
                    <p className="text-xs text-muted-foreground">ادفع نقداً عند استلام طلبك</p>
                  </div>
                </Label>
                
                <Label 
                  htmlFor="online-payment"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'online' 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-muted hover:border-blue-500/50'
                  }`}
                >
                  <RadioGroupItem value="online" id="online-payment" className="sr-only" />
                  <div className={`p-3 rounded-xl ${paymentMethod === 'online' ? 'bg-blue-500 text-white' : 'bg-muted'}`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">الدفع الإلكتروني</p>
                    <p className="text-xs text-muted-foreground">بطاقة ائتمان / مدى / Apple Pay</p>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coupon Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mb-6 border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500/10 to-transparent px-4 py-3 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <Ticket className="h-5 w-5 text-pink-600" />
                كود الخصم
              </h3>
            </div>
            <CardContent className="p-4">
              {appliedCoupon ? (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono font-bold">{appliedCoupon.coupon.code}</p>
                      <p className="text-sm text-primary">خصم {appliedCoupon.discount.toFixed(0)} ر.س</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRemoveCoupon} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="أدخل كود الخصم"
                    dir="ltr"
                    className="flex-1 rounded-xl"
                  />
                  <Button 
                    onClick={handleApplyCoupon}
                    disabled={validateCoupon.isPending || !couponCode.trim()}
                    className="rounded-xl px-6"
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
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="mb-6 border-0 shadow-xl overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
            <div className="bg-gradient-to-r from-primary/20 to-transparent px-4 py-3 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                ملخص الطلب
              </h3>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span className="font-semibold">{totalAmount.toFixed(0)} ر.س</span>
                </div>
                
                {usePoints && pointsDiscount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between py-2 text-yellow-700 bg-yellow-500/10 px-3 rounded-lg -mx-1"
                  >
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      خصم النقاط
                    </span>
                    <span className="font-bold">-{pointsDiscount.toFixed(0)} ر.س</span>
                  </motion.div>
                )}
                
                {tierDiscountAmount > 0 && (
                  <div className="flex justify-between py-2 text-amber-700 bg-amber-500/10 px-3 rounded-lg -mx-1">
                    <span className="flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      خصم المستوى ({tierDiscount}%)
                    </span>
                    <span className="font-bold">-{tierDiscountAmount.toFixed(0)} ر.س</span>
                  </div>
                )}
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between py-2 text-pink-700 bg-pink-500/10 px-3 rounded-lg -mx-1">
                    <span className="flex items-center gap-1">
                      <Ticket className="h-4 w-4" />
                      خصم الكوبون
                    </span>
                    <span className="font-bold">-{couponDiscount.toFixed(0)} ر.س</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xl font-bold pt-4 border-t border-dashed">
                  <span>الإجمالي</span>
                  <span className="text-primary">{finalAmount.toFixed(0)} ر.س</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            className="w-full h-14 text-lg font-arabic rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
            onClick={handleSubmitOrder}
            disabled={createOrder.isPending || isPaymentProcessing}
          >
            {createOrder.isPending || isPaymentProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin ml-2" />
            ) : (
              <Sparkles className="h-5 w-5 ml-2" />
            )}
            {createOrder.isPending ? 'جاري الإرسال...' : isPaymentProcessing ? 'جاري التحويل للدفع...' : paymentMethod === 'online' ? 'الدفع الآن' : 'تأكيد الطلب'}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {paymentMethod === 'cash' ? '💵 الدفع عند الاستلام' : '🔒 ستتم إعادة توجيهك لصفحة الدفع الآمنة'}
          </p>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;
