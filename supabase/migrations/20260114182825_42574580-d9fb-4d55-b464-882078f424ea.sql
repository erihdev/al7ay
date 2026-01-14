-- Create special offers table for time-limited discounts
CREATE TABLE public.special_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  original_price DECIMAL(10,2) NOT NULL,
  offer_price DECIMAL(10,2) NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active offers
CREATE POLICY "Anyone can view active special offers"
ON public.special_offers
FOR SELECT
USING (is_active = true AND ends_at > now());

-- Admins can manage offers
CREATE POLICY "Admins can manage special offers"
ON public.special_offers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_special_offers_updated_at
BEFORE UPDATE ON public.special_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.special_offers;