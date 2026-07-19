-- ============================================================
-- Pharma Gate — Lier les comptes de test créés dans
-- Authentication > Users à la table public.users
-- À exécuter APRÈS avoir créé les 2 utilisateurs dans le dashboard
-- respo@respo.ma / mot de passe : respo@respo.ma       (rôle responsable)
-- assiste@assiste.ma / mot de passe : assiste@assiste.ma (rôle assistante)
-- ============================================================

insert into public.users (id, username, full_name, role)
select id, 'responsable', 'Responsable Pharmacie', 'responsable'
from auth.users where email = 'respo@respo.ma'
on conflict (id) do update set role = excluded.role;

insert into public.users (id, username, full_name, role)
select id, 'assistante1', 'Assistante Test', 'assistante'
from auth.users where email = 'assiste@assiste.ma'
on conflict (id) do update set role = excluded.role;

-- Vérification
select username, full_name, role from public.users;
