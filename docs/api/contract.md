# 📡 CONTRAT D'INTERFACE API - NICKOPLUS PRO

Documentation complète des APIs Supabase utilisées par NICKOPLUS PRO.

---

## 🔧 Configuration Générale

### **Base URL**
- **Supabase Project URL** : `https://[project-ref].supabase.co`
- **REST API** : `https://[project-ref].supabase.co/rest/v1`
- **Auth API** : `https://[project-ref].supabase.co/auth/v1`

### **Authentification**
- **Type** : Bearer Token (JWT)
- **Header** : `Authorization: Bearer {token}`
- **Token Source** : Supabase Auth (sessions persistées)
- **Auto-refresh** : Activé automatiquement

### **Format des Réponses**

#### **Succès (2xx)**
```json
{
  "data": [...],
  "error": null,
  "count": 10,
  "status": 200,
  "statusText": "OK"
}
```

#### **Erreur (4xx, 5xx)**
```json
{
  "data": null,
  "error": {
    "message": "Description de l'erreur",
    "details": "Détails supplémentaires",
    "hint": "Suggestion de correction"
  },
  "status": 400,
  "statusText": "Bad Request"
}
```

### **Row Level Security (RLS)**
Toutes les requêtes respectent automatiquement les politiques RLS définies dans Supabase :
- **Vendeurs** : Accès limité à leur boutique
- **Admins** : Accès complet à toutes les boutiques
- **Authentification** : Requise pour toutes les opérations

---

## 🔐 MODULE AUTHENTIFICATION

### **POST /auth/v1/token**
**Description :** Connexion utilisateur

**Headers :**
```json
{
  "Content-Type": "application/json",
  "apikey": "your-supabase-anon-key"
}
```

**Request Body :**
```json
{
  "email": "vendeur@nickoplus.com",
  "password": "password123"
}
```

**Response 200 :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "vendeur@nickoplus.com",
    "role": "seller",
    "boutique_id": "uuid-boutique"
  }
}
```

**Erreurs :**
- `400` : Email ou mot de passe invalide
- `422` : Email non confirmé
- `429` : Trop de tentatives

---

### **POST /auth/v1/signup**
**Description :** Inscription nouvel utilisateur (admin uniquement)

**Headers :**
```json
{
  "Authorization": "Bearer {admin-token}",
  "Content-Type": "application/json",
  "apikey": "your-supabase-anon-key"
}
```

**Request Body :**
```json
{
  "email": "nouveau.vendeur@nickoplus.com",
  "password": "TempPassword123!",
  "data": {
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "seller",
    "boutique_id": "uuid-boutique"
  }
}
```

**Response 201 :**
```json
{
  "user": {
    "id": "uuid",
    "email": "nouveau.vendeur@nickoplus.com",
    "created_at": "2025-01-12T10:00:00Z"
  }
}
```

---

### **POST /auth/v1/logout**
**Description :** Déconnexion utilisateur

**Headers :**
```json
{
  "Authorization": "Bearer {token}",
  "apikey": "your-supabase-anon-key"
}
```

**Response 200 :**
```json
{
  "message": "Successfully logged out"
}
```

---

## 💰 MODULE VENTES

### **GET /rest/v1/sales**
**Description :** Liste des ventes avec filtres

**Headers :**
```json
{
  "Authorization": "Bearer {token}",
  "apikey": "your-supabase-anon-key",
  "Range": "0-49"  // Pagination
}
```

**Query Parameters :**
- `boutique_id` (string) : UUID de la boutique
- `seller_id` (string) : UUID du vendeur (optionnel)
- `status` (string) : `en_cours`, `terminee`, `annulee`
- `payment_method` (string) : `especes`, `carte`, `cheque`, `virement`
- `date_from` (string) : Date ISO (YYYY-MM-DD)
- `date_to` (string) : Date ISO (YYYY-MM-DD)
- `limit` (number) : Nombre d'éléments (défaut: 50)
- `offset` (number) : Décalage (défaut: 0)

**Exemple de Requête :**
```bash
curl -X GET \
  'https://[project-ref].supabase.co/rest/v1/sales?boutique_id=123e4567-e89b-12d3-a456-426614174000&limit=20' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'apikey: your-anon-key'
