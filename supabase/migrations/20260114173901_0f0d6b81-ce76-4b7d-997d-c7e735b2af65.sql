-- Create delivery_tracking table for real-time location updates
CREATE TABLE public.delivery_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    current_lat DOUBLE PRECISION NOT NULL,
    current_lng DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0,
    speed DOUBLE PRECISION DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for delivery_tracking
CREATE POLICY "Admins can manage delivery tracking"
ON public.delivery_tracking
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view tracking for their orders"
ON public.delivery_tracking
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = delivery_tracking.order_id
        AND orders.customer_id = auth.uid()
    )
);

-- Enable realtime for delivery_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;