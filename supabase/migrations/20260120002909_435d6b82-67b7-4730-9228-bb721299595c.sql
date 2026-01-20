
-- Create EdfaPay features settings table
CREATE TABLE public.edfapay_features (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key text NOT NULL UNIQUE,
    feature_name_ar text NOT NULL,
    feature_name_en text,
    description_ar text,
    description_en text,
    is_enabled boolean NOT NULL DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.edfapay_features ENABLE ROW LEVEL SECURITY;

-- Admins can manage features
CREATE POLICY "Admins can manage edfapay features" 
ON public.edfapay_features 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view enabled features
CREATE POLICY "Anyone can view edfapay features" 
ON public.edfapay_features 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_edfapay_features_updated_at
BEFORE UPDATE ON public.edfapay_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all EdfaPay features
INSERT INTO public.edfapay_features (feature_key, feature_name_ar, feature_name_en, description_ar, description_en, is_enabled) VALUES
('refunds', 'استرداد المبالغ', 'Refunds', 'إرجاع المبلغ للعميل تلقائياً عند إلغاء الطلب', 'Automatically refund customers when orders are cancelled', false),
('transaction_reports', 'تقارير المعاملات', 'Transaction Reports', 'جلب تفاصيل كل عملية دفع في لوحة التحكم', 'Fetch payment transaction details in admin dashboard', true),
('webhooks', 'الإشعارات الفورية', 'Webhooks', 'إشعارات فورية لتحديث حالة الدفع تلقائياً', 'Real-time notifications for automatic payment status updates', true),
('saved_cards', 'حفظ البطاقات', 'Saved Cards', 'تخزين بطاقة العميل للدفع السريع', 'Store customer cards for faster checkout', false),
('apple_pay', 'Apple Pay', 'Apple Pay', 'دفع بنقرة واحدة عبر Apple Pay', 'One-tap payment with Apple Pay', false),
('google_pay', 'Google Pay', 'Google Pay', 'دفع بنقرة واحدة عبر Google Pay', 'One-tap payment with Google Pay', false),
('e_invoices', 'الفواتير الإلكترونية', 'E-Invoices', 'إصدار فواتير متوافقة مع هيئة الزكاة والضريبة', 'Issue invoices compliant with ZATCA regulations', false),
('scheduled_payments', 'الدفع المجدول', 'Scheduled Payments', 'خصم المبلغ لاحقاً للاشتراكات الشهرية', 'Deferred payments for monthly subscriptions', false);
