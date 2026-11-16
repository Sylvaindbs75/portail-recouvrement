-- Portail de suivi du recouvrement de charges : schéma, cloisonnement (RLS), stockage.
-- Données fictives uniquement tant qu'aucun cadrage sécurité/RGPD n'a été fait.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.role_utilisateur as enum ('cabinet', 'syndic');

create type public.etape_dossier as enum (
  'amiable',
  'mise_en_demeure',
  'assignation_a_valider',
  'assignation_validee',
  'audience',
  'jugement',
  'execution',
  'cloture'
);

create type public.statut_validation as enum ('en_attente', 'validee', 'modification_demandee');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.syndics (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  cree_le timestamptz not null default now()
);

create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nom_affiche text,
  role public.role_utilisateur not null,
  syndic_id uuid references public.syndics (id) on delete restrict,
  cree_le timestamptz not null default now(),
  constraint profil_syndic_coherent check ((role = 'syndic') = (syndic_id is not null))
);
create index profils_syndic_id_idx on public.profils (syndic_id);

create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  syndic_id uuid not null references public.syndics (id) on delete restrict,
  immeuble text not null,
  lot text not null,
  debiteur_ref text not null,
  solde_centimes bigint not null check (solde_centimes >= 0),
  etape public.etape_dossier not null default 'amiable',
  prochaine_echeance date,
  libelle_echeance text,
  mis_a_jour_le date not null default current_date,
  cree_le timestamptz not null default now()
);
create index dossiers_syndic_id_idx on public.dossiers (syndic_id);

create table public.evenements (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  date_evenement date not null default current_date,
  titre text not null,
  detail text,
  visible_syndic boolean not null default true,
  auteur uuid references auth.users (id) on delete set null default auth.uid(),
  cree_le timestamptz not null default now()
);
create index evenements_dossier_id_idx on public.evenements (dossier_id);
create index evenements_auteur_idx on public.evenements (auteur);

create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  nom text not null,
  chemin text not null unique,
  visible_syndic boolean not null default true,
  depose_par uuid references auth.users (id) on delete set null default auth.uid(),
  cree_le timestamptz not null default now(),
  -- le fichier est rangé sous le dossier : <dossier_id>/<nom de fichier>
  constraint piece_chemin_dans_dossier check (split_part(chemin, '/', 1) = dossier_id::text)
);
create index pieces_dossier_id_idx on public.pieces (dossier_id);
create index pieces_depose_par_idx on public.pieces (depose_par);

create table public.validations (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  piece_id uuid references public.pieces (id) on delete set null,
  objet text not null,
  statut public.statut_validation not null default 'en_attente',
  commentaire text,
  demande_le timestamptz not null default now(),
  decide_par uuid references auth.users (id) on delete set null,
  decide_le timestamptz,
  constraint decision_coherente check (
    (statut = 'en_attente' and decide_par is null and decide_le is null)
    or (statut <> 'en_attente' and decide_le is not null)
  )
);
create index validations_dossier_id_idx on public.validations (dossier_id);
create index validations_piece_id_idx on public.validations (piece_id);
create index validations_decide_par_idx on public.validations (decide_par);

-- ---------------------------------------------------------------------------
-- Fonctions d'accès (schéma privé, non exposé par l'API)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.est_cabinet()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profils
    where id = (select auth.uid()) and role = 'cabinet'
  );
$$;

create function private.mon_syndic_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select syndic_id from public.profils
  where id = (select auth.uid()) and role = 'syndic';
$$;

revoke all on function private.est_cabinet() from public, anon;
revoke all on function private.mon_syndic_id() from public, anon;
grant execute on function private.est_cabinet() to authenticated;
grant execute on function private.mon_syndic_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.syndics enable row level security;
alter table public.profils enable row level security;
alter table public.dossiers enable row level security;
alter table public.evenements enable row level security;
alter table public.pieces enable row level security;
alter table public.validations enable row level security;

-- Aucun accès anonyme.
revoke all on public.syndics, public.profils, public.dossiers, public.evenements, public.pieces, public.validations from anon;

-- syndics
create policy syndics_lecture on public.syndics for select to authenticated
  using ((select private.est_cabinet()) or id = (select private.mon_syndic_id()));
create policy syndics_ecriture_cabinet on public.syndics for all to authenticated
  using ((select private.est_cabinet())) with check ((select private.est_cabinet()));

-- profils : chacun lit le sien, le cabinet lit tout. Aucune écriture par l'API
-- (les rôles sont attribués en SQL par l'administrateur, pas d'auto-promotion).
create policy profils_lecture on public.profils for select to authenticated
  using (id = (select auth.uid()) or (select private.est_cabinet()));

-- dossiers
create policy dossiers_lecture on public.dossiers for select to authenticated
  using ((select private.est_cabinet()) or syndic_id = (select private.mon_syndic_id()));
create policy dossiers_ecriture_cabinet on public.dossiers for all to authenticated
  using ((select private.est_cabinet())) with check ((select private.est_cabinet()));

-- evenements : le syndic ne voit que les événements visibles de ses dossiers
create policy evenements_lecture on public.evenements for select to authenticated
  using (
    (select private.est_cabinet())
    or (
      visible_syndic
      and exists (
        select 1 from public.dossiers d
        where d.id = dossier_id and d.syndic_id = (select private.mon_syndic_id())
      )
    )
  );