```

**Response 200 :**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "reference": "V-20250112-001",
    "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
    "seller_id": "456e7890-e29b-41d4-a716-446655440001",
    "client_name": "Marie Dupont",
    "client_phone": "+237690123456",
    "total_amount": 25000,
    "payment_method": "especes",
    "status": "terminee",
    "is_synced": true,
    "created_at": "2025-01-12T10:30:00Z",
    "vendeur": {
      "first_name": "Jean",
      "last_name": "Mbarga"
    }
  }
]
```

**Politiques RLS :**
- **Vendeurs** : `seller_id = auth.uid() OR role IN ('admin', 'manager')`
- **Admins** : Accès complet

---

### **POST /rest/v1/sales**
**Description :** Créer une nouvelle vente

**Headers :**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "apikey": "your-supabase-anon-key"
}
```

**Request Body :**
```json
{
  "reference": "V-20250112-002",
  "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
  "seller_id": "456e7890-e29b-41d4-a716-446655440001",
  "client_name": "Pierre Kamga",
  "client_phone": "+237677234567",
  "total_amount": 35000,
  "payment_method": "carte",
  "status": "terminee",
  "is_synced": true
}
```

**Response 201 :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "reference": "V-20250112-002",
  "created_at": "2025-01-12T11:00:00Z"
}
```

**Validation Métier :**
- `boutique_id` doit correspondre à la boutique de l'utilisateur (sauf admin)
- `total_amount` doit être > 0
- Stock suffisant automatiquement vérifié via trigger

---

### **GET /rest/v1/sales/{id}**
**Description :** Détails d'une vente avec lignes

**Query Parameters :**
- `select` (string) : Champs à inclure avec jointures

**Exemple avec jointures :**
```bash
curl -X GET \
  'https://[project-ref].supabase.co/rest/v1/sales/550e8400-e29b-41d4-a716-446655440000?select=*,vendeur:profiles(first_name,last_name),lignes_vente(*,produit:products(name,reference))' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response 200 :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reference": "V-20250112-001",
  "client_name": "Marie Dupont",
  "total_amount": 25000,
  "vendeur": {
    "first_name": "Jean",
    "last_name": "Mbarga"
  },
  "lignes_vente": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "quantity": 2,
      "unit_price": 5000,
      "produit": {
        "name": "Rideau Velours Rouge",
        "reference": "RID-VEL-ROU-001"
      }
    }
  ]
}
```

---

### **PATCH /rest/v1/sales/{id}**
**Description :** Modifier une vente (annulation uniquement)

**Request Body :**
```json
{
  "status": "annulee"
}
```

**Conditions :**
- Vente créée dans les dernières 24h
- Permissions admin uniquement
- Déclenche automatiquement la remise en stock

---

## 📦 MODULE STOCKS

### **GET /rest/v1/stock**
**Description :** État des stocks par boutique

**Query Parameters :**
- `boutique_id` (string) : UUID de la boutique (obligatoire)
- `product_id` (string) : Filtrer par produit
- `select` (string) : Champs avec jointures

**Exemple :**
```bash
curl -X GET \
  'https://[project-ref].supabase.co/rest/v1/stock?boutique_id=123e4567-e89b-12d3-a456-426614174000&select=*,produit:products(name,reference,alert_threshold)' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response 200 :**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440004",
    "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
    "product_id": "990e8400-e29b-41d4-a716-446655440005",
    "quantity": 15,
    "updated_at": "2025-01-12T09:00:00Z",
    "produit": {
      "name": "Rideau Voilage Blanc",
      "reference": "RID-VOI-BLA-002",
      "alert_threshold": 10
    }
  }
]
```

---

### **POST /rest/v1/stock**
**Description :** Ajuster un stock (inventaire, correction)

