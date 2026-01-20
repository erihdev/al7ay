import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpdateProviderDeliveryLocation } from '@/hooks/useProviderOrderTracking';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { supabase } from '@/integrations/supabase/client';
import { Navigation2, MapPin, Loader2, Check, X, Phone, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { InAppNavigationMode } from '@/components/navigation/InAppNavigationMode';

interface ProviderDeliveryTrackerProps {
  orderId: string;
  orderNumber?: number;
  orderStatus?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  onDeliveryComplete?: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export function ProviderDeliveryTracker({
  orderId,
  orderNumber,
  orderStatus = 'out_for_delivery',
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  onDeliveryComplete,
  onStatusChange
}: ProviderDeliveryTrackerProps) {
  const { updateLocation, stopTracking } = useUpdateProviderDeliveryLocation();
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; durationMinutes: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Customer destination
  const destination = deliveryLat && deliveryLng 
    ? { lat: deliveryLat, lng: deliveryLng }
    : null;

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
    if (!destination || !mapRef.current || !mapReady) return;

    try {
      const { data, error } = await supabase.functions.invoke('calculate-eta', {
        body: {
          origin,
          destination
        }
      });

      if (error) throw error;

      if (data?.geometry && mapRef.current) {
        const source = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource;
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
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
      if (destination) {
        const distance = calculateDistance(origin, destination);
        const durationMinutes = Math.round((distance / 1000) * 12);
        setRouteInfo({
          distance: distance < 1000 ? `${Math.round(distance)} م` : `${(distance / 1000).toFixed(1)} كم`,
          duration: `~${durationMinutes} دقيقة`,
          durationMinutes
        });
      }
    }
  }, [destination, calculateDistance, mapReady]);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsTracking(true);
    toast.success('تم تفعيل تتبع الموقع');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading: posHeading, speed, accuracy } = position.coords;
        
        const newPosition = { lat: latitude, lng: longitude };
        setCurrentPosition(newPosition);
        setAccuracy(accuracy);
        
        if (posHeading !== null) {
          setHeading(posHeading);
        }

        // Update location in database
        updateLocation(
          orderId,
          latitude,
          longitude,
          posHeading || 0,
          (speed || 0) * 3.6 // Convert m/s to km/h
        ).catch((error) => {
          console.error('Failed to update location:', error);
        });
        
        // Update route
        fetchRoute(newPosition);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('خطأ في تحديد الموقع: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }, [orderId, updateLocation, fetchRoute]);

  // Stop location tracking
  const stopTrackingHandler = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    stopTracking(orderId).catch(console.error);
    setIsTracking(false);
    setCurrentPosition(null);
    toast.info('تم إيقاف التتبع');
  }, [orderId, stopTracking]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken || !destination) return;

    mapboxgl.accessToken = mapboxToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [destination.lng, destination.lat],
      zoom: 14,
      attributionControl: false,
    });

    // Customer destination marker
    const destEl = document.createElement('div');
    destEl.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 14px rgba(34, 197, 94, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `;

    new mapboxgl.Marker({ element: destEl })
      .setLngLat([destination.lng, destination.lat])
      .addTo(mapRef.current);

    mapRef.current.on('load', () => {
      if (!mapRef.current) return;

      mapRef.current.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapRef.current.addLayer({
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
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [mapboxToken, destination]);

  // Update user marker
  useEffect(() => {
    if (!mapRef.current || !currentPosition || !mapReady) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="transform: rotate(${heading}deg);">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      `;

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([currentPosition.lng, currentPosition.lat])
        .addTo(mapRef.current);
        
      // Fit bounds to show both markers
      if (destination) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([currentPosition.lng, currentPosition.lat]);
        bounds.extend([destination.lng, destination.lat]);
        mapRef.current.fitBounds(bounds, { padding: 60 });
      }
    } else {
      userMarkerRef.current.setLngLat([currentPosition.lng, currentPosition.lat]);
      
      const markerEl = userMarkerRef.current.getElement();
      const svg = markerEl.querySelector('svg');
      if (svg) {
        svg.style.transform = `rotate(${heading}deg)`;
      }
    }
  }, [currentPosition, heading, mapReady, destination]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Start navigation mode
  const startNavigation = useCallback(() => {
    if (!currentPosition) {
      toast.error('يرجى تفعيل تتبع الموقع أولاً');
      return;
    }
    if (!destination) {
      toast.error('إحداثيات العميل غير متوفرة');
      return;
    }
    setIsNavigationMode(true);
  }, [currentPosition, destination]);

  // Exit navigation mode
  const exitNavigation = useCallback(() => {
    setIsNavigationMode(false);
  }, []);

  // Handle status change from navigation mode
  const handleStatusChange = useCallback((newStatus: string) => {
    onStatusChange?.(newStatus);
    if (newStatus === 'completed') {
      stopTrackingHandler();
      onDeliveryComplete?.();
    }
  }, [onStatusChange, stopTrackingHandler, onDeliveryComplete]);

  return (
    <Card className="border-primary/30 bg-primary/5 overflow-hidden">
      <CardContent className="p-0">
        {/* Map Section */}
        {destination && (
          <div className={`relative transition-all duration-500 ${isNavigationMode ? 'h-[70vh]' : 'h-40'}`}>
            {isLoadingToken ? (
              <div className="h-full bg-muted flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div ref={mapContainerRef} className="w-full h-full" />
            )}

            {/* Navigation Mode Overlay */}
            <AnimatePresence>
              {isNavigationMode && mapRef.current && currentPosition && destination && (
                <InAppNavigationMode
                  map={mapRef.current}
                  userLocation={currentPosition}
                  destination={destination}
                  destinationName={customerName}
                  heading={heading}
                  routeInfo={routeInfo}
                  onExit={exitNavigation}
                  orderId={orderId}
                  orderNumber={orderNumber}
                  orderStatus={orderStatus}
                  customerPhone={customerPhone}
                  onStatusChange={handleStatusChange}
                  isProvider={true}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Controls - Hidden in navigation mode */}
        {!isNavigationMode && (
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Navigation2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تتبع التوصيل</h4>
                  <p className="text-xs text-muted-foreground">{customerName}</p>
                </div>
              </div>
              
              {isTracking && (
                <Badge variant="default" className="bg-green-500 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white mr-2" />
                  جاري التتبع
                </Badge>
              )}
            </div>

            {/* Delivery Address */}
            {deliveryAddress && (
              <div className="flex items-start gap-2 p-3 bg-background rounded-lg">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
                </div>
              </div>
            )}

            {/* Route Info */}
            {routeInfo && isTracking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between"
              >
                <span className="text-sm text-muted-foreground">المسافة والوقت:</span>
                <span className="font-semibold text-sm">
                  {routeInfo.distance} • {routeInfo.duration}
                </span>
              </motion.div>
            )}

            {/* Current Position Info */}
            {currentPosition && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">موقعك الحالي:</span>
                  <span className="font-mono text-xs">
                    {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
                  </span>
                </div>
                {accuracy && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>دقة الموقع:</span>
                    <span>{Math.round(accuracy)} متر</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {!isTracking ? (
                <Button 
                  onClick={startTracking} 
                  className="col-span-2 gap-2"
                >
                  <Navigation2 className="h-4 w-4" />
                  بدء تتبع الموقع
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={stopTrackingHandler}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    إيقاف التتبع
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      stopTrackingHandler();
                      onDeliveryComplete?.();
                    }}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    تم التوصيل
                  </Button>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {destination && isTracking && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-2 bg-primary"
                  onClick={startNavigation}
                >
                  <Maximize2 className="h-4 w-4" />
                  وضع الملاحة الكامل
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => window.location.href = `tel:${customerPhone}`}
              >
                <Phone className="h-4 w-4" />
                اتصل بالعميل
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
