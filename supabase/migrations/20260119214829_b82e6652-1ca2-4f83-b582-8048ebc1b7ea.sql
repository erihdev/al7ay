-- Create employee_positions junction table for many-to-many relationship
CREATE TABLE public.employee_positions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.admin_employees(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES public.job_positions(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(employee_id, position_id)
);

-- Create indexes for better performance
CREATE INDEX idx_employee_positions_employee ON public.employee_positions(employee_id);
CREATE INDEX idx_employee_positions_position ON public.employee_positions(position_id);

-- Enable RLS
ALTER TABLE public.employee_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage employee positions"
ON public.employee_positions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing position_id data to the new table
INSERT INTO public.employee_positions (employee_id, position_id, is_primary)
SELECT id, position_id, true
FROM public.admin_employees
WHERE position_id IS NOT NULL;