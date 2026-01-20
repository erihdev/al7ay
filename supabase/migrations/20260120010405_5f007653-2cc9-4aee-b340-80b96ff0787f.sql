-- Create pending_orders table to store order data before payment
CREATE TABLE public.pending_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.service_providers(id),
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  order_type TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  notes TEXT,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'online',
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Enable RLS
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for checkout)
CREATE POLICY "Anyone can create pending orders"
  ON public.pending_orders
  FOR INSERT
  WITH CHECK (true);

-- Allow reading own pending orders
CREATE POLICY "Users can view their pending orders"
  ON public.pending_orders
  FOR SELECT
  USING (customer_id = auth.uid() OR customer_id IS NULL);

-- Allow service role to delete (after processing)
CREATE POLICY "Service role can delete pending orders"
  ON public.pending_orders
  FOR DELETE
  USING (true);

-- Add index for cleanup
CREATE INDEX idx_pending_orders_expires_at ON public.pending_orders(expires_at);