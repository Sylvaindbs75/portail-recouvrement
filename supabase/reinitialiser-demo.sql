-- Remet le jeu FICTIF dans son état initial (PRD §10), par exemple avant une démonstration.
-- À exécuter dans l'éditeur SQL Supabase. Ne touche ni aux comptes ni aux profils.
-- Les fichiers déjà déposés dans le stockage sont conservés (les 3 pièces du jeu gardent leur fichier).

begin;

-- 1. Dossiers créés pendant les essais
delete from public.dossiers
where reference not in ('A-001', 'A-002', 'A-003', 'B-001', 'B-002');

-- 2. Événements ajoutés pendant les essais (ceux du jeu fictif n'ont pas d'auteur)
delete from public.evenements where auteur is not null;

-- 3. Pièces ajoutées pendant les essais
delete from public.pieces
where id not in ('00000000-0000-4000-c000-0000000000a2',
                 '00000000-0000-4000-c000-0000000000a3',
                 '00000000-0000-4000-c000-0000000000b2');

-- 4. Validations : seule celle du projet d'assignation A-002, de nouveau en attente
delete from public.validations where piece_id is distinct from '00000000-0000-4000-c000-0000000000a2';
update public.validations
   set statut = 'en_attente', commentaire = null, decide_par = null, decide_le = null,
       demande_le = '2026-11-10 09:00:00+01'
 where piece_id = '00000000-0000-4000-c000-0000000000a2';

-- 5. Dossiers : valeurs de la recette
update public.dossiers d
   set solde_centimes = v.solde, etape = v.etape::public.etape_dossier,
       prochaine_echeance = v.echeance, libelle_echeance = v.libelle
  from (values
    ('A-001', 325000, 'mise_en_demeure',       date '2026-11-20', 'Fin du délai de mise en demeure'),
    ('A-002', 118050, 'assignation_a_valider', null::date,        'Assignation à valider'),
    ('A-003', 642000, 'audience',              date '2026-12-10', 'Audience'),
    ('B-001', 250000, 'amiable',               date '2026-11-20', 'Relance amiable'),
    ('B-002', 987025, 'execution',             date '2026-12-01', 'Suivi de l''échéancier')
  ) as v(ref, solde, etape, echeance, libelle)
 where d.reference = v.ref;

-- Les déclencheurs ont pu modifier la date de mise à jour : on la rétablit en dernier.
update public.dossiers d set mis_a_jour_le = v.d
  from (values ('A-001', date '2026-11-02'), ('A-002', date '2026-11-10'), ('A-003', date '2026-10-05'),
               ('B-001', date '2026-11-12'), ('B-002', date '2026-09-01')) as v(ref, d)
 where d.reference = v.ref;

commit;

-- Contrôle : 5 dossiers, 23 220,75 €, 1 validation en attente
select count(*) as dossiers, sum(solde_centimes) as total_centimes,
       (select count(*) from public.validations where statut = 'en_attente') as en_attente
from public.dossiers;
