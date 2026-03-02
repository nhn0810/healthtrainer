-- Run this SQL in your Supabase SQL Editor to add limit and premium tracking attributes to your profiles table!

-- Add new columns safely
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS api_usage_count INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_api_usage_date DATE DEFAULT CURRENT_DATE;

-- (Optional) If you want to check your limits in Supabase right away
-- SELECT id, email, is_premium, created_at, api_usage_count FROM public.profiles;
