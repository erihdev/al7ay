import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Users, Coffee } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  provider_count: number;
  is_active: boolean;
}

const NeighborhoodsMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  const { data: mapboxToken, isLoading: tokenLoading } = useMapboxToken();

  const { data: neighborhoods, isLoading } = useQuery({
    queryKey: ['active-neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_neighborhoods')
        .select('*')
        .eq('is_active', true)
        .order('provider_count', { ascending: false });
      
      if (error) throw error;
      return data as Neighborhood[];
    }
  });

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [46.6753, 24.7136], // Riyadh center
      zoom: 10,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current || !neighborhoods) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each neighborhood
    neighborhoods.forEach((neighborhood) => {
      const el = document.createElement('div');
      el.className = 'neighborhood-marker';
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #1B4332, #2D6A4F);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(27, 67, 50, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          font-family: 'Tajawal', sans-serif;
        ">
          <span style="font-size: 14px;">📍</span>
          ${neighborhood.name}
          <span style="
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
          ">${neighborhood.provider_count}</span>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedNeighborhood(neighborhood);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([neighborhood.lng, neighborhood.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (neighborhoods.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      neighborhoods.forEach(n => bounds.extend([n.lng, n.lat]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [neighborhoods]);

  if (tokenLoading || isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">الأحياء المفعّلة</h2>
            <p className="text-muted-foreground text-lg">اكتشف الأحياء التي تتوفر فيها خدماتنا</p>
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </section>
    );
  }

  const totalProviders = neighborhoods?.reduce((sum, n) => sum + n.provider_count, 0) || 0;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">الأحياء المفعّلة</h2>
          <p className="text-muted-foreground text-lg">اكتشف الأحياء التي تتوفر فيها خدماتنا</p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-bold text-2xl">{neighborhoods?.length || 0}</span>
              <span className="text-muted-foreground">حي مفعّل</span>
            </div>
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" />
              <span className="font-bold text-2xl">{totalProviders}</span>
              <span className="text-muted-foreground">مقدم خدمة</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div 
                ref={mapContainer} 
                className="h-96 lg:h-[500px] w-full"
              />
            </Card>
          </div>

          {/* Neighborhoods List */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-arabic">قائمة الأحياء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
                {neighborhoods?.map((neighborhood) => (
                  <div
                    key={neighborhood.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedNeighborhood?.id === neighborhood.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedNeighborhood(neighborhood);
                      map.current?.flyTo({
                        center: [neighborhood.lng, neighborhood.lat],
                        zoom: 13
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{neighborhood.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-arabic">
                        <Users className="h-3 w-3 ml-1" />
                        {neighborhood.provider_count}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{neighborhood.city}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedNeighborhood && (
              <Card className="border-primary">
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2">{selectedNeighborhood.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{selectedNeighborhood.city}</p>
                  <div className="flex items-center gap-2 text-primary">
                    <Coffee className="h-4 w-4" />
                    <span className="font-medium">{selectedNeighborhood.provider_count} مقدم خدمة نشط</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NeighborhoodsMap;
