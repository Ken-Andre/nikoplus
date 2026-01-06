# 👩‍💼 GUIDE UTILISATEUR GÉRANTE - NICKOPLUS PRO

Guide complet pour la gérante utilisant NICKOPLUS PRO pour piloter les boutiques Nicko.

---

## 📋 Table des Matières

1. [Vue d'Ensemble du Rôle](#vue-densemble-du-rôle)
2. [Connexion & Authentification](#connexion--authentification)
3. [Dashboard Principal](#dashboard-principal)
4. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
5. [Gestion des Boutiques](#gestion-des-boutiques)
6. [Supervision des Stocks](#supervision-des-stocks)
7. [Rapports & Analytics](#rapports--analytics)
8. [Paramètres Système](#paramètres-système)
9. [Résolution des Problèmes](#résolution-des-problèmes)

---

## 🎯 Vue d'Ensemble du Rôle

En tant que gérante, vous êtes l'**administrateur principal** du système NICKOPLUS PRO. Vos responsabilités incluent :

### **Pilotage Stratégique**
- **Suivi des performances** : Ventes, marges, tendances
- **Gestion des ressources** : Utilisateurs, boutiques, stocks
- **Reporting** : Rapports hebdomadaires/mensuels
- **Décisions opérationnelles** : Approvisionnement, promotions

### **Gestion Opérationnelle**
- **Contrôle qualité** : Stocks, ventes, conformité
- **Support utilisateurs** : Formation, résolution problèmes
- **Sécurité système** : Accès, sauvegardes, monitoring
- **Évolution métier** : Nouveaux produits, fournisseurs

### **Horaires Typiques d'Utilisation**
- **Matin (8h-10h)** : Revue KPIs, alertes critiques
- **Mi-journée (11h-12h)** : Gestion stocks, commandes
- **Après-midi (14h-16h)** : Suivi opérations, rapports
- **Fin journée (16h-17h)** : Synthèse, planification

---

## 🔐 Connexion & Authentification

### **Accès Administrateur**
1. Rendez-vous sur l'URL fournie par l'équipe technique
2. Utilisez vos identifiants administrateur :
   - **Email** : gerante@nickoplus.com (ou équivalent)
   - **Mot de passe** : Fourni lors de la formation

### **Première Connexion**
Après authentification, vous arrivez directement sur le **Dashboard Administrateur** avec :
- Vue d'ensemble temps réel de toutes les boutiques
- Alertes prioritaires (stocks critiques, synchronisation)
- KPIs consolidés Douala + Kribi

### **Sécurité & Sessions**
- **Auto-déconnexion** : Après 2h d'inactivité
- **Sessions multiples** : Accès simultané autorisé
- **Historique** : Tous les accès tracés pour audit

---

## 📊 Dashboard Principal

### **Structure Générale**

```
┌─────────────────────────────────────────────────────────┐
│ HEADER : NICKOPLUS PRO - Administrateur                │
│ 👤 [Votre nom] - Admin │ 🟢 En ligne │ 🔔 Notifications │
├─────────────────────────────────────────────────────────┤
│ CARDS KPIs PRINCIPAUX (6 cards en grille)              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │Utili│ │Bouti│ │Vente│ │CA   │ │Produ│ │Alert│        │
│ │sateur│ │ques │ │s    │ │Total│ │its  │ │es   │        │
│ │s    │ │     │ │30j  │ │30j  │ │     │ │non  │        │
│ │15   │ │2    │ │245  │ │2.1M │ │1 250│ │8    │        │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────────────────────────────┤
│ GRAPHIQUES (2 colonnes)                                │
│ ┌─────────────────────────────────────┐ ┌─────────────┐ │
│ │ Tendance CA (30 jours)             │ │ Ventes      │ │
│ │ [Graphique en ligne]               │ │ quotidiennes│ │
│ │                                     │ │ [Histogramme]│ │
│ └─────────────────────────────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────┤
│ TOP BOUTIQUES & ALERTES CRITIQUES                      │
│ ┌─────────────────────────────────────┐ ┌─────────────┐ │
│ │ Top 5 Boutiques (CA 30j)           │ │ Alertes     │ │
│ │ 1. Douala - 1.2M XAF              │ │ critiques   │ │
│ │ 2. Kribi - 850k XAF               │ │ 🔴 3 actives │ │
│ │ ...                                │ │             │ │
│ └─────────────────────────────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ACTIONS RAPIDES                                        │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│ │Gestion          │ │Gestion          │ │Rapports     │ │
│ │Utilisateurs     │ │Boutiques        │ │globaux      │ │
│ └─────────────────┘ └─────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Cards KPIs Détaillées**

#### **1. Utilisateurs**
- **Total actifs** : 15 (comptés automatiquement)
- **Répartition** : 1 Admin, 3 Managers, 11 Vendeurs
- **Évolution** : +2 ce mois
- **Action** : Clic → Gestion utilisateurs

#### **2. Boutiques**
- **Total** : 2 (Douala + Kribi)
- **Statut** : Toutes actives
- **Synchronisation** : Dernière synchro il y a 5 min
- **Action** : Clic → Gestion boutiques

#### **3. Ventes (30 jours)**
- **Nombre total** : 245 ventes
- **Évolution** : +15% vs mois précédent
- **Moyenne journalière** : 8 ventes/jour
- **Pic** : 15 ventes (mardi dernier)

#### **4. Chiffre d'Affaires (30 jours)**
- **Montant** : 2.1M XAF
- **Évolution** : +12% vs mois précédent
- **Marge moyenne** : 35%
- **Par boutique** : Douala 65%, Kribi 35%

#### **5. Produits**
- **Total catalogue** : 1 250 références
- **Actifs** : 1 248 (2 désactivés)
- **Nouveaux ce mois** : 15
- **Catégories** : 8 principales

#### **6. Alertes**
- **Non résolues** : 8
- **Critiques** : 3 (ruptures totales)
- **Résolues cette semaine** : 12
- **Action** : Clic → Liste détaillée

### **Graphiques Interactifs**

#### **Tendance du Chiffre d'Affaires**
- **Période** : 30 derniers jours
- **Granularité** : Par jour
- **Métriques** :
  - Ligne principale : CA total
  - Tooltip : Détail par jour
  - Comparaison : Objectifs vs Réel
- **Interactions** : Zoom, export PNG

#### **Histogramme des Ventes**
- **Métrique** : Nombre de ventes par jour
- **Couleurs** : Vert (normal), Rouge (pic > 15 ventes)
- **Moyenne** : Ligne horizontale
- **Export** : Données Excel disponibles

### **Top Boutiques & Alertes**

#### **Classement Performance**
- **Critères** : CA 30 jours décroissant
- **Affichage** : Nom + montant + évolution %
- **Détails** : Nombre ventes, marge moyenne
- **Action** : Clic → Dashboard boutique détaillé

#### **Alertes Critiques**
- **Types** : Rupture stock, commande retard, synchro échouée
- **Priorité** : Color coding (🔴 Critique, 🟡 Important, 🟢 Info)
- **Actions** : Résoudre, contacter vendeur, créer commande
- **Historique** : 7 derniers jours conservés

---

## 👥 Gestion des Utilisateurs

### **Accès à la Gestion**
1. Dashboard → "Gestion des utilisateurs"
2. Ou menu latéral → "Administration" → "Utilisateurs"

### **Fonctionnalités Disponibles**

#### **Liste des Utilisateurs**
```
┌─────────────────────────────────────────────────────────┐
│ UTILISATEURS ACTIFS (15 total)                         │
│                                                       │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🔍 Filtres : Rôle ▼ | Boutique ▼ | Statut ▼    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📋 LISTE UTILISATEURS                           │   │
│ │ ┌─────────────────────────────────────────┐   │   │
│ │ │ 👤 Jean Mbarga                         │   │   │
│ │ │ vendeur@nickoplus.com                  │   │   │
│ │ │ Rôle : Vendeur | Boutique : Douala     │   │   │
│ │ │ Statut : Actif | Dernière connexion    │   │   │
│ │ │ [MODIFIER] [DÉSACTIVER]                │   │   │
│ │ └─────────────────────────────────────────┘   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ [BOUTON AJOUTER UTILISATEUR]                         │
└─────────────────────────────────────────────────────────┘
```

#### **Créer un Nouvel Utilisateur**
1. Bouton **"Nouveau"** ou **"+"**
2. Formulaire :
   - **Email** : Obligatoire, unique
   - **Prénom/Nom** : Pour affichage
   - **Rôle** : Admin, Manager, Vendeur
   - **Boutique** : Affectation géographique
   - **Mot de passe temporaire** : Généré automatiquement
3. Validation → Email d'invitation envoyé automatiquement

#### **Modifier un Utilisateur**
- **Changer de boutique** : Réassignation géographique
- **Changer de rôle** : Promotion/déclassement
- **Réinitialiser mot de passe** : Nouveau temporaire envoyé
- **Désactiver** : Conservation historique, pas de suppression

#### **Rôles & Permissions**

| Rôle | Permissions | Boutiques | Actions |
|------|-------------|-----------|---------|
| **Admin** | Tout | Toutes | Créer/modifier/supprimer |
| **Manager** | Stocks, Ventes, Rapports | Sa boutique + lecture autres | Validation, reporting |
| **Vendeur** | Ventes, Stocks lecture | Sa boutique uniquement | Créer ventes, consulter |

### **Audit & Sécurité**
- **Logs d'accès** : Tous tracés automatiquement
- **Historique modifications** : Qui, quand, quoi
- **Alertes sécurité** : Tentatives échouées, accès suspects
- **Sauvegarde** : Données utilisateurs chiffrées

---

## 🏪 Gestion des Boutiques

### **Vue d'Ensemble Multi-Boutiques**
- **Douala** : Boutique principale, plus gros volume
- **Kribi** : Boutique secondaire, spécialisation touristique
- **Synchronisation** : Données cohérentes automatiquement

### **Paramètres Boutique**
Pour chaque boutique :
- **Informations générales** : Nom, adresse, téléphone
- **Paramètres opérationnels** : Horaire ouverture, devise
- **Stocks** : Seuils d'alerte personnalisés
- **Utilisateurs** : Liste affectée

### **Tableau de Bord par Boutique**
- **KPIs individuels** : CA, ventes, marges
- **Stocks locaux** : Alertes spécifiques
- **Performance vendeurs** : Par boutique
- **Comparaisons** : vs autres boutiques

---

## 📦 Supervision des Stocks

### **Vue Consolidée**
- **Stock total** : 2 500 produits toutes boutiques
- **Valeur inventaire** : 45M XAF
- **Rotation** : 12 jours moyenne
- **Alertes actives** : 8 (3 critiques)

### **Gestion des Seuils**
- **Par défaut** : 10 unités minimum
- **Par produit** : Ajustable individuellement
- **Par catégorie** : Règles spécifiques (tissus vs accessoires)
- **Saisonnalité** : Ajustements automatiques

### **Commandes Fournisseurs**
1. **Déclenchement** : Automatique (seuil) ou manuel
2. **Workflow** :
   - Création commande → Validation → Envoi fournisseur
   - Suivi livraison → Réception → Mise à jour stock
3. **Historique** : Toutes les commandes tracées
4. **Performance** : Taux de livraison, délais moyens

### **Rapports Stocks**
- **Inventaire physique** : Comparaison théorique vs réel
- **Analyse rotation** : Produits dormants
- **Tendances** : Évolution sur 12 mois
- **Prévisions** : Besoins futurs estimés

---

## 📈 Rapports & Analytics

### **Types de Rapports**

#### **Rapports Temps Réel**
- **Dashboard** : KPIs live toutes les 30 secondes
- **Alertes** : Notifications instantanées
- **Suivi synchro** : État connexions boutiques

#### **Rapports Périodiques**
- **Quotidien** : Synthèse journée (email automatique)
- **Hebdomadaire** : Performance détaillée
- **Mensuel** : Analyse stratégique

#### **Rapports Ad Hoc**
- **Par période** : Dates personnalisables
- **Par boutique** : Comparaisons individuelles
- **Par produit** : Performance catalogue
- **Par vendeur** : Évaluation individuelle

### **Formats d'Export**
- **PDF** : Présentations, archives
- **Excel** : Analyses détaillées
- **CSV** : Intégrations externes

### **Métriques Avancées**
- **ABC Analysis** : Classement produits (A=80% CA, B=15%, C=5%)
- **Pareto** : 80/20 ventes par produits/clients
- **Tendances** : Prévisions basées sur historiques
- **Benchmarks** : Comparaisons vs objectifs

---

## ⚙️ Paramètres Système

### **Configuration Générale**
- **Entreprise** : Nom, logo, devise (XAF)
- **Sécurité** : Politiques mots de passe, sessions
- **Notifications** : Email, SMS, seuils d'alerte
- **Sauvegardes** : Fréquence, rétention

### **Maintenance**
- **Mises à jour** : Programmées hors heures d'ouverture
- **Sauvegardes** : Automatiques quotidiennes
- **Monitoring** : Uptime, performance, erreurs
- **Logs** : Audit complet, debugging

### **Intégrations**
- **API externes** : Fournisseurs, paiement
- **Webhooks** : Notifications automatiques
- **Exports** : Formats standards (CSV, XML)

---

## 🚨 Résolution des Problèmes

### **Problèmes Courants**

#### **1. Synchronisation Boutique**
**Symptômes** : Données incohérentes entre Douala/Kribi
**Actions** :
1. Vérifier connexion internet boutique concernée
2. Forcer synchronisation manuelle
3. Vérifier conflits de données
4. Restaurer depuis sauvegarde si nécessaire

#### **2. Alertes Stock Non Résolues**
**Symptômes** : Alertes persistent malgré réapprovisionnement
**Actions** :
1. Vérifier mise à jour stock effective
2. Ajuster seuils d'alerte si inappropriés
3. Recalculer inventaire si nécessaire

#### **3. Utilisateur Ne Peut Pas Se Connecter**
**Actions** :
1. Vérifier email/mot de passe
2. Réinitialiser mot de passe si oublié
3. Vérifier statut actif du compte
4. Consulter logs de sécurité

#### **4. Performance Lente**
**Actions** :
1. Vérifier connexion internet
2. Fermer autres onglets/applications
3. Vider cache navigateur (Ctrl+F5)
4. Redémarrer navigateur

### **Support & Escalade**
- **Niveau 1** : Documentation et auto-dépannage
- **Niveau 2** : Support équipe développement (chat)
- **Niveau 3** : Intervention sur site si critique

---

## 💡 Bonnes Pratiques

### **Routine Quotidienne**
1. **8h-9h** : Revue dashboard, alertes critiques
2. **9h-10h** : Validation synchronisation boutiques
3. **11h-12h** : Gestion stocks, commandes fournisseurs
4. **14h-16h** : Suivi opérations, support vendeurs
5. **16h-17h** : Rapports, planification lendemain

### **Maintenance Préventive**
- **Sauvegardes** : Vérifiées hebdomadairement
- **Mises à jour** : Appliquées mensuellement
- **Formations** : Rafraîchissement trimestriel
- **Audits** : Sécurité semestrielle

### **Gestion d'Urgence**
- **Plan de continuité** : Documenté et testé
- **Contacts critiques** : Liste toujours accessible
- **Procédures backup** : Papier si système indisponible

---

## 📊 KPIs à Surveiller

### **Indicateurs Critiques**
- **Disponibilité système** : >99%
- **Temps synchronisation** : <5 minutes
- **Résolution alertes** : <24h
- **Satisfaction vendeurs** : >4/5

### **Objectifs Business**
- **Croissance CA** : +15%/mois
- **Réduction ruptures** : -60%
- **Temps formation** : <2h par vendeur
- **ROI projet** : 340% (atteint)

---

## 🎓 Formation & Support

### **Formation Initiale**
- **Durée** : 4h (2h théorie + 2h pratique)
- **Supports** : Guides détaillés + démonstrations
- **Certification** : Test pratique validé

### **Support Continu**
- **Documentation** : Toujours à jour
- **Chat support** : < 2h réponse garantie
- **Sessions coaching** : Mensuelles
- **Webinaires** : Nouveautés et bonnes pratiques

---

**Dernière mise à jour :** 6 janvier 2026  
**Version système :** 1.0.0  
**Support :** support@nickoplus.com  
**Urgences :** +237 XX XXX XXX (24/7)
