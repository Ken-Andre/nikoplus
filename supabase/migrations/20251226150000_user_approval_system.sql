-- Add is_approved column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Add approved_at and approved_by columns for audit
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Update existing users to be approved (so they can still login)
UPDATE public.profiles SET is_approved = true WHERE is_approved IS NULL OR is_approved = false;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);
