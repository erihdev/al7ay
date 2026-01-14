import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { ProductGrid } from '@/components/menu/ProductGrid';
import { FeaturedProducts } from '@/components/menu/FeaturedProducts';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { LocationPermission } from '@/components/location/LocationPermission';
import type { Database } from '@/integrations/supabase/types';

type ProductCategory = Database['public']['Enums']['product_category'];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');

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

        {/* Category Tabs */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-arabic">تصفح القائمة</h2>
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Product Grid */}
        <ProductGrid category={activeCategory} />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
