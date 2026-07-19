# Pharma Gate — Instructions pour Claude Code

## Contexte du projet
Application web de gestion de stock et de vente pour une pharmacie hospitalière (Maroc).
Stack : React + Vite (frontend) · Supabase (base de données + auth) · Tailwind CSS · Recharts · jsPDF

## Architecture
- **2 rôles** : `responsable` (admin) et `assistante` (opérateur)
- **122 médicaments** déjà dans `supabase/seed.sql`
- **5 tables** : users, medicaments, patients, sorties, livraisons

## Conventions de code
- Français dans les labels UI, comments en français
- Composants React en PascalCase dans `src/components/`
- Pages dans `src/pages/`
- Hooks dans `src/hooks/`
- Services Supabase dans `src/lib/`
- Variables d'environnement dans `.env.local` (ne jamais committer)

## Variables d'environnement requises
```
VITE_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

## Commandes
```bash
npm run dev       # Démarrer le serveur de développement
npm run build     # Build de production
npm run lint      # Linter
```

## Supabase
- Appliquer le schéma : `supabase/schema.sql`
- Insérer les données : `supabase/seed.sql`
- Les policies RLS garantissent que chaque assistante ne voit que ses propres sorties

## Flux critique — Saisie de sortie (assistante)
1. Cliquer "Enregistrer une sortie"
2. Taper les premières lettres du médicament → dropdown filtré en temps réel
3. Sélectionner le médicament dans la liste
4. Taper le nom du patient → autocomplétion depuis la table `patients`
5. Si patient inconnu → créé automatiquement à la validation
6. Saisir la quantité → validation stock disponible
7. Confirmer → insertion dans `sorties`, décrément du stock dans `medicaments`
