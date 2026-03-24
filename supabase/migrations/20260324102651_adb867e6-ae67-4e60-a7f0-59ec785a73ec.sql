
-- Create SECURITY DEFINER function for audit log inserts
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  _user_id UUID,
  _user_email TEXT,
  _action TEXT,
  _table_name TEXT DEFAULT NULL,
  _record_id UUID DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_values, new_values)
  VALUES (_user_id, _user_email, _action, _table_name, _record_id, _old_values, _new_values)
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;

-- Update audit_logs INSERT policy to allow any authenticated user via the function
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
