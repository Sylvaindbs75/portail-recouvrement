# Cahier de recette (V1, données fictives)

Date de référence des tests : 16 novembre 2026.
Site : https://portail-recouvrement.vercel.app. Base : Supabase `otbeppqvdvmcqdlxkpkd` (eu-north-1).

## Tests automatiques

| Test | Où | Résultat au 16/11/2026 |
| --- | --- | --- |
| Chiffres de la recette PRD §10, formats, filtres, frise, export CSV, CSV piégé | `npm test` (Vitest) | ✅ 13/13 |
| Cloisonnement : anonyme, Alpha, Beta, cabinet, décision | `tests/rls.sql` dans l'éditeur SQL | ✅ `RLS_OK [anon alpha beta cabinet decision]` |
| Compilation et typage | `npm run build` | ✅ |

`tests/rls.sql` vérifie notamment les points suivants :
- un visiteur anonyme n'a accès à rien ;
- Alpha voit 3 dossiers et 10 850,50 € ;
- Beta voit 2 dossiers et 12 370,25 € ;
- aucune note ni pièce interne n'est visible des syndics, ni par la table, ni dans le stockage ;
- un syndic ne peut rien modifier, ni s'attribuer le rôle cabinet, ni déposer de fichier ;
- Beta ne peut pas valider un acte d'Alpha ;
- une décision est signée, datée et non modifiable ;
- le cabinet voit 5 dossiers et 23 220,75 €, avec A-003 (42 j) et B-002 (76 j) sans mise à jour.

## Parcours manuel (PRD §5)

| # | Étape | Compte | Attendu | Vérifié |
| --- | --- | --- | --- | --- |
| 1 | Créer un dossier pour Syndic Alpha, étape mise en demeure | cabinet | Le dossier apparaît dans le portefeuille | ☐ |
| 2 | Déposer un projet d'acte et demander la validation, avec une note visible | cabinet | « Validation attendue » dans le suivi client | ☐ |
| 3 | Tableau de bord | Alpha | 1 action à valider, audience du 10 déc. 2026 | ✅ en local |
| 4 | Ouvrir A-002, lire le projet, valider | Alpha | Étape « Assignation validée », décision en lecture seule | ✅ en local |
| 4 bis | Demander une modification avec un commentaire | Alpha | Commentaire visible côté cabinet | ☐ |
| 5 | Voir la décision, faire avancer l'étape, ajouter un événement | cabinet | Chronologie à jour, date de mise à jour = jour | ☐ |
| 6 | Exporter le CSV | Alpha | 3 lignes, aucune ligne Beta | ✅ test automatique |
| 7 | Ouvrir `/syndic/dossiers/A-002` | Beta | « Dossier introuvable » | ✅ en local (avec B-001 depuis Alpha) |
| 9 | Ouvrir une adresse protégée sans être connecté | — | Redirection vers la connexion, page conservée | ✅ en ligne |

## Avant une démonstration

Exécuter `supabase/reinitialiser-demo.sql` pour remettre le jeu fictif dans son état initial (A-002 de nouveau « à valider »).
Fichiers de démonstration des pièces : `maquette/pieces-fictives/`. Ils se déposent depuis l'espace cabinet, avec le bouton « Fichier » de chaque pièce.

## Sécurité : réglages à faire dans le tableau de bord Supabase

Ces réglages ne sont pas accessibles par le connecteur.
- **Authentication → Sign In / Providers → Email** : désactiver « Allow new users to sign up ». Les comptes sont créés par le cabinet. Sans ce réglage, n'importe qui peut créer un compte. Ce compte n'aurait accès à aucune donnée, car il n'a pas de profil.
- **Authentication → Password security** : activer la protection contre les mots de passe compromis.
- **Authentication → URL Configuration** : Site URL = `https://portail-recouvrement.vercel.app`.

## Avertissement attendu du conseiller Supabase

`decider_validation` est une fonction `SECURITY DEFINER` appelable par les utilisateurs connectés. C'est voulu : c'est le seul moyen pour un syndic d'enregistrer sa décision. La fonction vérifie elle-même le syndic et l'état de la validation (voir `tests/rls.sql`).
