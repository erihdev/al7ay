-- Add signing token to contracts
ALTER TABLE public.employee_contracts 
ADD COLUMN signing_token TEXT UNIQUE,
ADD COLUMN signing_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for token lookup
CREATE INDEX idx_employee_contracts_signing_token ON public.employee_contracts(signing_token);

-- RLS policy for employees to view and sign their own contracts via token
CREATE POLICY "Employees can view their contracts via token"
ON public.employee_contracts
FOR SELECT
TO anon
USING (
    signing_token IS NOT NULL 
    AND signing_token_expires_at > now()
);

CREATE POLICY "Employees can sign their contracts via token"
ON public.employee_contracts
FOR UPDATE
TO anon
USING (
    signing_token IS NOT NULL 
    AND signing_token_expires_at > now()
)
WITH CHECK (
    signing_token IS NOT NULL 
    AND signing_token_expires_at > now()
);