import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Truck, 
  XCircle,
  MapPin,
  Loader2,
  Navigation2,
  Store,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { InAppNavigationMode } from '@/components/navigation/InAppNavigationMode';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
}

interface ServiceProvider {
  id: string;
  business_name: string;
  logo_url: string | null;
  phone: string | null;
}

interface PullUpStyleOrderCardProps {
  order: {
    id: string;
    status: string;
    order_type: string;
    total_amount: number;
    created_at: string;
    order_number?: number | null;
    provider_order_items?: OrderItem[];
    service_providers?: ServiceProvider;
    delivery_address?: string | null;
  };
  storeLocation: { lat: number; lng: number };
  onDetailsClick?: () => void;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; step: number }> = {
  pending: { 
    label: 'قيد الانتظار', 
    icon: Clock, 
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    step: 1
  },
  preparing: { 
    label: 'جاري التحضير', 
    icon: ChefHat, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    step: 2
  },
  ready: { 
    label: 'جاهز للاستلام', 
    icon: CheckCircle2, 
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    step: 3
  },
  out_for_delivery: { 
    label: 'في الطريق', 
    icon: Truck, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    step: 3
  },
  completed: { 
    label: 'مكتمل', 
    icon: CheckCircle2, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    step: 4
  },
  cancelled: { 
    label: 'ملغي', 
    icon: XCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    step: 0
  }
};

