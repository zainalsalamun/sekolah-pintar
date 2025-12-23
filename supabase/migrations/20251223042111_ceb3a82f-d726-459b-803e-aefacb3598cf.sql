-- Create function to automatically assign admin role to first user
CREATE OR REPLACE FUNCTION public.assign_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if there are no existing admin users
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    -- Make the first user an admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user profile is created
DROP TRIGGER IF EXISTS on_first_user_make_admin ON public.profiles;
CREATE TRIGGER on_first_user_make_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_first_user_admin();