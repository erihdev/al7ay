-- Allow users to insert service_provider role for themselves during registration
CREATE POLICY "Users can add service_provider role for themselves"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'service_provider'::app_role
);

-- Also ensure provider_subscriptions allows users to create their own subscriptions
CREATE POLICY "Providers can create their own subscriptions"
ON public.provider_subscriptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_providers 
    WHERE id = provider_id 
    AND user_id = auth.uid()
  )
);