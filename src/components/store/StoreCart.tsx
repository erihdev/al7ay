import { useState, useEffect, useCallback, useRef } from 'react';
import { useProviderCart } from '@/contexts/ProviderCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  Sparkles,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Map,
  Navigation
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

          {/* Location Selection Options */}
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
            </div>
          )}
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
        className="mt-auto pt-6 w-full space-y-3"
      >
        <Button
          className="w-full h-12 rounded-xl shadow-lg"
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
