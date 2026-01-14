import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useLocation } from '@/contexts/LocationContext';
import { Loader2 } from 'lucide-react';

interface OrderTrackingMapProps {
  deliveryLocation: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number; heading?: number } | null;
  isActive: boolean;
}

export function OrderTrackingMap({
  deliveryLocation,
  driverLocation,
  isActive,
}: OrderTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  const { storeLocation } = useLocation();

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

    // Add store marker
    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([storeLocation.lng, storeLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<div class="font-arabic p-1">المتجر</div>'))
      .addTo(map.current);

    // Add delivery destination marker
    new mapboxgl.Marker({ color: '#ea580c' })
      .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<div class="font-arabic p-1">موقع التوصيل</div>'))
      .addTo(map.current);

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds()
      .extend([storeLocation.lng, storeLocation.lat])
      .extend([deliveryLocation.lng, deliveryLocation.lat]);

    map.current.fitBounds(bounds, { padding: 60 });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, storeLocation, deliveryLocation]);

  // Update driver marker position
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    if (!driverMarker.current) {
      // Create driver marker with custom element
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${driverLocation.heading || 0}deg);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([driverLocation.lng, driverLocation.lat])
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
      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">خطأ في تحميل الخريطة</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-48 rounded-lg overflow-hidden" />
      {isActive && driverLocation && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-arabic flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          تتبع مباشر
        </div>
      )}
    </div>
  );
}
