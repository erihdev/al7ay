-- Create employee points table
CREATE TABLE public.employee_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.admin_employees(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    monthly_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(employee_id)
);

-- Create points history table
CREATE TABLE public.employee_points_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.admin_employees(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.employee_rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description_ar TEXT,
    points_required INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create claimed rewards table
CREATE TABLE public.employee_claimed_rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.admin_employees(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.employee_rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'pending'
);

-- Create report schedule settings table
CREATE TABLE public.admin_report_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    schedule TEXT DEFAULT 'weekly',
    recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_claimed_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_report_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Admins can manage employee points" ON public.employee_points
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view points history" ON public.employee_points_history
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage rewards" ON public.employee_rewards
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage claimed rewards" ON public.employee_claimed_rewards
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage report settings" ON public.admin_report_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default report settings
INSERT INTO public.admin_report_settings (report_type, is_enabled, schedule, recipients)
VALUES ('employee_performance', true, 'weekly', ARRAY['difmashni@gmail.com']);

-- Insert some default rewards
INSERT INTO public.employee_rewards (name_ar, name_en, description_ar, points_required) VALUES
('يوم إجازة إضافي', 'Extra Day Off', 'الحصول على يوم إجازة مدفوعة إضافي', 500),
('مكافأة مالية', 'Cash Bonus', 'مكافأة مالية بقيمة 200 ريال', 300),
('شهادة تقدير', 'Certificate of Appreciation', 'شهادة تقدير من الإدارة', 100),
('قسيمة شراء', 'Shopping Voucher', 'قسيمة شراء بقيمة 100 ريال', 200);

-- Create trigger for updated_at
CREATE TRIGGER update_employee_points_updated_at
    BEFORE UPDATE ON public.employee_points
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_report_settings_updated_at
    BEFORE UPDATE ON public.admin_report_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();