-- Add delivery scope setting to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS delivery_scope text DEFAULT 'neighborhood' CHECK (delivery_scope IN ('neighborhood', 'city'));

-- Add comment to explain the field
COMMENT ON COLUMN public.service_providers.delivery_scope IS 'neighborhood = accept orders only from same neighborhood, city = accept orders from all neighborhoods in same city';