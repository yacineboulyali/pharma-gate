-- ============================================================
-- Pharma Gate — Migration : modification d'une sortie (historique)
-- Réservé au rôle responsable
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Sans danger à ré-exécuter (idempotent).
-- ============================================================

-- ============================================================
-- FUNCTION : modifier_sortie
-- Corrige la quantité / le patient d'une sortie déjà enregistrée
-- et réajuste le stock du médicament en conséquence, atomiquement.
-- ============================================================
create or replace function public.modifier_sortie(
  p_sortie_id uuid,
  p_patient_nom text,
  p_quantite integer
)
returns jsonb language plpgsql security definer as $$
declare
  v_medicament_id uuid;
  v_ancienne_quantite integer;
  v_stock_actuel integer;
  v_patient_id uuid;
begin
  if public.current_user_role() <> 'responsable' then
    return jsonb_build_object('success', false, 'error', 'Accès réservé au responsable');
  end if;

  if p_quantite < 1 then
    return jsonb_build_object('success', false, 'error', 'Quantité invalide');
  end if;

  select medicament_id, quantite into v_medicament_id, v_ancienne_quantite
  from public.sorties
  where id = p_sortie_id
  for update;

  if v_medicament_id is null then
    return jsonb_build_object('success', false, 'error', 'Sortie introuvable');
  end if;

  select stock into v_stock_actuel
  from public.medicaments
  where id = v_medicament_id
  for update;

  -- Le stock actuel + l'ancienne quantité représente la disponibilité
  -- réelle une fois l'ancienne sortie "annulée"
  if v_stock_actuel + v_ancienne_quantite < p_quantite then
    return jsonb_build_object(
      'success', false,
      'error', format('Stock insuffisant. Disponible : %s', v_stock_actuel + v_ancienne_quantite)
    );
  end if;

  select id into v_patient_id
  from public.patients
  where lower(trim(nom)) = lower(trim(p_patient_nom))
  limit 1;

  if v_patient_id is null then
    insert into public.patients (nom)
    values (trim(p_patient_nom))
    returning id into v_patient_id;
  end if;

  update public.medicaments
  set stock  = stock  + v_ancienne_quantite - p_quantite,
      sortie = sortie - v_ancienne_quantite + p_quantite
  where id = v_medicament_id;

  update public.sorties
  set patient_id = v_patient_id,
      quantite   = p_quantite
  where id = p_sortie_id;

  return jsonb_build_object(
    'success', true,
    'nouveau_stock', v_stock_actuel + v_ancienne_quantite - p_quantite
  );
end;
$$;

-- ---- SORTIES : modification (responsable uniquement) ----
-- Nécessaire pour que la fonction ci-dessus (security definer) reste
-- cohérente avec le modèle de permissions même si RLS est un jour
-- appliqué aux appels directs sur la table.
drop policy if exists "sorties_update_responsable" on public.sorties;
create policy "sorties_update_responsable" on public.sorties
  for update using (public.current_user_role() = 'responsable');