create policy evenements_ecriture_cabinet on public.evenements for all to authenticated
  using ((select private.est_cabinet())) with check ((select private.est_cabinet()));

-- pieces
create policy pieces_lecture on public.pieces for select to authenticated
  using (
    (select private.est_cabinet())
    or (
      visible_syndic
      and exists (
        select 1 from public.dossiers d
        where d.id = dossier_id and d.syndic_id = (select private.mon_syndic_id())
      )
    )
  );
create policy pieces_ecriture_cabinet on public.pieces for all to authenticated
  using ((select private.est_cabinet())) with check ((select private.est_cabinet()));

-- validations : lecture par le syndic du dossier ; décision uniquement via decider_validation()
create policy validations_lecture on public.validations for select to authenticated
  using (
    (select private.est_cabinet())
    or exists (
      select 1 from public.dossiers d
      where d.id = dossier_id and d.syndic_id = (select private.mon_syndic_id())
    )
  );
create policy validations_ecriture_cabinet on public.validations for all to authenticated
  using ((select private.est_cabinet())) with check ((select private.est_cabinet()));

-- ---------------------------------------------------------------------------
-- Date de dernière mise à jour du dossier
-- ---------------------------------------------------------------------------
create function private.dossier_touche()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.etape, new.solde_centimes, new.prochaine_echeance, new.libelle_echeance)
     is distinct from (old.etape, old.solde_centimes, old.prochaine_echeance, old.libelle_echeance)
     and new.mis_a_jour_le = old.mis_a_jour_le then
    new.mis_a_jour_le := current_date;
  end if;
  return new;
end;
$$;

create trigger dossiers_touche before update on public.dossiers
  for each row execute function private.dossier_touche();

create function private.evenement_touche_dossier()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dossiers
     set mis_a_jour_le = greatest(mis_a_jour_le, new.date_evenement)
   where id = new.dossier_id;
  return new;
end;
$$;
revoke all on function private.evenement_touche_dossier() from public, anon, authenticated;

create trigger evenements_touche_dossier after insert on public.evenements
  for each row execute function private.evenement_touche_dossier();

-- ---------------------------------------------------------------------------
-- Décision du syndic sur un projet d'acte
-- ---------------------------------------------------------------------------
create function public.decider_validation(
  p_validation_id uuid,
  p_decision public.statut_validation,
  p_commentaire text default null
)
returns public.validations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.validations;
  d public.dossiers;
begin
  if p_decision = 'en_attente' then
    raise exception 'Décision invalide';
  end if;
  if p_decision = 'modification_demandee' and coalesce(btrim(p_commentaire), '') = '' then
    raise exception 'Un commentaire est requis pour demander une modification';
  end if;

  select * into v from public.validations where id = p_validation_id for update;
  if not found then
    raise exception 'Validation introuvable';
  end if;

  select * into d from public.dossiers where id = v.dossier_id;
  if d.syndic_id is distinct from private.mon_syndic_id() then
    -- même message que l'absence : on ne révèle pas l'existence d'un dossier d'un autre syndic
    raise exception 'Validation introuvable';
  end if;

  if v.statut <> 'en_attente' then
    raise exception 'Cette validation a déjà été traitée';
  end if;

  update public.validations
     set statut = p_decision,
         commentaire = nullif(btrim(p_commentaire), ''),
         decide_par = auth.uid(),
         decide_le = now()
   where id = v.id
   returning * into v;

  insert into public.evenements (dossier_id, titre, detail, visible_syndic, auteur)
  values (
    d.id,
    case when p_decision = 'validee' then v.objet || ' validé par le syndic'
         else 'Modification demandée par le syndic : ' || v.objet end,
    v.commentaire,
    true,
    auth.uid()
  );

  if p_decision = 'validee' and d.etape = 'assignation_a_valider' then
    update public.dossiers set etape = 'assignation_validee', mis_a_jour_le = current_date where id = d.id;
  end if;

  return v;
end;
$$;

revoke all on function public.decider_validation(uuid, public.statut_validation, text) from public, anon;
grant execute on function public.decider_validation(uuid, public.statut_validation, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Stockage privé des pièces
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pieces', 'pieces', false, 20971520,
        array['application/pdf', 'image/png', 'image/jpeg',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy pieces_fichiers_lecture on storage.objects for select to authenticated
  using (
    bucket_id = 'pieces'
    and (
      (select private.est_cabinet())
      or exists (
        select 1
        from public.pieces p
        join public.dossiers d on d.id = p.dossier_id
        where p.chemin = storage.objects.name
          and p.visible_syndic
          and d.syndic_id = (select private.mon_syndic_id())
      )
    )
  );

create policy pieces_fichiers_ajout_cabinet on storage.objects for insert to authenticated
  with check (bucket_id = 'pieces' and (select private.est_cabinet()));

create policy pieces_fichiers_modif_cabinet on storage.objects for update to authenticated
  using (bucket_id = 'pieces' and (select private.est_cabinet()))
  with check (bucket_id = 'pieces' and (select private.est_cabinet()));

create policy pieces_fichiers_suppr_cabinet on storage.objects for delete to authenticated
  using (bucket_id = 'pieces' and (select private.est_cabinet()));
