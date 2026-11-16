# PRD proposé · Portail de suivi du recouvrement de charges de Sylvain

> Copie du PRD fourni le 16/11/2026. Décisions prises depuis : poste Windows 11 ; connexion par e-mail et mot de passe ; étapes du §6 ; projet Supabase dédié `otbeppqvdvmcqdlxkpkd` (eu-north-1) ; mise en ligne par import GitHub sur Vercel ; analyse fonctionnelle par le repli du §4 (REA optionnel).

## 1. Besoin

Sylvain veut « une petite plateforme pour partage de dossiers simples avec les clients et suivi procédure », en commençant par le recouvrement de charges de copropriété, pour des syndics.

**Critère de réussite :** un portail en ligne où deux syndics fictifs se connectent chacun avec leur compte, voient uniquement leurs dossiers (étape, solde, chronologie, pièces), valident un projet d'assignation ou demandent sa modification, pendant que Sylvain, depuis l'espace cabinet, fait avancer les dossiers. Le cloisonnement entre syndics est démontré par un test, pas supposé.

## 4. Périmètre V1

1. Connexion par compte, deux rôles : cabinet et syndic.
2. Tableau de bord syndic : nombre de dossiers, solde total, actions à valider, prochaines audiences.
3. Liste des dossiers du syndic, filtrable par étape, avec solde et date de dernière mise à jour.
4. Fiche dossier : étape, solde, chronologie, pièces téléchargeables, notes visibles par le syndic.
5. Validation d'un projet d'acte : accepter, ou demander une modification avec un commentaire.
6. Espace cabinet : tous les dossiers, création, changement d'étape, échéance, dépôt d'un projet d'acte, demande de validation, note visible ou interne, dossiers sans mise à jour depuis plus de 30 jours.
7. Export CSV de l'état des dossiers d'un syndic, pour son assemblée générale.
8. Cloisonnement par la base de données, prouvé par des tests avec deux comptes syndics.

**Extensions :** notifications e-mail ; ouverture de dossier et dépôt de pièces par le syndic ; double authentification ; journal des accès ; agenda ; autres contentieux ; actualisation du décompte.

## 5. Parcours

1. Cabinet : création d'un dossier pour le Syndic Alpha, étape mise en demeure.
2. Dépôt du projet d'assignation d'un autre dossier, demande de validation, note visible.
3. Syndic Alpha : tableau de bord, une action à valider, une audience à venir.
4. Ouverture de la fiche, téléchargement, validation ou demande de modification.
5. Cabinet : voit la décision, fait avancer l'étape, ajoute un événement.
6. Export CSV par le syndic.
7. Syndic Beta : ne voit jamais un dossier, une pièce ni un total d'Alpha, même en modifiant l'adresse.

## 6. Données

Tables : syndics, profils, dossiers, evenements, pieces, validations.
Étapes : amiable ; mise en demeure ; assignation à valider ; assignation validée ; audience ; jugement ; exécution ; clôturé.

## 7. Règles métier

- Montants en centimes entiers, affichés au format français. Le solde est saisi par le cabinet ; pas de calcul d'intérêts, frais ni prescription.
- Un syndic lit uniquement les dossiers, événements visibles et pièces visibles de son syndic ; il ne modifie que la décision et le commentaire des validations qui lui sont adressées.
- Le cabinet lit et modifie tout. Une note interne n'est jamais visible par un syndic.
- Une décision est enregistrée avec auteur et date et n'est pas modifiable par le syndic après coup.
- « Sans mise à jour » : plus de 30 jours (seuil réglable).
- L'export ne contient que les dossiers du syndic connecté.

## 8. Architecture

Navigateur → Vercel (interface) → Supabase (comptes, données, pièces). Règles d'accès dans la base (RLS, règles de stockage, liens signés temporaires). Seule la clé publique Supabase côté navigateur.

## 9. États et erreurs

Session expirée → retour connexion sans perte de la page ; dossier d'un autre syndic → « dossier introuvable » ; pièce interne absente et lien refusé ; validation déjà traitée en lecture seule ; « 1 180,50 € » reconnu ; balise script affichée comme texte.

## 10. Recette (date de référence 16/11/2026)

| Dossier | Syndic | Lot | Solde | Étape | Dernière mise à jour |
| --- | --- | --- | --- | --- | --- |
| A-001 | Syndic Alpha | Lot 12 | 3 250,00 € | Mise en demeure | 2 nov. 2026 |
| A-002 | Syndic Alpha | Lot 4 (parking) | 1 180,50 € | Assignation à valider | 10 nov. 2026 |
| A-003 | Syndic Alpha | Lot 7 | 6 420,00 € | Audience le 10 déc. 2026 | 5 oct. 2026 |
| B-001 | Syndic Beta | Lot 2 | 2 500,00 € | Amiable | 12 nov. 2026 |
| B-002 | Syndic Beta | Lot 9 | 9 870,25 € | Exécution | 1er sept. 2026 |

| Test | Résultat attendu |
| --- | --- |
| Tableau de bord Alpha | 3 dossiers ; 10 850,50 € ; 1 action à valider ; 1 audience à venir |
| Tableau de bord Beta | 2 dossiers ; 12 370,25 € ; 0 action à valider |
| Espace cabinet | 5 dossiers ; 23 220,75 € ; sans mise à jour > 30 j : A-003 (42 j), B-002 (76 j) |
| Validation A-002 | Étape « assignation validée », 0 action pour Alpha, décision datée et signée |
| Demande de modification | Statut « modification demandée », commentaire visible du cabinet |
| Cloisonnement | Beta : aucun dossier Alpha par liste, adresse, API ni lien de pièce |
| Note interne | Invisible pour les deux syndics |
| Export CSV Alpha | 3 lignes, aucune ligne Beta |
| Texte piégé | Affiché comme texte |
