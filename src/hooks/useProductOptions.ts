import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductOption {
  id: string;
  name_ar: string;
  name_en: string | null;
  is_required: boolean;
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  name_ar: string;
  name_en: string | null;
  price_modifier: number;
  sort_order: number;
}

export interface SelectedOption {
  option_id: string;
  option_name: string;
  value_id: string;
  value_name: string;
  price_modifier: number;
}

export function useProductOptions(productId?: string) {
  return useQuery({
    queryKey: ['product-options', productId],
    queryFn: async () => {
      if (!productId) return [];

      // Get linked options for this product
      const { data: links, error: linksError } = await supabase
        .from('product_options_link')
        .select('option_id')
        .eq('product_id', productId);

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        // If no specific links, get all options (for products without specific config)
        const { data: allOptions, error: allOptionsError } = await supabase
          .from('product_options')
          .select('*');

        if (allOptionsError) throw allOptionsError;

        const optionIds = allOptions?.map(o => o.id) || [];
        
        const { data: values, error: valuesError } = await supabase
          .from('product_option_values')
          .select('*')
          .in('option_id', optionIds)
          .order('sort_order');

        if (valuesError) throw valuesError;

        return allOptions?.map(option => ({
          ...option,
          values: values?.filter(v => v.option_id === option.id) || []
        })) || [];
      }

      const optionIds = links.map(l => l.option_id);

      const { data: options, error: optionsError } = await supabase
        .from('product_options')
        .select('*')
        .in('id', optionIds);

      if (optionsError) throw optionsError;

      const { data: values, error: valuesError } = await supabase
        .from('product_option_values')
        .select('*')
        .in('option_id', optionIds)
        .order('sort_order');

      if (valuesError) throw valuesError;

      return options?.map(option => ({
        ...option,
        values: values?.filter(v => v.option_id === option.id) || []
      })) || [];
    },
    enabled: !!productId,
  });
}

export function useAllProductOptions() {
  return useQuery({
    queryKey: ['all-product-options'],
    queryFn: async () => {
      const { data: options, error: optionsError } = await supabase
        .from('product_options')
        .select('*');

      if (optionsError) throw optionsError;

      const { data: values, error: valuesError } = await supabase
        .from('product_option_values')
        .select('*')
        .order('sort_order');

      if (valuesError) throw valuesError;

      return options?.map(option => ({
        ...option,
        values: values?.filter(v => v.option_id === option.id) || []
      })) || [];
    },
  });
}
