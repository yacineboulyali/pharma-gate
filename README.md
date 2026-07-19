# Pharma Gate 💊

[![Netlify Status](https://api.netlify.com/api/v1/badges/864cb655-40f8-4e87-8d5e-5808600f499d/deploy-status)](https://app.netlify.com/projects/pharma-gate/deploys)

Application web de gestion de stock et de vente pour une pharmacie hospitalière.

## Stack
- **Frontend** : React 18 + Vite + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Graphes** : Recharts
- **PDF** : jsPDF + jspdf-autotable

## Démarrage rapide

### Étape 1 — Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → New project
2. Nom : `pharmagest` · Mot de passe DB fort · Région : EU West

### Étape 2 — Appliquer le schéma SQL

Dans **Supabase Dashboard > SQL Editor** :

1. Copier-coller le contenu de `supabase/schema.sql` → **Run**
2. Copier-coller le contenu de `supabase/seed.sql` → **Run**

Vérifier : 122 médicaments dans la table `medicaments`.

### Étape 3 — Récupérer les clés API

Dashboard Supabase → **Project Settings > API** :
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

### Étape 4 — Configurer l'environnement

```bash
cp .env.local.example .env.local
# Éditer .env.local avec vos valeurs Supabase
```

### Étape 5 — Créer les comptes de test

Dans **Supabase Dashboard > Authentication > Users**, créer (ou mettre à jour) 2 utilisateurs via **Add user > Create new user** (email confirmé, mot de passe défini manuellement) :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `respo@respo.ma` | `respo@respo.ma` | responsable |
| `assiste@assiste.ma` | `assiste@assiste.ma` | assistante |

Après création, exécuter `supabase/create_test_users.sql` dans le **SQL Editor** pour lier ces comptes `auth.users` à la table `public.users` (rôle + profil).

### Étape 6 — Lancer l'application

```bash
npm install
npm run dev
```

Ouvrir http://localhost:5173 → Se connecter avec `respo@respo.ma` / `respo@respo.ma` (ou `assiste@assiste.ma` / `assiste@assiste.ma`).

---

## Structure du projet

```
pharmagest/
├── CLAUDE.md                    # Instructions pour Claude Code
├── supabase/
│   ├── schema.sql               # Tables + RLS policies + fonctions
│   └── seed.sql                 # 122 médicaments importés du fichier xlsx
├── src/
│   ├── lib/
│   │   └── supabase.js          # Client Supabase
│   ├── hooks/
│   │   └── useAuth.jsx          # Context Auth + hook
│   ├── components/
│   │   └── Layout.jsx           # Layout partagé (header + nav)
│   ├── pages/
│   │   ├── LoginPage.jsx        # Page de connexion
│   │   ├── assistante/
│   │   │   ├── Dashboard.jsx    # Dashboard assistante + graphes
│   │   │   ├── SaisieSortie.jsx # Flux de saisie (critique)
│   │   │   └── LogSorties.jsx   # Historique personnel
│   │   └── responsable/
│   │       ├── Dashboard.jsx    # KPIs + top médicaments + stock critique
│   │       ├── GestionStock.jsx # Tableau stock + livraisons
│   │       ├── ListePatients.jsx
│   │       ├── GestionAssistantes.jsx
│   │       └── HistoriqueGlobal.jsx  # Historique + export PDF
│   ├── App.jsx                  # Routing + protection par rôle
│   ├── main.jsx
│   └── index.css                # Tailwind + classes utilitaires
└── .env.local.example
```

## Rôles

| Rôle | Accès | Route |
|------|-------|-------|
| `responsable` | Tout | `/responsable` |
| `assistante` | Ses sorties uniquement | `/assistante` |

## Flux saisie de sortie (assistante)

```
[Dashboard] → clic "Enregistrer une sortie"
  → Étape 1 : Taper "Ami" → liste filtrée → sélectionner "Amian 200mg 30cp"
  → Étape 2 : Taper "Mohammed" → autocomplétion patients → saisir quantité
  → Confirmer → RPC enregistrer_sortie() → stock décrémenté atomiquement
  → Page succès avec stock restant
```

## Base de données

### Tables
- `users` — Comptes avec rôle (responsable/assistante)
- `medicaments` — 122 médicaments (désignation, stock, seuil_alerte)
- `patients` — Créés automatiquement à la première sortie
- `sorties` — Log de chaque vente
- `livraisons` — Historique des réapprovisionnements

### Fonctions RPC
- `enregistrer_sortie()` — Transaction atomique : vérifie stock, crée patient si nouveau, décrément stock, log sortie

### Sécurité RLS
- Assistante : voit uniquement ses propres sorties
- Responsable : accès complet à toutes les tables
- Médicaments et patients : lecture pour tous les utilisateurs authentifiés

## Déploiement

Déployé sur Netlify : [pharma-gate](https://app.netlify.com/projects/pharma-gate/deploys)

```bash
npm run build
# Déployer le dossier dist/ sur Vercel ou Netlify
# Configurer les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

`netlify.toml` définit déjà la commande de build (`npm run build`), le dossier de sortie (`dist`) et la redirection SPA nécessaire pour React Router (sans elle, un accès direct ou un refresh sur une route comme `/responsable/stock` renvoie une 404).

Sur Netlify, penser à configurer dans **Site settings > Environment variables** :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(ces valeurs ne sont jamais committées — voir `.env.local.example`)
