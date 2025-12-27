-- ============================================
-- SCRIPT DE MIGRATION COMPLET POUR SUPABASE
-- Projet: Gestion de Stock Multi-Boutiques
-- ============================================

-- ============================================
-- ÉTAPE 1: CRÉER L'ENUM POUR LES RÔLES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'seller');

-- ============================================
-- ÉTAPE 2: CRÉER LES TABLES
-- ============================================

-- Table des boutiques
CREATE TABLE public.boutiques (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    boutique_id UUID REFERENCES public.boutiques(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des rôles utilisateurs
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL DEFAULT 'seller',
    UNIQUE (user_id, role)
);

-- Table des catégories
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des fournisseurs
CREATE TABLE public.suppliers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    specialty TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des produits
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reference TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    selling_price NUMERIC NOT NULL,
    purchase_price NUMERIC DEFAULT 0,
    category_id UUID REFERENCES public.categories(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    image_url TEXT,
    alert_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des stocks
CREATE TABLE public.stock (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des alertes de stock
CREATE TABLE public.stock_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id),
    alert_type TEXT NOT NULL DEFAULT 'low_stock',
    message TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des ventes
CREATE TABLE public.sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reference TEXT NOT NULL,
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id),
    seller_id UUID NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'completed',
    is_synced BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des articles de vente
CREATE TABLE public.sale_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des objectifs de vente
CREATE TABLE public.sales_objectives (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL,
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    target_amount NUMERIC NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des commandes fournisseurs
CREATE TABLE public.supplier_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reference TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id),
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount NUMERIC DEFAULT 0,
    expected_delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des paramètres de l'application
CREATE TABLE public.app_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des logs d'audit
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ÉTAPE 3: CRÉER LES FONCTIONS
-- ============================================

-- Fonction pour vérifier si un utilisateur a un rôle
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

-- Fonction pour obtenir la boutique d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_boutique(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT boutique_id FROM public.profiles WHERE id = _user_id
$$;

-- Fonction pour décrémenter le stock
CREATE OR REPLACE FUNCTION public.decrement_stock(_product_id UUID, _boutique_id UUID, _quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
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

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction pour gérer la création d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ============================================
-- ÉTAPE 4: CRÉER LES TRIGGERS
-- ============================================

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ÉTAPE 5: ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6: CRÉER LES POLITIQUES RLS
-- ============================================

-- === BOUTIQUES ===
CREATE POLICY "Authenticated users can view boutiques" ON public.boutiques
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage boutiques" ON public.boutiques
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- === PROFILES ===
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- === USER_ROLES ===
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- === CATEGORIES ===
CREATE POLICY "Authenticated users can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage categories" ON public.categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- === SUPPLIERS ===
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage suppliers" ON public.suppliers
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- === PRODUCTS ===
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage products" ON public.products
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- === STOCK ===
CREATE POLICY "Authenticated users can view stock" ON public.stock
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage stock" ON public.stock
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- === STOCK_ALERTS ===
CREATE POLICY "Authenticated users can view stock alerts" ON public.stock_alerts
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage stock alerts" ON public.stock_alerts
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- === SALES ===
CREATE POLICY "Users can view sales from their boutique" ON public.sales
  FOR SELECT USING (boutique_id = public.get_user_boutique(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can create sales" ON public.sales
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can manage all sales" ON public.sales
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- === SALE_ITEMS ===
CREATE POLICY "Users can view sale items" ON public.sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
      AND (s.boutique_id = public.get_user_boutique(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Sellers can create sale items" ON public.sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id AND s.seller_id = auth.uid()
    )
  );

-- === SALES_OBJECTIVES ===
CREATE POLICY "Sellers can view their own objectives" ON public.sales_objectives
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Admins and managers can manage objectives" ON public.sales_objectives
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- === SUPPLIER_ORDERS ===
CREATE POLICY "Admins and managers can view supplier orders" ON public.supplier_orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can manage supplier orders" ON public.supplier_orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- === APP_SETTINGS ===
CREATE POLICY "Authenticated users can view settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage app settings" ON public.app_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- === AUDIT_LOGS ===
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ÉTAPE 7: CRÉER LE BUCKET DE STOCKAGE
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Politique pour les images de produits
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================
-- SCRIPT TERMINÉ
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Copiez ce script
-- 2. Allez dans votre projet Supabase: https://supabase.com/dashboard/project/hajacavrhwfiiqpxcywj
-- 3. Ouvrez l'éditeur SQL (SQL Editor)
-- 4. Collez et exécutez ce script
-- 5. Ensuite, exportez les données de Lovable Cloud et importez-les
--
-- APRÈS L'EXÉCUTION:
-- - Configurez les paramètres d'authentification (Site URL, Redirect URLs)
-- - Mettez à jour les fichiers .env de votre projet avec les nouvelles clés
-- ============================================
