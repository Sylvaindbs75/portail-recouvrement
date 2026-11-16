# Analyse fonctionnelle

Établie le 16 novembre 2026 selon le **repli prévu au PRD §4**. REA n'a pas été utilisé : aucune observation de la plateforme de référence n'a été faite pour ce document.
Sources : l'inventaire public résumé au PRD §2 et la maquette `maquette/Maquette portail client cabinet.pdf`.
On reprend des **fonctions**, jamais une interface, des textes ni une identité visuelle.

Légende : **vu** = présent dans une source ; **déduit** = conséquence raisonnable ; **inconnu** = à trancher par le cabinet.

## Fonctions et couverture V1

| Fonction | Source | Statut | V1 |
| --- | --- | --- | --- |
| Tableau de bord syndic (dossiers, montant, actions, audience) | PRD §2 + maquette p. 1 | vu | ✅ |
| Liste filtrable par étape avec solde | PRD §2 + maquette p. 1 | vu | ✅ (Amiable / Procédure / Exécution / Clôturés) |
| Actions à faire / validations en attente | PRD §2 + maquette p. 1 | vu | ✅ |
| Fiche dossier : frise d'étapes, chronologie, décompte, pièces | maquette p. 2 | vu | ✅ sauf le décompte détaillé (voir écarts) |
| Validation d'assignation ou demande de modification | PRD §2 + maquette p. 2 | vu | ✅ avec commentaire obligatoire, décision non modifiable |
| Message du syndic à l'avocat | maquette p. 2 | vu | ⏳ remplacé par le commentaire de modification |
| Espace cabinet : portefeuille tous syndics, suivi client | maquette p. 3 | vu | ✅ |
| Mise à jour : étape, échéance, projet d'acte, demande de validation, note visible | maquette p. 3 | vu | ✅ |
| Note interne au cabinet | PRD §4 | déduit | ✅ |
| Dossiers sans mise à jour depuis plus de 30 jours | PRD §4 | déduit | ✅ |
| Export de l'état des dossiers pour l'AG | PRD §2 | vu | ✅ CSV |
| Agenda des audiences | PRD §2 | vu | ⏳ extension (seule la prochaine audience est affichée) |
| Création de dossier et dépôt de pièces par le syndic | PRD §2 | vu | ⏳ extension |
| Courrier postal | PRD §2 | vu | ❌ hors périmètre |
| Notification par e-mail | maquette p. 3 | vu | ⏳ extension (prestataire à choisir) |
| « Voir comme le syndic » | maquette p. 3 | vu | ⏳ extension, par un compte syndic de test |
| Maintien de l'e-mail pour les syndics qui le préfèrent | PRD §2 | vu | hors outil |

## Écarts avec la maquette

- **Décompte détaillé** (charges, appels travaux, frais art. 10-1) : la V1 n'a qu'un solde global saisi par le cabinet (PRD §7). Le décompte peut être joint en pièce.
- **Message libre à l'avocat** : non repris. Le syndic s'exprime via la demande de modification.
- **Débiteur** : désigné par une référence, comme le recommande le PRD, plutôt que par un nom.

## Inconnus à trancher par le cabinet

1. Vocabulaire et liste définitive des étapes (PRD §6).
2. Informations visibles par le syndic (débiteur nommé ? décompte détaillé ?).
3. Mode de connexion en production : mot de passe (V1) ou lien par e-mail, double authentification.
4. Nom du portail et identité visuelle (`[NOM DU CABINET]` reste à remplacer).
5. Conditions de mise en production : hébergement, contrat de sous-traitance, journal des accès, durée de conservation.
