import { useState, useEffect } from 'react';
import { useProviderCart } from '@/contexts/ProviderCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  Send,
  Loader2,
  MapPin,
  Store,
  CheckCircle2,
  Phone,
  User,
  Mail,
  FileText,
  ArrowRight,
  Package,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface StoreCartProps {
  primaryColor?: string;
}

type ViewState = 'cart' | 'checkout' | 'success';

interface OrderResult {
  orderId: string;
  orderNumber: string;
}

const StoreCart = ({ primaryColor = '#1B4332' }: StoreCartProps) => {
  const { items, providerId, providerName, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useProviderCart();
  const { user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-fill user data when logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          if (profile.full_name && !customerName) setCustomerName(profile.full_name);
          if (profile.phone && !customerPhone) setCustomerPhone(profile.phone);
        }
        
        if (user.email && !customerEmail) {
          setCustomerEmail(user.email);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Reset view when sheet closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to avoid visible reset
      setTimeout(() => {
        if (viewState === 'success') {
          setViewState('cart');
          setOrderResult(null);
        }
      }, 300);
    }
  }, [isOpen]);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }

    if (!customerPhone.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }

    if (!/^05\d{8}$/.test(customerPhone.trim())) {
      toast.error('يرجى إدخال رقم هاتف صحيح (يبدأ بـ 05)');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      toast.error('يرجى إدخال عنوان التوصيل');
      return;
    }

    if (!providerId) {
      toast.error('خطأ في بيانات المتجر');
      return;
    }

    if (items.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('provider_orders')
        .insert({
          provider_id: providerId,
          customer_id: user?.id || null,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : null,
          notes: notes.trim() || null,
          total_amount: totalPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with selected_options
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        selected_options: null
      }));

      const { error: itemsError } = await supabase
        .from('provider_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Set success state
      setOrderResult({
        orderId: order.id,
        orderNumber: orderNumber
      });
      setViewState('success');
      
      // Clear cart
      clearCart();
      
    } catch (error) {
      console.error('Order error:', error);
      toast.error('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewOrder = () => {
    setViewState('cart');
    setOrderResult(null);
    setIsOpen(false);
  };

  const renderCartView = () => (
    <div className="flex flex-col h-full">
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">السلة فارغة</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            أضف منتجات من القائمة لتبدأ الطلب
          </p>
        </div>
      ) : (
        <>
          {providerName && (
            <div className="flex items-center gap-2 py-3 px-3 bg-muted/50 rounded-xl mb-4">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{providerName}</span>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto space-y-3 py-2 -mx-2 px-2">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.productName}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{item.productName}</h4>
                          <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                            {item.price} ر.س
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full hover:bg-background"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full hover:bg-background"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t pt-4 space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">المجموع</span>
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {totalPrice.toFixed(0)} ر.س
              </span>
            </div>
            
            <Button 
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setViewState('checkout')}
            >
              <ArrowRight className="h-5 w-5 ml-2" />
              متابعة الطلب
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderCheckoutView = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 space-y-5 -mx-2 px-2">
        {/* Order Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">نوع الطلب</Label>
          <RadioGroup 
            value={orderType} 
            onValueChange={(v) => setOrderType(v as 'pickup' | 'delivery')}
            className="grid grid-cols-2 gap-3"
          >
            <Label 
              htmlFor="pickup" 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                orderType === 'pickup' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
              style={orderType === 'pickup' ? { borderColor: primaryColor } : {}}
            >
              <Store className="h-6 w-6" style={orderType === 'pickup' ? { color: primaryColor } : {}} />
              <span className="text-sm font-medium">استلام</span>
              <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
            </Label>
            <Label 
              htmlFor="delivery" 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                orderType === 'delivery' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
              style={orderType === 'delivery' ? { borderColor: primaryColor } : {}}
            >
              <MapPin className="h-6 w-6" style={orderType === 'delivery' ? { color: primaryColor } : {}} />
              <span className="text-sm font-medium">توصيل</span>
              <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
            </Label>
          </RadioGroup>
        </div>

        {/* Customer Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            بيانات العميل
          </h3>
          
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="الاسم الكامل *"
                className="pr-10 h-12 rounded-xl"
              />
            </div>

            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="رقم الهاتف * (05XXXXXXXX)"
                dir="ltr"
                className="pr-10 h-12 rounded-xl text-right"
              />
            </div>

            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="البريد الإلكتروني (اختياري)"
                dir="ltr"
                className="pr-10 h-12 rounded-xl text-right"
              />
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <AnimatePresence>
          {orderType === 'delivery' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                عنوان التوصيل
              </h3>
              <Textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="أدخل عنوان التوصيل بالتفصيل *"
                className="min-h-[80px] rounded-xl resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ملاحظات
          </h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات إضافية على الطلب (اختياري)"
            className="min-h-[60px] rounded-xl resize-none"
          />
        </div>

        {/* Order Summary */}
        <Card className="border-0 bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              ملخص الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-muted-foreground">
                <span>{item.productName} × {item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(0)} ر.س</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>الإجمالي</span>
              <span style={{ color: primaryColor }}>{totalPrice.toFixed(0)} ر.س</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <SheetFooter className="border-t pt-4 flex-col gap-2 mt-2">
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
          style={{ backgroundColor: primaryColor }}
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
              جاري إرسال الطلب...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 ml-2" />
              تأكيد الطلب
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full h-10"
          onClick={() => setViewState('cart')}
          disabled={isSubmitting}
        >
          العودة للسلة
        </Button>
      </SheetFooter>
    </div>
  );

  const renderSuccessView = () => (
    <div className="flex flex-col h-full items-center justify-center text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <CheckCircle2 className="h-14 w-14" style={{ color: primaryColor }} />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="h-8 w-8 text-yellow-500" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-2xl font-bold">تم استلام طلبك!</h2>
        <p className="text-muted-foreground">
          شكراً لك، سيتم التواصل معك قريباً
        </p>
      </motion.div>

      {orderResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-muted/50 space-y-2"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>رقم الطلب</span>
          </div>
          <p className="font-mono text-lg font-bold" style={{ color: primaryColor }}>
            {orderResult.orderNumber}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 space-y-3 w-full max-w-[250px]"
      >
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <Store className="h-4 w-4" />
            <span>{providerName || 'المتجر'}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            {orderType === 'pickup' ? (
              <>
                <Store className="h-4 w-4" />
                <span>استلام من المتجر</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>توصيل للعنوان</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto pt-6 w-full"
      >
        <Button
          className="w-full h-12 rounded-xl"
          variant="outline"
          onClick={handleNewOrder}
        >
          إغلاق
        </Button>
      </motion.div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 left-6 z-50"
        >
          <Button 
            className="rounded-full shadow-2xl h-14 w-14 p-0 relative"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="h-6 w-6" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:max-w-md font-arabic p-0" dir="rtl">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="font-arabic text-right text-lg">
              {viewState === 'cart' && 'سلة المشتريات'}
              {viewState === 'checkout' && 'إتمام الطلب'}
              {viewState === 'success' && 'تأكيد الطلب'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden p-6">
            <AnimatePresence mode="wait">
              {viewState === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  {renderCartView()}
                </motion.div>
              )}
              {viewState === 'checkout' && (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  {renderCheckoutView()}
                </motion.div>
              )}
              {viewState === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full"
                >
                  {renderSuccessView()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoreCart;
