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
import { UnifiedLocationPicker } from '@/components/location/UnifiedLocationPicker';
import { Badge } from '@/components/ui/badge';
import { OrderScheduler } from '@/components/scheduling/OrderScheduler';
import { LoyaltyTierBadge, tierConfigs } from '@/components/loyalty/LoyaltyTierBadge';
import { Minus, Plus, Trash2, ShoppingBag, MapPin, Truck, Star, Map, CheckCircle2, Ticket, Loader2, X, Crown, CreditCard, Banknote, Sparkles, Gift, Clock, User, Phone, Mail, FileText, Store } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEdfaPayment } from '@/hooks/useEdfaPayment';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const { isWithinDeliveryZone: isUserInZone, userLocation, storeLocation, deliveryRadius } = useLocation();
  const { data: loyaltyPoints } = useLoyaltyPoints();
  const { data: loyaltyTier } = useLoyaltyTier(user?.id);
  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>(
    isUserInZone ? 'delivery' : 'pickup'
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

  // Calculate distance between two points (returns meters)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    if (!storeLocation) return;

    const distance = calculateDistance(storeLocation.lat, storeLocation.lng, location.lat, location.lng);

    if (distance > deliveryRadius) {
      toast.error('الموقع خارج نطاق التوصيل', {
        description: 'يرجى اختيار موقع داخل منطقة التوصيل أو اختيار الاستلام من المتجر'
      });
      return;
    }

    setDeliveryLocation(location);
    toast.success('تم تحديد موقع التوصيل', {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
    });
  };

  // Calculate delivery ETA
  const deliveryEstimate = (() => {
    if (!deliveryLocation || !storeLocation) return null;

    const distanceMeters = calculateDistance(
      storeLocation.lat, storeLocation.lng,
      deliveryLocation.lat, deliveryLocation.lng
    );

    // Average speed 25km/h
    const distanceKm = distanceMeters / 1000;
    const preparationTime = 15; // Increased prep time for realism
    const travelTime = (distanceKm / 25) * 60;
    const totalMinutes = Math.ceil(preparationTime + travelTime);

    return {
      distanceText: distanceKm >= 1 ? `${distanceKm.toFixed(1)} كم` : `${Math.round(distanceMeters)} م`,
      etaText: totalMinutes < 60 ? `${totalMinutes} دقيقة` : `${Math.floor(totalMinutes / 60)} ساعة و ${totalMinutes % 60} دقيقة`
    };
  })();

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
      <div className="min-h-screen bg-background font-arabic pt-[env(safe-area-inset-top)] overflow-x-hidden" dir="rtl">
        <div className="w-full max-w-lg mx-auto px-3 py-4 pb-28">
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
            <Link to="/app">
              <Button size="lg" className="font-arabic gap-2 rounded-full px-8">
                <Sparkles className="h-5 w-5" />
                تصفح المتاجر
              </Button>
            </Link>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic pt-[env(safe-area-inset-top)] overflow-x-hidden" dir="rtl">
      <div className="w-full max-w-lg mx-auto px-3 py-4 pb-36">
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-white/10 shadow-md bg-card/50 backdrop-blur-sm group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.image_url ? (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-500">
                          <img
                            src={item.image_url}
                            alt={item.name_ar}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 right-1 bg-primary/90 backdrop-blur-md text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            x{item.quantity}
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                          <div className="text-4xl opacity-50">☕</div>
                        </div>
                      )}

                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{item.name_ar}</h3>
                          {item.selected_options && item.selected_options.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {item.selected_options.map(o => o.value_name).join(' • ')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          <p className="text-primary font-bold text-xl">
                            {(item.price * item.quantity).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">ر.س</span>
                          </p>

                          <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1 border border-border/50">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full hover:bg-background shadow-sm transition-all"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full hover:bg-background shadow-sm transition-all"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="pickup"
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${orderType === 'pickup'
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'border-muted hover:border-primary/30 hover:bg-muted/30'
                    }`}
                >
                  <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                  <div className={`p-3 rounded-full transition-colors duration-300 ${orderType === 'pickup' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'}`}>
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-base">استلام من المتجر</span>
                    <span className="text-xs text-muted-foreground mt-1 block">استلم طلبك بنفسك</span>
                  </div>
                  {orderType === 'pickup' && (
                    <motion.div layoutId="orderTypeCheck" className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    </motion.div>
                  )}
                </Label>

                <Label
                  htmlFor="delivery"
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${orderType === 'delivery'
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'border-muted hover:border-primary/30 hover:bg-muted/30'
                    }`}
                >
                  <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                  <div className={`p-3 rounded-full transition-colors duration-300 ${orderType === 'delivery' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'}`}>
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-base">توصيل للمنزل</span>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {(isUserInZone || deliveryLocation)
                        ? 'توصيل سريع ومباشر'
                        : 'خارج نطاق التوصيل'
                      }
                    </span>
                  </div>
                  {orderType === 'delivery' && (
                    <motion.div layoutId="orderTypeCheck" className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    </motion.div>
                  )}
                </Label>
              </RadioGroup>
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
                <div className="space-y-4">
                  <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-lg border-2 border-primary/10">
                    <UnifiedLocationPicker onLocationSelect={handleLocationSelect} />
                  </div>

                  {deliveryLocation && (
                    <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400 font-arabic mb-0.5">
                              موقع التوصيل المحدد
                            </p>
                            <p className="text-sm text-foreground font-arabic leading-relaxed">
                              {deliveryLocation.address}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] px-1.5 h-5">
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            مؤكد
                          </Badge>
                        </div>

                        {deliveryEstimate && (
                          <div className="flex items-center gap-3 pt-2 border-t border-green-200 dark:border-green-800/50">
                            <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium font-arabic">
                                وقت التوصيل المتوقع: {deliveryEstimate.etaText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Truck className="h-3.5 w-3.5" />
                              <span className="text-xs font-arabic">
                                {deliveryEstimate.distanceText}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
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
                className="grid grid-cols-1 gap-4"
              >
                <Label
                  htmlFor="cash-payment"
                  className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-500/5 shadow-md scale-[1.02]'
                    : 'border-muted hover:border-green-500/30 hover:bg-muted/30'
                    }`}
                >
                  <RadioGroupItem value="cash" id="cash-payment" className="sr-only" />
                  <div className={`p-3 rounded-xl transition-colors duration-300 ${paymentMethod === 'cash' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-muted text-muted-foreground'}`}>
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base">الدفع عند الاستلام</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ادفع نقداً عند استلام طلبك</p>
                  </div>
                  {paymentMethod === 'cash' && (
                    <motion.div layoutId="paymentCheck" className="absolute top-4 left-4">
                      <div className="bg-green-500 text-white rounded-full p-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </motion.div>
                  )}
                </Label>

                <Label
                  htmlFor="online-payment"
                  className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'online'
                    ? 'border-blue-500 bg-blue-500/5 shadow-md scale-[1.02]'
                    : 'border-muted hover:border-blue-500/30 hover:bg-muted/30'
                    }`}
                >
                  <RadioGroupItem value="online" id="online-payment" className="sr-only" />
                  <div className={`p-3 rounded-xl transition-colors duration-300 ${paymentMethod === 'online' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-muted text-muted-foreground'}`}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base">الدفع الإلكتروني</p>
                    <p className="text-xs text-muted-foreground mt-0.5">بطاقة ائتمان / مدى / Apple Pay</p>
                  </div>
                  {paymentMethod === 'online' && (
                    <div className="flex gap-1 absolute bottom-4 left-4 opacity-50">
                      <div className="w-6 h-4 bg-foreground/20 rounded"></div>
                      <div className="w-6 h-4 bg-foreground/20 rounded"></div>
                    </div>
                  )}
                  {paymentMethod === 'online' && (
                    <motion.div layoutId="paymentCheck" className="absolute top-4 left-4">
                      <div className="bg-blue-500 text-white rounded-full p-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </motion.div>
                  )}
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
            className="w-full h-16 text-xl font-bold font-arabic rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary to-primary/90"
            onClick={handleSubmitOrder}
            disabled={createOrder.isPending || isPaymentProcessing}
          >
            {createOrder.isPending || isPaymentProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin ml-2" />
            ) : (
              <Sparkles className="h-6 w-6 ml-2 animate-pulse" />
            )}
            {createOrder.isPending ? 'جاري الإرسال...' : isPaymentProcessing ? 'جاري التحويل للدفع...' : paymentMethod === 'online' ? `الدفع الآن • ${finalAmount.toFixed(0)} ر.س` : `تأكيد الطلب • ${finalAmount.toFixed(0)} ر.س`}
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
