# 🏗️ ARCHITECTURE DÉTAILLÉE - NICKOPLUS PRO

Guide technique complet de l'architecture du système NICKOPLUS PRO.

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Frontend](#architecture-frontend)
3. [Architecture Backend (Supabase)](#architecture-backend-supabase)
4. [Modèle de Données](#modèle-de-données)
5. [Mode Hors Ligne](#mode-hors-ligne)
6. [Sécurité](#sécurité)
7. [Performance](#performance)
8. [Diagrammes](#diagrammes)

---

## 🎯 Vue d'Ensemble

### Architecture Générale

```mermaid
graph TB
    subgraph "UTILISATEURS"
        V[Vendeuses]
        G[Gérante]
        S[Superviseur]
    end

    subgraph "FRONTEND (React + TypeScript)"
        UI[Interface Utilisateur]
        PWA[PWA + Service Worker]
        CACHE[Cache IndexedDB]
        API[Client API Supabase]
    end

    subgraph "BACKEND (Supabase BaaS)"
        AUTH[Authentication]
        DB[(PostgreSQL)]
        STORAGE[File Storage]
        REALTIME[Realtime]
        FUNCTIONS[Edge Functions]
    end

    subgraph "INFRASTRUCTURE"
        VERCEL[Vercel Hosting]
        MONITORING[Sentry + Analytics]
    end

    V --> UI
    G --> UI
    S --> UI

    UI --> PWA
    PWA --> CACHE
    UI --> API

    API --> AUTH
    API --> DB
    API --> STORAGE
    API --> REALTIME
    API --> FUNCTIONS

    FRONTEND --> VERCEL
    MONITORING --> FRONTEND
    MONITORING --> BACKEND
```

### Principes Architecturaux

#### **1. Simplicité First**
- **Pas de backend personnalisé** : Utilisation de Supabase (BaaS) pour réduire la complexité
- **Frontend pur** : Toute la logique métier côté client
- **Serverless** : Pas de gestion de serveurs

#### **2. Progressive Web App (PWA)**
- **Mode hors ligne** : Fonctionnement sans connexion Internet
- **Installation native** : Application installable sur mobile/desktop
- **Performance** : Cache intelligent et lazy loading

#### **3. Type Safety**
- **TypeScript** partout pour éviter les bugs runtime
- **Types générés** automatiquement depuis Supabase
- **Validation stricte** des données

#### **4. Évolutivité**
- **Modularité** : Composants réutilisables
- **Separation of Concerns** : Hooks, services, composants séparés
- **State Management** : TanStack Query pour la gestion d'état serveur

---

## 🖥️ Architecture Frontend

### Stack Technique

| Technologie | Version | Rôle | Justification |
|-------------|---------|------|---------------|
| **React** | 18.x | Framework UI | Composants réutilisables, écosystème riche |
| **TypeScript** | 5.x | Type Safety | Prévention des bugs, DX améliorée |
| **Vite** | 5.x | Build Tool | Démarrage rapide, HMR ultra-rapide |
| **Tailwind CSS** | 3.x | Styling | Utilitaire-first, responsive, performant |
| **React Router** | 6.x | Routing | Navigation SPA fluide |
| **TanStack Query** | 5.x | State Management | Cache intelligent, synchronisation serveur |
| **Supabase JS** | 2.x | API Client | Client officiel, types générés |
| **IndexedDB** | - | Cache local | Stockage hors ligne structuré |
| **Vite PWA** | 1.x | PWA | Service Worker, manifest, offline |

### Structure des Dossiers

```
src/
├── components/                    # 🧩 Composants React
│   ├── ui/                         # Composants shadcn/ui (génériques)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Table.tsx
│   ├── ventes/                     # Composants métier ventes
│   │   ├── VenteForm.tsx
│   │   ├── VenteList.tsx
│   │   └── VenteDetails.tsx
│   ├── stocks/                     # Composants métier stocks
│   │   ├── StockCard.tsx
│   │   └── StockList.tsx
│   └── shared/                     # Composants partagés
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── ConnectionIndicator.tsx
│
├── hooks/                         # 🎣 Custom React Hooks
│   ├── useAuth.ts                 # Gestion authentification
│   ├── useVentes.ts               # CRUD ventes
│   ├── useStocks.ts               # Gestion stocks
│   ├── useSync.ts                 # Synchronisation
│   └── useLocalStorage.ts         # Stockage local
│
├── lib/                           # 🔧 Utilitaires
│   ├── api.ts                     # Client API Supabase
│   ├── utils.ts                   # Fonctions utilitaires
│   ├── offlineStorage.ts          # Gestion cache IndexedDB
│   └── constants.ts               # Constantes application
│
├── pages/                         # 📄 Pages Next.js
│   ├── AuthPage.tsx               # Login/Register
│   ├── VendeurDashboard.tsx       # Dashboard vendeur
│   ├── NouvelleVente.tsx          # Création vente
│   ├── GestionStocks.tsx          # Consultation stocks
│   ├── AdminDashboard.tsx         # Dashboard admin
│   └── RapportVentes.tsx          # Rapports
│
├── types/                         # 📝 Types TypeScript
│   ├── vente.ts                   # Types ventes
│   ├── stock.ts                   # Types stocks
│   ├── user.ts                    # Types utilisateurs
│   └── index.ts                   # Exports globaux
│
├── contexts/                      # 🌐 React Contexts
│   ├── AuthContext.tsx            # Contexte authentification
│   └── SyncContext.tsx            # Contexte synchronisation
│
├── integrations/                  # 🔗 Intégrations externes
│   └── supabase/
│       ├── client.ts              # Configuration client
│       └── types.ts               # Types générés
│
└── styles/                        # 🎨 Styles globaux
    └── globals.css                # Tailwind + custom styles
```

### Flux de Données Frontend

```mermaid
graph TD
    subgraph "USER INTERFACE"
        PAGE[Page Component]
        FORM[Form Component]
        LIST[List Component]
    end

    subgraph "BUSINESS LOGIC"
        HOOK[Custom Hook]
        SERVICE[Service/API Client]
    end

    subgraph "STATE MANAGEMENT"
        QUERY[TanStack Query]
        CONTEXT[React Context]
        LOCAL[Local State]
    end

    subgraph "DATA SOURCES"
        SUPABASE[Supabase API]
        INDEXEDDB[IndexedDB Cache]
        LOCALSTORAGE[LocalStorage]
    end

    PAGE --> HOOK
    FORM --> HOOK
    LIST --> HOOK

    HOOK --> QUERY
    HOOK --> CONTEXT
    HOOK --> LOCAL

    QUERY --> SUPABASE
    QUERY --> INDEXEDDB

    CONTEXT --> LOCALSTORAGE
    LOCAL --> LOCALSTORAGE
```

### Gestion d'État

#### **1. TanStack Query (Données Serveur)**
```typescript
// ✅ BON : Cache intelligent, synchronisation automatique
const useVentes = (filters?: VenteFilters) => {
  return useQuery({
    queryKey: ['ventes', filters],
    queryFn: () => apiClient.ventes.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};
```

#### **2. React Context (État Global)**
```typescript
// ✅ BON : Authentification, thème, synchronisation
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### **3. Local State (État Local)**
```typescript
// ✅ BON : Formulaires, UI temporaire
const [searchTerm, setSearchTerm] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

---

## 🗄️ Architecture Backend (Supabase)

### Services Supabase Utilisés

#### **1. Authentication**
- **Type** : Supabase Auth
- **Méthode** : Email + Password
- **JWT** : Tokens gérés automatiquement
- **Sessions** : Persistées automatiquement

#### **2. Database (PostgreSQL)**
- **Tables** : 12 tables principales
- **Rôles** : `admin`, `manager`, `seller`
- **RLS** : Row Level Security activé
- **Fonctions** : `decrement_stock()`, `has_role()`, `get_user_boutique()`

#### **3. Storage**
- **Utilisation** : PDFs tickets, images produits
- **Politiques** : RLS par utilisateur/boutique

#### **4. Realtime**
- **Utilisation** : Synchronisation multi-boutiques
- **Channels** : Par boutique pour les mises à jour

### Schéma de Base de Données

```mermaid
erDiagram
    BOUTIQUES ||--o{ UTILISATEURS : "emploie"
    BOUTIQUES ||--o{ VENTES : "réalise"
    BOUTIQUES ||--o{ STOCKS : "détient"
    BOUTIQUES ||--o{ COMMANDES_FOURNISSEURS : "reçoit"

    UTILISATEURS ||--o{ VENTES : "effectue"
    UTILISATEURS ||--o{ ALERTES : "reçoit"

    PRODUITS ||--o{ STOCKS : "est_stocké"
    PRODUITS ||--o{ LIGNES_VENTE : "est_vendu"
    PRODUITS ||--o{ LIGNES_COMMANDE : "est_commandé"

    VENTES ||--o{ LIGNES_VENTE : "contient"
    VENTES }o--|| CLIENTS : "concerne"

    FOURNISSEURS ||--o{ PRODUITS : "fournit"
    FOURNISSEURS ||--o{ COMMANDES_FOURNISSEURS : "reçoit"

    COMMANDES_FOURNISSEURS ||--o{ LIGNES_COMMANDE : "détaille"

    STOCKS ||--o{ ALERTES : "génère"

    UTILISATEURS {
        string id PK
        string email UK
        string first_name
        string last_name
        string role
        string boutique_id FK
        boolean is_approved
    }

    BOUTIQUES {
        string id PK
        string name
        string address
        string phone
    }

    PRODUITS {
        string id PK
        string reference UK
        string name
        number selling_price
        number purchase_price
        number alert_threshold
        string supplier_id FK
        string category_id FK
    }

    STOCKS {
        string id PK
        string product_id FK
        string boutique_id FK
        number quantity
    }

    VENTES {
        string id PK
        string reference UK
        string boutique_id FK
        string seller_id FK
        number total_amount
        string payment_method
        string status
        boolean is_synced
    }

    LIGNES_VENTE {
        string id PK
        string sale_id FK
        string product_id FK
        number quantity
        number unit_price
    }

    ALERTES {
        string id PK
        string alert_type
        string product_id FK
        string boutique_id FK
        string message
        boolean is_resolved
    }

    FOURNISSEURS {
        string id PK
        string name
        string contact_name
        string phone
        string email
    }

    COMMANDES_FOURNISSEURS {
        string id PK
        string reference UK
        string supplier_id FK
        string boutique_id FK
        number total_amount
        string status
    }

    SALES_OBJECTIVES {
        string id PK
        string seller_id FK
        string boutique_id FK
        number month
        number year
        number target_amount
    }
```

### Politiques RLS (Row Level Security)

#### **Table `ventes`**
```sql
-- Vendeurs voient uniquement leurs ventes
CREATE POLICY "Vendeurs voient leurs ventes" ON ventes
FOR SELECT USING (
  seller_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Admins voient tout
CREATE POLICY "Admins voient toutes les ventes" ON ventes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

#### **Table `stocks`**
```sql
-- Utilisateurs voient stocks de leur boutique uniquement
CREATE POLICY "Stocks de sa boutique uniquement" ON stocks
FOR ALL USING (
  boutique_id = get_user_boutique(auth.uid())
);
```

### Fonctions PostgreSQL

#### **decrement_stock()**
```sql
CREATE OR REPLACE FUNCTION decrement_stock(
  _boutique_id TEXT,
  _product_id TEXT,
  _quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  current_quantity INTEGER;
BEGIN
  -- Récupérer quantité actuelle
  SELECT quantity INTO current_quantity
  FROM stocks
  WHERE boutique_id = _boutique_id AND product_id = _product_id;

  -- Vérifier stock suffisant
  IF current_quantity < _quantity THEN
    RAISE EXCEPTION 'Stock insuffisant pour le produit %', _product_id;
  END IF;

  -- Décrémenter stock
  UPDATE stocks
  SET quantity = quantity - _quantity,
      updated_at = NOW()
  WHERE boutique_id = _boutique_id AND product_id = _product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📱 Mode Hors Ligne

### Architecture PWA

```mermaid
graph TD
    subgraph "SERVICE WORKER"
        SW[Service Worker]
        CACHE[Cache Storage API]
        SYNC[Background Sync]
    end

    subgraph "INDEXEDDB"
        VENTES[Cache Ventes]
        STOCKS[Cache Stocks]
        PRODUITS[Cache Produits]
    end

    subgraph "APPLICATION"
        UI[Interface Utilisateur]
        QUEUE[Queue Synchronisation]
        DETECT[Détection Connexion]
    end

    UI --> DETECT
    DETECT --> QUEUE
    DETECT --> SW

    SW --> CACHE
    SW --> SYNC

    QUEUE --> INDEXEDDB
    SYNC --> INDEXEDDB
```

### Stratégie de Cache

#### **1. Cache des Données Statiques**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    vitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 semaine
              },
            },
          },
        ],
      },
    }),
  ],
});
```

#### **2. Cache des Données Métier**
```typescript
// lib/offlineStorage.ts
export class OfflineStorage {
  private db: IDBDatabase;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('nickoplus-db', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour les ventes hors ligne
        if (!db.objectStoreNames.contains('ventes')) {
          const ventesStore = db.createObjectStore('ventes', { keyPath: 'localId' });
          ventesStore.createIndex('synced', 'synced', { unique: false });
          ventesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store pour les stocks
        if (!db.objectStoreNames.contains('stocks')) {
          db.createObjectStore('stocks', { keyPath: 'product_id' });
        }
      };
    });
  }

  async saveVente(vente: VenteData): Promise<void> {
    const transaction = this.db.transaction(['ventes'], 'readwrite');
    const store = transaction.objectStore('ventes');

    const venteToSave = {
      ...vente,
      localId: `local-${Date.now()}`,
      synced: false,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.add(venteToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedVentes(): Promise<VenteData[]> {
    const transaction = this.db.transaction(['ventes'], 'readonly');
    const store = transaction.objectStore('ventes');
    const index = store.index('synced');

    return new Promise<VenteData[]>((resolve, reject) => {
      const request = index.getAll(false); // synced = false
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(localId: string): Promise<void> {
    const transaction = this.db.transaction(['ventes'], 'readwrite');
    const store = transaction.objectStore('ventes');

    const vente = await new Promise<any>((resolve, reject) => {
      const request = store.get(localId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (vente) {
      vente.synced = true;
      await new Promise<void>((resolve, reject) => {
        const request = store.put(vente);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}
```

### Synchronisation Différée

```typescript
// hooks/useSync.ts
export const useSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingData = async () => {
    if (!isOnline) return;

    setSyncStatus('syncing');

    try {
      const unsyncedVentes = await offlineStorage.getUnsyncedVentes();

      for (const vente of unsyncedVentes) {
        try {
          // Tenter de synchroniser avec Supabase
          const result = await apiClient.ventes.create(vente);

          // Marquer comme synchronisé
          await offlineStorage.markAsSynced(vente.localId!);

          // Mettre à jour le stock local si nécessaire
          await updateLocalStocks(vente);

        } catch (error) {
          console.error('Erreur sync vente:', vente.localId, error);
          // Continuer avec les autres ventes
        }
      }

      setSyncStatus('success');

      // Notification utilisateur
      toast.success(`${unsyncedVentes.length} ventes synchronisées`);

    } catch (error) {
      setSyncStatus('error');
      toast.error('Erreur lors de la synchronisation');
    }
  };

  return { isOnline, syncStatus, syncPendingData };
};
```

---

## 🔒 Sécurité

### Authentification

#### **Supabase Auth**
- **JWT Tokens** : Signés, expirent automatiquement
- **Refresh Tokens** : Rotation automatique
- **Session Management** : Persistance sécurisée

#### **Politiques RLS**
```sql
-- Exemple : Utilisateurs voient uniquement leurs boutiques
ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boutique_policy" ON ventes
FOR ALL USING (
  boutique_id IN (
    SELECT boutique_id FROM profiles WHERE id = auth.uid()
  )
);
```

### Autorisation

#### **Rôles Système**
```typescript
// types/index.ts
export type AppRole = 'admin' | 'manager' | 'seller';

// Fonction utilitaire
export const hasRole = (user: User, role: AppRole): boolean => {
  return user.roles?.includes(role) ?? false;
};

// Hook d'autorisation
export const useAuthorization = () => {
  const { user } = useAuth();

  const canCreateVente = hasRole(user, 'seller') || hasRole(user, 'admin');
  const canDeleteVente = hasRole(user, 'admin');
  const canManageUsers = hasRole(user, 'admin');

  return { canCreateVente, canDeleteVente, canManageUsers };
};
```

### Protection des Données

#### **Chiffrement**
- **En transit** : HTTPS obligatoire (Supabase)
- **Au repos** : Chiffrement PostgreSQL
- **Local** : IndexedDB non chiffré (données non sensibles)

#### **Validation**
```typescript
// DTOs avec validation
import { z } from 'zod';

export const CreateVenteSchema = z.object({
  boutiqueId: z.string().uuid(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  lignesVente: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
  paymentMethod: z.enum(['especes', 'carte', 'cheque', 'virement']),
});

export type CreateVenteDto = z.infer<typeof CreateVenteSchema>;
```

---

## ⚡ Performance

### Optimisations Frontend

#### **1. Code Splitting**
```typescript
// Lazy loading des pages
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const NouvelleVente = lazy(() => import('@/pages/NouvelleVente'));

// Dans le router
<Route
  path="/admin/dashboard"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  }
/>
```

#### **2. TanStack Query Cache**
```typescript
// Configuration globale
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: (failureCount, error) => {
        // Ne pas retry pour erreurs 4xx
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
```

#### **3. Virtual Scrolling**
```typescript
// Pour listes longues
import { FixedSizeList as List } from 'react-window';

const VenteList = ({ ventes }: { ventes: Vente[] }) => {
  return (
    <List
      height={400}
      itemCount={ventes.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <VenteCard vente={ventes[index]} />
        </div>
      )}
    </List>
  );
};
```

### Optimisations Base de Données

#### **1. Indexes Stratégiques**
```sql
-- Index pour recherches fréquentes
CREATE INDEX idx_ventes_boutique_date ON ventes(boutique_id, created_at DESC);
CREATE INDEX idx_stocks_boutique_produit ON stocks(boutique_id, product_id);
CREATE INDEX idx_alertes_boutique_resolve ON alertes(boutique_id, is_resolved) WHERE is_resolved = false;
```

#### **2. Requêtes Optimisées**
```typescript
// ✅ BON : Jointures optimisées côté Supabase
export const getVentesWithDetails = async (boutiqueId: string) => {
  return await supabase
    .from('ventes')
    .select(`
      *,
      vendeur:profiles(first_name, last_name),
      lignes_vente(
        quantity,
        unit_price,
        produit:products(name, reference)
      )
    `)
    .eq('boutique_id', boutiqueId)
    .order('created_at', { ascending: false })
    .limit(50);
};
```

### Métriques Performance Cibles

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **First Contentful Paint** | < 1.5s | Lighthouse |
| **Time to Interactive** | < 3s | Lighthouse |
| **Bundle Size** | < 500KB | Vite Build |
| **API Response Time** | < 500ms | Supabase Analytics |
| **Offline First Load** | < 2s | PWA Testing |

---

## 📊 Diagrammes

### Architecture Complète

```mermaid
graph TB
    subgraph "CLIENT BROWSER"
        BROWSER[Browser Engine]
        PWA[PWA Runtime]
        CACHE[(IndexedDB)]
    end

    subgraph "FRONTEND APPLICATION"
        REACT[React Components]
        ROUTER[React Router]
        QUERY[TanStack Query]
        CONTEXT[React Context]
        HOOKS[Custom Hooks]
        API[Supabase Client]
    end

    subgraph "SUPABASE BACKEND"
        AUTH[Supabase Auth]
        DB[(PostgreSQL)]
        STORAGE[Supabase Storage]
        REALTIME[Realtime Engine]
        EDGE[Edge Functions]
    end

    subgraph "INFRASTRUCTURE"
        VERCEL[Vercel Hosting]
        CDN[CDN Global]
        MONITORING[Sentry Monitoring]
    end

    BROWSER --> PWA
    PWA --> CACHE

    REACT --> ROUTER
    REACT --> QUERY
    REACT --> CONTEXT
    REACT --> HOOKS
    HOOKS --> API
    API --> CACHE

    API --> AUTH
    API --> DB
    API --> STORAGE
    API --> REALTIME
    API --> EDGE

    FRONTEND --> VERCEL
    VERCEL --> CDN
    MONITORING --> FRONTEND
    MONITORING --> BACKEND
```

### Flux d'une Vente Complète

```mermaid
sequenceDiagram
    participant V as Vendeuse
    participant UI as Interface
    participant CACHE as IndexedDB
    participant API as Supabase Client
    participant AUTH as Supabase Auth
    participant DB as PostgreSQL
    participant STOCK as Stock Service

    Note over V,DB: Processus de vente avec vérifications

    V->>UI: Sélection produits
    UI->>UI: Calcul total en temps réel

    V->>UI: Validation vente
    UI->>CACHE: Vérification stock local
    CACHE-->>UI: Stock disponible

    alt Connexion Internet
        UI->>API: Créer vente
        API->>AUTH: Vérifier token
        AUTH-->>API: Token valide

        API->>DB: Insérer vente
        DB->>STOCK: decrement_stock()
        STOCK-->>DB: Stock mis à jour

        DB-->>API: Vente créée
        API-->>UI: Succès + référence

        UI->>UI: Générer PDF ticket
        UI-->>V: Ticket imprimé

    else Mode Hors Ligne
        UI->>CACHE: Sauvegarder vente localement
        CACHE-->>UI: Confirmée localement

        UI->>UI: Générer ticket temporaire
        UI-->>V: Message "Synchronisation différée"

        Note over UI: Tentative reconnexion automatique
    end

    Note over V: Processus terminé
```

---

## 📚 Ressources Supplémentaires

- [Documentation Supabase](https://supabase.com/docs)
- [Guide PWA](https://web.dev/progressive-web-apps/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Dernière mise à jour :** 30 décembre 2025
**Version architecture :** 1.0
