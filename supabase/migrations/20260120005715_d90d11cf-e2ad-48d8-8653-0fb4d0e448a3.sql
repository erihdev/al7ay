-- Create invoice settings table
CREATE TABLE public.invoice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  business_name TEXT DEFAULT 'المتجر',
  business_name_en TEXT,
  slogan TEXT DEFAULT 'شكراً لتعاملكم معنا',
  address TEXT,
  phone TEXT,
  email TEXT,
  vat_number TEXT,
  cr_number TEXT,
  footer_text TEXT DEFAULT 'نتمنى لكم تجربة ممتعة',
  show_vat_number BOOLEAN DEFAULT false,
  show_qr_code BOOLEAN DEFAULT false,
  primary_color TEXT DEFAULT '#1B4332',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read invoice settings (needed for customer invoices)
CREATE POLICY "Invoice settings are publicly readable"
ON public.invoice_settings
FOR SELECT
USING (true);

-- Only admins can modify invoice settings
CREATE POLICY "Only admins can insert invoice settings"
ON public.invoice_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update invoice settings"
ON public.invoice_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.invoice_settings (
  business_name,
  slogan,
  footer_text
) VALUES (
  'الحي',
  'الحي يحيييك',
  'شكراً لتعاملكم معنا • نتمنى لكم تجربة ممتعة'
);

-- Add trigger for updated_at
CREATE TRIGGER update_invoice_settings_updated_at
BEFORE UPDATE ON public.invoice_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();