-- Create table for suggested neighborhoods
CREATE TABLE public.suggested_neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  suggested_by_email TEXT NOT NULL,
  suggested_by_name TEXT NOT NULL,
  application_id UUID REFERENCES public.service_provider_applications(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggested_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit neighborhood suggestions"
ON public.suggested_neighborhoods
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all suggestions"
ON public.suggested_neighborhoods
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update suggestions"
ON public.suggested_neighborhoods
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete suggestions"
ON public.suggested_neighborhoods
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_suggested_neighborhoods_updated_at
BEFORE UPDATE ON public.suggested_neighborhoods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();