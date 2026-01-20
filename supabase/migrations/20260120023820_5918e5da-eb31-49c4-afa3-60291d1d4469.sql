-- Add sequential order_number to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- Add sequential order_number to provider_orders table
ALTER TABLE public.provider_orders 
ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- Create unique index for order numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_orders_order_number ON public.provider_orders(order_number);

-- Add comments
COMMENT ON COLUMN public.orders.order_number IS 'رقم الطلب المتسلسل للعرض';
COMMENT ON COLUMN public.provider_orders.order_number IS 'رقم الطلب المتسلسل للعرض';