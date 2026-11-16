-- À exécuter UNE FOIS, après avoir créé les 3 comptes de test dans
-- Supabase > Authentication > Users. Remplacez les adresses ci-dessous.
-- Aucun mot de passe ne figure ici.

insert into public.profils (id, email, nom_affiche, role, syndic_id)
select u.id, u.email, v.nom, v.role::public.role_utilisateur, v.syndic_id::uuid
from (values
  ('ADRESSE_CABINET', 'Cabinet', 'cabinet', null),
  ('ADRESSE_ALPHA',   'Gestionnaire Syndic Alpha', 'syndic', '00000000-0000-4000-a000-00000000000a'),
  ('ADRESSE_BETA',    'Gestionnaire Syndic Beta',  'syndic', '00000000-0000-4000-a000-00000000000b')
) as v(email, nom, role, syndic_id)
join auth.users u on lower(u.email) = lower(v.email)
on conflict (id) do update
  set role = excluded.role, syndic_id = excluded.syndic_id, nom_affiche = excluded.nom_affiche;
