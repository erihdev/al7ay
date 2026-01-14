import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface DeliveryMapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

export function DeliveryMapPicker({ onLocationSelect, initialLocation }: DeliveryMapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { storeLocation, deliveryRadius, userLocation } = useLocation();
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || userLocation
  );
  const [address, setAddress] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !storeLocation) return;

    mapboxgl.accessToken = mapboxToken;

    const initialCenter = selectedLocation || userLocation || storeLocation;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 14,
      attributionControl: false,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Add delivery zone circle
    map.current.on('load', () => {
      if (!map.current || !storeLocation) return;

      // Add store marker
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([storeLocation.lng, storeLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="font-arabic p-1">موقع المتجر</div>'))
        .addTo(map.current);

      // Add delivery zone circle
      map.current.addSource('delivery-zone', {
        type: 'geojson',
        data: createCircleGeoJSON(storeLocation.lng, storeLocation.lat, deliveryRadius),
      });

      map.current.addLayer({
        id: 'delivery-zone-fill',
        type: 'fill',
        source: 'delivery-zone',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.1,
        },
      });

      map.current.addLayer({
        id: 'delivery-zone-border',
        type: 'line',
        source: 'delivery-zone',
        paint: {
          'line-color': '#10b981',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    });

    // Create draggable marker for delivery location
    marker.current = new mapboxgl.Marker({
      color: '#ea580c',
      draggable: true,
    })
      .setLngLat([initialCenter.lng, initialCenter.lat])
      .addTo(map.current);

    // Update location on marker drag
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
        reverseGeocode(lngLat.lat, lngLat.lng);
      }
    });

    // Update marker on map click
    map.current.on('click', (e) => {
      marker.current?.setLngLat(e.lngLat);
      setSelectedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      reverseGeocode(e.lngLat.lat, e.lngLat.lng);
    });

    // Initial reverse geocode
    if (initialCenter) {
      reverseGeocode(initialCenter.lat, initialCenter.lng);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, storeLocation]);

  const createCircleGeoJSON = (lng: number, lat: number, radiusMeters: number): GeoJSON.FeatureCollection => {
    const points = 64;
    const coords: [number, number][] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusMeters * Math.cos(angle);
      const dy = radiusMeters * Math.sin(angle);
      
      const newLat = lat + (dy / 111320);
      const newLng = lng + (dx / (111320 * Math.cos(lat * Math.PI / 180)));
      
      coords.push([newLng, newLat]);
    }
    coords.push(coords[0]); // Close the circle

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      }],
    };
  };

  const reverseGeocode = async (lat: number, lng: number) => {
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

  const goToCurrentLocation = () => {
    if (userLocation && map.current && marker.current) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
      });
      marker.current.setLngLat([userLocation.lng, userLocation.lat]);
      setSelectedLocation(userLocation);
      reverseGeocode(userLocation.lat, userLocation.lng);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      setIsConfirming(true);
      onLocationSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: address || 'العنوان المحدد على الخريطة',
      });
      setIsConfirming(false);
    }
  };

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
        <p className="text-muted-foreground">خطأ في تحميل الخريطة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div ref={mapContainer} className="h-64 rounded-lg overflow-hidden" />
        
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-3 left-3 shadow-lg"
          onClick={goToCurrentLocation}
          title="موقعي الحالي"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {address && (
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">{address}</p>
        </div>
      )}

      <Button
        className="w-full font-arabic"
        onClick={handleConfirm}
        disabled={!selectedLocation || isConfirming}
      >
        {isConfirming ? 'جاري التأكيد...' : 'تأكيد موقع التوصيل'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        اضغط على الخريطة أو اسحب العلامة لتحديد موقع التوصيل
      </p>
    </div>
  );
}
