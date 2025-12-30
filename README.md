# 🏪 NICKOPLUS PRO - Système de Gestion Boutiques

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Système de gestion des ventes et stocks pour les boutiques Nicko (Douala & Kribi)

---

## 📖 Table des Matières

- [À Propos](#à-propos)
- [Fonctionnalités Principales](#fonctionnalités-principales)
- [Architecture](#architecture)
- [Installation Rapide](#installation-rapide)
- [Documentation](#documentation)
- [Contribution](#contribution)
- [Équipe](#équipe)
- [Support](#support)

---

## 🎯 À Propos

**NICKOPLUS PRO** est une application web progressive (PWA) conçue pour digitaliser et optimiser la gestion des boutiques Nicko spécialisées dans la décoration d'intérieur.

### Contexte

Les boutiques Nicko (Douala et Kribi) géraient manuellement leurs ventes et stocks, entraînant :
- ❌ Erreurs de stock fréquentes
- ❌ Perte de temps considérable
- ❌ Absence de traçabilité
- ❌ Pas de vision consolidée multi-boutiques

### Solution

NICKOPLUS PRO apporte :
- ✅ Enregistrement rapide des ventes (< 2 min)
- ✅ Gestion automatisée des stocks
- ✅ Synchronisation temps réel entre boutiques
- ✅ Dashboard de pilotage pour la gérante
- ✅ **Mode hors ligne** (connectivité instable)

---

## 🚀 Fonctionnalités Principales

### 💰 Module Ventes
- Enregistrement rapide de ventes
- Génération automatique de tickets (PDF)
- Historique complet avec filtres
- Support mode hors ligne

### 📦 Module Stocks
- Consultation en temps réel par boutique
- Alertes automatiques de rupture de stock
- Mise à jour automatique après vente
- Gestion des catégories de produits

### 🔄 Synchronisation Multi-Boutiques
- Synchronisation automatique toutes les 5 minutes
- Résolution intelligente de conflits
- Cache local avec IndexedDB
- Détection automatique de perte de connexion

### 📊 Dashboard Administrateur
- KPIs temps réel (ventes, recettes, stocks)
- Graphiques de performance (7 jours, mois, année)
- Rapports exportables (PDF, Excel)
- Gestion utilisateurs et fournisseurs

### 🏢 Module Fournisseurs
- CRUD complet des fournisseurs
- Création et suivi de commandes
- Historique des livraisons
- Génération de commandes automatiques (si stock < seuil)

---

## 🏗️ Architecture

### Stack Technique

#### **Frontend**
- **Framework** : React 18+ avec Next.js 14+ (App Router)
- **Styling** : Tailwind CSS 3+
- **PWA** : Service Worker + IndexedDB
- **Graphiques** : Recharts
- **Icônes** : Lucide React
- **Déploiement** : Vercel (gratuit)

#### **Base de Données**
- **Plateforme** : Supabase (PostgreSQL serverless)
- **Authentification** : Supabase Auth (JWT)
- **Realtime** : Synchronisation temps réel
- **Stockage** : Supabase Storage (images, PDFs)

#### **DevOps**
- **Version Control** : Git + GitHub
- **CI/CD** : GitHub Actions
- **Cache hors ligne** : IndexedDB (idb-keyval)
- **Exports** : PDF (jspdf), Excel (xlsx)

### Schéma d'Architecture Simplifié

```
┌─────────────────────────────────────────┐
│         UTILISATEURS                    │
│  Vendeurs | Gérante | Superviseur      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       FRONTEND (React + Next.js)        │
│  • Interface Vendeur (Ventes)           │
│  • Dashboard Admin (KPIs, Rapports)     │
│  • Mode Hors Ligne (PWA)                │
│  • Cache IndexedDB                      │
└────────────────┬────────────────────────┘
                 │ HTTPS/WebSocket
                 ▼
┌─────────────────────────────────────────┐
│         SUPABASE (BaaS)                 │
│  • PostgreSQL Database                  │
│  • Authentication (JWT)                 │
│  • Realtime subscriptions               │
│  • File Storage (PDFs, images)          │
│  • Edge Functions (optionnel)           │
└─────────────────────────────────────────┘
```

**Voir documentation détaillée :** [docs/architecture/overview.md](docs/architecture/overview.md)

---

## ⚡ Installation Rapide

### Prérequis

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Git** ≥ 2.x
- **Compte Supabase** (gratuit)

### Installation Frontend

```bash
# Clone le repository
git clone https://github.com/votre-org/nickoplus-pro.git
cd nickoplus-pro

# Installation des dépendances
npm install

# Configuration environnement
cp .env.example .env.local

# Éditer .env.local avec vos clés Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key

# Lancement en mode développement
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

### Configuration Supabase

1. **Créer un projet** sur [supabase.com](https://supabase.com)
2. **Exécuter les migrations** :
   ```bash
   # Dans le dossier supabase
   cd supabase
   npx supabase db reset
   ```
3. **Récupérer les clés** dans Settings > API
4. **Ajouter dans `.env.local`**

### Connexion Initiale

**Compte administrateur par défaut :**
- **Email** : `admin@nickoplus.com`
- **Mot de passe** : `Admin@2025`

⚠️ **Important** : Changez le mot de passe immédiatement après la première connexion !

---

## 📚 Documentation

### Documentation Développeur

| Document | Description | Lien |
|----------|-------------|------|
| **Contributing Guide** | Comment contribuer au projet | [CONTRIBUTING.md](CONTRIBUTING.md) |
| **Architecture Détaillée** | Choix techniques, patterns, diagrammes | [docs/architecture/](docs/architecture/) |
| **API Documentation** | Référence complète des appels Supabase | [docs/api/](docs/api/) |
| **Coding Standards** | Conventions de code, linting | [docs/development/coding-standards.md](docs/development/) |
| **Testing Guide** | Stratégie de tests, frameworks | [docs/development/testing.md](docs/development/) |

### Documentation Utilisateur

| Document | Public | Lien |
|----------|--------|------|
| **Guide Vendeur** | Vendeuses (ventes quotidiennes) | [docs/user-guides/vendeur.md](docs/user-guides/) |
| **Guide Gérante** | Gérante (pilotage, décisions) | [docs/user-guides/gerante.md](docs/user-guides/) |
| **Guide Admin Système** | Admin IT (déploiement, maintenance) | [docs/operations/](docs/operations/) |

### Documentation Technique

| Document | Description | Lien |
|----------|-------------|------|
| **Analyse Critique** | Évaluation documentation existante | [docs/README.md](docs/README.md) |
| **SFD** | Spécifications Fonctionnelles Détaillées | [docs/specifications/SFD.md](docs/specifications/) |
| **Contrat d'Interface API** | Contrat Frontend ↔ Supabase | [docs/api/contract.md](docs/api/) |
| **Matrice de Traçabilité** | Exigences → User Stories → Tests | [docs/specifications/traceability-matrix.md](docs/specifications/) |

---

## 🤝 Contribution

Nous accueillons chaleureusement les contributions ! Voici comment participer :

### 1. Fork & Clone

```bash
# Fork le repo sur GitHub
# Puis clone ton fork
git clone https://github.com/TON-USERNAME/nickoplus-pro.git
cd nickoplus-pro
```

### 2. Créer une Branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug-xyz
```

### 3. Développer & Tester

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Tests
npm run test

# Linting
npm run lint
```

### 4. Commit avec Convention

Nous utilisons **Conventional Commits** :

```bash
# Nouvelles fonctionnalités
git commit -m "feat(ventes): ajout filtrage par date"

# Corrections de bugs
git commit -m "fix(stocks): correction calcul seuil alerte"

# Documentation
git commit -m "docs(api): mise à jour endpoint /ventes"

# Refactoring
git commit -m "refactor(auth): simplification logique JWT"
```

### 5. Push & Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
# Créer une Pull Request sur GitHub
```

**Voir le guide complet :** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 👥 Équipe

### Équipe de Développement

| Rôle | Nom | Responsabilités | Contact |
|------|-----|-----------------|---------|
| **Chef de Projet** | Kenmogne | Coordination, planification, client | kenmogne@example.com |
| **Lead Frontend** | [Nom] | Architecture React, UI/UX, Supabase | frontend@example.com |
| **DevOps** | [Nom] | CI/CD, déploiement, monitoring | devops@example.com |
| **QA Lead** | [Nom] | Tests, assurance qualité | qa@example.com |

### Superviseur Académique

- **Nom** : [Nom du superviseur]
- **Institution** : [Université/École]
- **Email** : superviseur@university.edu

### Client

- **Entreprise** : Boutiques Nicko
- **Contact Principal** : Gérante
- **Boutiques** : Douala & Kribi (Cameroun)

---

## 🆘 Support

### Besoin d'Aide ?

- 📖 **Documentation** : Consultez d'abord la [documentation complète](docs/)
- 💬 **Discussions** : Posez vos questions dans les [GitHub Discussions](https://github.com/votre-org/nickoplus-pro/discussions)
- 🐛 **Bug Report** : Signalez un bug via [GitHub Issues](https://github.com/votre-org/nickoplus-pro/issues)
- 💡 **Feature Request** : Proposez une fonctionnalité via [GitHub Issues](https://github.com/votre-org/nickoplus-pro/issues)

### Canaux de Communication

- **Slack** : [#nickoplus-pro](https://votre-workspace.slack.com/archives/nickoplus-pro)
- **Email Équipe** : team@nickoplus-project.com
- **Réunions Hebdomadaires** : Tous les lundis 10h (Google Meet)

---

## 📊 Statut du Projet

### Roadmap

- [x] **Sprint 1-2** : Authentification + Base de données
- [x] **Sprint 3-4** : Module Ventes + Stocks
- [ ] **Sprint 5** : Mode Hors Ligne + Synchronisation
- [ ] **Sprint 6** : Dashboard + Fournisseurs
- [ ] **Sprint 7** : Tests finaux + Déploiement

### Métriques Actuelles

| Métrique | Valeur | Cible |
|----------|--------|-------|
| **Tests Coverage** | 68% | ≥ 70% |
| **Bugs Ouverts** | 5 | < 10 |
| **Performance (Lighthouse)** | 88 | ≥ 90 |
| **Disponibilité** | 99.2% | ≥ 99% |

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- **Boutiques Nicko** pour la confiance accordée
- **Superviseur académique** pour l'encadrement
- **Communautés Open Source** : React, Supabase, Tailwind CSS
- **Outils gratuits** : Vercel, Supabase, GitHub

---

## 📞 Contact

**Projet NICKOPLUS PRO**  
📧 Email : contact@nickoplus-project.com  
🌐 Site : https://nickoplus.app  
📱 GitHub : [@nickoplus-pro](https://github.com/votre-org/nickoplus-pro)

---

**Dernière mise à jour :** 30 décembre 2025  
**Version :** 1.0.0  
**Statut :** 🟢 En développement actif
