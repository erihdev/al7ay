-- Create contact settings table
CREATE TABLE public.contact_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL DEFAULT 'support@alhaay.com',
  phone TEXT NOT NULL DEFAULT '+966 50 000 0000',
  whatsapp TEXT NOT NULL DEFAULT '966500000000',
  location TEXT NOT NULL DEFAULT 'المملكة العربية السعودية',
  working_hours TEXT NOT NULL DEFAULT 'السبت - الخميس: 9 ص - 9 م',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read contact settings
CREATE POLICY "Contact settings are viewable by everyone" 
ON public.contact_settings 
FOR SELECT 
USING (true);

-- Allow authenticated users to update (admin will be checked in app)
CREATE POLICY "Authenticated users can update contact settings" 
ON public.contact_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.contact_settings (email, phone, whatsapp, location, working_hours)
VALUES ('support@alhaay.com', '+966 50 000 0000', '966500000000', 'المملكة العربية السعودية', 'السبت - الخميس: 9 ص - 9 م');

-- Add trigger for updated_at
CREATE TRIGGER update_contact_settings_updated_at
BEFORE UPDATE ON public.contact_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();