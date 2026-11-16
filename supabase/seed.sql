-- Jeu de données ENTIÈREMENT FICTIF (PRD §10). Date de référence : 16 novembre 2026.
-- Les comptes utilisateurs sont reliés séparément : voir supabase/lier-comptes.sql.

insert into public.syndics (id, nom) values
  ('00000000-0000-4000-a000-00000000000a', 'Syndic Alpha'),
  ('00000000-0000-4000-a000-00000000000b', 'Syndic Beta');

insert into public.dossiers
  (id, reference, syndic_id, immeuble, lot, debiteur_ref, solde_centimes, etape, prochaine_echeance, libelle_echeance, mis_a_jour_le)
values
  ('00000000-0000-4000-b000-0000000000a1', 'A-001', '00000000-0000-4000-a000-00000000000a',
   'SDC Résidence Les Tilleuls', 'Lot 12', 'Débiteur A1 (fictif)', 325000, 'mise_en_demeure',
   '2026-11-20', 'Fin du délai de mise en demeure', '2026-11-02'),
  ('00000000-0000-4000-b000-0000000000a2', 'A-002', '00000000-0000-4000-a000-00000000000a',
   'SDC 8 rue du Modèle', 'Lot 4 (parking)', 'Débiteur A2 (fictif)', 118050, 'assignation_a_valider',
   null, 'Assignation à valider', '2026-11-10'),
  ('00000000-0000-4000-b000-0000000000a3', 'A-003', '00000000-0000-4000-a000-00000000000a',
   'SDC Le Parc des Essais', 'Lot 7', 'Débiteur A3 (fictif)', 642000, 'audience',
   '2026-12-10', 'Audience', '2026-10-05'),
  ('00000000-0000-4000-b000-0000000000b1', 'B-001', '00000000-0000-4000-a000-00000000000b',
   'SDC Les Jardins Fictifs', 'Lot 2', 'Débiteur B1 (fictif)', 250000, 'amiable',
   '2026-11-20', 'Relance amiable', '2026-11-12'),
  ('00000000-0000-4000-b000-0000000000b2', 'B-002', '00000000-0000-4000-a000-00000000000b',
   'SDC Villa Démonstration', 'Lot 9', 'Débiteur B2 (fictif)', 987025, 'execution',
   '2026-12-01', 'Suivi de l''échéancier', '2026-09-01');

-- Chronologie (dates ≤ date de mise à jour de chaque dossier)
insert into public.evenements (dossier_id, date_evenement, titre, detail, visible_syndic, auteur) values
  ('00000000-0000-4000-b000-0000000000a1', '2026-10-20', 'Dossier ouvert', 'Pièces transmises par le syndic.', true, null),
  ('00000000-0000-4000-b000-0000000000a1', '2026-11-02', 'Mise en demeure par courrier d''avocat', 'Lettre recommandée envoyée.', true, null),
  ('00000000-0000-4000-b000-0000000000a1', '2026-11-02', 'Note interne', 'Débiteur déjà relancé deux fois par le syndic, prévoir assignation rapide.', false, null),
  ('00000000-0000-4000-b000-0000000000a2', '2026-09-24', 'Dossier ouvert', 'Pièces transmises par le syndic.', true, null),
  ('00000000-0000-4000-b000-0000000000a2', '2026-10-02', 'Mise en demeure par courrier d''avocat', 'Lettre recommandée distribuée le 5 oct.', true, null),
  ('00000000-0000-4000-b000-0000000000a2', '2026-11-04', 'Délai de la mise en demeure expiré', 'Aucun règlement reçu.', true, null),
  ('00000000-0000-4000-b000-0000000000a2', '2026-11-10', 'Projet d''assignation déposé', 'En attente de votre validation.', true, null),
  ('00000000-0000-4000-b000-0000000000a3', '2026-08-01', 'Dossier ouvert', null, true, null),
  ('00000000-0000-4000-b000-0000000000a3', '2026-10-05', 'Assignation délivrée', 'Audience fixée au 10 décembre 2026.', true, null),
  ('00000000-0000-4000-b000-0000000000b1', '2026-11-12', 'Dossier ouvert', '<script>alert("test")</script> doit s''afficher comme du texte.', true, null),
  ('00000000-0000-4000-b000-0000000000b2', '2026-09-01', 'Échéancier accordé', 'Suivi mensuel des versements.', true, null);

-- Pièces (les fichiers seront déposés depuis l'espace cabinet)
insert into public.pieces (id, dossier_id, nom, chemin, visible_syndic, depose_par) values
  ('00000000-0000-4000-c000-0000000000a2', '00000000-0000-4000-b000-0000000000a2',
   'Projet d''assignation (PDF)', '00000000-0000-4000-b000-0000000000a2/projet-assignation.pdf', true, null),
  ('00000000-0000-4000-c000-0000000000a3', '00000000-0000-4000-b000-0000000000a3',
   'Note de stratégie (interne)', '00000000-0000-4000-b000-0000000000a3/note-interne.pdf', false, null),
  ('00000000-0000-4000-c000-0000000000b2', '00000000-0000-4000-b000-0000000000b2',
   'Jugement (PDF)', '00000000-0000-4000-b000-0000000000b2/jugement.pdf', true, null);

insert into public.validations (dossier_id, piece_id, objet, statut, demande_le) values
  ('00000000-0000-4000-b000-0000000000a2', '00000000-0000-4000-c000-0000000000a2',
   'Projet d''assignation', 'en_attente', '2026-11-10 09:00:00+01');

-- Les triggers ont pu toucher mis_a_jour_le : on rétablit les dates de la recette.
update public.dossiers set mis_a_jour_le = v.d
from (values
  ('A-001', date '2026-11-02'), ('A-002', date '2026-11-10'), ('A-003', date '2026-10-05'),
  ('B-001', date '2026-11-12'), ('B-002', date '2026-09-01')
) as v(ref, d)
where reference = v.ref;
