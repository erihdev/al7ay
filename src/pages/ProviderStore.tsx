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
import ProductReviews from '@/components/store/ProductReviews';
import ProviderReviewDialog from '@/components/reviews/ProviderReviewDialog';
import ProviderReviewsList from '@/components/reviews/ProviderReviewsList';
import ProviderRatingBadge from '@/components/reviews/ProviderRatingBadge';
import { useProviderRatingSummary } from '@/hooks/useProviderReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
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
  MessageSquare,
  Sparkles,
  IceCream,
  Cake,
  X,
  Search,
  AlertTriangle,
  Globe,
  Navigation
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { user } = useAuth();
  const { userLocation } = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReviews, setShowReviews] = useState(false);
  const [showCoverageAlert, setShowCoverageAlert] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Provider rating summary
  const ratingSummary = useProviderRatingSummary(providerId);

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
  const headerStyle = storeTheme.header_style || 'solid';
  const headerImageUrl = storeTheme.header_image_url || '';
  const headerOverlayOpacity = storeTheme.header_overlay_opacity ?? 50;
  const headerBlur = storeTheme.header_blur || false;
  const fontFamily = storeTheme.font_family || 'Tajawal';
  
  // Check if header has image background
  const hasImageHeader = headerStyle === 'image' && headerImageUrl;
  
  // Get header background based on style
  const getHeaderBackground = () => {
    if (hasImageHeader) {
      return 'transparent'; // We'll use the image as background
    }
    switch (headerStyle) {
      case 'gradient':
        return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
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
      const headerOffset = 180;
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
    });
    setSelectedProduct(null);
    setQuantity(1);
  };

  // Loading state
  if (providerLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="h-16 bg-muted animate-pulse" />
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
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
      <div className="min-h-screen bg-background font-arabic flex items-center justify-center" dir="rtl">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">المتجر غير موجود</h2>
            <p className="text-muted-foreground mb-6">
              عذراً، لم نتمكن من العثور على هذا المتجر
            </p>
            <Link to="/">
              <Button>
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily }} dir="rtl">
      {/* Coverage Alert */}
      {showCoverageAlert && isOutsideCoverage && (
        <Dialog open={showCoverageAlert} onOpenChange={setShowCoverageAlert}>
          <DialogContent className="max-w-md font-arabic" dir="rtl">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
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
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {alt.logo_url ? (
                            <img src={alt.logo_url} alt={alt.business_name} className="w-full h-full object-cover" />
                          ) : (
                            <Store className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate flex items-center gap-1">
                            {alt.business_name}
                            {alt.is_verified && (
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
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

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowCoverageAlert(false)}
                >
                  تصفح على أي حال
                </Button>
                <Link to="/" className="flex-1">
                  <Button className="w-full">
                    العودة للرئيسية
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fixed Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden pt-[env(safe-area-inset-top)]"
        style={{ background: getHeaderBackground() }}
      >
        {/* Background Image with Effects */}
        {hasImageHeader && (
          <div className="absolute inset-0">
            <img 
              src={headerImageUrl}
              alt=""
              className={cn(
                "w-full h-full object-cover",
                headerBlur && "blur-sm scale-105"
              )}
            />
            {/* Overlay */}
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: primaryColor,
                opacity: headerOverlayOpacity / 100
              }}
            />
            {/* Gradient fade at bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-8"
              style={{
                background: `linear-gradient(to top, ${primaryColor}40, transparent)`
              }}
            />
          </div>
        )}
        {/* Top Bar */}
        <div className="relative z-10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div 
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden"
            >
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
            {/* Store Name */}
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                {provider.business_name}
              </h1>
              <div className="flex items-center gap-2">
                {provider.active_neighborhoods && (
                  <p className="text-[11px] text-white/70 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {(provider.active_neighborhoods as any).name}
                  </p>
                )}
                {ratingSummary.totalReviews > 0 && (
                  <button 
                    onClick={() => setShowReviews(true)}
                    className="text-[11px] text-white/90 flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-full"
                  >
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {ratingSummary.averageRating.toFixed(1)}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {provider.phone && (
              <a href={`tel:${provider.phone}`}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9">
                  <Phone className="h-4 w-4" />
                </Button>
              </a>
            )}
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="pr-10 h-10 bg-white/95 border-0 rounded-full text-sm"
              dir="rtl"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
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
          className="relative z-10 flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  isActive 
                    ? "bg-white text-foreground shadow-lg" 
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-muted" : "bg-white/20"
                )}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content - with top padding for fixed header */}
      <main className="pt-[180px] pb-32">
        {productsLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="m-4">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
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
        ) : (
          <div>
            {/* All Products or Filtered by Category */}
            {(activeCategory === 'all' 
              ? Object.entries(productsByCategory) 
              : [[activeCategory, productsByCategory[activeCategory] || []] as [string, Product[]]]
            ).map(([category, categoryProducts]: [string, Product[]]) => {
              if (!categoryProducts || categoryProducts.length === 0) return null;
              const CategoryIcon = getCategoryIconComponent(category);
              
              return (
                <div 
                  key={category} 
                  ref={(el) => { sectionRefs.current[category] = el; }}
                  className="mb-6"
                >
                  {/* Category Header */}
                  <div 
                    className="sticky top-[180px] z-40 px-4 py-3 flex items-center gap-3"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{getCategoryLabel(category)}</h2>
                      <p className="text-xs text-muted-foreground">{categoryProducts.length} منتج</p>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="px-4 space-y-3">
                    {categoryProducts.map((product: Product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={() => handleAddToCart(product, 1)}
                        onClick={() => setSelectedProduct(product)}
                        primaryColor={primaryColor}
                        accentColor={accentColor}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Sheet */}
      <Dialog open={!!selectedProduct} onOpenChange={() => { setSelectedProduct(null); setQuantity(1); }}>
        <DialogContent dir="rtl" className="font-arabic max-w-lg p-0 overflow-hidden gap-0">
          {selectedProduct && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Product Image */}
              <div className="relative aspect-[16/10] bg-muted flex-shrink-0">
                {selectedProduct.image_url ? (
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name_ar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <Coffee className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                {selectedProduct.is_featured && (
                  <Badge 
                    className="absolute top-3 right-3 shadow-lg"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Star className="h-3 w-3 ml-1 fill-white" />
                    مميز
                  </Badge>
                )}
              </div>

              {/* Product Info */}
              <ScrollArea className="flex-1">
                <div className="p-5 space-y-4">
                  {/* Name and Price */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedProduct.name_ar}</h2>
                      {selectedProduct.name_en && (
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {selectedProduct.name_en}
                        </p>
                      )}
                    </div>
                    <div 
                      className="text-xl font-bold whitespace-nowrap"
                      style={{ color: primaryColor }}
                    >
                      {Number(selectedProduct.price).toFixed(0)} ر.س
                    </div>
                  </div>

                  {selectedProduct.description_ar && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {selectedProduct.description_ar}
                    </p>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between py-4 border-y">
                    <span className="font-medium">الكمية</span>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-xl w-8 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div>
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4" />
                      التقييمات والمراجعات
                    </h3>
                    <ProductReviews productId={selectedProduct.id} primaryColor={primaryColor} />
                  </div>
                </div>
              </ScrollArea>

              {/* Add to Cart Button */}
              <div className="p-4 border-t bg-background flex-shrink-0">
                <Button 
                  className="w-full h-12 text-base font-bold rounded-xl shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => handleAddToCart(selectedProduct, quantity)}
                >
                  <ShoppingBag className="h-5 w-5 ml-2" />
                  إضافة للسلة - {(Number(selectedProduct.price) * quantity).toFixed(0)} ر.س
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart */}
      <StoreCart 
        primaryColor={primaryColor} 
        storeLocation={provider?.store_lat && provider?.store_lng ? { lat: provider.store_lat, lng: provider.store_lng } : null}
        deliveryRadiusKm={provider?.delivery_radius_km ?? 5}
      />
      
      {/* Reviews Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">تقييمات {provider.business_name}</h2>
              {user && providerId && (
                <ProviderReviewDialog 
                  providerId={providerId} 
                  providerName={provider.business_name} 
                />
              )}
            </div>
            {providerId && <ProviderReviewsList providerId={providerId} />}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Floating Review Button */}
      {user && providerId && (
        <div className="fixed bottom-24 left-4 z-40">
          <ProviderReviewDialog 
            providerId={providerId} 
            providerName={provider.business_name}
            trigger={
              <Button
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                <Star className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
  onClick: () => void;
  primaryColor: string;
  accentColor: string;
}

const ProductCard = ({ product, onAddToCart, onClick, primaryColor, accentColor }: ProductCardProps) => {
  return (
    <div
      className="flex gap-3 p-3 bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name_ar}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Coffee className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
        {product.is_featured && (
          <div 
            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <Star className="h-3 w-3 fill-white text-white" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          <h4 className="font-bold text-sm line-clamp-1">{product.name_ar}</h4>
          {product.description_ar && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {product.description_ar}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span 
            className="font-bold text-base"
            style={{ color: primaryColor }}
          >
            {Number(product.price).toFixed(0)} ر.س
          </span>
          <Button
            size="sm"
            className="h-7 px-3 rounded-full text-xs gap-1"
            style={{ backgroundColor: primaryColor }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
          >
            <Plus className="h-3 w-3" />
            أضف
          </Button>
        </div>
      </div>
    </div>
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
