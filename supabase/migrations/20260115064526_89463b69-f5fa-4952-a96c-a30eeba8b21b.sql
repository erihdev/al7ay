-- Create provider_reviews table for store ratings
CREATE TABLE public.provider_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (provider_id, user_id)
);

-- Enable RLS
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view provider reviews"
ON public.provider_reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.provider_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.provider_reviews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.provider_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_provider_reviews_updated_at
BEFORE UPDATE ON public.provider_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_provider_reviews_provider_id ON public.provider_reviews(provider_id);
CREATE INDEX idx_provider_reviews_user_id ON public.provider_reviews(user_id);