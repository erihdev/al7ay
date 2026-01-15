-- Add vehicle information columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS vehicle_brand text,
ADD COLUMN IF NOT EXISTS vehicle_model text,
ADD COLUMN IF NOT EXISTS vehicle_year text,
ADD COLUMN IF NOT EXISTS vehicle_color text,
ADD COLUMN IF NOT EXISTS vehicle_plate text;