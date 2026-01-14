import { useState } from 'react';
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
  Store
} from 'lucide-react';
import { toast } from 'sonner';

interface StoreCartProps {
  primaryColor?: string;
}

const StoreCart = ({ primaryColor = '#1B4332' }: StoreCartProps) => {
  const { items, providerId, providerName, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useProviderCart();
  const { user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmitOrder = async () => {
    if (!customerName || !customerPhone) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress) {
      toast.error('يرجى إدخال عنوان التوصيل');
      return;
    }

    if (!providerId) {
      toast.error('خطأ في بيانات المتجر');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('provider_orders')
        .insert({
          provider_id: providerId,
          customer_id: user?.id || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? deliveryAddress : null,
          notes: notes || null,
          total_amount: totalPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('provider_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً');
      clearCart();
      setIsOpen(false);
      setIsCheckout(false);
      
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setDeliveryAddress('');
      setNotes('');
      
    } catch (error) {
      console.error('Order error:', error);
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-6 left-6 z-50 rounded-full shadow-2xl h-14 w-14 p-0"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:max-w-md font-arabic" dir="rtl">
        <SheetHeader>
          <SheetTitle className="font-arabic text-right">
            {isCheckout ? 'إتمام الطلب' : 'سلة المشتريات'}
          </SheetTitle>
        </SheetHeader>

        {!isCheckout ? (
          // Cart View
          <div className="flex flex-col h-full">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">السلة فارغة</h3>
                <p className="text-sm text-muted-foreground">
                  أضف منتجات لتبدأ الطلب
                </p>
              </div>
            ) : (
              <>
                {providerName && (
                  <div className="flex items-center gap-2 py-3 px-2 bg-muted/50 rounded-lg mb-4">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{providerName}</span>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto space-y-3 py-4">
                  {items.map(item => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.price} ر.س
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>الإجمالي</span>
                    <span style={{ color: primaryColor }}>{totalPrice.toFixed(0)} ر.س</span>
                  </div>
                  
                  <Button 
                    className="w-full font-arabic"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setIsCheckout(true)}
                  >
                    إتمام الطلب
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          // Checkout View
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Order Type */}
              <div className="space-y-2">
                <Label className="font-arabic">نوع الطلب</Label>
                <RadioGroup 
                  value={orderType} 
                  onValueChange={(v) => setOrderType(v as 'pickup' | 'delivery')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="font-arabic cursor-pointer">
                      <Store className="h-4 w-4 inline ml-1" />
                      استلام من المتجر
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="font-arabic cursor-pointer">
                      <MapPin className="h-4 w-4 inline ml-1" />
                      توصيل
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-arabic">الاسم *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="font-arabic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-arabic">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-arabic">البريد الإلكتروني (اختياري)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>

              {orderType === 'delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-arabic">عنوان التوصيل *</Label>
                  <Textarea
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="أدخل عنوان التوصيل بالتفصيل"
                    className="font-arabic"
                    rows={2}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-arabic">ملاحظات (اختياري)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية على الطلب"
                  className="font-arabic"
                  rows={2}
                />
              </div>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-arabic">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(0)} ر.س</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>الإجمالي</span>
                    <span>{totalPrice.toFixed(0)} ر.س</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <SheetFooter className="border-t pt-4 flex-col gap-2">
              <Button
                className="w-full font-arabic"
                style={{ backgroundColor: primaryColor }}
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    إرسال الطلب
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full font-arabic"
                onClick={() => setIsCheckout(false)}
                disabled={isSubmitting}
              >
                العودة للسلة
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default StoreCart;
