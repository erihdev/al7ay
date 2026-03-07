import { Json } from '@/integrations/supabase/types';

export interface SelectedOption {
  option_id: string;
  option_name: string;
  value_id: string;
  value_name: string;
  price_modifier: number;
  [key: string]: Json | undefined;
}

export interface CartItem {
  id: string;
  name_ar: string;
  price: number;
  quantity: number;
  image_url?: string;
  selected_options?: SelectedOption[];
}
