import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Map, 
  MapPin, 
  Users, 
  Edit, 
  X, 
  ZoomIn, 
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  provider_count: number;
  is_active: boolean;
}

interface NeighborhoodsMapProps {
  neighborhoods: Neighborhood[];
  onEdit?: (neighborhood: Neighborhood) => void;
  onNeighborhoodClick?: (neighborhood: Neighborhood) => void;
}

const NeighborhoodsMap = ({ neighborhoods, onEdit, onNeighborhoodClick }: NeighborhoodsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const { data: mapboxToken, isLoading: isTokenLoading } = useMapboxToken();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate center based on neighborhoods
    const validNeighborhoods = neighborhoods.filter(n => n.lat && n.lng);
    const center: [number, number] = validNeighborhoods.length > 0
      ? [
          validNeighborhoods.reduce((sum, n) => sum + n.lng, 0) / validNeighborhoods.length,
          validNeighborhoods.reduce((sum, n) => sum + n.lat, 0) / validNeighborhoods.length
        ]
      : [45.0792, 23.8859]; // Saudi Arabia center

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom: 5,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update markers when neighborhoods change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    neighborhoods.forEach(neighborhood => {
      if (!neighborhood.lat || !neighborhood.lng) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'neighborhood-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${neighborhood.is_active ? '#1B4332' : '#9CA3AF'};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      `;

      // Add provider count badge if > 0
      if (neighborhood.provider_count > 0) {
        const badge = document.createElement('span');
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #D4AF37;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 5px;
          border-radius: 10px;
          min-width: 16px;
          text-align: center;
        `;
        badge.textContent = String(neighborhood.provider_count);
        el.appendChild(badge);
      }

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      });

      // Click handler
      el.addEventListener('click', () => {
        setSelectedNeighborhood(neighborhood);
        onNeighborhoodClick?.(neighborhood);
        
        // Fly to location
        map.current?.flyTo({
          center: [neighborhood.lng, neighborhood.lat],
          zoom: 12,
          duration: 1000
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([neighborhood.lng, neighborhood.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple neighborhoods
    if (neighborhoods.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      neighborhoods.forEach(n => {
        if (n.lat && n.lng) bounds.extend([n.lng, n.lat]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10,
        duration: 1000
      });
    }
  }, [neighborhoods, onNeighborhoodClick]);

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const handleFitAll = () => {
    if (!map.current || neighborhoods.length === 0) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    neighborhoods.forEach(n => {
      if (n.lat && n.lng) bounds.extend([n.lng, n.lat]);
    });
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 10,
      duration: 1000
    });
    setSelectedNeighborhood(null);
  };

  if (isTokenLoading) {
    return <Skeleton className="h-[400px] rounded-lg" />;
  }

  return (
    <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">خريطة الأحياء</CardTitle>
            <Badge variant="outline" className="mr-2">
              {neighborhoods.length} حي
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleFitAll} title="عرض الكل">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="تكبير">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="تصغير">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div 
          ref={mapContainer} 
          className={`w-full rounded-b-lg ${isFullscreen ? 'h-[calc(100%-60px)]' : 'h-[400px]'}`}
        />

        {/* Selected Neighborhood Info Panel */}
        {selectedNeighborhood && (
          <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">{selectedNeighborhood.name}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setSelectedNeighborhood(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">المدينة:</span>
                <span className="font-medium">{selectedNeighborhood.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الحالة:</span>
                <Badge variant={selectedNeighborhood.is_active ? 'default' : 'secondary'}>
                  {selectedNeighborhood.is_active ? 'نشط' : 'معطل'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">مقدمي الخدمات:</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{selectedNeighborhood.provider_count}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>الإحداثيات:</span>
                <span dir="ltr">{selectedNeighborhood.lat.toFixed(4)}, {selectedNeighborhood.lng.toFixed(4)}</span>
              </div>
            </div>

            {onEdit && (
              <Button 
                className="w-full mt-4" 
                size="sm"
                onClick={() => onEdit(selectedNeighborhood)}
              >
                <Edit className="h-4 w-4 ml-2" />
                تعديل الحي
              </Button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md p-3 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
            <span>حي نشط</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white shadow" />
            <span>حي معطل</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeighborhoodsMap;