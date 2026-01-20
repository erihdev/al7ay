-- Create loyalty and referral settings table
CREATE TABLE public.loyalty_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Tier settings
  bronze_min_points INTEGER NOT NULL DEFAULT 0,
  silver_min_points INTEGER NOT NULL DEFAULT 500,
  gold_min_points INTEGER NOT NULL DEFAULT 1500,
  bronze_discount INTEGER NOT NULL DEFAULT 0,
  silver_discount INTEGER NOT NULL DEFAULT 5,
  gold_discount INTEGER NOT NULL DEFAULT 10,
  bronze_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  silver_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.25,
  gold_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.5,
  -- Points settings
  points_per_riyal INTEGER NOT NULL DEFAULT 1,
  points_value_in_riyals DECIMAL(5,2) NOT NULL DEFAULT 0.1,
  -- Referral settings
  referrer_bonus_points INTEGER NOT NULL DEFAULT 50,
  referred_bonus_points INTEGER NOT NULL DEFAULT 25,
  referral_enabled BOOLEAN NOT NULL DEFAULT true,
  loyalty_enabled BOOLEAN NOT NULL DEFAULT true,
  -- Description texts
  program_description_ar TEXT,
  referral_description_ar TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (needed for customer-facing features)
CREATE POLICY "Anyone can read loyalty settings" 
ON public.loyalty_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update loyalty settings" 
ON public.loyalty_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default settings
INSERT INTO public.loyalty_settings (
  program_description_ar,
  referral_description_ar
) VALUES (
  'اكسب نقاط مع كل طلب واستمتع بخصومات حصرية! كلما زادت نقاطك، ارتفع مستواك وزادت مميزاتك.',
  'شارك كود الإحالة الخاص بك مع أصدقائك. عندما يسجلون ويطلبون، كلاكما يحصل على نقاط مكافأة!'
);

-- Create trigger for updated_at
CREATE TRIGGER update_loyalty_settings_updated_at
BEFORE UPDATE ON public.loyalty_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();