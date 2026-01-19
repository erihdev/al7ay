-- Create job positions table with duties
CREATE TABLE public.job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    duties JSONB DEFAULT '[]'::jsonb,
    permissions_template JSONB DEFAULT '[]'::jsonb,
    salary_range_min NUMERIC,
    salary_range_max NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee contracts table
CREATE TABLE public.employee_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.admin_employees(id) ON DELETE CASCADE NOT NULL,
    position_id UUID REFERENCES public.job_positions(id) NOT NULL,
    contract_number TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE,
    salary NUMERIC NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'full_time', -- full_time, part_time, contract
    duties JSONB DEFAULT '[]'::jsonb,
    terms_ar TEXT,
    terms_en TEXT,
    employee_signature TEXT,
    employee_signed_at TIMESTAMP WITH TIME ZONE,
    admin_signature TEXT,
    admin_signed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft', -- draft, pending_signature, active, expired, terminated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_positions
CREATE POLICY "Admins can manage job positions"
ON public.job_positions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for employee_contracts
CREATE POLICY "Admins can manage contracts"
ON public.employee_contracts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add position_id to admin_employees
ALTER TABLE public.admin_employees 
ADD COLUMN position_id UUID REFERENCES public.job_positions(id);

-- Insert default job positions based on project needs
INSERT INTO public.job_positions (title_ar, title_en, description_ar, duties, permissions_template) VALUES
(
    'مدير العمليات',
    'Operations Manager',
    'مسؤول عن إدارة جميع العمليات اليومية ومتابعة الطلبات والموظفين',
    '["متابعة الطلبات اليومية وضمان تنفيذها", "إدارة فريق العمل وتوزيع المهام", "حل المشكلات التشغيلية", "إعداد تقارير الأداء اليومية", "التنسيق مع مقدمي الخدمة"]'::jsonb,
    '["orders", "providers", "employees"]'::jsonb
),
(
    'مسؤول خدمة العملاء',
    'Customer Service Representative',
    'مسؤول عن التواصل مع العملاء وحل مشاكلهم ومتابعة شكاواهم',
    '["الرد على استفسارات العملاء", "حل شكاوى العملاء", "متابعة حالة الطلبات", "التواصل مع مقدمي الخدمة لحل المشاكل", "تقديم تقارير عن رضا العملاء"]'::jsonb,
    '["orders"]'::jsonb
),
(
    'مسؤول التسويق',
    'Marketing Specialist',
    'مسؤول عن التسويق والعروض الترويجية وإدارة الكوبونات',
    '["إنشاء وإدارة العروض الترويجية", "إدارة الكوبونات والخصومات", "تحليل أداء الحملات التسويقية", "التواصل مع العملاء عبر الإشعارات", "إعداد تقارير التسويق"]'::jsonb,
    '["offers", "coupons", "notifications"]'::jsonb
),
(
    'المحاسب المالي',
    'Financial Accountant',
    'مسؤول عن الشؤون المالية والمدفوعات وعمولات مقدمي الخدمة',
    '["مراجعة المدفوعات والإيرادات", "إدارة عمولات مقدمي الخدمة", "إعداد التقارير المالية", "متابعة المستحقات", "تسوية الحسابات"]'::jsonb,
    '["payments", "commissions", "reports"]'::jsonb
),
(
    'مسؤول مقدمي الخدمة',
    'Provider Relations Manager',
    'مسؤول عن إدارة العلاقات مع مقدمي الخدمة ومتابعة طلباتهم',
    '["مراجعة طلبات الانضمام الجديدة", "متابعة أداء مقدمي الخدمة", "حل مشاكل مقدمي الخدمة", "التحقق من الوثائق والتراخيص", "تقديم الدعم الفني لمقدمي الخدمة"]'::jsonb,
    '["providers", "applications", "subscriptions"]'::jsonb
),
(
    'مدير النظام',
    'System Administrator',
    'مسؤول عن إدارة النظام والإعدادات والأمان',
    '["إدارة إعدادات النظام", "مراقبة أداء النظام", "إدارة صلاحيات المستخدمين", "متابعة سجلات النشاط", "ضمان أمان البيانات"]'::jsonb,
    '["settings", "employees", "activity_log", "versions"]'::jsonb
);

-- Create indexes
CREATE INDEX idx_employee_contracts_employee ON public.employee_contracts(employee_id);
CREATE INDEX idx_employee_contracts_status ON public.employee_contracts(status);
CREATE INDEX idx_job_positions_active ON public.job_positions(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_job_positions_updated_at
    BEFORE UPDATE ON public.job_positions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_contracts_updated_at
    BEFORE UPDATE ON public.employee_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();