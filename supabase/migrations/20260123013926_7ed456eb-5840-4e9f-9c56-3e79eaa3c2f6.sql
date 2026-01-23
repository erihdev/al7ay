-- Allow admins to view all points history
CREATE POLICY "Admins can view all points history" 
ON public.points_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to insert points history (for manual adjustments)
CREATE POLICY "Admins can insert points history" 
ON public.points_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to update loyalty points
CREATE POLICY "Admins can update loyalty points" 
ON public.loyalty_points 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);