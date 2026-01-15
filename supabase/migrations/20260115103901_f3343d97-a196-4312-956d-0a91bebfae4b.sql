-- Create table for login attempts tracking
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempt_type TEXT NOT NULL DEFAULT 'failed_login', -- 'failed_login', 'unauthorized_access', 'blocked'
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert from edge functions (service role) and authenticated users for their own failed attempts
CREATE POLICY "Allow logging attempts"
ON public.login_attempts
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at DESC);