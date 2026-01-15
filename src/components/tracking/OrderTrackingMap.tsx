import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useLocation } from '@/contexts/LocationContext';
import { Loader2, Navigation, RotateCw } from 'lucide-react';
import { formatRouteForMap } from '@/hooks/useDeliveryETA';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface RoutePoint {
  lat: number;
  lng: number;
  recorded_at: string;
}

interface OrderTrackingMapProps {
  deliveryLocation: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number; heading?: number } | null;
  routeHistory?: RoutePoint[];
  isActive: boolean;
  expectedRouteGeometry?: GeoJSON.LineString | null;
}

export function OrderTrackingMap({
  deliveryLocation,
  driverLocation,
  routeHistory = [],
  isActive,
  expectedRouteGeometry,
}: OrderTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  const { storeLocation } = useLocation();
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Fetch expected route from store to destination
  const fetchExpectedRoute = async () => {
    if (!map.current || !storeLocation) return;

    setIsLoadingRoute(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-eta', {
        body: {
          origin: storeLocation,
          destination: deliveryLocation
        }
      });

      if (error) throw error;

      if (data?.geometry) {
        // Update expected route on map
        const source = map.current.getSource('expected-route') as mapboxgl.GeoJSONSource;
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
          data.geometry.coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
          map.current?.fitBounds(bounds, { padding: 50 });
        }
      }
    } catch (error) {
      console.error('Failed to fetch expected route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !storeLocation) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [deliveryLocation.lng, deliveryLocation.lat],
      zoom: 14,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Add store marker with custom popup
    const storePopup = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setHTML(`
        <div class="font-arabic p-2 text-center">
          <div class="font-bold text-green-600">🏪 المتجر</div>
        </div>
      `);

    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([storeLocation.lng, storeLocation.lat])
      .setPopup(storePopup)
      .addTo(map.current);

    // Add delivery destination marker with custom popup
    const deliveryPopup = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setHTML(`
        <div class="font-arabic p-2 text-center">
          <div class="font-bold text-orange-600">📍 موقع التوصيل</div>
        </div>
      `);

    new mapboxgl.Marker({ color: '#ea580c' })
      .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
      .setPopup(deliveryPopup)
      .addTo(map.current);

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds()
      .extend([storeLocation.lng, storeLocation.lat])
      .extend([deliveryLocation.lng, deliveryLocation.lat]);

    map.current.fitBounds(bounds, { padding: 60 });

    // Add layers when map loads
    map.current.on('load', () => {
      if (!map.current) return;

      // Add expected route source (from Mapbox Directions)
      map.current.addSource('expected-route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add expected route line - dashed for "expected"
      map.current.addLayer({
        id: 'expected-route-border',
        type: 'line',
        source: 'expected-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 8,
          'line-opacity': 0.3,
        },
      });

      map.current.addLayer({
        id: 'expected-route-line',
        type: 'line',
        source: 'expected-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [2, 1],
        },
      });

      // Add actual route source (driver's path)
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add actual route line - solid for "traveled"
      map.current.addLayer({
        id: 'route-line-border',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#6d28d9',
          'line-width': 6,
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
          'line-color': '#8b5cf6',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      });

      // Fetch expected route automatically
      fetchExpectedRoute();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, storeLocation, deliveryLocation]);

  // Update actual route line when history changes
  useEffect(() => {
    if (!map.current || !routeHistory.length) return;

    const routeGeoJSON = formatRouteForMap(routeHistory);
    if (!routeGeoJSON) return;

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [routeGeoJSON],
      });
    }
  }, [routeHistory]);

  // Update driver marker position
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    if (!driverMarker.current) {
      // Create driver marker with custom element
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${driverLocation.heading || 0}deg);
          animation: pulse 2s infinite;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
            50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
          }
        </style>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML('<div class="font-arabic p-2 font-bold text-purple-600">🚗 السائق</div>'))
        .addTo(map.current);
    } else {
      // Animate marker to new position
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);

      // Update rotation
      const el = driverMarker.current.getElement().firstChild as HTMLElement;
      if (el && driverLocation.heading !== undefined) {
        el.style.transform = `rotate(${driverLocation.heading}deg)`;
      }
    }

    // Optionally pan to driver
    if (isActive) {
      map.current.panTo([driverLocation.lng, driverLocation.lat], { duration: 1000 });
    }
  }, [driverLocation, isActive]);

  if (isLoadingToken) {
    return (
      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">خطأ في تحميل الخريطة</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-64 rounded-t-lg overflow-hidden" />
      
      {/* Live tracking badge */}
      {isActive && driverLocation && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-arabic flex items-center gap-1 shadow-lg">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          تتبع مباشر
        </div>
      )}

      {/* Route info panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm p-3">
        <div className="flex items-center justify-between">
          {/* Route legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-1 bg-blue-500 rounded" style={{ borderStyle: 'dashed' }} />
              <span className="text-muted-foreground">المسار المتوقع</span>
            </div>
            {routeHistory.length > 1 && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-1 bg-purple-500 rounded" />
                <span className="text-muted-foreground">المسار الفعلي</span>
              </div>
            )}
          </div>

          {/* Route info */}
          {routeInfo && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{routeInfo.distance}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium text-primary">{routeInfo.duration}</span>
            </div>
          )}

          {/* Refresh route button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={fetchExpectedRoute}
            disabled={isLoadingRoute}
          >
            <RotateCw className={`h-3 w-3 ${isLoadingRoute ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Points counter */}
      {routeHistory.length > 1 && (
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-arabic flex items-center gap-1">
          <Navigation className="h-3 w-3 text-purple-500" />
          {routeHistory.length} نقطة
        </div>
      )}
    </div>
  );
}
