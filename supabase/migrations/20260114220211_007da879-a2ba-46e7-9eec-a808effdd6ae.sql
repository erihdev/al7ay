-- Create active neighborhoods table
CREATE TABLE public.active_neighborhoods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    city text NOT NULL DEFAULT 'الرياض',
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    provider_count integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active neighborhoods
CREATE POLICY "Anyone can view active neighborhoods"
ON public.active_neighborhoods
FOR SELECT
USING (is_active = true);

-- Admins can manage neighborhoods
CREATE POLICY "Admins can manage neighborhoods"
ON public.active_neighborhoods
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add role enum value for service_provider if not exists
DO $$ BEGIN
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'service_provider';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trigger for updated_at
CREATE TRIGGER update_active_neighborhoods_updated_at
    BEFORE UPDATE ON public.active_neighborhoods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample neighborhoods
INSERT INTO public.active_neighborhoods (name, city, lat, lng, provider_count) VALUES
('حي النرجس', 'الرياض', 24.8234, 46.6388, 3),
('حي الياسمين', 'الرياض', 24.8456, 46.6234, 5),
('حي الملقا', 'الرياض', 24.8123, 46.6567, 2),
('حي العليا', 'الرياض', 24.7234, 46.6789, 8),
('حي السليمانية', 'الرياض', 24.6987, 46.7012, 4);