import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductCategory = Database['public']['Enums']['product_category'];

interface ProductSearchProps {
  products: Product[] | undefined;
  onFilteredProducts: (products: Product[]) => void;
  category: ProductCategory | 'all';
}

export function ProductSearch({ products, onFilteredProducts, category }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Filter by category
    if (category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name_ar.toLowerCase().includes(query) ||
          (p.name_en && p.name_en.toLowerCase().includes(query)) ||
          (p.description_ar && p.description_ar.toLowerCase().includes(query))
      );
    }

    return result;
  }, [products, category, searchQuery]);

  // Update parent with filtered results
  useMemo(() => {
    onFilteredProducts(filteredProducts);
  }, [filteredProducts, onFilteredProducts]);

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="ابحث عن منتج..."
        className="pr-10 pl-10"
        dir="rtl"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
