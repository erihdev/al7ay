import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Navigation, Loader2, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UnifiedLocationPickerProps {
    onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
    className?: string;
    autoFocus?: boolean;
    initialLocation?: { lat: number; lng: number } | null;
}

export function UnifiedLocationPicker({
    onLocationSelect,
    className,
    autoFocus = true,
    initialLocation
}: UnifiedLocationPickerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);

    const { data: mapboxToken } = useMapboxToken();
    const {
        userLocation,
        setUserLocation,
        resolveAddress,
        userAddress,
        requestLocation,
        isLoadingAddress,
        locationPermission
    } = useLocation();

    const [isMapReady, setIsMapReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Default to Riyadh if no location
    const defaultCenter = { lat: 24.7136, lng: 46.6753 };

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current || !mapboxToken || map.current) return;

        mapboxgl.accessToken = mapboxToken;

        const initialLat = initialLocation?.lat || userLocation?.lat || defaultCenter.lat;
        const initialLng = initialLocation?.lng || userLocation?.lng || defaultCenter.lng;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Standard style, can be customized
            center: [initialLng, initialLat],
            zoom: (initialLocation || userLocation) ? 15 : 10,
            attributionControl: false,
        });

        // Add navigation controls (zoom, rotation)
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        // Create the draggable marker
        const el = document.createElement('div');
        el.className = 'location-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.backgroundImage = 'url(/icons/marker-pin.svg)'; // We might need a custom SVG here, using fallback for now
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="text-primary w-10 h-10 drop-shadow-xl -mt-5"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`;

        marker.current = new mapboxgl.Marker({
            element: el,
            draggable: true,
            color: '#C9A227', // Primary gold color
        })
            .setLngLat([initialLng, initialLat])
            .addTo(map.current);

        // Event Listeners
        map.current.on('load', () => setIsMapReady(true));

        // Update state on drag end
        marker.current.on('dragend', async () => {
            const lngLat = marker.current?.getLngLat();
            if (lngLat) {
                handleLocationUpdate(lngLat.lat, lngLat.lng);
            }
        });

        // Update marker on map click
        map.current.on('click', (e) => {
            marker.current?.setLngLat(e.lngLat);
            handleLocationUpdate(e.lngLat.lat, e.lngLat.lng);
        });

        // If we have explicit permission and no location yet, request it (only if no initialLocation)
        if (autoFocus && !userLocation && !initialLocation && locationPermission === 'granted') {
            requestLocation();
        }

        // If initial location provided, resolve its address
        if (initialLocation) {
            handleLocationUpdate(initialLocation.lat, initialLocation.lng);
        }

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [mapboxToken]);

    // Sync map center with userLocation context updates (e.g. from GPS)
    useEffect(() => {
        if (userLocation && map.current && marker.current) {
            // Only fly to location if it's significantly different to avoid jitter during small GPS updates
            const currentCenter = map.current.getCenter();
            const dist = Math.sqrt(
                Math.pow(currentCenter.lat - userLocation.lat, 2) +
                Math.pow(currentCenter.lng - userLocation.lng, 2)
            );

            if (dist > 0.001) { // Threshold
                map.current.flyTo({
                    center: [userLocation.lng, userLocation.lat],
                    zoom: 16,
                    speed: 1.5
                });
                marker.current.setLngLat([userLocation.lng, userLocation.lat]);
            }
        }
    }, [userLocation]);

    const handleLocationUpdate = async (lat: number, lng: number) => {
        // 1. Update Context
        setUserLocation({ lat, lng });

        // 2. Resolve Address
        const address = await resolveAddress(lat, lng);

        // 3. Notify Parent
        if (onLocationSelect && address) {
            onLocationSelect({ lat, lng, address });
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !mapboxToken) return;
        setIsSearching(true);

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery + ' Saudi Arabia')}.json?access_token=${mapboxToken}&language=ar&limit=1`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                handleLocationUpdate(lat, lng);
                toast.success(`تم الانتقال إلى: ${data.features[0].text}`);
            } else {
                toast.error('لم يتم العثور على الموقع');
            }
        } catch (error) {
            toast.error('خطأ في البحث');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className={cn("relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-white/20", className)}>
            {/* Map Container */}
            <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-muted/20" />

            {/* Top Search Bar & Controls */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md">
                    <div className="p-2 flex gap-2">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="ابحث عن حي أو مدينة..."
                            className="border-0 bg-transparent focus-visible:ring-0 font-arabic text-right h-10"
                            dir="rtl"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-primary hover:bg-primary/10"
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-5 w-5" />}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute bottom-32 right-4 z-10 flex flex-col gap-2">
                <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full shadow-lg w-12 h-12 bg-white text-primary hover:bg-white/90 transition-transform hover:scale-105"
                    onClick={() => requestLocation()}
                    disabled={locationPermission === 'loading'}
                >
                    {locationPermission === 'loading' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Navigation className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Bottom Address Card */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/20 to-transparent">
                <AnimatePresence>
                    {userLocation && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-3 bg-primary/10 rounded-full shrink-0">
                                            <MapPin className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-right">
                                            <h3 className="font-bold text-sm text-muted-foreground mb-1 font-arabic">الموقع المحدد</h3>
                                            {isLoadingAddress ? (
                                                <div className="flex items-center gap-2 text-sm text-foreground/70">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    جاري جلب العنوان...
                                                </div>
                                            ) : (
                                                <p className="font-medium text-base text-foreground leading-snug line-clamp-2 dir-rtl font-arabic">
                                                    {userAddress || "موقع غير مسمى (تم التحديد بالإحداثيات)"}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground mt-1 font-mono dir-ltr">
                                                {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                                            </p>
                                        </div>
                                    </div>

                                    {onLocationSelect && (
                                        <div className="mt-4">
                                            <Button
                                                className="w-full font-arabic shadow-lg shadow-primary/20"
                                                size="lg"
                                                onClick={() => userAddress && onLocationSelect({
                                                    lat: userLocation.lat,
                                                    lng: userLocation.lng,
                                                    address: userAddress
                                                })}
                                                disabled={isLoadingAddress || !userAddress}
                                            >
                                                تأكيد هذا الموقع
                                                <Check className="mr-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
