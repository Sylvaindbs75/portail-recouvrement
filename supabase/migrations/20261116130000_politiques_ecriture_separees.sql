-- Conseiller Supabase « multiple permissive policies » : les politiques « for all »
-- du cabinet doublaient la lecture. On les remplace par insert / update / delete.
-- Le comportement d'accès est inchangé (cf. tests/rls.sql).

do $$
declare t text;
begin
  foreach t in array array['syndics', 'dossiers', 'evenements', 'pieces', 'validations'] loop
    execute format('drop policy %I on public.%I', t || '_ecriture_cabinet', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.est_cabinet()))', t || '_ajout_cabinet', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.est_cabinet())) with check ((select private.est_cabinet()))', t || '_modif_cabinet', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.est_cabinet()))', t || '_suppr_cabinet', t);
  end loop;
end;
$$;

-- decider_validation reste SECURITY DEFINER et appelable par « authenticated » :
-- c'est le seul moyen pour un syndic d'enregistrer sa décision. La fonction vérifie
-- elle-même que la validation appartient au syndic connecté et qu'elle est en attente.
comment on function public.decider_validation(uuid, public.statut_validation, text) is
  'Décision du syndic sur un projet d''acte. Contrôle d''accès interne : syndic du dossier uniquement, décision unique.';