**Request Body :**
```json
{
  "product_id": "990e8400-e29b-41d4-a716-446655440005",
  "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 25,
  "operation": "set"  // "set", "add", "subtract"
}
```

**Fonctionnement :**
- `set` : Définit la quantité exacte
- `add` : Ajoute à la quantité existante
- `subtract` : Soustrait de la quantité existante

---

## 🏪 MODULE PRODUITS

### **GET /rest/v1/products**
**Description :** Catalogue des produits

**Query Parameters :**
- `category_id` (string) : Filtrer par catégorie
- `supplier_id` (string) : Filtrer par fournisseur
- `is_active` (boolean) : Produits actifs uniquement
- `search` (string) : Recherche textuelle

**Exemple :**
```bash
curl -X GET \
  'https://[project-ref].supabase.co/rest/v1/products?category_id=aaeffb81-403e-4c75-b02b-d6c22f060804&search=rideau' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response 200 :**
```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    "reference": "RID-VOI-BLA-002",
    "name": "Rideau Voilage Blanc",
    "description": "Voilage léger 2.5m x 1.4m",
    "category_id": "d10fc335-8089-4dcf-b638-934fec8cea6b",
    "supplier_id": "de085a12-b29d-49b8-91b5-232674b55edb",
    "purchase_price": 5000,
    "selling_price": 12000,
    "alert_threshold": 8,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### **POST /rest/v1/products**
**Description :** Créer un nouveau produit

**Request Body :**
```json
{
  "reference": "COU-DEC-BLE-010",
  "name": "Coussin Décoratif Bleu",
  "description": "Coussin 45x45cm en tissu wax",
  "category_id": "b49b4b36-93d7-4831-8d9f-b402eaa3f569",
  "supplier_id": "55a7d7df-bf80-47e3-a157-83a09f4f7ec4",
  "purchase_price": 2000,
  "selling_price": 5000,
  "alert_threshold": 10,
  "is_active": true
}
```

---

## 🏢 MODULE FOURNISSEURS

### **GET /rest/v1/suppliers**
**Description :** Liste des fournisseurs

**Query Parameters :**
- `search` (string) : Recherche par nom
- `specialty` (string) : Filtrer par spécialité

**Response 200 :**
```json
[
  {
    "id": "de085a12-b29d-49b8-91b5-232674b55edb",
    "name": "Textiles Afrique SARL",
    "contact_name": "Jean Mbarga",
    "phone": "+237699123456",
    "email": "contact@textiles-afrique.cm",
    "address": "Douala, Akwa",
    "specialty": "Tissus et rideaux",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

## ⚠️ MODULE ALERTES

### **GET /rest/v1/stock_alerts**
**Description :** Alertes de rupture de stock

**Query Parameters :**
- `boutique_id` (string) : UUID de la boutique
- `is_resolved` (boolean) : Alertes actives (false) ou résolues (true)

**Response 200 :**
```json
[
  {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "alert_type": "low_stock",
    "product_id": "990e8400-e29b-41d4-a716-446655440005",
    "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "Stock bas: Rideau Voilage Blanc (7 unités restantes)",
    "is_resolved": false,
    "created_at": "2025-01-12T08:00:00Z",
    "produit": {
      "name": "Rideau Voilage Blanc",
      "reference": "RID-VOI-BLA-002"
    }
  }
]
```

---

## 📊 MODULE DASHBOARD

### **RPC: get_dashboard_kpis**
**Description :** Indicateurs clés de performance

**Headers :**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "apikey": "your-supabase-anon-key"
}
```

**Request Body :**
```json
{
  "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
  "period": "today"  // "today", "week", "month"
}
```

**Response 200 :**
```json
{
  "ventes_count": 45,
  "total_amount": 1250000,
  "top_products": [
    { "name": "Rideau Velours", "quantity": 12 },
    { "name": "Coussin Déco", "quantity": 8 }
  ],
  "stock_alerts": 3,
  "evolution_percent": 12.5
}
```

---

## 🔄 MODULE SYNCHRONISATION

