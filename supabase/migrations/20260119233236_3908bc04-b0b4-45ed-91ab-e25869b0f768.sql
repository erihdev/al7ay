-- Create commission settings table
CREATE TABLE public.commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method TEXT NOT NULL UNIQUE,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for registration page)
CREATE POLICY "Anyone can view commission settings"
ON public.commission_settings
FOR SELECT
USING (true);

-- Allow admins to update
CREATE POLICY "Admins can update commission settings"
ON public.commission_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default values
INSERT INTO public.commission_settings (payment_method, commission_rate, description_ar) VALUES
('platform_managed', 15, 'عمولة المنصة عند إدارة المدفوعات'),
('direct_gateway', 10, 'عمولة المنصة عند الربط المباشر مع بوابة الدفع');

-- Add trigger for updated_at
CREATE TRIGGER update_commission_settings_updated_at
BEFORE UPDATE ON public.commission_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();