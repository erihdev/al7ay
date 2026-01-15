-- Add verification fields to service_providers table
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS freelance_certificate_url text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS iban text,
ADD COLUMN IF NOT EXISTS national_address text,
ADD COLUMN IF NOT EXISTS is_payment_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10;

-- Add comment for clarity
COMMENT ON COLUMN public.service_providers.freelance_certificate_url IS 'URL to uploaded freelance work certificate';
COMMENT ON COLUMN public.service_providers.iban IS 'International Bank Account Number for payouts';
COMMENT ON COLUMN public.service_providers.national_address IS 'Saudi National Address for verification';
COMMENT ON COLUMN public.service_providers.is_payment_verified IS 'Whether payment info has been verified by admin';
COMMENT ON COLUMN public.service_providers.commission_rate IS 'Platform commission percentage on orders';