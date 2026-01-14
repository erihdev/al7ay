
-- Product options (e.g., size, milk type)
CREATE TABLE public.product_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Option values (e.g., small/medium/large, regular/oat/almond milk)
CREATE TABLE public.product_option_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link products to options
CREATE TABLE public.product_options_link (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
  UNIQUE(product_id, option_id)
);

-- Store selected options in order items
ALTER TABLE public.order_items ADD COLUMN selected_options JSONB DEFAULT '[]'::jsonb;

-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coupon usage tracking
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add coupon reference to orders
ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN coupon_discount NUMERIC DEFAULT 0;

-- RLS for product_options
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product options" ON public.product_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage product options" ON public.product_options FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for product_option_values
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view option values" ON public.product_option_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage option values" ON public.product_option_values FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for product_options_link
ALTER TABLE public.product_options_link ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product options link" ON public.product_options_link FOR SELECT USING (true);
CREATE POLICY "Admins can manage product options link" ON public.product_options_link FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their coupon usage" ON public.coupon_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert coupon usage" ON public.coupon_usage FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default options
INSERT INTO public.product_options (id, name_ar, name_en, is_required) VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'حجم الكوب', 'Cup Size', true),
  ('a2222222-2222-2222-2222-222222222222', 'نوع الحليب', 'Milk Type', false);

-- Insert option values
INSERT INTO public.product_option_values (option_id, name_ar, name_en, price_modifier, sort_order) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'صغير', 'Small', 0, 1),
  ('a1111111-1111-1111-1111-111111111111', 'وسط', 'Medium', 3, 2),
  ('a1111111-1111-1111-1111-111111111111', 'كبير', 'Large', 6, 3),
  ('a2222222-2222-2222-2222-222222222222', 'حليب عادي', 'Regular Milk', 0, 1),
  ('a2222222-2222-2222-2222-222222222222', 'حليب شوفان', 'Oat Milk', 4, 2),
  ('a2222222-2222-2222-2222-222222222222', 'حليب لوز', 'Almond Milk', 4, 3),
  ('a2222222-2222-2222-2222-222222222222', 'بدون حليب', 'No Milk', 0, 4);
