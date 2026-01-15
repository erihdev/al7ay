-- Create app_versions table to track app versions
CREATE TABLE public.app_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  release_notes TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read versions
CREATE POLICY "Anyone can view app versions" 
ON public.app_versions 
FOR SELECT 
USING (true);

-- Only admins can manage versions
CREATE POLICY "Admins can manage app versions" 
ON public.app_versions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create user_app_versions table to track which version each user has seen
CREATE TABLE public.user_app_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  last_seen_version VARCHAR(20) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_app_versions ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own version records
CREATE POLICY "Users can view their own version record" 
ON public.user_app_versions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own version record" 
ON public.user_app_versions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own version record" 
ON public.user_app_versions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert the first version
INSERT INTO public.app_versions (version, release_notes, is_current)
VALUES ('1.1.0', 'تحسينات في لوحة تحكم مقدمي الخدمات وإضافة إحصائيات تفصيلية', true);