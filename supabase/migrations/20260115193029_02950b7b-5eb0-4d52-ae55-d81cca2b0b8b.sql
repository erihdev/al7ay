-- Add direct store location coordinates to service_providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS store_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS store_lng DOUBLE PRECISION;

-- Add comment for documentation
COMMENT ON COLUMN public.service_providers.store_lat IS 'Store latitude coordinate';
COMMENT ON COLUMN public.service_providers.store_lng IS 'Store longitude coordinate';