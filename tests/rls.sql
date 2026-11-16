-- Recette du cloisonnement (PRD §7, §9, §10).
-- Tout s'exécute dans un bloc qui se termine par une exception volontaire :
-- les comptes et fichiers de test créés ici sont donc ANNULÉS (rollback).
-- Résultat attendu : une erreur « RLS_OK … ». Toute autre erreur = test en échec.

do $$
declare
  u_cab   uuid := '11111111-1111-4111-8111-111111111111';
  u_alpha uuid := '22222222-2222-4222-8222-222222222222';
  u_beta  uuid := '33333333-3333-4333-8333-333333333333';
  n bigint;
  s bigint;
  v_id uuid;
  refs text;
  ok text := '';
begin
  -- Comptes fictifs temporaires
  insert into auth.users (id, instance_id, aud, role, email) values
    (u_cab,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-cabinet@exemple.invalid'),
    (u_alpha, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-alpha@exemple.invalid'),
    (u_beta,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-beta@exemple.invalid');
  insert into public.profils (id, email, role, syndic_id) values
    (u_cab,   'test-cabinet@exemple.invalid', 'cabinet', null),
    (u_alpha, 'test-alpha@exemple.invalid',   'syndic', '00000000-0000-4000-a000-00000000000a'),
    (u_beta,  'test-beta@exemple.invalid',    'syndic', '00000000-0000-4000-a000-00000000000b');

  -- Fichiers fictifs dans le stockage : une pièce visible (A-002) et une pièce interne (A-003)
  insert into storage.objects (bucket_id, name, owner) values
    ('pieces', '00000000-0000-4000-b000-0000000000a2/projet-assignation.pdf', u_cab),
    ('pieces', '00000000-0000-4000-b000-0000000000a3/note-interne.pdf', u_cab)
  on conflict do nothing;

  select id into v_id from public.validations where dossier_id = '00000000-0000-4000-b000-0000000000a2';

  -- Remet A-002 dans l'état du jeu fictif (annulé à la fin, comme le reste).
  update public.validations set statut = 'en_attente', commentaire = null, decide_par = null, decide_le = null where id = v_id;
  update public.dossiers set etape = 'assignation_a_valider' where id = '00000000-0000-4000-b000-0000000000a2';
  update public.dossiers set mis_a_jour_le = v.d
  from (values ('A-001', date '2026-11-02'), ('A-002', date '2026-11-10'), ('A-003', date '2026-10-05'),
               ('B-001', date '2026-11-12'), ('B-002', date '2026-09-01')) as v(ref, d)
  where reference = v.ref;

  ------------------------------------------------------------------ ANONYME
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into n from public.dossiers;
    raise exception 'ÉCHEC anon : lecture des dossiers autorisée (% lignes)', n;
  exception when insufficient_privilege then ok := ok || 'anon ';
  end;
  execute 'reset role';

  ------------------------------------------------------------------ ALPHA
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', u_alpha, 'role', 'authenticated')::text, true);

  select count(*), coalesce(sum(solde_centimes), 0) into n, s from public.dossiers;
  if n <> 3 or s <> 1085050 then raise exception 'ÉCHEC Alpha tableau de bord : % dossiers, % centimes', n, s; end if;

  select count(*) into n from public.validations where statut = 'en_attente';
  if n <> 1 then raise exception 'ÉCHEC Alpha actions à valider : %', n; end if;

  select count(*) into n from public.dossiers where etape = 'audience' and prochaine_echeance >= date '2026-11-16';
  if n <> 1 then raise exception 'ÉCHEC Alpha audiences à venir : %', n; end if;

  select count(*) into n from public.evenements where not visible_syndic;
  if n <> 0 then raise exception 'ÉCHEC Alpha voit % note(s) interne(s)', n; end if;

  select count(*) into n from public.pieces;
  if n <> 1 then raise exception 'ÉCHEC Alpha voit % pièce(s) au lieu de 1 (pièce interne exposée ?)', n; end if;

  select count(*) into n from storage.objects where bucket_id = 'pieces' and name in ('00000000-0000-4000-b000-0000000000a2/projet-assignation.pdf', '00000000-0000-4000-b000-0000000000a3/note-interne.pdf');
  if n <> 1 then raise exception 'ÉCHEC Alpha voit % fichier(s) au lieu de 1', n; end if;

  select count(*) into n from public.syndics;
  if n <> 1 then raise exception 'ÉCHEC Alpha voit % syndic(s)', n; end if;

  -- Écritures interdites au syndic
  update public.dossiers set solde_centimes = 0;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ÉCHEC Alpha a modifié % dossier(s)', n; end if;

  update public.validations set statut = 'validee', decide_le = now();
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'ÉCHEC Alpha a modifié directement % validation(s)', n; end if;

  begin
    update public.profils set role = 'cabinet', syndic_id = null where id = u_alpha;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'ÉCHEC Alpha s''est promu cabinet'; end if;
  exception when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('pieces', '00000000-0000-4000-b000-0000000000a2/pirate.pdf');
    raise exception 'ÉCHEC Alpha a déposé un fichier';
  exception when insufficient_privilege then null;
  end;
  ok := ok || 'alpha ';

  ------------------------------------------------------------------ BETA
  perform set_config('request.jwt.claims', json_build_object('sub', u_beta, 'role', 'authenticated')::text, true);

  select count(*), coalesce(sum(solde_centimes), 0) into n, s from public.dossiers;
  if n <> 2 or s <> 1237025 then raise exception 'ÉCHEC Beta tableau de bord : % dossiers, % centimes', n, s; end if;

  select count(*) into n from public.dossiers where id = '00000000-0000-4000-b000-0000000000a2';
  if n <> 0 then raise exception 'ÉCHEC Beta accède au dossier A-002 par son identifiant'; end if;

  select count(*) into n from public.validations;
  if n <> 0 then raise exception 'ÉCHEC Beta voit % validation(s)', n; end if;

  select count(*) into n from public.evenements e where e.dossier_id::text like '%-0000000000a_';
  if n <> 0 then raise exception 'ÉCHEC Beta voit % événement(s) Alpha', n; end if;

  select count(*) into n from public.pieces where dossier_id::text like '%-0000000000a_';
  if n <> 0 then raise exception 'ÉCHEC Beta voit % pièce(s) Alpha', n; end if;

  select count(*) into n from storage.objects where bucket_id = 'pieces' and name in ('00000000-0000-4000-b000-0000000000a2/projet-assignation.pdf', '00000000-0000-4000-b000-0000000000a3/note-interne.pdf');
  if n <> 0 then raise exception 'ÉCHEC Beta voit % fichier(s) Alpha', n; end if;

  begin
    perform public.decider_validation(v_id, 'validee', null);
    raise exception 'ÉCHEC Beta a validé un acte d''Alpha';
  exception when raise_exception then
    if sqlerrm <> 'Validation introuvable' then raise; end if;
  end;
  ok := ok || 'beta ';

  ------------------------------------------------------------------ CABINET
  perform set_config('request.jwt.claims', json_build_object('sub', u_cab, 'role', 'authenticated')::text, true);

  select count(*), coalesce(sum(solde_centimes), 0) into n, s from public.dossiers;
  if n <> 5 or s <> 2322075 then raise exception 'ÉCHEC cabinet : % dossiers, % centimes', n, s; end if;

  select string_agg(reference || ':' || (date '2026-11-16' - mis_a_jour_le), ',' order by reference) into refs
  from public.dossiers where date '2026-11-16' - mis_a_jour_le > 30;
  if refs is distinct from 'A-003:42,B-002:76' then raise exception 'ÉCHEC cabinet sans mise à jour : %', refs; end if;

  select count(*) into n from storage.objects where bucket_id = 'pieces' and name in ('00000000-0000-4000-b000-0000000000a2/projet-assignation.pdf', '00000000-0000-4000-b000-0000000000a3/note-interne.pdf');
  if n <> 2 then raise exception 'ÉCHEC cabinet voit % fichier(s) au lieu de 2', n; end if;
  ok := ok || 'cabinet ';

  ------------------------------------------------------------------ DÉCISION ALPHA
  perform set_config('request.jwt.claims', json_build_object('sub', u_alpha, 'role', 'authenticated')::text, true);

  begin
    perform public.decider_validation(v_id, 'modification_demandee', '   ');
    raise exception 'ÉCHEC modification sans commentaire acceptée';
  exception when raise_exception then
    if sqlerrm not like 'Un commentaire est requis%' then raise; end if;
  end;

  perform public.decider_validation(v_id, 'validee', null);

  select count(*) into n from public.validations where statut = 'en_attente';
  if n <> 0 then raise exception 'ÉCHEC après validation : % action(s) à valider', n; end if;

  select count(*) into n from public.validations where id = v_id and decide_par = u_alpha and decide_le is not null;
  if n <> 1 then raise exception 'ÉCHEC décision non signée/datée'; end if;

  select count(*) into n from public.dossiers where reference = 'A-002' and etape = 'assignation_validee';
  if n <> 1 then raise exception 'ÉCHEC étape A-002 non passée à « assignation validée »'; end if;

  select count(*) into n from public.dossiers where reference = 'A-002' and libelle_echeance = 'Délivrance par le cabinet';
  if n <> 1 then raise exception 'ÉCHEC libellé d''échéance A-002 non mis à jour'; end if;

  begin
    perform public.decider_validation(v_id, 'modification_demandee', 'je change d''avis');
    raise exception 'ÉCHEC décision modifiée après coup';
  exception when raise_exception then
    if sqlerrm <> 'Cette validation a déjà été traitée' then raise; end if;
  end;
  ok := ok || 'decision ';

  execute 'reset role';
  raise exception 'RLS_OK [%] (rollback volontaire, aucune donnée conservée)', btrim(ok);
end;
$$;
