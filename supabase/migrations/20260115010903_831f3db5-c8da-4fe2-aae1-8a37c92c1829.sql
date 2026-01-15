-- Subscription plans table for admin to manage pricing
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  description_ar text,
  description_en text,
  duration_days integer NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  is_trial boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  features jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Provider subscriptions table
CREATE TABLE public.provider_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  is_trial boolean NOT NULL DEFAULT false,
  payment_id uuid REFERENCES public.payments(id),
  auto_renew boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (provider_id, starts_at)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Provider subscriptions policies
CREATE POLICY "Admins can manage all subscriptions"
ON public.provider_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers can view their own subscriptions"
ON public.provider_subscriptions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.service_providers 
  WHERE service_providers.id = provider_subscriptions.provider_id 
  AND service_providers.user_id = auth.uid()
));

CREATE POLICY "Providers can insert their own subscriptions"
ON public.provider_subscriptions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.service_providers 
  WHERE service_providers.id = provider_subscriptions.provider_id 
  AND service_providers.user_id = auth.uid()
));

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_subscriptions;

-- Insert default plans
INSERT INTO public.subscription_plans (name_ar, name_en, description_ar, description_en, duration_days, price, is_trial, sort_order, features)
VALUES 
  ('تجربة مجانية', 'Free Trial', 'جرّب المنصة مجاناً لمدة 7 أيام', 'Try the platform free for 7 days', 7, 0, true, 1, '["إدارة المنتجات", "استقبال الطلبات", "لوحة إحصائيات", "دعم فني"]'::jsonb),
  ('اشتراك شهري', 'Monthly', 'اشتراك شهري مع جميع المميزات', 'Monthly subscription with all features', 30, 99, false, 2, '["جميع المميزات", "إدارة غير محدودة للمنتجات", "تقارير متقدمة", "دعم فني على مدار الساعة", "إشعارات فورية"]'::jsonb),
  ('اشتراك سنوي', 'Yearly', 'اشتراك سنوي بخصم 20%', 'Yearly subscription with 20% discount', 365, 950, false, 3, '["جميع مميزات الاشتراك الشهري", "خصم 20%", "أولوية في الدعم الفني", "تحليلات متقدمة"]'::jsonb);

-- Add subscription_status to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none', 'trial', 'active', 'expired'));

-- Create trigger to update updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_subscriptions_updated_at
BEFORE UPDATE ON public.provider_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update service_providers RLS to allow self-registration
CREATE POLICY "Users can create their own provider profile"
ON public.service_providers
FOR INSERT
WITH CHECK (auth.uid() = user_id);