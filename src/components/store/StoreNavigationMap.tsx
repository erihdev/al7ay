import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Loader2, Navigation2, RotateCw, MapPin, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { InAppNavigationMode } from '@/components/navigation/InAppNavigationMode';

interface StoreNavigationMapProps {
  storeLocation: { lat: number; lng: number };
  storeName: string;
  storePhone?: string | null;
  onClose?: () => void;
}

export function StoreNavigationMap({
  storeLocation,
  storeName,
  storePhone,
  onClose,
}: StoreNavigationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [heading, setHeading] = useState<number>(0);
  const [isNavigationMode, setIsNavigationMode] = useState(false);

  // Calculate distance using Haversine formula
  const calculateDistance = useCallback((from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.lat * Math.PI) / 180;
    const φ2 = (to.lat * Math.PI) / 180;
    const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
    const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Fetch route from user location to store
  const fetchRoute = useCallback(async (origin: { lat: number; lng: number }) => {
    if (!map.current) return;

    setIsLoadingRoute(true);
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

        setRouteInfo({
          distance: data.distanceText,
          duration: data.durationText
        });

        // Fit bounds to show entire route
        if (data.geometry.coordinates && data.geometry.coordinates.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([origin.lng, origin.lat]);
          bounds.extend([storeLocation.lng, storeLocation.lat]);
          data.geometry.coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
          map.current?.fitBounds(bounds, { padding: 80 });
        }
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
      // Fallback to straight-line distance
      const distance = calculateDistance(origin, storeLocation);
      setRouteInfo({
        distance: distance < 1000 ? `${Math.round(distance)} م` : `${(distance / 1000).toFixed(1)} كم`,
        duration: `~${Math.round((distance / 1000) * 12)} دقيقة` // Estimate 5 km/h walking
      });
    } finally {
      setIsLoadingRoute(false);
    }
  }, [storeLocation, calculateDistance]);

  // Start watching user location
  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('المتصفح لا يدعم تحديد الموقع');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(newLocation);
        setIsLocating(false);

        // Update heading if available
        if (position.coords.heading !== null) {
          setHeading(position.coords.heading);
        }

        // Fetch route when location updates
        fetchRoute(newLocation);
      },
      (error) => {
        console.error('Location error:', error);
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('يرجى السماح بالوصول للموقع');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('موقعك غير متاح حالياً');
            break;
          case error.TIMEOUT:
            setLocationError('انتهت مهلة تحديد الموقع');
            break;
          default:
            setLocationError('خطأ في تحديد الموقع');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  }, [fetchRoute]);

  // Center map on user
  const centerOnUser = useCallback(() => {
    if (userLocation && map.current) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        duration: 1000
      });
    }
  }, [userLocation]);

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

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Add store marker
    const storeEl = document.createElement('div');
    storeEl.innerHTML = `
      <div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
        </svg>
      </div>
    `;

    new mapboxgl.Marker({ element: storeEl })
      .setLngLat([storeLocation.lng, storeLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`<div class="font-arabic p-2 text-center font-bold text-green-600">🏪 ${storeName}</div>`))
      .addTo(map.current);

    // Add route layers when map loads
    map.current.on('load', () => {
      if (!map.current) return;

      // Add route source
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add route line with gradient
      map.current.addLayer({
        id: 'route-border',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 8,
          'line-opacity': 0.4,
        },
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });

      // Start location tracking
      startLocationWatch();
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      map.current?.remove();
    };
  }, [mapboxToken, storeLocation, storeName, startLocationWatch]);

  // Update user marker position and follow in navigation mode
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userMarker.current) {
      // Create user marker
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
            inset: -8px;
            border-radius: 50%;
            border: 2px solid rgba(59, 130, 246, 0.5);
            animation: pulse 2s infinite;
          "></div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="transform: rotate(${heading}deg);">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.5; }
          }
        </style>
      `;

      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML('<div class="font-arabic p-2 font-bold text-blue-600">📍 موقعي</div>'))
        .addTo(map.current);
    } else {
      // Smooth transition to new position
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
      
      // Update heading
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
  }, [userLocation, heading, isNavigationMode]);

  if (isLoadingToken) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-72 bg-muted flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground text-sm">خطأ في تحميل الخريطة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${isNavigationMode ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardContent className="p-0 h-full">
        <div className={`relative ${isNavigationMode ? 'h-full' : ''}`}>
          {/* Map */}
          <div 
            ref={mapContainer} 
            className={`w-full transition-all duration-500 ${isNavigationMode ? 'h-full' : 'h-72'}`} 
          />

          {/* Loading overlay - hidden in nav mode */}
          {isLocating && !isNavigationMode && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">جاري تحديد موقعك...</p>
              </div>
            </div>
          )}

          {/* Location error */}
          {locationError && !isNavigationMode && (
            <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-lg text-xs font-arabic flex items-center justify-between">
              <span>{locationError}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-destructive-foreground hover:bg-destructive-foreground/20"
                onClick={startLocationWatch}
              >
                إعادة المحاولة
              </Button>
            </div>
          )}

          {/* Live tracking badge - hidden in nav mode */}
          {userLocation && !isNavigationMode && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-arabic flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              تتبع مباشر
            </div>
          )}

          {/* Center on user button - hidden in nav mode */}
          {!isNavigationMode && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-20 right-2 h-10 w-10 rounded-full shadow-lg"
              onClick={centerOnUser}
              disabled={!userLocation}
            >
              <Locate className="h-5 w-5" />
            </Button>
          )}

          {/* Route info panel - hidden in nav mode */}
          {!isNavigationMode && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-background/90 backdrop-blur-sm p-4 space-y-3">
              {/* Distance and duration */}
              {routeInfo ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{storeName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{routeInfo.distance}</span>
                        <span>•</span>
                        <span>{routeInfo.duration}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => userLocation && fetchRoute(userLocation)}
                    disabled={isLoadingRoute || !userLocation}
                  >
                    <RotateCw className={`h-4 w-4 ${isLoadingRoute ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">جاري حساب المسافة...</span>
                </div>
              )}

              {/* Navigation button */}
              <Button
                className="w-full gap-2"
                onClick={startNavigation}
                disabled={!userLocation}
              >
                <Navigation2 className="h-4 w-4" />
                ابدأ الملاحة
              </Button>
            </div>
          )}

          {/* In-App Navigation Overlay */}
          <AnimatePresence>
            {isNavigationMode && map.current && userLocation && (
              <InAppNavigationMode
                map={map.current}
                userLocation={userLocation}
                destination={storeLocation}
                destinationName={storeName}
                heading={heading}
                routeInfo={routeInfo}
                onExit={exitNavigation}
              />
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
