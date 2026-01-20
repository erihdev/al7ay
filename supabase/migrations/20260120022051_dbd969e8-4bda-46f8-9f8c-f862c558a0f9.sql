-- Add hierarchical location structure to active_neighborhoods
ALTER TABLE public.active_neighborhoods 
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS governorate TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.active_neighborhoods.region IS 'المنطقة الإدارية (13 منطقة في السعودية)';
COMMENT ON COLUMN public.active_neighborhoods.governorate IS 'المحافظة التابعة للمنطقة';
COMMENT ON COLUMN public.active_neighborhoods.city IS 'المدينة أو القرية';
COMMENT ON COLUMN public.active_neighborhoods.name IS 'اسم الحي';