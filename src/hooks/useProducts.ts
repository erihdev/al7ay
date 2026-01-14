import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductCategory = Database['public']['Enums']['product_category'];

export function useProducts(category?: ProductCategory) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .eq('is_featured', true)
        .limit(6);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProductsByCategory() {
  return useQuery({
    queryKey: ['products', 'by-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by category
      const grouped: Record<ProductCategory, Product[]> = {
        coffee: [],
        sweets: [],
        cold_drinks: [],
      };

      data?.forEach((product) => {
        if (grouped[product.category]) {
          grouped[product.category].push(product);
        }
      });

      return grouped;
    },
  });
}
