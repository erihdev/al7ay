-- Create employee activity log table
CREATE TABLE public.employee_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.admin_employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.employee_activity_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert activity logs
CREATE POLICY "Admins can insert activity logs"
ON public.employee_activity_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR employee_has_permission(auth.uid(), 'any', 'view'));

-- Employees can view their own activity
CREATE POLICY "Employees can view own activity"
ON public.employee_activity_log
FOR SELECT
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_employee_activity_log_employee ON public.employee_activity_log(employee_id);
CREATE INDEX idx_employee_activity_log_created ON public.employee_activity_log(created_at DESC);
CREATE INDEX idx_employee_activity_log_action ON public.employee_activity_log(action_type);