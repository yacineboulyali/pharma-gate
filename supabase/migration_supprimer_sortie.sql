-- ============================================================
-- Pharma Gate — Migration : suppression d'une sortie (historique)
-- Réservé au rôle responsable
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Sans danger à ré-exécuter (idempotent).
-- ============================================================

-- ============================================================
-- FUNCTION : supprimer_sortie
-- Restitue le stock du médicament avant de supprimer la sortie,
-- atomiquement. La policy sorties_delete_responsable existe déjà
-- (schema.sql) mais un delete direct laisserait stock/sortie
-- désynchronisés sur medicaments — d'où cette fonction dédiée.
-- ============================================================
create or replace function public.supprimer_sortie(
  p_sortie_id uuid
)
returns jsonb language plpgsql security definer as $$
declare
  v_medicament_id uuid;
  v_quantite integer;
begin
  if public.current_user_role() <> 'responsable' then
    return jsonb_build_object('success', false, 'error', 'Accès réservé au responsable');
  end if;

  select medicament_id, quantite into v_medicament_id, v_quantite
  from public.sorties
  where id = p_sortie_id
  for update;

  if v_medicament_id is null then
    return jsonb_build_object('success', false, 'error', 'Sortie introuvable');
  end if;

  update public.medicaments
  set stock  = stock  + v_quantite,
      sortie = sortie - v_quantite
  where id = v_medicament_id;

  delete from public.sorties where id = p_sortie_id;

  return jsonb_build_object('success', true);
end;
$$;
