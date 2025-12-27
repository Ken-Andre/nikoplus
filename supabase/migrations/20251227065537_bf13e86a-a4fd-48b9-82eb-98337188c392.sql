-- Add is_approved column and related fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Update existing users to be approved (so they can still login)
UPDATE public.profiles SET is_approved = true WHERE is_approved IS NULL OR is_approved = false;

-- Update the handle_new_user function to set is_approved = false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    false
  );
  
  -- Default role is seller
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'seller');
  
  RETURN NEW;
END;
$$;