import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductSearch } from '@/components/menu/ProductSearch';
import { FeaturedProducts } from '@/components/menu/FeaturedProducts';
import { SpecialOffersCarousel } from '@/components/offers/SpecialOffersCarousel';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { LocationPermission } from '@/components/location/LocationPermission';
import { FloatingParticles } from '@/components/ui/InteractiveBackground';
import { PageTransition, staggerContainer, fadeInUp } from '@/components/ui/PageTransition';
import { ProductGridSkeleton } from '@/components/ui/CardSkeleton';
import { useProducts } from '@/hooks/useProducts';
import { useOrderStatusNotifications } from '@/hooks/useOrderStatusNotifications';
import { Coffee, Sparkles, ShoppingBag, TrendingUp } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProductCategory = Database['public']['Enums']['product_category'];
type Product = Database['public']['Tables']['products']['Row'];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { data: allProducts, isLoading } = useProducts();
  
  // Enable order status notifications for logged-in customers
  useOrderStatusNotifications();

  const handleFilteredProducts = useCallback((products: Product[]) => {
    setFilteredProducts(products);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
        <FloatingParticles count={12} />
        <Header />
        
        <main className="container mx-auto px-4 pb-24 pt-4 space-y-6">
          {/* Welcome Section */}
          <motion.div 
            variants={fadeInUp}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/20 p-3 rounded-2xl">
                  <Coffee className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">مرحباً بك! ☕</h1>
                  <p className="text-sm text-muted-foreground">اختر مشروبك المفضل</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 text-center">
                  <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">منتجات</p>
                  <p className="font-bold text-sm">{allProducts?.length || 0}</p>
                </div>
                <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 text-center">
                  <Sparkles className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-xs text-muted-foreground">مميز</p>
                  <p className="font-bold text-sm">{allProducts?.filter(p => p.is_featured).length || 0}</p>
                </div>
                <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-muted-foreground">أصناف</p>
                  <p className="font-bold text-sm">3</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location Permission */}
          <motion.div variants={fadeInUp}>
            <LocationPermission />
          </motion.div>

          {/* Loyalty Card */}
          <motion.div variants={fadeInUp}>
            <LoyaltyCard />
          </motion.div>

          {/* Special Offers */}
          <motion.div variants={fadeInUp}>
            <SpecialOffersCarousel />
          </motion.div>

          {/* Featured Products */}
          <motion.div variants={fadeInUp}>
            <FeaturedProducts />
          </motion.div>

          {/* Browse Menu Section */}
          <motion.div 
            className="space-y-4"
            variants={fadeInUp}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-arabic">تصفح القائمة</h2>
                  <p className="text-xs text-muted-foreground">{filteredProducts.length} منتج</p>
                </div>
              </div>
            </div>
            
            {/* Search */}
            <ProductSearch
              products={allProducts}
              onFilteredProducts={handleFilteredProducts}
              category={activeCategory}
            />
            
            {/* Category Tabs */}
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </motion.div>

          {/* Product Grid */}
          {isLoading ? (
            <ProductGridSkeleton count={6} />
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-muted to-muted/50 rounded-full p-6">
                  <Coffee className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <p className="text-muted-foreground font-arabic text-lg">لا توجد نتائج</p>
              <p className="text-sm text-muted-foreground/70 mt-1">جرب البحث بكلمات مختلفة</p>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={fadeInUp}
                  custom={index}
                  className="transform-gpu"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Bottom Padding for scroll */}
          <div className="h-4" />
        </main>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default Index;
