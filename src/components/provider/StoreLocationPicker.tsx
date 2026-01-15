import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Navigation2, CheckCircle, Edit3, X, Check } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface StoreLocationPickerProps {
  location: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number }) => void;
  deliveryRadiusKm?: number;
}

export function StoreLocationPicker({ location, onLocationChange, deliveryRadiusKm = 5 }: StoreLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Default to Riyadh center
  const defaultCenter = { lat: 24.7136, lng: 46.6753 };
  const center = location || defaultCenter;

  // Convert km to meters for the circle
  const radiusInMeters = deliveryRadiusKm * 1000;

  // Create a GeoJSON circle from center point and radius
  const createGeoJSONCircle = useCallback((centerLng: number, centerLat: number, radiusKm: number) => {
    const points = 64;
    const coords: [number, number][] = [];
    const distanceX = radiusKm / (111.320 * Math.cos((centerLat * Math.PI) / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([centerLng + x, centerLat + y]);
    }
    coords.push(coords[0]); // Close the polygon

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      },
      properties: {}
    };
  }, []);

  // Update circle on map
  const updateCircle = useCallback((lng: number, lat: number) => {
    if (!map.current || !mapReady) return;

    const circleData = createGeoJSONCircle(lng, lat, deliveryRadiusKm);

    if (map.current.getSource('delivery-radius')) {
      (map.current.getSource('delivery-radius') as mapboxgl.GeoJSONSource).setData(circleData as GeoJSON.Feature);
    }
  }, [mapReady, deliveryRadiusKm, createGeoJSONCircle]);

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
            zoom: 14
          });
          
          if (marker.current) {
            marker.current.setLngLat([newLocation.lng, newLocation.lat]);
          }
          updateCircle(newLocation.lng, newLocation.lat);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onLocationChange, updateCircle]);

  // Apply manual coordinates
  const applyManualCoordinates = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    // Validate coordinates (roughly for Saudi Arabia region)
    if (isNaN(lat) || isNaN(lng) || lat < 15 || lat > 35 || lng < 34 || lng > 56) {
      return;
    }
    
    const newLocation = { lat, lng };
    onLocationChange(newLocation);
    
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14
      });
      
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      }
      updateCircle(lng, lat);
    }
    
    setShowManualInput(false);
    setManualLat('');
    setManualLng('');
  }, [manualLat, manualLng, onLocationChange, updateCircle]);

  // Open manual input with current values
  const openManualInput = useCallback(() => {
    if (location) {
      setManualLat(location.lat.toFixed(6));
      setManualLng(location.lng.toFixed(6));
    } else {
      setManualLat('24.7136');
      setManualLng('46.6753');
    }
    setShowManualInput(true);
  }, [location]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: location ? 13 : 12,
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
        updateCircle(lngLat.lng, lngLat.lat);
      }
    });

    // Handle map click
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      onLocationChange({ lat, lng });
      updateCircle(lng, lat);
    });

    map.current.on('load', () => {
      setMapReady(true);
      
      // Add delivery radius circle source and layer
      const initialCircle = createGeoJSONCircle(center.lng, center.lat, deliveryRadiusKm);
      
      map.current?.addSource('delivery-radius', {
        type: 'geojson',
        data: initialCircle as GeoJSON.Feature
      });

      // Add fill layer
      map.current?.addLayer({
        id: 'delivery-radius-fill',
        type: 'fill',
        source: 'delivery-radius',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.15
        }
      });

      // Add outline layer
      map.current?.addLayer({
        id: 'delivery-radius-outline',
        type: 'line',
        source: 'delivery-radius',
        paint: {
          'line-color': '#16a34a',
          'line-width': 2,
          'line-dasharray': [3, 2]
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update marker when location prop changes
  useEffect(() => {
    if (marker.current && location && mapReady) {
      marker.current.setLngLat([location.lng, location.lat]);
      updateCircle(location.lng, location.lat);
    }
  }, [location, mapReady, updateCircle]);

  // Update circle when radius changes
  useEffect(() => {
    if (location && mapReady) {
      updateCircle(location.lng, location.lat);
    }
  }, [deliveryRadiusKm, location, mapReady, updateCircle]);

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
        <span className="block mt-1 text-green-600 dark:text-green-400 font-medium">
          الدائرة الخضراء تمثل نطاق التوصيل ({deliveryRadiusKm} كم)
        </span>
      </p>

      <div className="relative rounded-lg overflow-hidden border">
        {isLoadingToken ? (
          <div className="h-72 bg-muted flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div ref={mapContainer} className="h-72 w-full" />
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

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="font-arabic gap-2"
          onClick={getCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation2 className="h-4 w-4" />
          )}
          موقعي الحالي
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="font-arabic gap-2"
          onClick={openManualInput}
        >
          <Edit3 className="h-4 w-4" />
          إدخال يدوي
        </Button>
      </div>

      {/* Manual Coordinate Input */}
      {showManualInput && (
        <div className="p-4 bg-muted rounded-lg border space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-arabic font-medium text-sm">إدخال الإحداثيات يدوياً</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-arabic">
            يمكنك الحصول على الإحداثيات من Google Maps بالضغط مطولاً على الموقع
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-arabic">خط العرض (Lat)</Label>
              <Input
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="24.7136"
                dir="ltr"
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-arabic">خط الطول (Lng)</Label>
              <Input
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="46.6753"
                dir="ltr"
                className="text-sm"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full font-arabic gap-2"
            onClick={applyManualCoordinates}
            disabled={!manualLat || !manualLng}
          >
            <Check className="h-4 w-4" />
            تطبيق الإحداثيات
          </Button>
        </div>
      )}

      {location && !showManualInput && (
        <p className="text-xs text-center text-muted-foreground font-arabic">
          الإحداثيات: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
