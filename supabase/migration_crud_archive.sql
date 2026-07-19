-- ============================================================
-- Pharma Gate — Migration : CRUD complet + archivage
-- (patients, médicaments, assistantes)
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Sans danger à ré-exécuter (idempotent).
-- ============================================================

-- Colonnes d'archivage
alter table public.medicaments add column if not exists active boolean default true;
alter table public.patients    add column if not exists active boolean default true;

-- ---- PATIENTS : modification / suppression (responsable uniquement) ----
drop policy if exists "patients_update_responsable" on public.patients;
create policy "patients_update_responsable" on public.patients
  for update using (public.current_user_role() = 'responsable');

drop policy if exists "patients_delete_responsable" on public.patients;
create policy "patients_delete_responsable" on public.patients
  for delete using (public.current_user_role() = 'responsable');

-- ---- USERS : suppression d'un compte assistante (responsable uniquement) ----
-- Ne supprime que la ligne de profil public.users, pas le compte
-- auth.users sous-jacent (nécessite la clé service_role / le dashboard).
drop policy if exists "users_delete_responsable" on public.users;
create policy "users_delete_responsable" on public.users
  for delete using (public.current_user_role() = 'responsable' and role = 'assistante');
