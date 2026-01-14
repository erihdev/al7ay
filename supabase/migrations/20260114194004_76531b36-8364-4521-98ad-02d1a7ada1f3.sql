-- Fix the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;

-- Create a more restrictive insert policy
CREATE POLICY "Users can insert their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);