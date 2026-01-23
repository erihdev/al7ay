import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Users, Coffee, Store, ArrowLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAllProviderRatings } from '@/hooks/useProviderReviews';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  provider_count: number;
  is_active: boolean;
}

interface ServiceProvider {
  id: string;
  business_name: string;
  logo_url: string | null;
  is_verified: boolean;
}

const NeighborhoodsMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const initialBoundsSet = useRef(false);

  const { data: mapboxToken, isLoading: tokenLoading } = useMapboxToken();
  const { data: providerRatings } = useAllProviderRatings();

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

  // Fetch providers for selected neighborhood
  const { data: providers } = useQuery({
    queryKey: ['neighborhood-providers', selectedNeighborhood?.id],
    queryFn: async () => {
      if (!selectedNeighborhood) return [];
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('id, business_name, logo_url, is_verified')
        .eq('neighborhood_id', selectedNeighborhood.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as ServiceProvider[];
    },
    enabled: !!selectedNeighborhood
  });

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [42.55, 17.33], // Al-Aliya village center
      zoom: 12,
      attributionControl: false,
      fadeDuration: 0, // Disable fade animations for smoother loading
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Mark map as ready after style loads
    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
      setMapReady(false);
      initialBoundsSet.current = false;
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current || !mapReady || !neighborhoods) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each neighborhood with staggered animation
    neighborhoods.forEach((neighborhood, index) => {
      const el = document.createElement('div');
      el.className = 'neighborhood-marker';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.8)';
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, hsl(43, 75%, 48%), hsl(45, 85%, 52%));
          color: hsl(30, 25%, 8%);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 4px 12px hsla(43, 75%, 48%, 0.3);
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
            background: hsla(0, 0%, 100%, 0.3);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
          ">${neighborhood.provider_count}</span>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedNeighborhood(neighborhood);
        map.current?.flyTo({
          center: [neighborhood.lng, neighborhood.lat],
          zoom: 14,
          duration: 800,
          essential: true
        });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([neighborhood.lng, neighborhood.lat])
        .addTo(map.current!);

      // Staggered fade-in animation
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
      }, index * 100);

      markersRef.current.push(marker);
    });

    // Fit bounds only once on initial load
    if (neighborhoods.length > 0 && !initialBoundsSet.current) {
      initialBoundsSet.current = true;
      const bounds = new mapboxgl.LngLatBounds();
      neighborhoods.forEach(n => bounds.extend([n.lng, n.lat]));
      
      // Use a slight delay to ensure smooth initial render
      setTimeout(() => {
        map.current?.fitBounds(bounds, { 
          padding: 60,
          duration: 1000,
          maxZoom: 14
        });
      }, 300);
    }
  }, [neighborhoods, mapReady]);

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
            <Card className="overflow-hidden relative">
              {/* Loading overlay */}
              {!mapReady && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">جاري تحميل الخريطة...</span>
                  </div>
                </div>
              )}
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
                  <div className="flex items-center gap-2 text-primary mb-4">
                    <Coffee className="h-4 w-4" />
                    <span className="font-medium">{selectedNeighborhood.provider_count} مقدم خدمة نشط</span>
                  </div>

                  {/* Providers List */}
                  {providers && providers.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-sm font-medium mb-2">المتاجر في هذا الحي:</p>
                      {providers.map(provider => {
                        const rating = providerRatings?.[provider.id];
                        return (
                          <Link 
                            key={provider.id} 
                            to={`/store/${provider.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {provider.logo_url ? (
                                <img 
                                  src={provider.logo_url} 
                                  alt={provider.business_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Store className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{provider.business_name}</p>
                              <div className="flex items-center gap-2">
                                {provider.is_verified && (
                                  <Badge variant="secondary" className="text-xs">موثّق</Badge>
                                )}
                                {rating && rating.count > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {rating.average.toFixed(1)} ({rating.count})
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
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
