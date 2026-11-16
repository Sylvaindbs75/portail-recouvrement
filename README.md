# Portail recouvrement

Portail de suivi des dossiers de recouvrement de charges de copropriété (cabinet ↔ syndics).
**Version de démonstration : données entièrement fictives.**

- Interface : React 19, Vite, TanStack Router/Query, Tailwind, base `satnaing/shadcn-admin` (voir `NOTICE.md`).
- Données, comptes, pièces : Supabase (projet `otbeppqvdvmcqdlxkpkd`, UE). Les droits sont appliqués **par la base** (RLS).
- Mise en ligne : Vercel, à partir de ce dépôt.

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner la clé publique Supabase
npm run dev
```

## Vérifier

```bash
npm test          # chiffres de la recette PRD §10, formats, export CSV
npm run build     # compilation + vérification TypeScript
```

Cloisonnement : exécuter `tests/rls.sql` dans l'éditeur SQL Supabase. Résultat attendu :
une erreur `RLS_OK [anon alpha beta cabinet decision]` (le script s'annule lui-même, rien n'est conservé).

## Base de données

- `supabase/migrations/` : schéma, RLS, stockage privé `pieces`.
- `supabase/seed.sql` : jeu fictif du PRD.
- `supabase/lier-comptes.sql` : rattacher les comptes créés dans Authentication aux rôles cabinet / syndic.
- `supabase/reinitialiser-demo.sql` : remettre le jeu fictif dans son état initial avant une démonstration.

## Documentation

- `docs/PRD.md` : besoin et périmètre.
- `docs/analyse-fonctionnelle.md` : fonctions couvertes, écarts avec la maquette, points à trancher.
- `docs/recette.md` : résultats des tests, parcours manuel, réglages de sécurité Supabase à faire.
- `maquette/pieces-fictives/` : PDF fictifs à déposer sur les pièces du jeu de démonstration.

En ligne : https://portail-recouvrement.vercel.app (redéployé automatiquement à chaque push sur `main`).

## Règles importantes

- Aucune clé `service_role` dans le code, le dépôt ou Vercel : seule la clé publique est utilisée.
- Aucune donnée réelle avant un cadrage sécurité / RGPD (secret professionnel, 2FA, journal des accès).
