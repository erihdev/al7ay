-- Create delivery tracking table for provider orders
CREATE TABLE public.provider_delivery_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.provider_orders(id) ON DELETE CASCADE,
    current_lat DOUBLE PRECISION NOT NULL,
    current_lng DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0,
    speed DOUBLE PRECISION DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(order_id)
);

-- Create route history table for provider deliveries
CREATE TABLE public.provider_delivery_route_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.provider_orders(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_delivery_route_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for provider_delivery_tracking
-- Providers can manage tracking for their own orders
CREATE POLICY "Providers can insert tracking for their orders"
ON public.provider_delivery_tracking
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.provider_orders po
        JOIN public.service_providers sp ON po.provider_id = sp.id
        WHERE po.id = order_id AND sp.user_id = auth.uid()
    )
);

CREATE POLICY "Providers can update tracking for their orders"
ON public.provider_delivery_tracking
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.provider_orders po
        JOIN public.service_providers sp ON po.provider_id = sp.id
        WHERE po.id = order_id AND sp.user_id = auth.uid()
    )
);

-- Customers can view tracking for their orders
CREATE POLICY "Customers can view tracking for their orders"
ON public.provider_delivery_tracking
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.provider_orders po
        WHERE po.id = order_id AND po.customer_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.provider_orders po
        JOIN public.service_providers sp ON po.provider_id = sp.id
        WHERE po.id = order_id AND sp.user_id = auth.uid()
    )
);

-- RLS policies for provider_delivery_route_history
CREATE POLICY "Providers can insert route history for their orders"
ON public.provider_delivery_route_history
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.provider_orders po
        JOIN public.service_providers sp ON po.provider_id = sp.id
        WHERE po.id = order_id AND sp.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view route history for their orders"
ON public.provider_delivery_route_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.provider_orders po
        WHERE po.id = order_id AND po.customer_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.provider_orders po
        JOIN public.service_providers sp ON po.provider_id = sp.id
        WHERE po.id = order_id AND sp.user_id = auth.uid()
    )
);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_delivery_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_delivery_route_history;

-- Create indexes for better performance
CREATE INDEX idx_provider_delivery_tracking_order_id ON public.provider_delivery_tracking(order_id);
CREATE INDEX idx_provider_delivery_route_history_order_id ON public.provider_delivery_route_history(order_id);
CREATE INDEX idx_provider_delivery_route_history_recorded_at ON public.provider_delivery_route_history(recorded_at);