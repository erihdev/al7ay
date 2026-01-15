-- Add store theme customization columns to service_providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS store_theme JSONB DEFAULT '{
  "primary_color": "#1B4332",
  "secondary_color": "#2D6A4F",
  "accent_color": "#D4AF37",
  "background_color": "#FFFFFF",
  "text_color": "#1A1A1A",
  "header_style": "solid",
  "font_family": "Tajawal",
  "border_radius": "medium",
  "button_style": "rounded"
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.service_providers.store_theme IS 'JSON object containing store visual theme customization settings';