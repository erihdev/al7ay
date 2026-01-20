import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { LocationPermission } from '@/components/location/LocationPermission';
import { CustomerNotificationPermission } from '@/components/notifications/CustomerNotificationPermission';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { FloatingParticles } from '@/components/ui/InteractiveBackground';
import { PageTransition, fadeInUp } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocation } from '@/contexts/LocationContext';
import { useOrderStatusNotifications } from '@/hooks/useOrderStatusNotifications';
import { 
  Store, 
  MapPin, 
  Search, 
  Star, 
  Navigation,
  ArrowLeft,
  Sparkles,
  Filter,
  Building2,
  Globe,
  AlertCircle,
  MapPinned
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomerLocationPicker } from '@/components/location/CustomerLocationPicker';

interface ServiceProvider {
  id: string;
  business_name: string;
  business_name_en: string | null;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  is_verified: boolean;
  delivery_scope: 'neighborhood' | 'city' | null;
  delivery_radius_km: number | null;
  store_lat: number | null;
  store_lng: number | null;
  active_neighborhoods: {
    id: string;
    name: string;
    city: string;
    lat: number;
    lng: number;
  } | null;
}

// Calculate distance between two points in meters
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const Index = () => {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [deliveryScopeFilter, setDeliveryScopeFilter] = useState<'all' | 'neighborhood' | 'city'>('all');
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ city: string; neighborhood: string; neighborhoodId: string; userCoords?: { lat: number; lng: number }; distance?: number } | null>(null);
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { requestLocation } = useLocation();
  
  // Enable order status notifications for logged-in customers
  useOrderStatusNotifications();

  // Redirect to profile page for login/register if not authenticated
  if (!loading && !user) {
    return <Navigate to="/profile" replace />;
  }

  // Fetch all active service providers with their neighborhoods
  const { data: providers, isLoading } = useQuery({
    queryKey: ['service-providers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          id,
          business_name,
          business_name_en,
          logo_url,
          description,
          phone,
          is_verified,
          delivery_scope,
          delivery_radius_km,
          store_lat,
          store_lng,
          active_neighborhoods (
            id,
            name,
            city,
            lat,
            lng
          )
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as ServiceProvider[];
    },
  });

  // Extract unique cities and neighborhoods for filters
  const cities = [...new Set(providers?.map(p => p.active_neighborhoods?.city).filter(Boolean) as string[])].sort();
  const neighborhoods = providers
    ?.filter(p => selectedCity === 'all' || p.active_neighborhoods?.city === selectedCity)
    .map(p => p.active_neighborhoods)
    .filter(Boolean) || [];
  const uniqueNeighborhoods = [...new Map(neighborhoods.map(n => [n?.id, n])).values()].filter(Boolean);

  // Reset neighborhood when city changes
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedNeighborhood('all');
    setDetectedLocation(null);
  };

  // Auto-detect nearest neighborhood from GPS
  const detectNearestNeighborhood = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsAutoDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Fetch all neighborhoods with coordinates
        const { data: neighborhoodsWithCoords, error } = await supabase
          .from('active_neighborhoods')
          .select('id, name, city, lat, lng')
          .eq('is_active', true);

        if (error || !neighborhoodsWithCoords) {
          setIsAutoDetecting(false);
          return;
        }

        // Find nearest neighborhood
        let nearest: { id: string; name: string; city: string; distance: number } | null = null;
        
        for (const neighborhood of neighborhoodsWithCoords) {
          if (neighborhood.lat && neighborhood.lng) {
            const distance = calculateDistance(userLat, userLng, neighborhood.lat, neighborhood.lng);
            if (!nearest || distance < nearest.distance) {
              nearest = {
                id: neighborhood.id,
                name: neighborhood.name,
                city: neighborhood.city,
                distance
              };
            }
          }
        }

        if (nearest) {
          setDetectedLocation({
            city: nearest.city,
            neighborhood: nearest.name,
            neighborhoodId: nearest.id,
            userCoords: { lat: userLat, lng: userLng },
            distance: nearest.distance
          });
          setUserGpsCoords({ lat: userLat, lng: userLng });
          setSelectedCity(nearest.city);
          setSelectedNeighborhood(nearest.id);
        }

        setIsAutoDetecting(false);
      },
      () => {
        setIsAutoDetecting(false);
        // Will trigger location permission request
        requestLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Handle manual location selection from map
  const handleManualLocationSelected = (coords: { lat: number; lng: number }) => {
    setUserGpsCoords(coords);
    setDetectedLocation({
      city: 'موقع مخصص',
      neighborhood: 'تم تحديده على الخريطة',
      neighborhoodId: 'manual',
      userCoords: coords,
      distance: 0
    });
    // Reset filters since we're using direct coordinates
    setSelectedCity('all');
    setSelectedNeighborhood('all');
  };

  // Filter and sort providers by filters, distance, and delivery_scope
  const filteredProviders = providers?.filter(provider => {
    // Delivery scope filter
    if (deliveryScopeFilter !== 'all') {
      const providerScope = provider.delivery_scope || 'neighborhood';
      if (providerScope !== deliveryScopeFilter) {
        return false;
      }
    }
    // City filter
    if (selectedCity !== 'all' && provider.active_neighborhoods?.city !== selectedCity) {
      // Also include providers that serve the whole city
      if (provider.delivery_scope !== 'city') {
        return false;
      }
    }
    // Neighborhood filter
    if (selectedNeighborhood !== 'all' && provider.active_neighborhoods?.id !== selectedNeighborhood) {
      // Include providers that serve the whole city even if neighborhood filter is active
      if (provider.delivery_scope !== 'city') {
        return false;
      }
    }
    // Search query filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      provider.business_name.toLowerCase().includes(query) ||
      (provider.business_name_en && provider.business_name_en.toLowerCase().includes(query)) ||
      (provider.active_neighborhoods?.name.toLowerCase().includes(query)) ||
      (provider.active_neighborhoods?.city.toLowerCase().includes(query))
    );
  }) || [];

  // Calculate distances and determine if provider serves user's location
  const providersWithDistance = filteredProviders.map(provider => {
    let distance: number | null = null;
    let servesUserLocation = true; // Default to true if no location
    
    // Get provider's coordinates - prefer store_lat/store_lng, fallback to neighborhood
    const providerLat = provider.store_lat ?? provider.active_neighborhoods?.lat;
    const providerLng = provider.store_lng ?? provider.active_neighborhoods?.lng;
    
    if (userGpsCoords && providerLat && providerLng) {
      distance = calculateDistance(
        userGpsCoords.lat,
        userGpsCoords.lng,
        providerLat,
        providerLng
      );
      
      // Check if provider serves user's location based on delivery_scope
      const deliveryScope = provider.delivery_scope || 'neighborhood';
      const deliveryRadiusKm = provider.delivery_radius_km || 2; // Default 2km radius
      
      if (deliveryScope === 'neighborhood') {
        // Provider only serves their neighborhood - check if user is within delivery radius
        servesUserLocation = distance <= (deliveryRadiusKm * 1000);
      } else {
        // Provider serves entire city - check if user is within reasonable city distance (~50km)
        servesUserLocation = distance <= 50000;
      }
    }
    
    return { ...provider, distance, servesUserLocation };
  }).sort((a, b) => {
    // Prioritize providers that serve user's location
    if (a.servesUserLocation && !b.servesUserLocation) return -1;
    if (!a.servesUserLocation && b.servesUserLocation) return 1;
    // Then sort by distance
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  // Split providers into those serving user and those not
  const servingProviders = providersWithDistance.filter(p => p.servesUserLocation);
  const notServingProviders = providersWithDistance.filter(p => !p.servesUserLocation && userGpsCoords);

  // Format distance for display
  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters < 1000) {
      return `${Math.round(meters)} م`;
    }
    return `${(meters / 1000).toFixed(1)} كم`;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
        <FloatingParticles count={12} />
        <Header />
        
        <main className="container mx-auto px-3 pb-20 pt-3 space-y-4">
          {/* Welcome Section */}
          <motion.div 
            variants={fadeInUp}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4"
          >
            <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold">مرحباً بك في الحي! 👋</h1>
                  <p className="text-xs text-muted-foreground">اكتشف مقدمي الخدمات القريبين منك</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-2 text-center">
                  <Store className="h-4 w-4 mx-auto mb-0.5 text-primary" />
                  <p className="text-[10px] text-muted-foreground">مقدم خدمة</p>
                  <p className="font-bold text-xs">{providers?.length || 0}</p>
                </div>
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-2 text-center">
                  <Sparkles className="h-4 w-4 mx-auto mb-0.5 text-amber-500" />
                  <p className="text-[10px] text-muted-foreground">موثق</p>
                  <p className="font-bold text-xs">{providers?.filter(p => p.is_verified).length || 0}</p>
                </div>
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-2 text-center">
                  <MapPin className="h-4 w-4 mx-auto mb-0.5 text-green-500" />
                  <p className="text-[10px] text-muted-foreground">أحياء</p>
                  <p className="font-bold text-xs">
                    {new Set(providers?.map(p => p.active_neighborhoods?.id).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification Permission for background alerts */}
          <motion.div variants={fadeInUp}>
            <CustomerNotificationPermission customerId={user?.id} />
          </motion.div>

          {/* Location Permission */}
          <motion.div variants={fadeInUp}>
            <LocationPermission />
          </motion.div>

          {/* Loyalty Card */}
          <motion.div variants={fadeInUp}>
            <LoyaltyCard />
          </motion.div>

          {/* Search Section */}
          <motion.div variants={fadeInUp} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">مقدمو الخدمات</h2>
                  <p className="text-[10px] text-muted-foreground">
                    {providersWithDistance.length} مقدم خدمة {userGpsCoords ? 'قريب منك' : 'متاح'}
                  </p>
                </div>
              </div>
              
              {/* Location buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectNearestNeighborhood}
                  disabled={isAutoDetecting}
                  className="gap-1.5 text-xs h-8"
                >
                  {isAutoDetecting ? (
                    <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5" />
                  )}
                  {isAutoDetecting ? 'جارٍ التحديد...' : 'موقعي'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLocationPicker(true)}
                  className="gap-1.5 text-xs h-8"
                >
                  <MapPinned className="h-3.5 w-3.5" />
                  الخريطة
                </Button>
              </div>
            </div>

            {/* Detected Location Badge */}
            {detectedLocation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1.5 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 truncate">
                      تم تحديد موقعك: {detectedLocation.neighborhood}
                    </p>
                    <p className="text-[10px] text-green-600/80 dark:text-green-500/80">
                      {detectedLocation.city}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-primary hover:text-primary/80"
                      onClick={() => setShowLocationPicker(true)}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-green-600 hover:text-green-700"
                      onClick={() => {
                        setDetectedLocation(null);
                        setUserGpsCoords(null);
                        setSelectedCity('all');
                        setSelectedNeighborhood('all');
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
                {detectedLocation.userCoords && detectedLocation.distance && detectedLocation.distance > 500 && detectedLocation.neighborhoodId !== 'manual' && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-green-200/50 dark:border-green-800/50">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        GPS غير دقيق؟
                      </p>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-5 px-1 text-[10px] text-amber-600"
                      onClick={() => setShowLocationPicker(true)}
                    >
                      حدد يدوياً
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مقدم خدمة أو حي..."
                className="pr-9 h-10 rounded-lg text-sm"
                dir="rtl"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {/* City Filter */}
              <div className="flex-1 min-w-[100px]">
                <Select value={selectedCity} onValueChange={handleCityChange}>
                  <SelectTrigger className="h-9 rounded-lg text-xs">
                    <Building2 className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                    <SelectValue placeholder="المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المدن</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Neighborhood Filter */}
              <div className="flex-1 min-w-[100px]">
                <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                  <SelectTrigger className="h-9 rounded-lg text-xs">
                    <MapPin className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                    <SelectValue placeholder="الحي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأحياء</SelectItem>
                    {uniqueNeighborhoods.map(neighborhood => (
                      <SelectItem key={neighborhood?.id} value={neighborhood?.id || ''}>
                        {neighborhood?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Scope Filter */}
              <div className="flex-1 min-w-[100px]">
                <Select value={deliveryScopeFilter} onValueChange={(val) => setDeliveryScopeFilter(val as 'all' | 'neighborhood' | 'city')}>
                  <SelectTrigger className="h-9 rounded-lg text-xs">
                    <Globe className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                    <SelectValue placeholder="نطاق الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="neighborhood">الحي فقط</SelectItem>
                    <SelectItem value="city">المدينة كاملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Badge */}
            {(selectedCity !== 'all' || selectedNeighborhood !== 'all' || deliveryScopeFilter !== 'all') && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="h-3 w-3 text-primary" />
                {selectedCity !== 'all' && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
                    {selectedCity}
                  </Badge>
                )}
                {selectedNeighborhood !== 'all' && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
                    {uniqueNeighborhoods.find(n => n?.id === selectedNeighborhood)?.name}
                  </Badge>
                )}
                {deliveryScopeFilter !== 'all' && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5 gap-1">
                    {deliveryScopeFilter === 'city' ? (
                      <>
                        <Globe className="h-2.5 w-2.5" />
                        المدينة كاملة
                      </>
                    ) : (
                      <>
                        <MapPin className="h-2.5 w-2.5" />
                        الحي فقط
                      </>
                    )}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] text-muted-foreground hover:text-foreground px-1.5"
                  onClick={() => {
                    setSelectedCity('all');
                    setSelectedNeighborhood('all');
                    setDeliveryScopeFilter('all');
                    setDetectedLocation(null);
                  }}
                >
                  مسح الفلاتر
                </Button>
              </div>
            )}
          </motion.div>

          {/* Providers List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : providersWithDistance.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-muted to-muted/50 rounded-full p-4">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <p className="text-muted-foreground font-arabic text-sm">
                {searchQuery ? 'لا توجد نتائج' : 'لا يوجد مقدمو خدمات حالياً'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'سيتم إضافة مقدمي خدمات قريباً'}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Providers that serve user's location */}
              {servingProviders.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/store/${provider.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Logo */}
                          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {provider.logo_url ? (
                              <img 
                                src={provider.logo_url} 
                                alt={provider.business_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Store className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <h3 className="font-bold text-sm truncate flex items-center gap-1.5">
                                  {provider.business_name}
                                  {provider.is_verified && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                      <Star className="h-2.5 w-2.5 ml-0.5 fill-amber-500 text-amber-500" />
                                      موثق
                                    </Badge>
                                  )}
                                </h3>
                                {provider.active_neighborhoods && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {provider.active_neighborhoods.name}، {provider.active_neighborhoods.city}
                                    </span>
                                  </p>
                                )}
                              </div>
                              <ArrowLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </div>

                            {/* Distance & Description */}
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              {provider.distance !== null && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                                  <Navigation className="h-2.5 w-2.5 ml-0.5" />
                                  {formatDistance(provider.distance)}
                                </Badge>
                              )}
                              {provider.delivery_scope === 'city' && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  <Globe className="h-2.5 w-2.5 ml-0.5" />
                                  يخدم كل المدينة
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}

              {/* Separator and providers outside coverage */}
              {notServingProviders.length > 0 && (
                <>
                  <div className="py-3">
                    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 py-2 px-3">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      <AlertDescription className="font-arabic text-amber-700 dark:text-amber-300 text-xs">
                        المتاجر التالية قد لا تخدم منطقتك حالياً
                      </AlertDescription>
                    </Alert>
                  </div>
                  
                  {notServingProviders.map((provider, index) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (servingProviders.length + index) * 0.1 }}
                    >
                      <Link to={`/store/${provider.id}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] opacity-70 hover:opacity-100">
                          <CardContent className="p-3">
                            <div className="flex gap-3">
                              {/* Logo */}
                              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                {provider.logo_url ? (
                                  <img 
                                    src={provider.logo_url} 
                                    alt={provider.business_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Store className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="min-w-0">
                                    <h3 className="font-bold text-sm truncate flex items-center gap-1.5">
                                      {provider.business_name}
                                      {provider.is_verified && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                          <Star className="h-2.5 w-2.5 ml-0.5 fill-amber-500 text-amber-500" />
                                          موثق
                                        </Badge>
                                      )}
                                    </h3>
                                    {provider.active_neighborhoods && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">
                                          {provider.active_neighborhoods.name}، {provider.active_neighborhoods.city}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                  <ArrowLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </div>

                                {/* Distance & Out of range badge */}
                                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                  {provider.distance !== null && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                                      <Navigation className="h-2.5 w-2.5 ml-0.5" />
                                      {formatDistance(provider.distance)}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 border-amber-500 text-amber-600">
                                    <AlertCircle className="h-2.5 w-2.5 ml-0.5" />
                                    خارج التغطية
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}

          {/* Bottom Padding for scroll */}
          <div className="h-4" />
        </main>

        <BottomNav />

        {/* Customer Location Picker Dialog */}
        <CustomerLocationPicker
          open={showLocationPicker}
          onOpenChange={setShowLocationPicker}
          onLocationSelected={handleManualLocationSelected}
          initialCoords={userGpsCoords}
        />
      </div>
    </PageTransition>
  );
};

export default Index;