export function PullUpStyleOrderCard({ 
  order, 
  storeLocation,
  onDetailsClick 
}: PullUpStyleOrderCardProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; durationMinutes: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [heading, setHeading] = useState<number>(0);
  const [mapReady, setMapReady] = useState(false);
  const [isNotifyingStore, setIsNotifyingStore] = useState(false);
  const [hasNotifiedStore, setHasNotifiedStore] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false);

  // Notify store that customer has arrived
  const notifyStoreArrival = useCallback(async () => {
    if (!order.service_providers?.id || isNotifyingStore || hasNotifiedStore) return;

    setIsNotifyingStore(true);
    try {
      // Call edge function to notify store
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'customer_arrived',
          orderId: order.id,
          providerId: order.service_providers.id,
          customerName: 'العميل',
          message: `العميل وصل لاستلام الطلب #${order.order_number || order.id.slice(-4).toUpperCase()} 🙋`
        }
      });

      if (error) throw error;

      setHasNotifiedStore(true);
      toast.success('تم إبلاغ المتجر بوصولك!', {
        description: 'سيتم تجهيز طلبك للتسليم الآن',
        duration: 5000
      });
    } catch (error) {
      console.error('Failed to notify store:', error);
      toast.error('تعذر إبلاغ المتجر', {
        description: 'حاول مرة أخرى أو اتصل بالمتجر مباشرة'
      });
    } finally {
      setIsNotifyingStore(false);
    }
  }, [order.id, order.service_providers?.id, isNotifyingStore, hasNotifiedStore]);

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Calculate distance using Haversine formula
  const calculateDistance = useCallback((from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const R = 6371e3;
    const φ1 = (from.lat * Math.PI) / 180;
    const φ2 = (to.lat * Math.PI) / 180;
    const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
    const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Fetch route
  const fetchRoute = useCallback(async (origin: { lat: number; lng: number }) => {
    if (!map.current || !mapReady) return;

    try {
      const { data, error } = await supabase.functions.invoke('calculate-eta', {
        body: {
          origin,
          destination: storeLocation
        }
      });

      if (error) throw error;

      if (data?.geometry && map.current) {
        const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: data.geometry
          });
        }

        const durationMinutes = Math.round(data.duration / 60);
        setRouteInfo({
          distance: data.distanceText,
          duration: data.durationText,
          durationMinutes
        });

        // Fit bounds
        if (data.geometry.coordinates?.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([origin.lng, origin.lat]);
          bounds.extend([storeLocation.lng, storeLocation.lat]);
          data.geometry.coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
          map.current?.fitBounds(bounds, { padding: 50 });
        }
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
      const distance = calculateDistance(origin, storeLocation);
      const durationMinutes = Math.round((distance / 1000) * 12);
      setRouteInfo({
        distance: distance < 1000 ? `${Math.round(distance)} م` : `${(distance / 1000).toFixed(1)} كم`,
        duration: `~${durationMinutes} دقيقة`,
        durationMinutes
      });
    }
  }, [storeLocation, calculateDistance, mapReady]);

  // Start watching location
  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    setIsLocating(true);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(newLocation);
        setIsLocating(false);

        if (position.coords.heading !== null) {
          setHeading(position.coords.heading);
        }

        fetchRoute(newLocation);
      },
      () => {
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  }, [fetchRoute]);

  // Start navigation mode
  const startNavigation = useCallback(() => {
    if (!map.current || !userLocation) {
      toast.error('يرجى انتظار تحديد موقعك أولاً');
      return;
    }
    setIsNavigationMode(true);
  }, [userLocation]);

  // Exit navigation mode
  const exitNavigation = useCallback(() => {
    setIsNavigationMode(false);
    if (map.current) {
      map.current.flyTo({
        center: [storeLocation.lng, storeLocation.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }
  }, [storeLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [storeLocation.lng, storeLocation.lat],
      zoom: 14,
      attributionControl: false,
    });

    // Store marker with orange color
    const storeEl = document.createElement('div');
    storeEl.innerHTML = `
      <div style="
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #f97316, #ea580c);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 14px rgba(249, 115, 22, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M4 7V4h16v3h-2v13H6V7H4zm2 0v11h12V7H6zm3 2h2v7H9V9zm4 0h2v7h-2V9z"/>
        </svg>
      </div>
    `;

    new mapboxgl.Marker({ element: storeEl })
      .setLngLat([storeLocation.lng, storeLocation.lat])
      .addTo(map.current);

    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#6366f1',
          'line-width': 5,
          'line-opacity': 0.85,
        },
      });

      setMapReady(true);
      startLocationWatch();
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      map.current?.remove();
    };
  }, [mapboxToken, storeLocation, startLocationWatch]);

  // Update user marker and follow in navigation mode
  useEffect(() => {
    if (!map.current || !userLocation || !mapReady) return;

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 2px solid rgba(59, 130, 246, 0.3);
            animation: pulse 2s infinite;
          "></div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="transform: rotate(${heading}deg);">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      `;

      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
      
      // Update heading rotation
      const markerEl = userMarker.current.getElement();
      const svg = markerEl.querySelector('svg');
      if (svg) {
        svg.style.transform = `rotate(${heading}deg)`;
      }
    }
    
    // In navigation mode, follow user and rotate map
    if (isNavigationMode && map.current) {
      map.current.easeTo({
        center: [userLocation.lng, userLocation.lat],
        bearing: heading,
        duration: 500
      });
    }
  }, [userLocation, heading, mapReady, isNavigationMode]);

  // Progress steps based on order status
  const getProgressWidth = () => {
    if (status.step === 1) return '15%';
    if (status.step === 2) return '50%';
    if (status.step >= 3) return '85%';
    return '0%';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-xl bg-card border"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-l from-orange-500 to-amber-500 p-2.5 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-white/90 flex items-center justify-center shadow-md">
              <Store className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-white">
                {order.service_providers?.business_name || 'المتجر'}
              </h3>
              <p className="text-white/90 text-[10px] sm:text-sm">
                طلب #{order.order_number || order.id.slice(-4).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-lg sm:text-2xl font-bold text-white">
              {order.total_amount.toFixed(0)}
              <span className="text-[10px] sm:text-sm font-normal mr-1">ر.س</span>
            </p>
          </div>
        </div>
      </div>

      {/* Status & Progress Section */}
      <div className="p-2.5 sm:p-4 bg-muted/30">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
          <Badge className={`${status.bgColor} ${status.color} border-0 px-2 py-0.5 text-[10px] sm:text-sm font-medium`}>
            <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            {status.label}
          </Badge>
          {routeInfo && (
            <span className="text-[10px] sm:text-sm font-medium text-muted-foreground">
              {routeInfo.distance} • {routeInfo.duration}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2.5">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center shadow">
              <Navigation2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
            <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">موقعك</span>
          </div>

          <div className="flex-1 relative h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: getProgressWidth() }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 flex items-center justify-center shadow">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">المتجر</span>
          </div>
        </div>

        {/* "I'm here" button for ready orders */}
        {order.status === 'ready' && order.order_type === 'pickup' && (
          <Button 
            className={`w-full gap-1.5 shadow-lg text-xs sm:text-sm h-9 sm:h-10 ${hasNotifiedStore ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-white`}
            onClick={notifyStoreArrival}
            disabled={isNotifyingStore || hasNotifiedStore}
          >
            {isNotifyingStore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasNotifiedStore ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {hasNotifiedStore ? 'تم إبلاغ المتجر' : 'وصلت؟ أبلغ المتجر'}
          </Button>
        )}
      </div>

      {/* Map Section - Expands in navigation mode */}
      <div className={`relative transition-all duration-500 ${isNavigationMode ? 'h-[70vh]' : ''}`}>
        {isLoadingToken ? (
          <div className={`bg-muted flex items-center justify-center ${isNavigationMode ? 'h-full' : 'h-36 sm:h-48'}`}>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div 
            ref={mapContainer} 
            className={`w-full transition-all duration-500 ${isNavigationMode ? 'h-full' : 'h-36 sm:h-48'}`} 
          />
        )}

        {isLocating && !isNavigationMode && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1.5 text-primary" />
              <p className="text-xs sm:text-sm text-muted-foreground">جاري تحديد موقعك...</p>
            </div>
          </div>
        )}

        {/* In-App Navigation Overlay */}
        <AnimatePresence>
          {isNavigationMode && map.current && userLocation && (
            <InAppNavigationMode
              map={map.current}
              userLocation={userLocation}
              destination={storeLocation}
              destinationName={order.service_providers?.business_name || 'المتجر'}
              heading={heading}
              routeInfo={routeInfo}
              onExit={exitNavigation}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions - Hidden in navigation mode */}
      {!isNavigationMode && (
        <div className="p-2.5 sm:p-4 border-t flex items-center gap-2">
          <Button
            className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-xs sm:text-sm h-9 sm:h-10"
            onClick={startNavigation}
            disabled={!userLocation}
          >
            <Navigation2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ابدأ الملاحة
          </Button>

          <Button
            variant="outline"
            className="flex-1 gap-1 text-xs sm:text-sm h-9 sm:h-10"
            onClick={onDetailsClick}
          >
            تفاصيل الطلب
          </Button>
        </div>
      )}
    </motion.div>
  );
}
