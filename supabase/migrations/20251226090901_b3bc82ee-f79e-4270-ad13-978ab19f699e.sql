-- Create sales objectives table
CREATE TABLE public.sales_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  target_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (seller_id, month, year)
);

-- Enable RLS
ALTER TABLE public.sales_objectives ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins and managers can manage objectives"
ON public.sales_objectives
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Sellers can view their own objectives"
ON public.sales_objectives
FOR SELECT
USING (seller_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_sales_objectives_updated_at
BEFORE UPDATE ON public.sales_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();