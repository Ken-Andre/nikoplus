-- Create atomic stock decrement function to prevent race conditions
CREATE OR REPLACE FUNCTION public.decrement_stock(
  _product_id UUID,
  _boutique_id UUID,
  _quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Lock the row and get current quantity
  SELECT quantity INTO current_stock
  FROM public.stock
  WHERE product_id = _product_id AND boutique_id = _boutique_id
  FOR UPDATE;
  
  -- If no stock record exists, return false
  IF current_stock IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if sufficient stock available
  IF current_stock < _quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Update stock atomically
  UPDATE public.stock
  SET quantity = quantity - _quantity,
      updated_at = now()
  WHERE product_id = _product_id AND boutique_id = _boutique_id;
  
  RETURN TRUE;
END;
$$;