import { useState, useEffect, useCallback } from 'react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Truck, 
  XCircle,
  MapPin,
  Loader2,
  X,
  Car,
  Navigation2,
  Hand
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef } from 'react';

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
    provider_order_items?: OrderItem[];
    service_providers?: ServiceProvider;
    delivery_address?: string | null;
  };
  storeLocation: { lat: number; lng: number };
  onDetailsClick?: () => void;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: { 
    label: 'قيد الانتظار', 
    icon: Clock, 
    color: 'text-amber-700',
    bgColor: 'bg-amber-100'
  },
  preparing: { 
    label: 'جاري تحضير الطلب', 
    icon: ChefHat, 
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  ready: { 
    label: 'جاهز للاستلام', 
    icon: CheckCircle2, 
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  out_for_delivery: { 
    label: 'في الطريق', 
    icon: Truck, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  completed: { 
    label: 'مكتمل', 
    icon: CheckCircle2, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  cancelled: { 
    label: 'ملغي', 
    icon: XCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-100'
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

  const [showMap, setShowMap] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; durationMinutes: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [heading, setHeading] = useState<number>(0);

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
    if (!map.current) return;

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
          map.current?.fitBounds(bounds, { padding: 60 });
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
  }, [storeLocation, calculateDistance]);

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

  // Open external navigation
  const openExternalNavigation = useCallback(() => {
    const destination = `${storeLocation.lat},${storeLocation.lng}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    window.open(isIOS ? appleMapsUrl : googleMapsUrl, '_blank');
  }, [storeLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !showMap) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [storeLocation.lng, storeLocation.lat],
      zoom: 13,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Store marker
    const storeEl = document.createElement('div');
    storeEl.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: #f97316;
        border-radius: 8px;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="color: white; font-weight: bold; font-size: 10px;">STORE</span>
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
          'line-opacity': 0.9,
        },
      });

      startLocationWatch();
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      map.current?.remove();
    };
  }, [mapboxToken, storeLocation, showMap, startLocationWatch]);

  // Update user marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 2px solid rgba(59, 130, 246, 0.4);
            animation: pulse 2s infinite;
          "></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="transform: rotate(${heading}deg);">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      `;

      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation, heading]);

  // Calculate progress percentage
  const progressPercent = routeInfo ? Math.min(90, Math.max(10, 100 - (routeInfo.durationMinutes / 30) * 100)) : 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-l from-orange-400 to-amber-400 p-4">
        <div className="flex items-start justify-between">
          {/* Left - Order Info */}
          <div className="flex items-center gap-3">
            {/* Status Icon */}
            <div className="w-14 h-14 rounded-xl bg-white/90 flex items-center justify-center">
              <StatusIcon className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Order #{order.id.slice(-4).toUpperCase()}
                </h3>
                <Badge className="bg-orange-600 text-white border-0 text-xs">
                  مباشر
                </Badge>
              </div>
              <p className="text-white/90 text-sm mt-1">{status.label}</p>
            </div>
          </div>

          {/* Right - Price */}
          <div className="text-left">
            <p className="text-2xl font-bold text-white">
              {order.total_amount.toFixed(2)}
              <span className="text-sm font-normal mr-1">ر.س</span>
            </p>
            <Badge className={`${status.bgColor} ${status.color} border-0 text-xs mt-1`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current ml-1 animate-pulse" />
              {status.label}
            </Badge>
          </div>
        </div>

        {/* "I'm here" button for ready orders */}
        {order.status === 'ready' && order.order_type === 'pickup' && (
          <Button 
            className="w-full mt-3 bg-amber-800 hover:bg-amber-900 text-white gap-2"
            onClick={() => {
              if (order.service_providers?.phone) {
                window.open(`tel:${order.service_providers.phone}`, '_self');
              }
            }}
          >
            <Hand className="h-4 w-4" />
            وصلت المتجر؟ اضغط أنا هنا
          </Button>
        )}
      </div>

      {/* Progress Bar Section */}
      <div className="p-4 bg-white dark:bg-card">
        <div className="flex items-center justify-between mb-2">
          {routeInfo && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {routeInfo.durationMinutes} min
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-sm h-auto p-0"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? 'إغلاق' : 'عرض الخريطة'}
          </Button>
        </div>

        {/* Progress Track */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-[10px] text-muted-foreground mt-1">أنت</span>
          </div>

          <div className="flex-1 relative h-2 bg-muted rounded-full">
            <div 
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
              style={{ left: `${progressPercent}%` }}
            >
              <div className="w-6 h-6 -mt-2 bg-primary rounded-full flex items-center justify-center shadow-md">
                <Car className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <MapPin className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">المتجر</span>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              {isLoadingToken ? (
                <div className="h-56 bg-muted flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div ref={mapContainer} className="h-56 w-full" />
              )}

              {isLocating && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground">جاري تحديد موقعك...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="p-4 border-t flex items-center justify-between">
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={openExternalNavigation}
        >
          <Navigation2 className="h-4 w-4" />
          ابدأ الملاحة
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-primary gap-1"
          onClick={onDetailsClick}
        >
          التفاصيل
          <span className="text-lg">›</span>
        </Button>
      </div>
    </motion.div>
  );
}
