-- Create notifications log table
CREATE TABLE public.notifications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL DEFAULT 'customer', -- customer, provider, all
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'admin_message', -- admin_message, order_status, bulk, etc.
  sent_via TEXT[], -- ['aimtell', 'webpush']
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_bulk BOOLEAN NOT NULL DEFAULT false,
  bulk_recipients_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, failed
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all notification logs
CREATE POLICY "Admins can view all notifications log" 
ON public.notifications_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow admins to insert notification logs
CREATE POLICY "Admins can insert notifications log" 
ON public.notifications_log FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create index for faster queries
CREATE INDEX idx_notifications_log_created_at ON public.notifications_log(created_at DESC);
CREATE INDEX idx_notifications_log_recipient ON public.notifications_log(recipient_id);
CREATE INDEX idx_notifications_log_type ON public.notifications_log(notification_type);