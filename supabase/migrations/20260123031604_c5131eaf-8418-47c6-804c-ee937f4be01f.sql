-- Add discount_percent column to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- Update existing yearly plan with 20% discount
UPDATE public.subscription_plans 
SET discount_percent = 20 
WHERE duration_days = 365;