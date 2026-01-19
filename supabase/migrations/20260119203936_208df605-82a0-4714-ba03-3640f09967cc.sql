-- إنشاء جدول الموظفين مع صلاحيات مخصصة
CREATE TABLE public.admin_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    position TEXT NOT NULL DEFAULT 'موظف',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول الصلاحيات للموظفين
CREATE TABLE public.employee_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.admin_employees(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(employee_id, permission_key)
);

-- قائمة الصلاحيات المتاحة
-- orders, stats, offers, referrals, coupons, reports, payments, applications, providers, verification, neighborhoods, subscriptions, commissions, payouts, edfapay, versions, settings, employees

-- تفعيل RLS
ALTER TABLE public.admin_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للموظفين - فقط الأدمن يستطيع الإدارة
CREATE POLICY "Admins can manage employees"
ON public.admin_employees
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- سياسات RLS للصلاحيات
CREATE POLICY "Admins can manage employee permissions"
ON public.employee_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- الموظفين يستطيعون رؤية صلاحياتهم الخاصة
CREATE POLICY "Employees can view own permissions"
ON public.employee_permissions
FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT id FROM public.admin_employees WHERE user_id = auth.uid()
    )
);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_admin_employees_updated_at
BEFORE UPDATE ON public.admin_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- دالة للتحقق من صلاحية موظف
CREATE OR REPLACE FUNCTION public.employee_has_permission(
    _user_id UUID,
    _permission_key TEXT,
    _action TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_employees e
        JOIN public.employee_permissions p ON p.employee_id = e.id
        WHERE e.user_id = _user_id
          AND e.is_active = true
          AND p.permission_key = _permission_key
          AND (
              (_action = 'view' AND p.can_view = true)
              OR (_action = 'edit' AND p.can_edit = true)
          )
    )
$$;