-- Create provider product reviews table
CREATE TABLE public.provider_product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.provider_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.provider_product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.provider_product_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON public.provider_product_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.provider_product_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.provider_product_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_provider_product_reviews_updated_at
  BEFORE UPDATE ON public.provider_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create provider order items table
CREATE TABLE public.provider_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.provider_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.provider_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for order items
CREATE POLICY "Users can view their order items"
  ON public.provider_order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.provider_orders
    WHERE provider_orders.id = provider_order_items.order_id
    AND provider_orders.customer_id = auth.uid()
  ));

CREATE POLICY "Providers can view their order items"
  ON public.provider_order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.provider_orders
    JOIN public.service_providers ON service_providers.id = provider_orders.provider_id
    WHERE provider_orders.id = provider_order_items.order_id
    AND service_providers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items"
  ON public.provider_order_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.provider_orders
    WHERE provider_orders.id = provider_order_items.order_id
    AND provider_orders.customer_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all order items"
  ON public.provider_order_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for provider_orders to notify providers
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_orders;