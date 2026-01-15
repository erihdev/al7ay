-- Add payment method and payout tracking fields to service_providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'platform_managed' CHECK (payment_method IN ('direct_gateway', 'platform_managed')),
ADD COLUMN IF NOT EXISTS gateway_account_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_approval_url TEXT,
ADD COLUMN IF NOT EXISTS payout_frequency TEXT DEFAULT 'weekly' CHECK (payout_frequency IN ('weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS last_payout_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pending_payout DECIMAL(10, 2) DEFAULT 0;

-- Create payouts table to track payment transfers
CREATE TABLE IF NOT EXISTS public.provider_payouts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,
    payout_method TEXT NOT NULL DEFAULT 'bank_transfer',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_reference TEXT,
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payouts table
ALTER TABLE public.provider_payouts ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage payouts
CREATE POLICY "Admins can manage payouts" ON public.provider_payouts
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Allow providers to view their own payouts
CREATE POLICY "Providers can view own payouts" ON public.provider_payouts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.service_providers sp
        WHERE sp.id = provider_payouts.provider_id
        AND sp.user_id = auth.uid()
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_provider_payouts_updated_at
    BEFORE UPDATE ON public.provider_payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();