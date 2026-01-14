-- Create service provider applications table
CREATE TABLE public.service_provider_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    business_name text NOT NULL,
    neighborhood text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.service_provider_applications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can submit an application (no auth required for initial submission)
CREATE POLICY "Anyone can submit applications"
ON public.service_provider_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.service_provider_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
ON public.service_provider_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete applications
CREATE POLICY "Admins can delete applications"
ON public.service_provider_applications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_service_provider_applications_updated_at
    BEFORE UPDATE ON public.service_provider_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();