-- Add customer_email column to orders table for email notifications
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;