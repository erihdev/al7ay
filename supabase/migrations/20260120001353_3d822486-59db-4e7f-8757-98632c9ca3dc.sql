-- Create table for provider contracts/agreements
CREATE TABLE public.provider_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
    contract_type TEXT NOT NULL DEFAULT 'edfapay_gateway',
    contract_number TEXT,
    
    -- Merchant info from contract
    merchant_name TEXT NOT NULL,
    merchant_id_number TEXT,
    merchant_email TEXT,
    merchant_phone TEXT,
    
    -- Entity info
    entity_type TEXT,
    cr_flc_number TEXT,
    entity_activities TEXT,
    national_address TEXT,
    vat_number TEXT,
    
    -- Bank info
    beneficiary_name TEXT,
    bank_name TEXT,
    iban TEXT,
    
    -- Fee structure from contract
    setup_fees NUMERIC DEFAULT 0,
    monthly_fees NUMERIC DEFAULT 0,
    transaction_fees_percent NUMERIC,
    visa_mc_fees TEXT,
    apple_google_pay_fees TEXT,
    settlement_fees NUMERIC,
    vat_percent NUMERIC DEFAULT 15,
    
    -- Contract dates
    contract_date DATE,
    start_date DATE,
    end_date DATE,
    duration_months INTEGER DEFAULT 12,
    auto_renew BOOLEAN DEFAULT true,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
    
    -- Document storage
    contract_file_url TEXT,
    
    -- Additional notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_contracts ENABLE ROW LEVEL SECURITY;

-- Admin can view all contracts
CREATE POLICY "Admins can view all contracts"
ON public.provider_contracts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage contracts
CREATE POLICY "Admins can manage contracts"
ON public.provider_contracts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Providers can view their own contracts
CREATE POLICY "Providers can view own contracts"
ON public.provider_contracts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_providers sp
        WHERE sp.id = provider_contracts.provider_id
        AND sp.user_id = auth.uid()
    )
);

-- Add trigger for updated_at
CREATE TRIGGER update_provider_contracts_updated_at
BEFORE UPDATE ON public.provider_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();