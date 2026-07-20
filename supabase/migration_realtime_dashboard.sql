-- ============================================================
-- Pharma Gate — Migration : activer le Realtime pour le dashboard
-- Permet au dashboard responsable de se mettre à jour automatiquement
-- dès qu'une sortie, un patient ou un médicament est modifié.
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Sans danger à ré-exécuter (idempotent).
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sorties'
  ) then
    alter publication supabase_realtime add table public.sorties;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'patients'
  ) then
    alter publication supabase_realtime add table public.patients;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'medicaments'
  ) then
    alter publication supabase_realtime add table public.medicaments;
  end if;
end $$;
