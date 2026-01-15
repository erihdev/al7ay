-- Add encrypted EdfaPay credentials columns to service_providers table
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS edfapay_merchant_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS edfapay_credentials_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edfapay_verified_at TIMESTAMP WITH TIME ZONE;