### **POST /rest/v1/sync_queue**
**Description :** Enregistrer des transactions hors ligne

**Request Body :**
```json
{
  "transactions": [
    {
      "type": "sale",
      "local_id": "local-1234567890",
      "data": {
        "reference": "V-20250112-003",
        "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
        "total_amount": 15000,
        "payment_method": "especes"
      },
      "timestamp": 1642000000000
    }
  ]
}
```

**Response 200 :**
```json
{
  "processed": 1,
  "successful": 1,
  "failed": 0,
  "results": [
    {
      "local_id": "local-1234567890",
      "server_id": "cc0e8400-e29b-41d4-a716-446655440007",
      "status": "success"
    }
  ]
}
```

---

## 🚨 CODES D'ERREUR SUPABASE

| Code HTTP | Code Erreur | Description | Solution |
|-----------|-------------|-------------|----------|
| `400` | `PGRST116` | Paramètres invalides | Vérifier les types de données |
| `401` | `PGRST301` | Non authentifié | Rafraîchir le token |
| `403` | `PGRST301` | Permissions insuffisantes | Vérifier les rôles RLS |
| `404` | `PGRST116` | Ressource introuvable | Vérifier l'UUID |
| `409` | `23505` | Contrainte unique violée | Valeur déjà existante |
| `500` | `PGRST000` | Erreur serveur | Contacter le support |

---

## 🧪 EXEMPLES DE TESTS API

### **Test avec cURL**

**Créer une vente :**
```bash
curl -X POST \
  https://[project-ref].supabase.co/rest/v1/sales \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -H 'apikey: your-anon-key' \
  -d '{
    "reference": "V-TEST-001",
    "boutique_id": "123e4567-e89b-12d3-a456-426614174000",
    "total_amount": 10000,
    "payment_method": "especes"
  }'
```

### **Test avec JavaScript/TypeScript**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://[project-ref].supabase.co',
  'your-anon-key'
);

// Authentification
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'vendeur@nickoplus.com',
  password: 'password123'
});

// Requête avec RLS automatique
const { data: ventes, error } = await supabase
  .from('sales')
  .select('*, vendeur:profiles(first_name, last_name)')
  .eq('boutique_id', '123e4567-e89b-12d3-a456-426614174000')
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## 📝 CONVENTIONS DE NOMMAGE

### **Tables**
- **snake_case** : `sales`, `stock_alerts`, `supplier_orders`
- **Préfixes** : Pas de préfixe (Supabase gère les conflits)

### **Colonnes**
- **snake_case** : `boutique_id`, `total_amount`, `created_at`
- **Types** : `uuid` pour IDs, `timestamp` pour dates

### **Endpoints**
- **RESTful** : `/sales`, `/products`, `/stock`
- **Query params** : `boutique_id`, `limit`, `offset`

---

## 🔒 POLITIQUES DE SÉCURITÉ

### **Row Level Security (RLS)**

**Activé sur toutes les tables principales :**
- **Ventes** : Utilisateurs voient uniquement leurs ventes ou celles de leur boutique
- **Stocks** : Limitation à la boutique de l'utilisateur
- **Produits** : Accès en lecture pour tous, écriture admin uniquement

### **Fonctions de Sécurité**

```sql
-- Vérifier le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION has_role(_role text, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir la boutique d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_boutique(_user_id uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT boutique_id FROM profiles WHERE id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 MONITORING ET LIMITES

### **Rate Limiting**
- **Anon** : 60 req/minute
- **Auth** : 1000 req/minute
- **Database** : 1000 req/minute par projet

### **Limits Supabase Free**
- **Database** : 500MB
- **Bandwidth** : 50GB/mois
- **Realtime** : 200 connections simultanées

### **Monitoring**
- **Logs** : Disponibles dans Supabase Dashboard
- **Metrics** : Performance, erreurs, utilisation
- **Alerts** : Configurables pour seuils critiques

---

**Dernière mise à jour :** 30 décembre 2025  
**Version API :** 1.0  
**Supabase Version :** 14.1
