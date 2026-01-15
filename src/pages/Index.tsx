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

          {/* Search and Category */}
          <motion.div 
            className="space-y-4"
            variants={fadeInUp}
          >
            <h2 className="text-lg font-bold font-arabic">تصفح القائمة</h2>
            
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
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-muted-foreground font-arabic">لا توجد نتائج</p>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={fadeInUp}
                  custom={index}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default Index;
