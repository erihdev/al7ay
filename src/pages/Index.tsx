import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductSearch } from '@/components/menu/ProductSearch';
import { FeaturedProducts } from '@/components/menu/FeaturedProducts';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { LocationPermission } from '@/components/location/LocationPermission';
import { Skeleton } from '@/components/ui/skeleton';
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
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 pb-24 pt-4 space-y-6">
        {/* Location Permission */}
        <LocationPermission />

        {/* Loyalty Card */}
        <LoyaltyCard />

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Search and Category */}
        <div className="space-y-4">
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
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-52 rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-arabic">لا توجد نتائج</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
