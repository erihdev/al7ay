-- Add selected_options column to provider_order_items table
ALTER TABLE public.provider_order_items 
ADD COLUMN IF NOT EXISTS selected_options jsonb DEFAULT NULL;