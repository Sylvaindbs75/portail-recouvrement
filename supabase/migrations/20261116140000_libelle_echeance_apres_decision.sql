-- Après la décision du syndic, le libellé d'échéance « Assignation à valider » restait affiché.
-- La décision met désormais à jour la prochaine échéance du dossier.

create or replace function public.decider_validation(
  p_validation_id uuid,
  p_decision public.statut_validation,
  p_commentaire text default null
)
returns public.validations language plpgsql security definer set search_path = ''
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
    raise exception 'Validation introuvable';
  end if;

  if v.statut <> 'en_attente' then
    raise exception 'Cette validation a déjà été traitée';
  end if;

  update public.validations
     set statut = p_decision, commentaire = nullif(btrim(p_commentaire), ''), decide_par = auth.uid(), decide_le = now()
   where id = v.id
   returning * into v;

  insert into public.evenements (dossier_id, titre, detail, visible_syndic, auteur)
  values (
    d.id,
    case when p_decision = 'validee' then v.objet || ' validé par le syndic'
         else 'Modification demandée par le syndic : ' || v.objet end,
    v.commentaire, true, auth.uid()
  );

  update public.dossiers
     set etape = case when p_decision = 'validee' and etape = 'assignation_a_valider'
                      then 'assignation_validee'::public.etape_dossier else etape end,
         libelle_echeance = case when p_decision = 'validee' then 'Délivrance par le cabinet'
                                 else 'Modification en cours par le cabinet' end,
         prochaine_echeance = null,
         mis_a_jour_le = current_date
   where id = d.id;

  return v;
end;
$$;

revoke all on function public.decider_validation(uuid, public.statut_validation, text) from public, anon;
grant execute on function public.decider_validation(uuid, public.statut_validation, text) to authenticated;
