import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerLocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelected: (coords: { lat: number; lng: number }) => void;
  initialCoords?: { lat: number; lng: number } | null;
}

export function CustomerLocationPicker({
  open,
  onOpenChange,
  onLocationSelected,
  initialCoords
}: CustomerLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialCoords || null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [mapToken, setMapToken] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapToken(data.token);
      } catch (error) {
        console.error('Error fetching mapbox token:', error);
        toast.error('فشل تحميل الخريطة');
      }
    };
    if (open) {
      fetchToken();
    }
  }, [open]);

  // Initialize map
  useEffect(() => {
    if (!open || !mapToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapToken;
    
    const defaultCenter = initialCoords 
      ? [initialCoords.lng, initialCoords.lat] as [number, number]
      : [42.6, 17.2] as [number, number]; // Default to Sabya area

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: initialCoords ? 15 : 10,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Add draggable marker
    marker.current = new mapboxgl.Marker({
      color: '#10b981',
      draggable: true
    })
      .setLngLat(defaultCenter)
      .addTo(map.current);

    if (initialCoords) {
      setSelectedCoords(initialCoords);
    }

    // Update coords when marker is dragged
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setSelectedCoords({ lat: lngLat.lat, lng: lngLat.lng });
      }
    });

    // Click on map to move marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      setSelectedCoords({ lat, lng });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [open, mapToken, initialCoords]);

  // Detect current location
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('الموقع الجغرافي غير مدعوم');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (map.current && marker.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 16
          });
          marker.current.setLngLat([longitude, latitude]);
        }
        
        setSelectedCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('فشل تحديد الموقع');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelected(selectedCoords);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-right flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            حدد موقعك على الخريطة
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground">
            اسحب العلامة أو انقر على الخريطة لتحديد موقعك بدقة
          </p>
        </div>

        <div className="relative h-[350px] w-full">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Detect location button */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-3 right-3 z-10 gap-2 shadow-md"
            onClick={detectCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            موقعي الحالي
          </Button>
        </div>

        {/* Selected coordinates display */}
        {selectedCoords && (
          <div className="px-4 py-2 bg-muted/50">
            <p className="text-xs text-muted-foreground font-mono" dir="ltr">
              {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="p-4 pt-2 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleConfirm}
            disabled={!selectedCoords}
          >
            <Check className="h-4 w-4" />
            تأكيد الموقع
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
