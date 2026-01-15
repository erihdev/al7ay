-- Add delivery radius column to service_providers table
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS delivery_radius_km numeric DEFAULT 5;

-- Add comment for documentation
COMMENT ON COLUMN public.service_providers.delivery_radius_km IS 'Delivery radius in kilometers from the store location';