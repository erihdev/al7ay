-- Create service_providers table for approved providers
CREATE TABLE public.service_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    application_id uuid REFERENCES public.service_provider_applications(id),
    business_name text NOT NULL,
    business_name_en text,
    logo_url text,
    description text,
    phone text,
    email text NOT NULL,
    neighborhood_id uuid REFERENCES public.active_neighborhoods(id),
    is_active boolean NOT NULL DEFAULT true,
    is_verified boolean NOT NULL DEFAULT false,
    store_settings jsonb DEFAULT '{"primary_color": "#1B4332", "accent_color": "#D4AF37"}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Policies for service_providers
CREATE POLICY "Providers can view their own data"
ON public.service_providers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Providers can update their own data"
ON public.service_providers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active providers"
ON public.service_providers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all providers"
ON public.service_providers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add provider_id to products table
ALTER TABLE public.products ADD COLUMN provider_id uuid REFERENCES public.service_providers(id);

-- Add provider_id to orders table  
ALTER TABLE public.orders ADD COLUMN provider_id uuid REFERENCES public.service_providers(id);

-- Create provider_products table for provider-specific products
CREATE TABLE public.provider_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    name_ar text NOT NULL,
    name_en text,
    description_ar text,
    price numeric NOT NULL,
    image_url text,
    category text NOT NULL DEFAULT 'other',
    is_available boolean NOT NULL DEFAULT true,
    is_featured boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on provider_products
ALTER TABLE public.provider_products ENABLE ROW LEVEL SECURITY;

-- Policies for provider_products
CREATE POLICY "Providers can manage their own products"
ON public.provider_products
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_providers
        WHERE service_providers.id = provider_products.provider_id
        AND service_providers.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view available provider products"
ON public.provider_products
FOR SELECT
USING (is_available = true);

CREATE POLICY "Admins can manage all provider products"
ON public.provider_products
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create provider_orders table
CREATE TABLE public.provider_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES auth.users(id),
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text,
    order_type text NOT NULL DEFAULT 'pickup',
    delivery_address text,
    delivery_lat double precision,
    delivery_lng double precision,
    status text NOT NULL DEFAULT 'pending',
    total_amount numeric NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on provider_orders
ALTER TABLE public.provider_orders ENABLE ROW LEVEL SECURITY;

-- Policies for provider_orders
CREATE POLICY "Providers can view their own orders"
ON public.provider_orders
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_providers
        WHERE service_providers.id = provider_orders.provider_id
        AND service_providers.user_id = auth.uid()
    )
);

CREATE POLICY "Providers can update their own orders"
ON public.provider_orders
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_providers
        WHERE service_providers.id = provider_orders.provider_id
        AND service_providers.user_id = auth.uid()
    )
);

CREATE POLICY "Customers can view their own orders"
ON public.provider_orders
FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders"
ON public.provider_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all provider orders"
ON public.provider_orders
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON public.service_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_products_updated_at
    BEFORE UPDATE ON public.provider_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_orders_updated_at
    BEFORE UPDATE ON public.provider_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();