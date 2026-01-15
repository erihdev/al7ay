-- Update trial plan duration to 30 days
UPDATE public.subscription_plans 
SET 
  duration_days = 30,
  description_ar = 'جرّب المنصة مجاناً لمدة 30 يوم',
  description_en = 'Try the platform free for 30 days'
WHERE is_trial = true;