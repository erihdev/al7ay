import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Navigation, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

export function LocationPickerDialog({ 
  open, 
  onOpenChange, 
  onLocationSelect 
}: LocationPickerDialogProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { data: mapboxToken, isLoading: isLoadingToken } = useMapboxToken();
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Default to Saudi Arabia center
  const defaultCenter = { lat: 24.7136, lng: 46.6753 };

  useEffect(() => {
    if (!open || !mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 5,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Create draggable marker
    marker.current = new mapboxgl.Marker({
      color: '#ea580c',
      draggable: true,
    });

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
      if (!marker.current) return;
      
      marker.current.setLngLat(e.lngLat);
      if (!marker.current.getElement().parentElement) {
        marker.current.addTo(map.current!);
      }
      setSelectedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      reverseGeocode(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [open, mapboxToken]);

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

  const searchLocation = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&language=ar&country=sa`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        if (map.current && marker.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 14,
          });
          marker.current.setLngLat([lng, lat]);
          if (!marker.current.getElement().parentElement) {
            marker.current.addTo(map.current);
          }
          setSelectedLocation({ lat, lng });
          setAddress(data.features[0].place_name);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const goToCurrentLocation = () => {
    if (navigator.geolocation && map.current && marker.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 15,
          });
          marker.current?.setLngLat([longitude, latitude]);
          if (!marker.current?.getElement().parentElement) {
            marker.current?.addTo(map.current!);
          }
          setSelectedLocation({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleConfirm = () => {
    if (selectedLocation && address) {
      onLocationSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: address,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-arabic" dir="rtl">
        <DialogHeader>
          <DialogTitle>حدد موقع الحي على الخريطة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مدينة أو حي..."
              className="font-arabic"
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            />
            <Button 
              variant="secondary" 
              onClick={searchLocation}
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Map */}
          {isLoadingToken ? (
            <div className="h-80 bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !mapboxToken ? (
            <div className="h-80 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">خطأ في تحميل الخريطة</p>
            </div>
          ) : (
            <div className="relative">
              <div ref={mapContainer} className="h-80 rounded-lg overflow-hidden" />
              
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
          )}

          {/* Selected address */}
          {address && (
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm">{address}</p>
            </div>
          )}

          {/* Confirm button */}
          <Button
            className="w-full font-arabic"
            onClick={handleConfirm}
            disabled={!selectedLocation || !address}
          >
            تأكيد الموقع
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ابحث عن الموقع أو اضغط على الخريطة لتحديد موقع الحي
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
