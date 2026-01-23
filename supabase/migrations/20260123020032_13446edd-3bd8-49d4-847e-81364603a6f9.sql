-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, offer, reminder, announcement
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled notifications table
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, cancelled, failed
  recipient_type TEXT NOT NULL DEFAULT 'all', -- all, filtered
  tier_filter TEXT, -- gold, silver, bronze, or null for all
  neighborhood_filter UUID REFERENCES public.active_neighborhoods(id) ON DELETE SET NULL,
  recipients_count INTEGER DEFAULT 0,
  template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_templates
CREATE POLICY "Admins can view all notification templates" 
ON public.notification_templates FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create notification templates" 
ON public.notification_templates FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update notification templates" 
ON public.notification_templates FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete notification templates" 
ON public.notification_templates FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS policies for scheduled_notifications
CREATE POLICY "Admins can view all scheduled notifications" 
ON public.scheduled_notifications FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create scheduled notifications" 
ON public.scheduled_notifications FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update scheduled notifications" 
ON public.scheduled_notifications FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete scheduled notifications" 
ON public.scheduled_notifications FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create indexes
CREATE INDEX idx_scheduled_notifications_status ON public.scheduled_notifications(status);
CREATE INDEX idx_scheduled_notifications_scheduled_at ON public.scheduled_notifications(scheduled_at);
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);

-- Update trigger for templates
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for scheduled notifications
CREATE TRIGGER update_scheduled_notifications_updated_at
BEFORE UPDATE ON public.scheduled_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.notification_templates (name, title, body, category) VALUES
('عرض خاص', '🎁 عرض خاص لك!', 'لا تفوت العروض الحصرية المتاحة الآن. خصومات تصل إلى 50%!', 'offer'),
('تذكير سلة', '🛒 لا تنسَ سلتك!', 'لديك منتجات في انتظارك! أكمل طلبك الآن واستمتع بخدمة التوصيل السريع.', 'reminder'),
('منتج جديد', '✨ منتج جديد!', 'تم إضافة منتجات جديدة للقائمة. اكتشفها الآن!', 'announcement'),
('شكر للعملاء', '❤️ شكراً لك!', 'نشكرك على ثقتك بنا. نتطلع لخدمتك دائماً!', 'general'),
('ترقية المستوى', '🏆 مبروك!', 'لقد تمت ترقية مستواك! استمتع بمزايا حصرية جديدة.', 'general');