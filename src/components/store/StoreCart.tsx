import { useState, useEffect, useCallback, useRef } from 'react';
import { useProviderCart } from '@/contexts/ProviderCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useEdfaPayment } from '@/hooks/useEdfaPayment';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  FileText,
  ArrowRight,
  Package,
  Clock,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Map,
  Navigation,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface StoreCartProps {
  primaryColor?: string;
  storeLocation?: { lat: number; lng: number } | null;
  deliveryRadiusKm?: number;
}

type ViewState = 'cart' | 'checkout' | 'success';

interface OrderResult {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  paymentMethod: string;
  createdAt: Date;
}

// Manual Location Picker Component
interface ManualLocationPickerProps {
  storeLocation: { lat: number; lng: number };
  deliveryRadiusKm: number;
  onLocationSelect: (lat: number, lng: number) => void;
  primaryColor: string;
}

function ManualLocationPicker({ storeLocation, deliveryRadiusKm, onLocationSelect, primaryColor }: ManualLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');

  // Create circle GeoJSON
  const createCircleGeoJSON = (lng: number, lat: number, radiusKm: number) => {
    const points = 64;
    const coords: [number, number][] = [];
    const radiusMeters = radiusKm * 1000;
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusMeters * Math.cos(angle);
      const dy = radiusMeters * Math.sin(angle);
      
      const newLat = lat + (dy / 111320);
      const newLng = lng + (dx / (111320 * Math.cos(lat * Math.PI / 180)));
      
      coords.push([newLng, newLat]);
    }
    coords.push(coords[0]);

    return {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coords],
        },
      }],
    };
  };

  // Reverse geocode
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!mapboxToken) return;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=ar`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [storeLocation.lng, storeLocation.lat],
      zoom: 13,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add store marker
      const storeEl = document.createElement('div');
      storeEl.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: ${primaryColor};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M4 7V4h16v3h-2v13H6V7H4zm2 0v11h12V7H6z"/>
          </svg>
        </div>
      `;

      new mapboxgl.Marker({ element: storeEl })
        .setLngLat([storeLocation.lng, storeLocation.lat])
        .addTo(map.current!);

      // Add delivery zone circle
      map.current.addSource('delivery-zone', {
        type: 'geojson',
        data: createCircleGeoJSON(storeLocation.lng, storeLocation.lat, deliveryRadiusKm),
      });

      map.current.addLayer({
        id: 'delivery-zone-fill',
        type: 'fill',
        source: 'delivery-zone',
        paint: {
          'fill-color': primaryColor,
          'fill-opacity': 0.1,
        },
      });

      map.current.addLayer({
        id: 'delivery-zone-border',
        type: 'line',
        source: 'delivery-zone',
        paint: {
          'line-color': primaryColor,
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });
    });

    // Create draggable marker
    marker.current = new mapboxgl.Marker({
      color: '#3b82f6',
      draggable: true,
    })
      .setLngLat([storeLocation.lng, storeLocation.lat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
        reverseGeocode(lngLat.lat, lngLat.lng);
      }
    });

    map.current.on('click', (e) => {
      marker.current?.setLngLat(e.lngLat);
      setSelectedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      reverseGeocode(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, storeLocation, deliveryRadiusKm, primaryColor]);

  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map.current && marker.current) {
          map.current.flyTo({ center: [longitude, latitude], zoom: 15 });
          marker.current.setLngLat([longitude, latitude]);
          setSelectedLocation({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
        }
      },
      () => {
        toast.error('لم نتمكن من تحديد موقعك');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (isLoadingToken) {
    return (
      <div className="h-48 bg-muted rounded-xl flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border">
        <div ref={mapContainer} className="h-48 w-full" />
        
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-2 left-2 shadow-lg h-8 w-8"
          onClick={handleGetCurrentLocation}
          title="موقعي الحالي"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {address && (
        <div className="flex items-start gap-2 p-2.5 bg-muted rounded-lg text-xs">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="line-clamp-2">{address}</p>
        </div>
      )}

      <Button
        type="button"
        className="w-full h-10 rounded-xl gap-2"
        style={{ backgroundColor: primaryColor }}
        onClick={() => selectedLocation && onLocationSelect(selectedLocation.lat, selectedLocation.lng)}
        disabled={!selectedLocation}
      >
        <CheckCircle2 className="h-4 w-4" />
        تأكيد الموقع
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        اضغط على الخريطة أو اسحب العلامة الزرقاء لتحديد موقع التوصيل
      </p>
    </div>
  );
}

const StoreCart = ({ primaryColor = '#1B4332', storeLocation, deliveryRadiusKm = 5 }: StoreCartProps) => {
  const navigate = useNavigate();
  const { items, providerId, providerName, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useProviderCart();
  const { user } = useAuth();
  const { initiatePayment, isProcessing: isPaymentProcessing } = useEdfaPayment();
  
  const [isOpen, setIsOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [distanceToStore, setDistanceToStore] = useState<number | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check delivery range when order type is delivery
  const checkDeliveryRange = useCallback(() => {
    if (!storeLocation) return;
    
    setIsCheckingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setCustomerLocation({ lat: userLat, lng: userLng });
        
        const distance = calculateDistance(
          storeLocation.lat,
          storeLocation.lng,
          userLat,
          userLng
        );
        
        setDistanceToStore(distance);
        setIsOutOfRange(distance > deliveryRadiusKm);
        setIsCheckingLocation(false);
      },
      () => {
        setIsCheckingLocation(false);
        toast.error('لم نتمكن من تحديد موقعك. يرجى السماح بالوصول للموقع');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [storeLocation, deliveryRadiusKm]);

  // Check location when switching to delivery (only if not using manual location)
  useEffect(() => {
    if (orderType === 'delivery' && storeLocation && !customerLocation && !useManualLocation) {
      checkDeliveryRange();
    }
  }, [orderType, storeLocation, customerLocation, checkDeliveryRange, useManualLocation]);

  // Handle manual location selection
  const handleManualLocationSelect = (lat: number, lng: number) => {
    if (!storeLocation) return;
    
    setCustomerLocation({ lat, lng });
    
    const distance = calculateDistance(
      storeLocation.lat,
      storeLocation.lng,
      lat,
      lng
    );
    
    setDistanceToStore(distance);
    setIsOutOfRange(distance > deliveryRadiusKm);
    setShowMapPicker(false);
  };

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

  const formatOrderNumber = (orderNumber: number) => {
    return orderNumber.toString();
  };

  const formatInvoiceNumber = (orderNumber: number) => {
    return orderNumber.toString();
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

    // Check delivery range
    if (orderType === 'delivery' && isOutOfRange) {
      toast.error(`أنت خارج نطاق التوصيل (${deliveryRadiusKm} كم). يرجى اختيار الاستلام من المتجر`);
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
      // Order number will come from database

      // If online payment, use Payment First policy
      if (paymentMethod === 'online') {
        const paymentResult = await initiatePayment({
          providerId: providerId || undefined,
          customerId: user?.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          orderType: orderType,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
          notes: notes.trim() || undefined,
          totalAmount: totalPrice,
          items: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            selectedOptions: null
          })),
        });

        if (!paymentResult.success) {
          toast.error('فشل بدء عملية الدفع، يمكنك الدفع عند الاستلام');
          setIsSubmitting(false);
          return;
        }
        
        // Payment redirect happens in useEdfaPayment
        // Order will be created after successful payment via webhook
        // Clear cart before redirect
        clearCart();
        return;
      }

      // For cash payment, create order immediately
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

      // Award loyalty points to customer if they are logged in
      if (user?.id) {
        try {
          // Fetch loyalty settings
          const { data: loyaltySettings } = await supabase
            .from('loyalty_settings')
            .select('loyalty_enabled, points_per_riyal')
            .single();

          if (loyaltySettings?.loyalty_enabled) {
            const pointsPerRiyal = loyaltySettings.points_per_riyal || 1;
            const pointsEarned = Math.floor(totalPrice * pointsPerRiyal);

            if (pointsEarned > 0) {
              // Check if user has loyalty record
              const { data: existingPoints } = await supabase
                .from('loyalty_points')
                .select('id, total_points, lifetime_points')
                .eq('user_id', user.id)
                .single();

              if (existingPoints) {
                // Update existing points
                await supabase
                  .from('loyalty_points')
                  .update({
                    total_points: existingPoints.total_points + pointsEarned,
                    lifetime_points: existingPoints.lifetime_points + pointsEarned,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', user.id);
              } else {
                // Create new loyalty record
                await supabase
                  .from('loyalty_points')
                  .insert({
                    user_id: user.id,
                    total_points: pointsEarned,
                    lifetime_points: pointsEarned,
                    tier: 'bronze'
                  });
              }

              // Add points history record
              await supabase
                .from('points_history')
                .insert({
                  user_id: user.id,
                  points_change: pointsEarned,
                  transaction_type: 'earned',
                  description: `نقاط مكتسبة من طلب #${order.order_number}`
                });

              console.log(`Awarded ${pointsEarned} loyalty points to customer`);
            }
          }
        } catch (pointsError) {
          console.error('Error awarding loyalty points:', pointsError);
          // Don't fail the order if points fail
        }
      }

      // Send push notification to provider for new order
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'new_order',
            orderId: order.id,
            providerId: providerId,
            customerName: customerName.trim(),
            totalAmount: totalPrice,
            orderType: orderType
          }
        });
      } catch (notifError) {
        console.error('Failed to send provider notification:', notifError);
        // Don't fail the order if notification fails
      }

      // Set success state
      setOrderResult({
        orderId: order.id,
        orderNumber: formatOrderNumber(order.order_number),
        invoiceNumber: formatInvoiceNumber(order.order_number),
        paymentMethod: 'الدفع عند الاستلام',
        createdAt: new Date()
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
      <div className="flex-1 overflow-y-auto py-2 space-y-4 -mx-2 px-2">
        
        {/* Professional Invoice Header */}
        <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: primaryColor, transform: 'translate(30%, -30%)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">فاتورة الطلب</h3>
                <p className="text-xs text-muted-foreground">{providerName || 'المتجر'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items - Invoice Style */}
        <div className="bg-background rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              تفاصيل الطلب ({items.length} منتج)
            </h4>
          </div>
          <div className="divide-y">
            {items.map((item, index) => (
              <div key={item.id} className="p-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.price} ر.س × {item.quantity}</p>
                </div>
                <div className="text-sm font-bold" style={{ color: primaryColor }}>
                  {(item.price * item.quantity).toFixed(0)} ر.س
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="font-semibold">المجموع الكلي</span>
              <div className="text-left">
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>{totalPrice.toFixed(0)}</span>
                <span className="text-sm mr-1">ر.س</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Store className="h-4 w-4" />
            طريقة الاستلام
          </Label>
          <RadioGroup 
            value={orderType} 
            onValueChange={(v) => setOrderType(v as 'pickup' | 'delivery')}
            className="grid grid-cols-2 gap-3"
          >
            <Label 
              htmlFor="pickup" 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                orderType === 'pickup' 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
              style={orderType === 'pickup' ? { borderColor: primaryColor } : {}}
            >
              <Store className="h-6 w-6" style={orderType === 'pickup' ? { color: primaryColor } : {}} />
              <span className="text-sm font-medium">استلام</span>
              <span className="text-[10px] text-muted-foreground">من المتجر</span>
              <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
            </Label>
            <Label 
              htmlFor="delivery" 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                orderType === 'delivery' 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
              style={orderType === 'delivery' ? { borderColor: primaryColor } : {}}
            >
              <MapPin className="h-6 w-6" style={orderType === 'delivery' ? { color: primaryColor } : {}} />
              <span className="text-sm font-medium">توصيل</span>
              <span className="text-[10px] text-muted-foreground">لموقعك</span>
              <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
            </Label>
          </RadioGroup>

          {/* Location Selection Options for Delivery */}
          {orderType === 'delivery' && (
            <div className="space-y-3">
              {/* Location Mode Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={!useManualLocation ? "default" : "outline"}
                  size="sm"
                  className="gap-2 h-10"
                  onClick={() => {
                    setUseManualLocation(false);
                    setShowMapPicker(false);
                    setCustomerLocation(null);
                    setDistanceToStore(null);
                    setIsOutOfRange(false);
                    checkDeliveryRange();
                  }}
                  style={!useManualLocation ? { backgroundColor: primaryColor } : {}}
                >
                  <Navigation className="h-4 w-4" />
                  موقعي الحالي
                </Button>
                <Button
                  type="button"
                  variant={useManualLocation ? "default" : "outline"}
                  size="sm"
                  className="gap-2 h-10"
                  onClick={() => {
                    setUseManualLocation(true);
                    setShowMapPicker(true);
                    setCustomerLocation(null);
                    setDistanceToStore(null);
                    setIsOutOfRange(false);
                  }}
                  style={useManualLocation ? { backgroundColor: primaryColor } : {}}
                >
                  <Map className="h-4 w-4" />
                  تحديد يدوي
                </Button>
              </div>

              {/* Manual Map Picker */}
              <AnimatePresence>
                {useManualLocation && showMapPicker && storeLocation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <ManualLocationPicker
                      storeLocation={storeLocation}
                      deliveryRadiusKm={deliveryRadiusKm}
                      onLocationSelect={handleManualLocationSelect}
                      primaryColor={primaryColor}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Auto Location Status */}
              <AnimatePresence>
                {!useManualLocation && isCheckingLocation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-center gap-2 p-3 bg-muted rounded-xl"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">جاري تحديد موقعك...</span>
                  </motion.div>
                )}

                {!isCheckingLocation && isOutOfRange && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
                        <span className="font-bold block mb-1">أنت خارج نطاق التوصيل!</span>
                        المسافة: {distanceToStore?.toFixed(1)} كم (الحد الأقصى: {deliveryRadiusKm} كم)
                        <br />
                        <span className="text-xs">يرجى اختيار "استلام" من المتجر أو تحديد موقع آخر</span>
                      </AlertDescription>
                    </Alert>
                    {!useManualLocation && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 gap-2"
                        onClick={checkDeliveryRange}
                      >
                        <RefreshCw className="h-4 w-4" />
                        إعادة تحديد الموقع
                      </Button>
                    )}
                  </motion.div>
                )}

                {!isCheckingLocation && !isOutOfRange && distanceToStore !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      موقعك ضمن نطاق التوصيل ({distanceToStore?.toFixed(1)} كم)
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delivery Address */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  عنوان التوصيل التفصيلي *
                </Label>
                <Textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="مثال: حي النخيل، شارع الملك فهد، مبنى رقم 5، الدور الثاني"
                  className="min-h-[70px] rounded-xl resize-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            طريقة الدفع
          </Label>
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={(v) => setPaymentMethod(v as 'cash' | 'online')}
            className="grid grid-cols-2 gap-3"
          >
            <Label 
              htmlFor="cash" 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'cash' 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
              style={paymentMethod === 'cash' ? { borderColor: primaryColor } : {}}
            >
              <Banknote className="h-6 w-6" style={paymentMethod === 'cash' ? { color: primaryColor } : {}} />
              <span className="text-sm font-medium">نقداً</span>
              <span className="text-[10px] text-muted-foreground">عند الاستلام</span>
              <RadioGroupItem value="cash" id="cash" className="sr-only" />
            </Label>
            <Label 
              htmlFor="online" 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'online' 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
              style={paymentMethod === 'online' ? { borderColor: primaryColor } : {}}
            >
              <CreditCard className="h-6 w-6" style={paymentMethod === 'online' ? { color: primaryColor } : {}} />
              <span className="text-sm font-medium">إلكتروني</span>
              <span className="text-[10px] text-muted-foreground">بطاقة / Apple Pay</span>
              <RadioGroupItem value="online" id="online" className="sr-only" />
            </Label>
          </RadioGroup>
          
          {paymentMethod === 'online' && (
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                سيتم توجيهك لصفحة الدفع الآمنة بعد تأكيد الطلب
              </p>
            </div>
          )}
        </div>

        {/* Notes - Compact */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ملاحظات (اختياري)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية على الطلب..."
            className="min-h-[50px] rounded-xl resize-none text-sm"
          />
        </div>

      </div>

      <SheetFooter className="border-t pt-4 flex-col gap-2 mt-2 bg-background">
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
          style={{ backgroundColor: primaryColor }}
          onClick={handleSubmitOrder}
          disabled={isSubmitting || (orderType === 'delivery' && isOutOfRange)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
              جاري إرسال الطلب...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 ml-2" />
              تأكيد الطلب • {totalPrice.toFixed(0)} ر.س
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
    <div className="flex flex-col h-full items-center justify-center text-center py-4">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative mb-4"
      >
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: primaryColor }} />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h2 className="text-xl font-bold">تم استلام طلبك!</h2>
        <p className="text-sm text-muted-foreground">
          سيتم التواصل معك قريباً
        </p>
      </motion.div>

      {/* Professional Invoice */}
      {orderResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 w-full"
        >
          <div className="bg-background rounded-2xl border shadow-lg overflow-hidden">
            {/* Invoice Header */}
            <div className="p-4 border-b text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` }}>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full opacity-20" style={{ background: primaryColor, transform: 'translate(-30%, -30%)' }} />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: primaryColor, transform: 'translate(30%, 30%)' }} />
              
              <div className="relative">
                <div className="text-[10px] font-medium text-muted-foreground mb-1">فاتورة ضريبية مبسطة</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Store className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="font-bold text-lg">{providerName || 'المتجر'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {orderResult.createdAt.toLocaleDateString('ar-SA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* Invoice & Order Numbers */}
            <div className="grid grid-cols-2 divide-x divide-x-reverse border-b">
              <div className="p-3 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">رقم الفاتورة</div>
                <p className="font-mono text-xs font-bold" style={{ color: primaryColor }}>
                  {orderResult.invoiceNumber}
                </p>
              </div>
              <div className="p-3 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">رقم الطلب</div>
                <p className="font-mono text-xs font-bold" style={{ color: primaryColor }}>
                  {orderResult.orderNumber}
                </p>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-3 border-b space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">نوع الطلب</span>
                <div className="flex items-center gap-1.5">
                  {orderType === 'pickup' ? (
                    <>
                      <Store className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                      <span className="font-medium">استلام من المتجر</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                      <span className="font-medium">توصيل</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">طريقة الدفع</span>
                <span className="font-medium">{orderResult.paymentMethod}</span>
              </div>
            </div>

            {/* Items Summary */}
            <div className="p-3 border-b bg-muted/20">
              <div className="text-[10px] font-medium text-muted-foreground mb-2">تفاصيل الطلب</div>
              <div className="space-y-1.5">
                {items.length > 0 ? items.map((item, index) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{index + 1}. {item.productName} × {item.quantity}</span>
                    <span className="font-medium">{(item.price * item.quantity).toFixed(0)} ر.س</span>
                  </div>
                )) : (
                  <div className="text-xs text-muted-foreground text-center">تم تأكيد المنتجات</div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="p-4" style={{ background: `${primaryColor}10` }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">المبلغ الإجمالي</span>
                  <div className="text-[10px] text-muted-foreground">شامل الضريبة</div>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold" style={{ color: primaryColor }}>{totalPrice.toFixed(0)}</span>
                  <span className="text-sm mr-1 font-medium">ر.س</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-2 border-t bg-muted/30 text-center">
              <p className="text-[9px] text-muted-foreground">
                شكراً لتعاملكم معنا • نتمنى لكم تجربة ممتعة
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto pt-4 w-full space-y-2"
      >
        <Button
          className="w-full h-11 rounded-xl shadow-lg"
          style={{ backgroundColor: primaryColor }}
          onClick={() => {
            handleNewOrder();
            navigate('/my-store-orders');
          }}
        >
          <ExternalLink className="h-4 w-4 ml-2" />
          تتبع الطلب
        </Button>
        <Button
          className="w-full h-10 rounded-xl"
          variant="ghost"
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
        <button data-cart-trigger className="hidden" />
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
