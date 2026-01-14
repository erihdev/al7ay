import { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

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
  const { addItem } = useProviderCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

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

  // Get unique categories
  const categories = products 
    ? ['all', ...new Set(products.map(p => p.category))]
    : ['all'];

  // Filter products by category
  const filteredProducts = products?.filter(p => 
    selectedCategory === 'all' || p.category === selectedCategory
  ) || [];

  // Get store settings with defaults
  const storeSettings = provider?.store_settings as { primary_color?: string; accent_color?: string } || {};
  const primaryColor = storeSettings.primary_color || '#1B4332';
  const accentColor = storeSettings.accent_color || '#D4AF37';

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'all': 'الكل',
      'coffee': 'القهوة',
      'sweets': 'الحلويات',
      'cold_drinks': 'المشروبات الباردة',
      'other': 'أخرى'
    };
    return labels[category] || category;
  };

  const handleAddToCart = (product: Product) => {
    if (!provider) return;
    
    addItem({
      productId: product.id,
      productName: product.name_ar,
      price: product.price,
      quantity: quantity,
      imageUrl: product.image_url
    }, provider.id, provider.business_name);
    
    toast.success('تمت الإضافة للسلة');
    setSelectedProduct(null);
    setQuantity(1);
  };

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-background font-arabic" dir="rtl">
        <Skeleton className="h-64 w-full" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background font-arabic flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
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
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      {/* Header with store branding */}
      <header 
        className="relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
        }}
      >
        {/* Back button and theme toggle */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <Link to="/">
            <Button variant="secondary" size="sm" className="font-arabic shadow-lg">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        {/* Store Info */}
        <div className="container mx-auto px-4 pt-20 pb-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Logo */}
            <div 
              className="w-28 h-28 rounded-2xl bg-white shadow-2xl flex items-center justify-center overflow-hidden border-4"
              style={{ borderColor: accentColor }}
            >
              {provider.logo_url ? (
                <img 
                  src={provider.logo_url} 
                  alt={provider.business_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            {/* Store Details */}
            <div className="text-center md:text-right flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {provider.business_name}
              </h1>
              {provider.business_name_en && (
                <p className="text-white/80 text-lg mb-3" dir="ltr">
                  {provider.business_name_en}
                </p>
              )}
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-white/90">
                {provider.active_neighborhoods && (
                  <Badge 
                    variant="secondary" 
                    className="text-sm font-normal"
                    style={{ backgroundColor: accentColor, color: 'white' }}
                  >
                    <MapPin className="h-3 w-3 ml-1" />
                    {(provider.active_neighborhoods as any).name}، {(provider.active_neighborhoods as any).city}
                  </Badge>
                )}
                {provider.is_verified && (
                  <Badge variant="secondary" className="text-sm">
                    <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                    موثّق
                  </Badge>
                )}
              </div>

              {provider.description && (
                <p className="text-white/80 mt-4 max-w-2xl">
                  {provider.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </header>

      {/* Contact Info Bar */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {provider.phone && (
              <a href={`tel:${provider.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                <span dir="ltr">{provider.phone}</span>
              </a>
            )}
            {provider.email && (
              <a href={`mailto:${provider.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                <span dir="ltr">{provider.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Category Filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="font-arabic"
                style={selectedCategory === category ? { backgroundColor: primaryColor } : {}}
              >
                {getCategoryLabel(category)}
              </Button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'all' 
                  ? 'لم يقم صاحب المتجر بإضافة منتجات بعد'
                  : 'لا توجد منتجات في هذا التصنيف'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Product Image */}
                <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name_ar}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Featured Badge */}
                  {product.is_featured && (
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
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{product.name_ar}</h3>
                      {product.name_en && (
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {product.name_en}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </div>

                  {product.description_ar && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description_ar}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span 
                      className="text-xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      {Number(product.price).toFixed(0)} ر.س
                    </span>
                    <Button 
                      size="sm"
                      style={{ backgroundColor: primaryColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                    >
                      <ShoppingBag className="h-4 w-4 ml-2" />
                      أضف للسلة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Product Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => { setSelectedProduct(null); setQuantity(1); }}>
        <DialogContent dir="rtl" className="font-arabic max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="font-arabic">{selectedProduct.name_ar}</DialogTitle>
              </DialogHeader>
              
              {selectedProduct.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name_ar}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {selectedProduct.description_ar && (
                <p className="text-muted-foreground">{selectedProduct.description_ar}</p>
              )}

              <div className="flex items-center justify-between py-2">
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {Number(selectedProduct.price).toFixed(0)} ر.س
                </span>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full font-arabic"
                style={{ backgroundColor: primaryColor }}
                onClick={() => handleAddToCart(selectedProduct)}
              >
                <ShoppingBag className="h-4 w-4 ml-2" />
                إضافة للسلة - {(Number(selectedProduct.price) * quantity).toFixed(0)} ر.س
              </Button>

              {/* Reviews Section */}
              <div className="border-t pt-4">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  التقييمات والمراجعات
                </h3>
                <ProductReviews productId={selectedProduct.id} primaryColor={primaryColor} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart */}
      <StoreCart primaryColor={primaryColor} />

      {/* Footer */}
      <footer className="bg-muted py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logo} alt="الحي" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-primary">منصة الحي</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 منصة الحي. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
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
