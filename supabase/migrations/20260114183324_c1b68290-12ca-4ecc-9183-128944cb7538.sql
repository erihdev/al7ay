-- Add scheduled_for column to orders table
ALTER TABLE public.orders ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE NULL;

-- Add tier column to loyalty_points table
ALTER TABLE public.loyalty_points ADD COLUMN tier TEXT NOT NULL DEFAULT 'bronze';

-- Create function to calculate tier based on lifetime points
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier(points INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF points >= 1500 THEN
    RETURN 'gold';
  ELSIF points >= 500 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$;

-- Create trigger to auto-update tier when points change
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.tier := public.calculate_loyalty_tier(NEW.lifetime_points);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tier_on_points_change
BEFORE INSERT OR UPDATE OF lifetime_points ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_loyalty_tier();

-- Update existing records to have correct tier
UPDATE public.loyalty_points 
SET tier = public.calculate_loyalty_tier(lifetime_points);