-- ============================================
-- NICKOPLUS PRO - Database Schema
-- ============================================

-- 1. Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'seller');

-- 2. Create boutiques table
CREATE TABLE public.boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  boutique_id UUID REFERENCES public.boutiques(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'seller',
  UNIQUE (user_id, role)
);

-- 5. Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  specialty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  purchase_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  alert_threshold INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create stock table (per boutique)
CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  boutique_id UUID REFERENCES public.boutiques(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, boutique_id)
);

-- 9. Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  boutique_id UUID REFERENCES public.boutiques(id) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  is_synced BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Create sale_items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Create supplier_orders table
CREATE TABLE public.supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  boutique_id UUID REFERENCES public.boutiques(id) NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  expected_delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Create stock_alerts table
CREATE TABLE public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  boutique_id UUID REFERENCES public.boutiques(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'low_stock',
  message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- SECURITY: Enable RLS on all tables
-- ============================================

ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTION for role checking
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to get user's boutique
CREATE OR REPLACE FUNCTION public.get_user_boutique(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT boutique_id FROM public.profiles WHERE id = _user_id
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- BOUTIQUES: All authenticated users can read
CREATE POLICY "Authenticated users can view boutiques"
ON public.boutiques FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage boutiques"
ON public.boutiques FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES: Users can view all profiles, update their own
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES: Only admins can view and manage
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CATEGORIES: All authenticated can read, admins/managers can manage
CREATE POLICY "Authenticated users can view categories"
ON public.categories FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage categories"
ON public.categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- SUPPLIERS: All authenticated can read, admins/managers can manage
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage suppliers"
ON public.suppliers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- PRODUCTS: All authenticated can read, admins/managers can manage
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage products"
ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- STOCK: All authenticated can read, admins/managers can manage
CREATE POLICY "Authenticated users can view stock"
ON public.stock FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage stock"
ON public.stock FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- SALES: Users can view sales from their boutique, sellers can create
CREATE POLICY "Users can view sales from their boutique"
ON public.sales FOR SELECT TO authenticated
USING (
  boutique_id = public.get_user_boutique(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Sellers can create sales"
ON public.sales FOR INSERT TO authenticated
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can manage all sales"
ON public.sales FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- SALE_ITEMS: Users can view items from their sales
CREATE POLICY "Users can view sale items"
ON public.sale_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_id
    AND (s.boutique_id = public.get_user_boutique(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Sellers can create sale items"
ON public.sale_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_id
    AND s.seller_id = auth.uid()
  )
);

-- SUPPLIER_ORDERS: Admins and managers only
CREATE POLICY "Admins and managers can view supplier orders"
ON public.supplier_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can manage supplier orders"
ON public.supplier_orders FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- STOCK_ALERTS: All authenticated can view, admins/managers can manage
CREATE POLICY "Authenticated users can view stock alerts"
ON public.stock_alerts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage stock alerts"
ON public.stock_alerts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_boutiques_updated_at
BEFORE UPDATE ON public.boutiques
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_updated_at
BEFORE UPDATE ON public.stock
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_orders_updated_at
BEFORE UPDATE ON public.supplier_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Default role is seller
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'seller');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INITIAL DATA: Create the two boutiques
-- ============================================

INSERT INTO public.boutiques (name, address, phone) VALUES
('NICKO Douala', 'Douala, Cameroun', '+237 6XX XXX XXX'),
('NICKO Kribi', 'Kribi, Cameroun', '+237 6XX XXX XXX');

-- Insert some default categories
INSERT INTO public.categories (name, description) VALUES
('Rideaux', 'Rideaux et voilages'),
('Draps', 'Draps et parures de lit'),
('Coussins', 'Coussins décoratifs'),
('Nappes', 'Nappes et sets de table'),
('Accessoires', 'Accessoires de décoration');