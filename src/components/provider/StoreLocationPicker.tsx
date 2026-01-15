import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Navigation2, CheckCircle } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface StoreLocationPickerProps {
  location: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

export function StoreLocationPicker({ location, onLocationChange }: StoreLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Default to Riyadh center
  const defaultCenter = { lat: 24.7136, lng: 46.6753 };
  const center = location || defaultCenter;

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        onLocationChange(newLocation);
        
        if (map.current) {
          map.current.flyTo({
            center: [newLocation.lng, newLocation.lat],
            zoom: 16
          });
          
          if (marker.current) {
            marker.current.setLngLat([newLocation.lng, newLocation.lat]);
          }
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: location ? 16 : 12,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Create draggable marker
    const el = document.createElement('div');
    el.innerHTML = `
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
        cursor: grab;
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M4 7V4h16v3h-2v13H6V7H4zm2 0v11h12V7H6zm3 2h2v7H9V9zm4 0h2v7h-2V9z"/>
        </svg>
      </div>
    `;

    marker.current = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
      }
    });

    // Handle map click
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      onLocationChange({ lat, lng });
    });

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update marker when location prop changes
  useEffect(() => {
    if (marker.current && location && mapReady) {
      marker.current.setLngLat([location.lng, location.lat]);
    }
  }, [location, mapReady]);

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <Label className="font-arabic font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          موقع المتجر على الخريطة
        </Label>
        {location && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle className="h-3 w-3" />
            تم التحديد
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground font-arabic">
        حدد موقع متجرك بدقة ليتمكن العملاء من الوصول إليك بسهولة. اضغط على الخريطة أو اسحب العلامة.
      </p>

      <div className="relative rounded-lg overflow-hidden border">
        {isLoadingToken ? (
          <div className="h-64 bg-muted flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div ref={mapContainer} className="h-64 w-full" />
        )}

        {isLocating && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground font-arabic">جاري تحديد موقعك...</p>
            </div>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full font-arabic gap-2"
        onClick={getCurrentLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation2 className="h-4 w-4" />
        )}
        استخدم موقعي الحالي
      </Button>

      {location && (
        <p className="text-xs text-center text-muted-foreground font-arabic">
          الإحداثيات: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
