-- Create user_favorites table for wishlist functionality
CREATE TABLE public.user_favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'main' CHECK (product_type IN ('main', 'provider')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id, product_type)
);

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites"
ON public.user_favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.user_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
ON public.user_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_product ON public.user_favorites(product_id, product_type);