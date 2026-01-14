-- Fix search_path for calculate_loyalty_tier function
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier(points INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
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

-- Fix search_path for update_loyalty_tier function
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.tier := public.calculate_loyalty_tier(NEW.lifetime_points);
  RETURN NEW;
END;
$$;