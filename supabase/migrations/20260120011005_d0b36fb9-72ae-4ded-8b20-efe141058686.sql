-- Create provider_invoice_settings table for each provider's invoice customization
CREATE TABLE public.provider_invoice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  logo_url TEXT,
  business_name TEXT,
  business_name_en TEXT,
  slogan TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  vat_number TEXT,
  cr_number TEXT,
  footer_text TEXT,
  show_vat_number BOOLEAN DEFAULT true,
  show_qr_code BOOLEAN DEFAULT true,
  primary_color TEXT DEFAULT '#1B4332',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- Enable RLS
ALTER TABLE public.provider_invoice_settings ENABLE ROW LEVEL SECURITY;

-- Providers can view their own invoice settings
CREATE POLICY "Providers can view own invoice settings"
  ON public.provider_invoice_settings
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

-- Providers can insert their own invoice settings
CREATE POLICY "Providers can insert own invoice settings"
  ON public.provider_invoice_settings
  FOR INSERT
  WITH CHECK (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

-- Providers can update their own invoice settings
CREATE POLICY "Providers can update own invoice settings"
  ON public.provider_invoice_settings
  FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

-- Admins can view all provider invoice settings
CREATE POLICY "Admins can view all provider invoice settings"
  ON public.provider_invoice_settings
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at
CREATE TRIGGER update_provider_invoice_settings_updated_at
  BEFORE UPDATE ON public.provider_invoice_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();