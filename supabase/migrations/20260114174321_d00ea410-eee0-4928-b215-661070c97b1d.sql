-- Create delivery_route_history table to store location history
CREATE TABLE public.delivery_route_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_delivery_route_history_order_id ON public.delivery_route_history(order_id);
CREATE INDEX idx_delivery_route_history_recorded_at ON public.delivery_route_history(order_id, recorded_at);

-- Enable RLS
ALTER TABLE public.delivery_route_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage route history"
ON public.delivery_route_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view route history for their orders"
ON public.delivery_route_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = delivery_route_history.order_id
        AND orders.customer_id = auth.uid()
    )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_route_history;