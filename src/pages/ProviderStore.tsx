import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProviderCartProvider, useProviderCart } from '@/contexts/ProviderCartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import StoreCart from '@/components/store/StoreCart';
import { useLocation } from '@/contexts/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Store, 
  MapPin, 
  Phone, 
  Star,
  ShoppingBag,
  Coffee,
  Package,
  Plus,
  Minus,
  Sparkles,
  IceCream,
  Cake,
  X,
  Search,
  AlertTriangle,
  Globe,
  CheckCircle2,
  Award
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ChatDialog } from '@/components/chat/ChatDialog';

interface Product {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_featured: boolean;
  is_available: boolean;
}

const ProviderStoreContent = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { addItem, totalItems } = useProviderCart();
  const { userLocation } = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCoverageAlert, setShowCoverageAlert] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  

  // Fetch provider data
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ['provider-store', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          active_neighborhoods (name, city, lat, lng)
        `)
        .eq('id', providerId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  // Fetch provider products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['provider-store-products', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_products')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_available', true)
        .order('is_featured', { ascending: false })
        .order('sort_order');
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!providerId,
  });

  // Fetch alternative providers (for coverage alert)
  const { data: alternativeProviders } = useQuery({
    queryKey: ['alternative-providers', provider?.active_neighborhoods?.city],
    queryFn: async () => {
      if (!provider?.active_neighborhoods?.city || !userLocation) return [];
      
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          id,
          business_name,
          logo_url,
          is_verified,
          delivery_scope,
          active_neighborhoods (name, city, lat, lng)
        `)
        .eq('is_active', true)
        .neq('id', providerId);
      
      if (error) throw error;
      
      // Filter providers that serve user's location
      return (data || []).filter(p => {
        if (!p.active_neighborhoods || !userLocation) return false;
        
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          p.active_neighborhoods.lat,
          p.active_neighborhoods.lng
        );
        
        const deliveryScope = p.delivery_scope || 'neighborhood';
        if (deliveryScope === 'neighborhood') {
          return distance <= 2000;
        } else {
          return p.active_neighborhoods.city === provider?.active_neighborhoods?.city && distance <= 30000;
        }
      }).slice(0, 3);
    },
    enabled: !!provider && !!userLocation && showCoverageAlert,
  });

  // Calculate distance helper function
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Check if provider serves user's location
  const isOutsideCoverage = React.useMemo(() => {
    if (!provider || !userLocation || !provider.active_neighborhoods) return false;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      provider.active_neighborhoods.lat,
      provider.active_neighborhoods.lng
    );
    
    const deliveryScope = provider.delivery_scope || 'neighborhood';
    if (deliveryScope === 'neighborhood') {
      return distance > 2000;
    } else {
      return distance > 30000;
    }
  }, [provider, userLocation]);

  // Show coverage alert when user location is detected and they're outside coverage
  useEffect(() => {
    if (isOutsideCoverage && userLocation) {
      setShowCoverageAlert(true);
    }
  }, [isOutsideCoverage, userLocation]);
  
  const filteredProducts = products?.filter(p => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name_ar.toLowerCase().includes(query) ||
      (p.name_en && p.name_en.toLowerCase().includes(query)) ||
      (p.description_ar && p.description_ar.toLowerCase().includes(query))
    );
  }) || [];

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Get featured products
  const featuredProducts = filteredProducts.filter(p => p.is_featured).slice(0, 4);

  // Get categories with counts
  const categories = [
    { id: 'all', label: 'الكل', icon: Package, count: filteredProducts.length },
    ...Object.entries(productsByCategory).map(([cat, prods]) => ({
      id: cat,
      label: getCategoryLabel(cat),
      icon: getCategoryIconComponent(cat),
      count: prods.length
    }))
  ];

  // Get store theme with defaults
  const storeTheme = provider?.store_theme as {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    background_color?: string;
    text_color?: string;
    header_style?: 'solid' | 'gradient' | 'transparent' | 'image';
    header_image_url?: string;
    header_overlay_opacity?: number;
    header_blur?: boolean;
    font_family?: string;
    border_radius?: string;
    button_style?: string;
  } || {};
  
  const primaryColor = storeTheme.primary_color || '#1B4332';
  const secondaryColor = storeTheme.secondary_color || '#2D6A4F';
  const accentColor = storeTheme.accent_color || '#D4AF37';
  const headerStyle = storeTheme.header_style || 'gradient';
  const headerImageUrl = storeTheme.header_image_url || '';
  const headerOverlayOpacity = storeTheme.header_overlay_opacity ?? 50;
  const headerBlur = storeTheme.header_blur || false;
  const fontFamily = storeTheme.font_family || 'Tajawal';
  
  // Check if header has image background
  const hasImageHeader = headerStyle === 'image' && headerImageUrl;
  
  // Get header background based on style
  const getHeaderBackground = () => {
    if (hasImageHeader) {
      return 'transparent';
    }
    switch (headerStyle) {
      case 'gradient':
        return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor}dd 100%)`;
      case 'transparent':
        return 'transparent';
      default:
        return primaryColor;
    }
  };

  function getCategoryLabel(category: string) {
    const labels: Record<string, string> = {
      'featured': 'المميز',
      'coffee': 'القهوة',
      'sweets': 'الحلويات',
      'cold_drinks': 'المشروبات الباردة',
      'other': 'أخرى'
    };
    return labels[category] || category;
  }

  function getCategoryIconComponent(category: string) {
    const icons: Record<string, any> = {
      'featured': Sparkles,
      'coffee': Coffee,
      'sweets': Cake,
      'cold_drinks': IceCream,
      'other': Package
    };
    return icons[category] || Package;
  }

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const section = sectionRefs.current[categoryId];
    if (section) {
      const headerOffset = 200;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: Product, qty: number = 1) => {
    if (!provider) return;
    
    addItem({
      productId: product.id,
      productName: product.name_ar,
      price: product.price,
      quantity: qty,
      imageUrl: product.image_url
    }, provider.id, provider.business_name);
    
    toast.success('تمت الإضافة للسلة', {
      description: `${product.name_ar} × ${qty}`,
      icon: <ShoppingBag className="h-4 w-4" />,
    });
    setSelectedProduct(null);
    setQuantity(1);
  };

  // Loading state
  if (providerLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
        <div className="p-4 -mt-8 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-28 w-28 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Not found state
  if (!provider) {
    return (
      <div className="min-h-screen bg-background font-arabic flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">المتجر غير موجود</h2>
              <p className="text-muted-foreground mb-8">
                عذراً، لم نتمكن من العثور على هذا المتجر
              </p>
              <Link to="/">
                <Button size="lg" className="rounded-full px-8">
                  <ArrowRight className="h-5 w-5 ml-2" />
                  العودة للرئيسية
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background" style={{ fontFamily }} dir="rtl">
      {/* Coverage Alert Dialog */}
      {showCoverageAlert && isOutsideCoverage && (
        <Dialog open={showCoverageAlert} onOpenChange={setShowCoverageAlert}>
          <DialogContent className="max-w-md font-arabic" dir="rtl">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">خارج نطاق التغطية</h3>
                  <p className="text-sm text-muted-foreground">هذا المتجر لا يخدم منطقتك حالياً</p>
                </div>
              </div>
              
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertDescription className="font-arabic text-amber-700 dark:text-amber-300 text-sm">
                  {provider.delivery_scope === 'city' ? (
                    <>المتجر يخدم مدينة {provider.active_neighborhoods?.city} فقط</>
                  ) : (
                    <>المتجر يخدم حي {provider.active_neighborhoods?.name} فقط</>
                  )}
                </AlertDescription>
              </Alert>

              {alternativeProviders && alternativeProviders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    متاجر تخدم منطقتك
                  </h4>
                  <div className="space-y-2">
                    {alternativeProviders.map(alt => (
                      <Link 
                        key={alt.id} 
                        to={`/store/${alt.id}`}
                        onClick={() => setShowCoverageAlert(false)}
                        className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {alt.logo_url ? (
                            <img src={alt.logo_url} alt={alt.business_name} className="w-full h-full object-cover" />
                          ) : (
                            <Store className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate flex items-center gap-1">
                            {alt.business_name}
                            {alt.is_verified && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {alt.active_neighborhoods?.name}، {alt.active_neighborhoods?.city}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {alt.delivery_scope === 'city' ? 'كل المدينة' : 'الحي'}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl" 
                  onClick={() => setShowCoverageAlert(false)}
                >
                  تصفح على أي حال
                </Button>
                <Link to="/" className="flex-1">
                  <Button className="w-full rounded-xl">
                    العودة للرئيسية
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hero Header */}
      <header className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{ background: getHeaderBackground() }}
        >
          {hasImageHeader && (
            <>
              <img 
                src={headerImageUrl}
                alt=""
                className={cn(
                  "w-full h-full object-cover",
                  headerBlur && "blur-sm scale-105"
                )}
              />
              <div 
                className="absolute inset-0"
                style={{ 
                  backgroundColor: primaryColor,
                  opacity: headerOverlayOpacity / 100
                }}
              />
            </>
          )}
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
          </div>
        </div>

        {/* Safe Area Padding */}
        <div className="pt-[env(safe-area-inset-top)]" />

        {/* Top Navigation */}
        <div className="relative z-10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Cart Button in Header */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/90 hover:bg-white/20 h-10 w-10 rounded-full relative"
              onClick={() => {
                const cartBtn = document.querySelector('[data-cart-trigger]') as HTMLButtonElement;
                if (cartBtn) cartBtn.click();
              }}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {totalItems}
                </span>
              )}
            </Button>
            <ThemeToggle />
            {provider.phone && (
              <a href={`tel:${provider.phone}`}>
                <Button variant="ghost" size="icon" className="text-white/90 hover:bg-white/20 h-10 w-10 rounded-full">
                  <Phone className="h-5 w-5" />
                </Button>
              </a>
            )}
            {/* Chat Button */}
            <ChatDialog 
              providerId={provider.id} 
              providerName={provider.business_name}
              primaryColor={primaryColor}
            />
          </div>
          
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-white/90 hover:bg-white/20 h-10 w-10 rounded-full">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Store Info */}
        <div className="relative z-10 px-6 pb-8 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start gap-5"
          >
            {/* Logo */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                {provider.logo_url ? (
                  <img 
                    src={provider.logo_url} 
                    alt={provider.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              {provider.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white mb-1 line-clamp-1">
                {provider.business_name}
              </h1>
              
              {provider.active_neighborhoods && (
                <p className="text-white/80 text-sm flex items-center gap-1.5 mb-3">
                  <MapPin className="h-4 w-4" />
                  {(provider.active_neighborhoods as any).name}، {(provider.active_neighborhoods as any).city}
                </p>
              )}
              
              {/* Stats Row */}
              <div className="flex items-center gap-3 flex-wrap">
                
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/90 text-sm">
                  <Package className="h-4 w-4" />
                  <span>{filteredProducts.length} منتج</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 38.3C1248 33.3 1344 26.7 1392 23.3L1440 20V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z" 
              className="fill-muted/30 dark:fill-background"
            />
          </svg>
        </div>
      </header>

      {/* Search Bar - Sticky */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="ابحث عن منتج..."
              className={cn(
                "pr-12 h-12 bg-muted/50 border-0 rounded-2xl text-base transition-all duration-300",
                isSearchFocused && "ring-2 ring-primary/30 bg-background"
              )}
              dir="rtl"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div 
          ref={categoryScrollRef}
          className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300",
                  isActive 
                    ? "text-white shadow-lg" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                style={isActive ? { backgroundColor: primaryColor } : {}}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  isActive ? "bg-white/20" : "bg-background"
                )}>
                  {cat.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-32">
        {productsLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {searchQuery ? 'لا توجد نتائج' : 'لا توجد منتجات'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'جرب البحث بكلمات مختلفة' 
                    : 'لم يقم صاحب المتجر بإضافة منتجات بعد'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Featured Products Section */}
            {featuredProducts.length > 0 && activeCategory === 'all' && !searchQuery && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pt-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Award className="h-4 w-4" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">المنتجات المميزة</h2>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {featuredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <FeaturedProductCard
                        product={product}
                        onAddToCart={() => handleAddToCart(product, 1)}
                        onClick={() => setSelectedProduct(product)}
                        primaryColor={primaryColor}
                        accentColor={accentColor}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Products by Category */}
            {(activeCategory === 'all' 
              ? Object.entries(productsByCategory) 
              : [[activeCategory, productsByCategory[activeCategory] || []] as [string, Product[]]]
            ).map(([category, categoryProducts]: [string, Product[]]) => {
              if (!categoryProducts || categoryProducts.length === 0) return null;
              const CategoryIcon = getCategoryIconComponent(category);
              
              return (
                <motion.div 
                  key={category} 
                  ref={(el) => { sectionRefs.current[category] = el; }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{getCategoryLabel(category)}</h2>
                      <p className="text-xs text-muted-foreground">{categoryProducts.length} منتج</p>
                    </div>
                  </div>

                  {/* Products Grid - Same style as Featured */}
                  <div className="grid grid-cols-3 gap-2">
                    {categoryProducts.map((product: Product, index: number) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <CompactProductCard
                          product={product}
                          onAddToCart={() => handleAddToCart(product, 1)}
                          onClick={() => setSelectedProduct(product)}
                          primaryColor={primaryColor}
                          accentColor={accentColor}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Dialog */}
      <AnimatePresence>
        {selectedProduct && (
          <Dialog open={!!selectedProduct} onOpenChange={() => { setSelectedProduct(null); setQuantity(1); }}>
            <DialogContent dir="rtl" className="font-arabic max-w-lg p-0 overflow-hidden gap-0 rounded-3xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col max-h-[85vh]"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-muted flex-shrink-0 overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.name_ar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Coffee className="h-20 w-20 text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {selectedProduct.is_featured && (
                    <Badge 
                      className="absolute top-4 right-4 shadow-lg text-white border-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Star className="h-3 w-3 ml-1 fill-white" />
                      مميز
                    </Badge>
                  )}
                  
                  {/* Price Badge */}
                  <div 
                    className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white font-bold text-lg shadow-lg backdrop-blur-sm"
                    style={{ backgroundColor: `${primaryColor}dd` }}
                  >
                    {Number(selectedProduct.price).toFixed(0)} ر.س
                  </div>
                </div>

                {/* Product Info */}
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedProduct.name_ar}</h2>
                      {selectedProduct.name_en && (
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {selectedProduct.name_en}
                        </p>
                      )}
                    </div>

                    {selectedProduct.description_ar && (
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedProduct.description_ar}
                      </p>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between py-4 px-5 bg-muted/50 rounded-2xl">
                      <span className="font-medium">الكمية</span>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-2xl w-10 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                </ScrollArea>

                {/* Add to Cart Button */}
                <div className="p-4 border-t bg-background flex-shrink-0">
                  <Button 
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => handleAddToCart(selectedProduct, quantity)}
                  >
                    <ShoppingBag className="h-5 w-5 ml-2" />
                    إضافة للسلة - {(Number(selectedProduct.price) * quantity).toFixed(0)} ر.س
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Floating Cart */}
      <StoreCart 
        primaryColor={primaryColor} 
        storeLocation={provider?.store_lat && provider?.store_lng ? { lat: provider.store_lat, lng: provider.store_lng } : null}
        deliveryRadiusKm={provider?.delivery_radius_km ?? 5}
      />
      
    </div>
  );
};

// Featured Product Card Component
interface FeaturedProductCardProps {
  product: Product;
  onAddToCart: () => void;
  onClick: () => void;
  primaryColor: string;
  accentColor: string;
}

const FeaturedProductCard = ({ product, onAddToCart, onClick, primaryColor, accentColor }: FeaturedProductCardProps) => {
  return (
    <Card
      className="overflow-hidden border-0 shadow-md cursor-pointer group hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name_ar}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Coffee className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        
        <div 
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
          style={{ backgroundColor: accentColor }}
        >
          <Star className="h-2.5 w-2.5 fill-white text-white" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h4 className="font-bold text-white text-xs line-clamp-1 mb-0.5">{product.name_ar}</h4>
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">
              {Number(product.price).toFixed(0)} ر.س
            </span>
            <Button
              size="sm"
              className="h-6 w-6 p-0 rounded-full shadow"
              style={{ backgroundColor: primaryColor }}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Compact Product Card Component (Grid Style - Same as Featured)
interface CompactProductCardProps {
  product: Product;
  onAddToCart: () => void;
  onClick: () => void;
  primaryColor: string;
  accentColor: string;
}

const CompactProductCard = ({ product, onAddToCart, onClick, primaryColor, accentColor }: CompactProductCardProps) => {
  return (
    <Card
      className="overflow-hidden border-0 shadow-md cursor-pointer group hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name_ar}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Coffee className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        
        {product.is_featured && (
          <div 
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
            style={{ backgroundColor: accentColor }}
          >
            <Star className="h-2.5 w-2.5 fill-white text-white" />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h4 className="font-bold text-white text-xs line-clamp-1 mb-0.5">{product.name_ar}</h4>
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">
              {Number(product.price).toFixed(0)} ر.س
            </span>
            <Button
              size="sm"
              className="h-6 w-6 p-0 rounded-full shadow"
              style={{ backgroundColor: primaryColor }}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ProviderStore = () => {
  return (
    <ProviderCartProvider>
      <ProviderStoreContent />
    </ProviderCartProvider>
  );
};

export default ProviderStore;
