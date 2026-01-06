# 🚀 GUIDE DÉPLOIEMENT - NICKOPLUS PRO

Procédures complètes de mise en production et maintenance du système NICKOPLUS PRO.

---

## 📋 Table des Matières

1. [Prérequis Système](#prérequis-système)
2. [Configuration Environnements](#configuration-environnements)
3. [Déploiement Supabase](#déploiement-supabase)
4. [Déploiement Frontend](#déploiement-frontend)
5. [Configuration Production](#configuration-production)
6. [Tests Post-Déploiement](#tests-post-déploiement)
7. [Maintenance & Monitoring](#maintenance--monitoring)
8. [Procédures d'Urgence](#procédures-durgence)

---

## 🖥️ Prérequis Système

### **Environnements Requis**

#### **Développement**
```bash
# Machine développeur
OS: Windows 11 / macOS / Linux
RAM: 8GB minimum
Disque: 50GB disponible
Node.js: 18.x LTS
Git: 2.30+
```

#### **Production**
```bash
# Serveurs
Frontend: Vercel (recommandé)
Backend: Supabase (hébergé)
Base de données: PostgreSQL 14+ (Supabase)
Stockage: Supabase Storage
```

### **Comptes & Accès**
- **Supabase** : Compte Pro ($25/mois) pour production
- **Vercel** : Compte gratuit (hobby plan)
- **GitHub** : Repository privé
- **Domaines** : nickoplus.com + SSL

### **Outils Déploiement**
```bash
# CLI Tools
npm/npx: Package management
Vercel CLI: Déploiement frontend
Supabase CLI: Gestion backend
Git: Version control

# Monitoring
Sentry: Error tracking
Supabase Analytics: Usage metrics
UptimeRobot: Monitoring disponibilité
```

---

## 🌍 Configuration Environnements

### **Variables d'Environnement**

#### **Fichier `.env.local` (Développement)**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
VITE_APP_NAME=NICKOPLUS PRO
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# Features Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

#### **Variables Vercel (Production)**
```bash
# Dashboard Vercel > Project Settings > Environment Variables
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_NAME=NICKOPLUS PRO
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### **Configuration Supabase**

#### **1. Créer Projet Supabase**
```bash
# Via Dashboard ou CLI
npx supabase login
npx supabase projects create "nickoplus-prod"
```

#### **2. Configuration Base de Données**
```sql
-- Activer Row Level Security
ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "boutique_policy" ON ventes
FOR ALL USING (boutique_id = get_user_boutique(auth.uid()));
```

#### **3. Variables Supabase**
```
# Authentication
JWT_SECRET: auto-généré
JWT_EXPIRY: 3600s (1h)

# Database
DB_URL: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Storage
STORAGE_URL: https://[project-ref].supabase.co/storage/v1
```

---

## 🗄️ Déploiement Supabase

### **Étape 1 : Migration depuis Lovable**
```bash
# Exporter le projet depuis Lovable
# Lovable fournit une exportation complète du code + base de données

# Cloner le repository exporté
git clone https://github.com/your-org/nikoplus.git
cd nikoplus

# Configuration pour migration future vers Supabase
# (Les étapes Supabase seront exécutées lors de la migration)
```

### **Étape 2 : Migration Base de Données**
```bash
# Appliquer migrations existantes
npx supabase db push

# Vérifier statut
npx supabase status
```

### **Étape 3 : Configuration Authentification**
```sql
-- Dans SQL Editor Supabase
INSERT INTO auth.settings (
  site_url,
  additional_redirect_urls,
  jwt_expiry
) VALUES (
  'https://nickoplus.com',
  '["https://nickoplus.vercel.app"]',
  3600
);
```

### **Étape 4 : Seed Données Initiales**
```bash
# Créer utilisateur admin
npx supabase db reset  # Reset + seed

# Ou manuellement via SQL
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES ('admin-uuid', 'gerante@nickoplus.com', 'Gérante', 'Nicko', 'admin');
```

### **Étape 5 : Configuration Storage**
```bash
# Créer buckets
npx supabase storage create tickets --public
npx supabase storage create products --public

# Politiques d'accès
# Via Dashboard Supabase > Storage > Policies
```

---

## 🌐 Déploiement Frontend

### **Étape 1 : Build Production**
```bash
# Installer dépendances
npm install

# Build optimisé
npm run build

# Vérifier build
ls -la dist/
```

### **Étape 2 : Configuration Vercel**
```bash
# Installer Vercel CLI
npm i -g vercel

# Connexion
vercel login

# Déploiement initial
vercel --prod

# Ou déploiement lié au repo
vercel link
vercel --prod
```

### **Étape 3 : Configuration Domain**
```bash
# Ajouter domaine personnalisé
vercel domains add nickoplus.com

# Configuration DNS (chez registrar)
# Type: CNAME
# Name: @
# Value: cname.vercel-dns.com
```

### **Étape 4 : Variables Environnement**
```bash
# Via Vercel Dashboard ou CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_SENTRY_DSN
```

### **Étape 5 : Optimisations Performance**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

---

## ⚙️ Configuration Production

### **Étape 1 : SSL & Sécurité**
```bash
# SSL automatique avec Vercel
# HSTS headers configurés
# CSP (Content Security Policy)
```

### **Étape 2 : Monitoring & Analytics**
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### **Étape 3 : Sauvegardes Automatiques**
```bash
# Configuration Supabase
# Dashboard > Database > Backups
# - Daily backups: Enabled
# - Retention: 30 days
# - Point-in-time recovery: Enabled
```

### **Étape 4 : Rate Limiting**
```sql
-- Via Supabase SQL Editor
CREATE OR REPLACE FUNCTION rate_limit_check(user_id uuid, action text)
RETURNS boolean AS $$
DECLARE
  request_count int;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM audit_logs
  WHERE user_id = $1
    AND action = $2
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN request_count < 100; -- 100 req/hour max
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Tests Post-Déploiement

### **Checklist Déploiement**

#### **Tests Fonctionnels**
- [ ] Connexion utilisateur ✅
- [ ] Création vente ✅
- [ ] Mise à jour stock automatique ✅
- [ ] Génération ticket PDF ✅
- [ ] Synchronisation multi-boutiques ✅
- [ ] Mode hors ligne ✅

#### **Tests Performance**
- [ ] Temps chargement < 3s ✅
- [ ] API response < 500ms ✅
- [ ] PWA installable ✅

#### **Tests Sécurité**
- [ ] Authentification JWT ✅
- [ ] RLS activé ✅
- [ ] HTTPS forcé ✅
- [ ] XSS protection ✅

#### **Tests Intégration**
- [ ] Webhooks fonctionnels ✅
- [ ] Notifications email ✅
- [ ] Exports PDF/Excel ✅

### **Tests Utilisateur Final**

#### **Scénario Test Vendeur**
1. **Connexion** : Email/mot de passe
2. **Création vente** : 3 produits, client, paiement
3. **Génération ticket** : PDF imprimable
4. **Vérification stock** : Mise à jour automatique

#### **Scénario Test Gérante**
1. **Dashboard** : KPIs, graphiques, alertes
2. **Gestion utilisateurs** : CRUD complet
3. **Rapports** : Export PDF/Excel
4. **Paramètres** : Configuration système

### **Outils de Test**
```bash
# Tests E2E
npm run test:e2e

# Tests de charge
npm run test:load

# Tests sécurité
npm run test:security

# Monitoring production
npm run monitor
```

---

## 🔧 Maintenance & Monitoring

### **Monitoring Quotidien**

#### **Métriques Clés**
- **Disponibilité** : 99.9% uptime target
- **Performance** : Response time < 500ms
- **Erreurs** : < 0.1% error rate
- **Usage** : Active users, page views

#### **Outils Monitoring**
```typescript
// src/lib/monitoring.ts
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'your-app-id',
  clientToken: 'your-client-token',
  site: 'datadoghq.com',
  service: 'nickoplus',
  env: 'production',
  version: '1.0.0',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
});
```

### **Maintenance Programmée**

#### **Tâches Hebdomadaires**
- [ ] Vérification sauvegardes automatiques
- [ ] Nettoyage logs anciens (> 90 jours)
- [ ] Mise à jour dépendances sécurité
- [ ] Test recovery disaster

#### **Tâches Mensuelles**
- [ ] Audit sécurité complet
- [ ] Optimisation performance base
- [ ] Mise à jour certificats SSL
- [ ] Revue logs sécurité

#### **Tâches Trimestrielles**
- [ ] Penetration testing
- [ ] Performance audit complet
- [ ] Mise à jour plan continuité
- [ ] Formation équipe support

### **Mises à Jour**
```bash
# Processus standard
1. Créer branche feature/update-v1.1.0
2. Tests complets en staging
3. Déploiement progressif (canary)
4. Monitoring 24h post-déploiement
5. Rollback automatique si anomalies
```

---

## 🚨 Procédures d'Urgence

### **Plan de Continuité d'Activité (PCA)**

#### **Niveau 1 : Incident Mineur**
**Exemples** : API lente, alerte stock
**Actions** :
1. Diagnostic automatique via monitoring
2. Escalade équipe support
3. Communication utilisateurs si impact

#### **Niveau 2 : Incident Majeur**
**Exemples** : Service indisponible, corruption données
**Actions** :
1. Activation runbook d'urgence
2. Basculement backup automatique
3. Communication stakeholders
4. Investigation root cause

#### **Niveau 3 : Catastrophe**
**Exemples** : Perte totale données, attaque cyber
**Actions** :
1. Activation plan disaster recovery
2. Restauration depuis backup géographique
3. Communication crise
4. Audit post-incident

### **Runbooks d'Urgence**

#### **Runbook : Service Indisponible**
```bash
# 1. Diagnostic
supabase status
vercel logs --follow

# 2. Vérification monitoring
sentry issues list
uptime status

# 3. Escalade si nécessaire
- Restart services
- Rollback version
- Contact support Supabase/Vercel

# 4. Communication
- Status page update
- Email utilisateurs impactés
- Mise à jour timeline
```

#### **Runbook : Corruption Données**
```bash
# 1. Isolation
supabase db pause

# 2. Backup actuel (si possible)
supabase db dump > emergency-backup.sql

# 3. Restauration dernier backup sain
supabase db restore backup-2024-01-05.sql

# 4. Vérification intégrité
supabase db health

# 5. Communication
- Alert tous utilisateurs
- Timeline récupération
- Support renforcé 48h
```

### **Contacts d'Urgence**
- **Équipe Dev** : dev@nickoplus.com (24/7)
- **Support Supabase** : support@supabase.com
- **Support Vercel** : support@vercel.com
- **Gérante** : gerante@nickoplus.com

---

## 📊 Métriques & KPIs Production

### **Disponibilité & Performance**
- **Uptime** : 99.9% (target)
- **Response Time** : < 500ms P95
- **Error Rate** : < 0.1%
- **Throughput** : 1000 req/min max

### **Business Metrics**
- **Active Users** : 15+ utilisateurs simultanés
- **Transaction Volume** : 50+ ventes/jour
- **Data Sync** : < 5min latence
- **Storage Growth** : 10GB/mois max

### **Qualité**
- **Crash Rate** : < 0.5%
- **User Satisfaction** : > 4.5/5
- **Support Tickets** : < 5/mois
- **Time to Resolution** : < 4h

---

## 🔄 Rollback & Recovery

### **Stratégie Rollback**
```bash
# Rollback frontend (Vercel)
vercel rollback [deployment-id]

# Rollback database (Supabase)
supabase db restore [backup-id]

# Rollback features (Feature flags)
# Via Supabase dashboard ou environment variables
```

### **Recovery Time Objectives (RTO/RPO)**
- **RTO** (Recovery Time Objective) : 4 heures max
- **RPO** (Recovery Point Objective) : 1 heure max de données perdues
- **RTO Critique** : 1 heure pour services essentiels

---

## 📚 Documentation Maintenance

### **Mise à Jour Documentation**
- **Hebdomadaire** : Vérifier cohérence docs/code
- **Post-déploiement** : Mettre à jour guides utilisateur
- **Changement métier** : Actualiser procédures

### **Support Formation**
- **Formation initiale** : 4h par utilisateur
- **Refraîchissement** : Trimestriel
- **Documentation** : Guides détaillés + vidéos

---

**Date de création :** 6 janvier 2026  
**Version :** 1.0.0  
**Responsable déploiement :** Équipe DevOps  
**Validation :** Lead Developer + Gérante
