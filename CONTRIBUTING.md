# 🤝 Guide de Contribution - NICKOPLUS PRO

Merci de vouloir contribuer à NICKOPLUS PRO ! Ce document explique comment participer efficacement au projet.

---

## 📋 Table des Matières

1. [Code de Conduite](#code-de-conduite)
2. [Comment Contribuer](#comment-contribuer)
3. [Workflow Git](#workflow-git)
4. [Standards de Code](#standards-de-code)
5. [Tests](#tests)
6. [Pull Requests](#pull-requests)
7. [Revue de Code](#revue-de-code)

---

## 📜 Code de Conduite

### Principes

- ✅ **Respectueux** : Traiter tous les contributeurs avec respect
- ✅ **Constructif** : Fournir des retours constructifs
- ✅ **Inclusif** : Accueillir les nouveaux contributeurs
- ✅ **Professionnel** : Maintenir un environnement professionnel

### Comportements Inacceptables

- ❌ Commentaires offensants ou discriminatoires
- ❌ Harcèlement sous toute forme
- ❌ Publication d'informations privées sans consentement
- ❌ Comportement non professionnel

---

## 🚀 Comment Contribuer

### Types de Contributions

1. **Rapporter un Bug** 🐛
2. **Proposer une Fonctionnalité** 💡
3. **Améliorer la Documentation** 📚
4. **Soumettre du Code** 💻

### 1. Rapporter un Bug

Avant de créer une issue :
- ✅ Vérifiez que le bug n'est pas déjà signalé
- ✅ Testez sur la dernière version
- ✅ Préparez des informations détaillées

**Template Bug Report :**
```markdown
## Description
[Description claire du bug]

## Étapes pour Reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Observer '...'

## Résultat Attendu
[Ce qui devrait se passer]

## Résultat Actuel
[Ce qui se passe réellement]

## Environnement
- OS: [Windows/Mac/Linux]
- Browser: [Chrome 120, Firefox 115, etc.]
- Version NICKOPLUS PRO: [1.0.0]

## Screenshots
[Si applicable]

## Logs d'Erreur
[Coller les logs de la console browser]
```
[Coller les logs ici]
```

### 2. Proposer une Fonctionnalité

**Template Feature Request :**
```markdown
## Problème à Résoudre
[Quel problème cette fonctionnalité résout-elle ?]

## Solution Proposée
[Description de la fonctionnalité]

## Alternatives Considérées
[Autres approches envisagées]

## Contexte Additionnel
[Mockups, exemples, etc.]
```

### 3. Améliorer la Documentation

La documentation est cruciale ! Voici comment contribuer :

**Types de documentation :**
- 📖 README et guides utilisateurs
- 🏗️ Documentation technique (architecture, API)
- 📝 Commentaires de code
- 🧪 Documentation de tests

**Checklist documentation :**
- [ ] Vérifier l'orthographe et la grammaire
- [ ] Utiliser un langage clair et simple
- [ ] Fournir des exemples concrets
- [ ] Tester les instructions (si tutoriel)

---

## 🔄 Workflow Git

### Structure des Branches

```
main
├── develop (branche principale de développement)
│   ├── feature/nom-fonctionnalite
│   ├── fix/nom-bug
│   ├── refactor/nom-refactoring
│   └── docs/nom-documentation
└── release/v1.0.0 (branches de release)
```

### Convention de Nommage des Branches

| Type | Préfixe | Exemple |
|------|---------|---------|
| Nouvelle fonctionnalité | `feature/` | `feature/ajout-filtrage-ventes` |
| Correction de bug | `fix/` | `fix/calcul-stock-incorrect` |
| Refactoring | `refactor/` | `refactor/service-ventes` |
| Documentation | `docs/` | `docs/mise-a-jour-api` |
| Hotfix critique | `hotfix/` | `hotfix/security-jwt` |

### Étapes de Contribution

#### 1. Fork & Clone

```bash
# Fork le repo sur GitHub (bouton "Fork")
# Puis clone ton fork
git clone https://github.com/TON-USERNAME/nickoplus-pro.git
cd nickoplus-pro

# Ajoute l'upstream (repo original)
git remote add upstream https://github.com/votre-org/nickoplus-pro.git
```

#### 2. Créer une Branche

```bash
# Assure-toi d'être à jour avec develop
git checkout develop
git pull upstream develop

# Crée ta branche
git checkout -b feature/ma-fonctionnalite
```

#### 3. Développer

```bash
# Fais tes modifications
# Teste localement (voir section Tests)

# Ajoute tes changements
git add .
git commit -m "feat(ventes): ajout filtrage par date"
```

#### 4. Synchroniser avec Upstream

```bash
# Récupère les dernières modifications
git fetch upstream
git rebase upstream/develop

# Résous les conflits si nécessaire
# Puis continue le rebase
git rebase --continue
```

#### 5. Pousser ta Branche

```bash
git push origin feature/ma-fonctionnalite
```

#### 6. Créer une Pull Request

Sur GitHub :
1. Va sur ton fork
2. Clique sur "Pull Request"
3. Sélectionne `develop` comme branche cible
4. Remplis le template de PR (voir section Pull Requests)

---

## 💻 Standards de Code

### Convention de Commits (Conventional Commits)

Nous utilisons **Conventional Commits** pour des messages structurés :

**Format :**
```
<type>(<scope>): <description courte>

[Corps optionnel]

[Footer optionnel]
```

**Types autorisés :**

| Type | Description | Exemple |
|------|-------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat(ventes): ajout export Excel` |
| `fix` | Correction de bug | `fix(stocks): correction calcul seuil` |
| `docs` | Documentation seule | `docs(api): mise à jour endpoints` |
| `style` | Formatage (pas de logique) | `style: application prettier` |
| `refactor` | Refactoring (ni feat ni fix) | `refactor(auth): simplification JWT` |
| `test` | Ajout/modification tests | `test(ventes): ajout tests unitaires` |
| `chore` | Tâches maintenance | `chore: mise à jour dépendances` |
| `perf` | Amélioration performance | `perf(stocks): optimisation requête` |

**Scopes suggérés :**
- `ventes`, `stocks`, `auth`, `users`, `fournisseurs`, `dashboard`, `sync`

**Exemples complets :**

```bash
# Ajout d'une fonctionnalité
git commit -m "feat(ventes): ajout filtrage par date et boutique"

# Correction d'un bug
git commit -m "fix(stocks): correction calcul stock après vente
Le stock n'était pas décrémenté correctement pour les ventes
en mode hors ligne. Fix appliqué dans StockService.update()"

# Breaking change (changement majeur)
git commit -m "feat(api): refonte endpoint /ventes

BREAKING CHANGE: Le format de réponse a changé.
Avant: { ventes: [...] }
Après: { data: [...], pagination: {...} }"
```

### Conventions de Code React/TypeScript

#### 1. Structure des Fichiers

```
src/
├── components/                    # Composants React
│   ├── ui/                         # Composants génériques (shadcn)
│   ├── ventes/                     # Composants métier ventes
│   │   ├── VenteForm.tsx
│   │   ├── VenteList.tsx
│   │   └── VenteDetails.tsx
│   └── shared/                     # Composants partagés
│       ├── Header.tsx
│       └── LoadingSpinner.tsx
├── hooks/                         # Custom hooks
│   ├── useAuth.ts
│   ├── useVentes.ts
│   └── useLocalStorage.ts
├── lib/                           # Utilitaires
│   ├── api.ts                     # Client Supabase
│   ├── utils.ts                   # Fonctions utilitaires
│   └── constants.ts               # Constantes
├── pages/                         # Pages Next.js
├── types/                         # Types TypeScript
└── contexts/                      # React Contexts
```

#### 2. Nommage

**Composants :**
```typescript
// PascalCase pour les composants
export const VenteCard: FC<VenteCardProps> = ({ vente }) => { ... }

// camelCase pour les hooks
export const useVentes = () => { ... }

// PascalCase pour les types
interface VenteData { ... }
type VenteStatus = 'en_cours' | 'terminee' | 'annulee';
```

**Fichiers :**
```typescript
// PascalCase pour composants
VenteCard.tsx
UserProfile.tsx

// camelCase pour hooks/utils
useAuth.ts
apiClient.ts

// kebab-case pour pages
nouvelle-vente.tsx
gestion-stocks.tsx
```

#### 3. Hooks React

**Bonnes pratiques :**

```typescript
// ✅ BON : Hook personnalisé réutilisable
export const useVentes = (filters?: VenteFilters) => {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVentes = async () => {
      try {
        setLoading(true);
        const data = await apiClient.ventes.list(filters);
        setVentes(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchVentes();
  }, [filters]);

  return { ventes, loading, error, refetch: fetchVentes };
};

// ❌ MAUVAIS : Logique métier dans composant
const VenteList: FC = () => {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ❌ Logique fetch ici = MAUVAIS
    fetch('/api/ventes').then(setVentes);
  }, []);

  // ...
};
```

#### 4. Gestion d'État

**Principe :** Local first, global si nécessaire

```typescript
// ✅ BON : État local pour données simples
const [searchTerm, setSearchTerm] = useState('');

// ✅ BON : Context pour données globales (auth, thème)
const AuthContext = createContext<AuthContextType | null>(null);

// ✅ BON : TanStack Query pour données serveur
const { data: ventes, isLoading } = useQuery({
  queryKey: ['ventes', filters],
  queryFn: () => apiClient.ventes.list(filters),
});
```

#### 5. Gestion des Erreurs

```typescript
// ✅ BON : Gestion d'erreur centralisée
const VenteForm: FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: VenteData) => {
    try {
      setError(null);
      await apiClient.ventes.create(data);
      // Succès
    } catch (err) {
      if (err instanceof ValidationError) {
        setError('Données invalides : ' + err.message);
      } else if (err instanceof NetworkError) {
        setError('Problème de connexion. Vente enregistrée localement.');
      } else {
        setError('Erreur inattendue. Veuillez réessayer.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert variant="destructive">{error}</Alert>}
      {/* ... */}
    </form>
  );
};
```

---

### Conventions de Code TypeScript

#### 1. Types et Interfaces

```typescript
// ✅ BON : Interface pour objets complexes
interface Vente {
  id: string;
  reference: string;
  montantTotal: number;
  status: VenteStatus;
  createdAt: Date;
  vendeur: User;
  lignes: LigneVente[];
}

// ✅ BON : Type union pour valeurs limitées
type VenteStatus = 'en_cours' | 'terminee' | 'annulee';

// ✅ BON : Generic pour listes paginées
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### 2. Fonctions et Méthodes

```typescript
// ✅ BON : Paramètres typés explicitement
export const calculateTotal = (lignes: LigneVente[]): number => {
  return lignes.reduce((total, ligne) => total + ligne.sousTotal, 0);
};

// ✅ BON : Return type explicite pour fonctions complexes
export const createVente = async (data: CreateVenteDto): Promise<Vente> => {
  // Validation
  if (!data.lignesVente?.length) {
    throw new ValidationError('Au moins une ligne de vente requise');
  }

  // Création
  const vente = await supabase
    .from('sales')
    .insert(data)
    .select()
    .single();

  return vente;
};
```

#### 3. Gestion des null/undefined

```typescript
// ✅ BON : Optional chaining et nullish coalescing
const userName = user?.profile?.firstName ?? 'Utilisateur anonyme';

// ✅ BON : Type guards pour vérifications
const isAuthenticated = (user: User | null): user is User => {
  return user !== null && user.id !== undefined;
};

// ✅ BON : Discriminated unions
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const handleResponse = (response: ApiResponse<Vente>) => {
  if (response.success) {
    // response.data est de type Vente
    console.log(response.data.reference);
  } else {
    // response.error est de type string
    console.error(response.error);
  }
};
```

---

## 🧪 Tests

### Frontend Tests (Vitest + React Testing Library)

#### Tests de Composants

```typescript
// components/ventes/VenteCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VenteCard } from './VenteCard';

describe('VenteCard', () => {
  const mockVente = {
    id: '1',
    reference: 'V-20250112-001',
    montantTotal: 25000,
  };

  it('renders vente information', () => {
    render(<VenteCard vente={mockVente} />);

    expect(screen.getByText('V-20250112-001')).toBeInTheDocument();
    expect(screen.getByText('25000 FCFA')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const handleDelete = jest.fn();
    render(<VenteCard vente={mockVente} onDelete={handleDelete} />);

    fireEvent.click(screen.getByText('Supprimer'));

    expect(handleDelete).toHaveBeenCalledWith('1');
  });
});
```

#### Tests de Hooks

```typescript
// hooks/useVentes.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useVentes } from './useVentes';

describe('useVentes', () => {
  it('fetches ventes successfully', async () => {
    const { result } = renderHook(() => useVentes());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ventes).toBeDefined();
    expect(result.current.error).toBe(null);
  });
});
```

**Commandes :**
```bash
# Tous les tests
npm run test

# Tests avec coverage
npm run test:coverage

# Mode watch
npm run test:watch

# Tests spécifiques
npm run test VenteCard.test.tsx
```

---

### Tests d'Intégration (Supabase)

```typescript
// tests/integration/ventes.integration.test.ts
import { createClient } from '@supabase/supabase-js';
import { apiClient } from '@/lib/api';

describe('Ventes Integration', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  beforeEach(async () => {
    // Nettoyer la base de test
    await supabase.from('sales').delete().neq('id', '');
  });

  it('creates and retrieves a vente', async () => {
    const venteData = {
      boutiqueId: 'test-boutique',
      lignesVente: [{ produitId: 'test-produit', quantite: 2 }],
      montantTotal: 10000,
    };

    // Créer une vente
    const created = await apiClient.ventes.create(venteData);
    expect(created.id).toBeDefined();

    // Récupérer la vente
    const retrieved = await apiClient.ventes.get(created.id);
    expect(retrieved.reference).toBe(created.reference);
  });
});
```

---

### Couverture de Tests Requise

| Type | Couverture Minimale | Cible |
|------|---------------------|-------|
| **Composants React** | 70% | 80% |
| **Custom Hooks** | 80% | 90% |
| **Utilitaires** | 90% | 95% |
| **Intégration API** | 60% | 75% |

---

## 📥 Pull Requests

### Template Pull Request

Quand vous créez une PR, utilisez ce template :

```markdown
## Description
[Description claire de ce que fait cette PR]

## Type de Changement
- [ ] 🐛 Bug fix (changement non-breaking qui corrige une issue)
- [ ] ✨ Nouvelle fonctionnalité (changement non-breaking qui ajoute une fonctionnalité)
- [ ] 💥 Breaking change (fix ou feature qui causerait des changements incompatibles)
- [ ] 📝 Documentation (changement de documentation uniquement)

## Motivation et Contexte
[Pourquoi ce changement est nécessaire ? Quelle issue résout-il ?]

Fixes #(issue_number)

## Comment a-t-il été testé ?
- [ ] Tests unitaires ajoutés/modifiés
- [ ] Tests d'intégration ajoutés/modifiés
- [ ] Tests manuels effectués

**Environnement de test :**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome, Firefox, etc.]

## Screenshots (si applicable)
[Ajouter des screenshots pour les changements UI]

## Checklist
- [ ] Mon code suit les conventions du projet
- [ ] J'ai effectué une auto-revue de mon code
- [ ] J'ai commenté les parties complexes
- [ ] J'ai mis à jour la documentation
- [ ] Mes changements ne génèrent pas de warnings
- [ ] J'ai ajouté des tests qui prouvent que mon fix/feature fonctionne
- [ ] Les tests nouveaux et existants passent localement
- [ ] J'ai mis à jour le CHANGELOG.md (si applicable)

## Revueurs Suggérés
@frontend-lead @qa-lead
```

---

## 👀 Revue de Code

### Checklist Revueur

Quand vous revoyez une PR, vérifiez :

#### **Code Quality**
- [ ] Le code est lisible et bien structuré
- [ ] Pas de code dupliqué
- [ ] Nommage clair des variables/fonctions
- [ ] Pas de magic numbers/strings

#### **Fonctionnalité**
- [ ] La feature fonctionne comme décrit
- [ ] Pas de régression introduite
- [ ] Gestion appropriée des erreurs

#### **Tests**
- [ ] Tests présents et pertinents
- [ ] Couverture de tests suffisante
- [ ] Tests passent tous

#### **Performance**
- [ ] Pas de requêtes inutiles
- [ ] Optimisations appropriées
- [ ] Pas de memory leaks

#### **Sécurité**
- [ ] Validation des inputs
- [ ] Pas de failles évidentes
- [ ] Gestion appropriée des permissions

#### **Documentation**
- [ ] Code commenté si nécessaire
- [ ] Documentation mise à jour
- [ ] README mis à jour si applicable

### Comment Reviewer

**✅ BON feedback :**
```
Suggestion : Pourrait-on extraire cette logique dans un hook séparé
pour améliorer la réutilisabilité ?

```typescript
const useVenteFilters = (initialFilters) => {
  // Logique de filtrage ici
};
```
```

**❌ MAUVAIS feedback :**
```
Ce code est nul, refais-le.
```

---

## 🆘 Besoin d'Aide ?

- 📖 **Documentation** : Consultez `/docs`
- 💬 **Slack** : Channel `#nickoplus-dev`
- 📧 **Email** : dev@nickoplus-project.com
- 👥 **Mentors** :
  - Frontend : @frontend-lead
  - Architecture : @tech-lead
  - QA : @qa-lead

---

**Merci de contribuer à NICKOPLUS PRO ! 🎉**
