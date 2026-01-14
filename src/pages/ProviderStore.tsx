import { useState, useRef, useEffect } from 'react';
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
import { 
  ArrowRight, 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  ShoppingBag,
  Coffee,
  Package,
  Plus,
  Minus,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  IceCream,
  Cake,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['featured']));
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch provider data
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ['provider-store', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          active_neighborhoods (name, city)
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

  // Group products by category
  const productsByCategory = products?.reduce((acc, product) => {
    const category = product.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>) || {};

  // Get featured products
  const featuredProducts = products?.filter(p => p.is_featured) || [];

  // Auto-expand first category with products
  useEffect(() => {
    if (products && products.length > 0 && expandedCategories.size === 1) {
      const categories = Object.keys(productsByCategory);
      if (categories.length > 0) {
        setExpandedCategories(new Set(['featured', categories[0]]));
      }
    }
  }, [products]);

  // Get store settings with defaults
  const storeSettings = provider?.store_settings as { primary_color?: string; accent_color?: string } || {};
  const primaryColor = storeSettings.primary_color || '#1B4332';
  const accentColor = storeSettings.accent_color || '#D4AF37';

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'featured': 'المميز',
      'coffee': 'القهوة',
      'sweets': 'الحلويات',
      'cold_drinks': 'المشروبات الباردة',
      'other': 'أخرى'
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'featured': Sparkles,
      'coffee': Coffee,
      'sweets': Cake,
      'cold_drinks': IceCream,
      'other': Package
    };
    const Icon = icons[category] || Package;
    return <Icon className="h-5 w-5" />;
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
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

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <div className="sticky top-0 z-50 bg-background border-b">
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 font-arabic" dir="rtl">
      {/* Sticky Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-lg border-b"
        style={{ 
          backgroundColor: `${primaryColor}f0`,
        }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-2"
                style={{ borderColor: accentColor }}
              >
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
              <div>
                <h1 className="text-lg font-bold text-white">
                  {provider.business_name}
                </h1>
                {provider.active_neighborhoods && (
                  <p className="text-xs text-white/70 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {(provider.active_neighborhoods as any).name}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Compact */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}99 100%)`
        }}
      >
        <div className="px-4 py-6">
          {/* Provider Info */}
          <div className="text-center text-white">
            {provider.business_name_en && (
              <p className="text-white/80 text-sm mb-2" dir="ltr">
                {provider.business_name_en}
              </p>
            )}
            {provider.description && (
              <p className="text-sm text-white/70 max-w-md mx-auto">
                {provider.description}
              </p>
            )}
            
            {/* Quick Info */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              {provider.is_verified && (
                <Badge 
                  className="text-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  <Star className="h-3 w-3 ml-1 fill-white" />
                  موثّق
                </Badge>
              )}
              {provider.phone && (
                <a 
                  href={`tel:${provider.phone}`} 
                  className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
              {provider.email && (
                <a 
                  href={`mailto:${provider.email}`} 
                  className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32.5C840 35 960 40 1080 42.5C1200 45 1320 45 1380 45L1440 45V60H0Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </div>

      {/* Menu Content */}
      <main className="px-4 py-6 pb-32">
        {productsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground">
                لم يقم صاحب المتجر بإضافة منتجات بعد
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Featured Section */}
            {featuredProducts.length > 0 && (
              <CategorySection
                category="featured"
                label={getCategoryLabel('featured')}
                icon={getCategoryIcon('featured')}
                products={featuredProducts}
                isExpanded={expandedCategories.has('featured')}
                onToggle={() => toggleCategory('featured')}
                onAddToCart={handleAddToCart}
                onProductClick={setSelectedProduct}
                primaryColor={primaryColor}
                accentColor={accentColor}
                ref={(el) => { categoryRefs.current['featured'] = el; }}
              />
            )}

            {/* Category Sections */}
            {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <CategorySection
                key={category}
                category={category}
                label={getCategoryLabel(category)}
                icon={getCategoryIcon(category)}
                products={categoryProducts}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
                onAddToCart={handleAddToCart}
                onProductClick={setSelectedProduct}
                primaryColor={primaryColor}
                accentColor={accentColor}
                ref={(el) => { categoryRefs.current[category] = el; }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => { setSelectedProduct(null); setQuantity(1); }}>
        <DialogContent dir="rtl" className="font-arabic max-w-lg p-0 overflow-hidden">
          {selectedProduct && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Product Image */}
              <div className="relative aspect-video bg-muted">
                {selectedProduct.image_url ? (
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name_ar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Coffee className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => { setSelectedProduct(null); setQuantity(1); }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Product Info */}
              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedProduct.name_ar}</h2>
                    {selectedProduct.name_en && (
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {selectedProduct.name_en}
                      </p>
                    )}
                  </div>

                  {selectedProduct.description_ar && (
                    <p className="text-muted-foreground">{selectedProduct.description_ar}</p>
                  )}

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between py-3 border-y">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-xl w-10 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">السعر الإجمالي</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: primaryColor }}
                      >
                        {(Number(selectedProduct.price) * quantity).toFixed(0)} ر.س
                      </p>
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="pt-2">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      التقييمات والمراجعات
                    </h3>
                    <ProductReviews productId={selectedProduct.id} primaryColor={primaryColor} />
                  </div>
                </div>
              </ScrollArea>

              {/* Add to Cart Button */}
              <div className="p-4 border-t bg-background">
                <Button 
                  className="w-full h-12 text-base font-bold rounded-xl"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => handleAddToCart(selectedProduct, quantity)}
                >
                  <ShoppingBag className="h-5 w-5 ml-2" />
                  إضافة للسلة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart */}
      <StoreCart primaryColor={primaryColor} />
    </div>
  );
};

// Category Section Component
interface CategorySectionProps {
  category: string;
  label: string;
  icon: React.ReactNode;
  products: Product[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onProductClick: (product: Product) => void;
  primaryColor: string;
  accentColor: string;
}

const CategorySection = React.forwardRef<HTMLDivElement, CategorySectionProps>(
  ({ category, label, icon, products, isExpanded, onToggle, onAddToCart, onProductClick, primaryColor, accentColor }, ref) => {
    return (
      <div ref={ref} className="overflow-hidden">
        {/* Category Header */}
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300",
            isExpanded 
              ? "bg-card shadow-lg" 
              : "bg-card/50 hover:bg-card shadow"
          )}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {icon}
            </div>
            <div className="text-right">
              <h3 className="font-bold text-lg">{label}</h3>
              <p className="text-xs text-muted-foreground">
                {products.length} منتج
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Products List */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-3">
              {products.map((product) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onClick={() => onProductClick(product)}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CategorySection.displayName = 'CategorySection';

// Product Item Component
interface ProductItemProps {
  product: Product;
  onAddToCart: (product: Product, qty?: number) => void;
  onClick: () => void;
  primaryColor: string;
  accentColor: string;
}

const ProductItem = ({ product, onAddToCart, onClick, primaryColor, accentColor }: ProductItemProps) => {
  return (
    <div
      className="flex gap-4 p-3 bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name_ar}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Coffee className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        {product.is_featured && (
          <Badge 
            className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5"
            style={{ backgroundColor: accentColor }}
          >
            <Star className="h-2.5 w-2.5 fill-white" />
          </Badge>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h4 className="font-bold text-base truncate">{product.name_ar}</h4>
          {product.name_en && (
            <p className="text-xs text-muted-foreground truncate" dir="ltr">
              {product.name_en}
            </p>
          )}
          {product.description_ar && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {product.description_ar}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span 
            className="font-bold text-lg"
            style={{ color: primaryColor }}
          >
            {Number(product.price).toFixed(0)} ر.س
          </span>
          <Button
            size="sm"
            className="h-8 px-3 rounded-full text-xs"
            style={{ backgroundColor: primaryColor }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
          >
            <Plus className="h-3.5 w-3.5 ml-1" />
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

// Add React import for forwardRef
import React from 'react';
