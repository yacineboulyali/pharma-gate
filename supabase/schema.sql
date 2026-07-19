-- ============================================================
-- Pharma Gate — Schéma Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE : users (profils liés à auth.users)
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  role text not null check (role in ('responsable', 'assistante')),
  active boolean default true,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABLE : medicaments
-- ============================================================
create table if not exists public.medicaments (
  id uuid primary key default uuid_generate_v4(),
  designation text not null,
  qte_livree integer default 0,
  sortie integer default 0,
  stock integer default 0,
  seuil_alerte integer default 5,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABLE : patients
-- ============================================================
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- index pour la recherche par nom
create index if not exists idx_patients_nom on public.patients using gin (to_tsvector('simple', nom));

-- ============================================================
-- TABLE : sorties
-- ============================================================
create table if not exists public.sorties (
  id uuid primary key default uuid_generate_v4(),
  medicament_id uuid not null references public.medicaments(id),
  patient_id uuid references public.patients(id),
  user_id uuid not null references public.users(id),
  quantite integer not null check (quantite > 0),
  date_sortie timestamptz default now(),
  note text
);

-- index pour les filtres fréquents
create index if not exists idx_sorties_date on public.sorties(date_sortie);
create index if not exists idx_sorties_user on public.sorties(user_id);
create index if not exists idx_sorties_medicament on public.sorties(medicament_id);

-- ============================================================
-- TABLE : livraisons
-- ============================================================
create table if not exists public.livraisons (
  id uuid primary key default uuid_generate_v4(),
  medicament_id uuid not null references public.medicaments(id),
  quantite integer not null check (quantite > 0),
  date_livraison date default current_date,
  note text,
  user_id uuid references public.users(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TRIGGER : updated_at auto sur medicaments
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_medicaments_updated_at on public.medicaments;
create trigger trg_medicaments_updated_at
  before update on public.medicaments
  for each row execute function public.set_updated_at();

-- ============================================================
-- FUNCTION : enregistrer_sortie
-- Décrémente le stock atomiquement et insère la sortie
-- ============================================================
create or replace function public.enregistrer_sortie(
  p_medicament_id uuid,
  p_patient_nom text,
  p_quantite integer,
  p_user_id uuid,
  p_note text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_stock_actuel integer;
  v_patient_id uuid;
  v_sortie_id uuid;
begin
  -- Vérifier le stock disponible
  select stock into v_stock_actuel
  from public.medicaments
  where id = p_medicament_id
  for update;

  if v_stock_actuel is null then
    return jsonb_build_object('success', false, 'error', 'Médicament introuvable');
  end if;

  if v_stock_actuel < p_quantite then
    return jsonb_build_object(
      'success', false,
      'error', format('Stock insuffisant. Disponible : %s', v_stock_actuel)
    );
  end if;

  -- Récupérer ou créer le patient
  select id into v_patient_id
  from public.patients
  where lower(trim(nom)) = lower(trim(p_patient_nom))
  limit 1;

  if v_patient_id is null then
    insert into public.patients (nom)
    values (trim(p_patient_nom))
    returning id into v_patient_id;
  end if;

  -- Décrémenter le stock
  update public.medicaments
  set sortie = sortie + p_quantite,
      stock  = stock  - p_quantite
  where id = p_medicament_id;

  -- Enregistrer la sortie
  insert into public.sorties (medicament_id, patient_id, user_id, quantite, note)
  values (p_medicament_id, v_patient_id, p_user_id, p_quantite, p_note)
  returning id into v_sortie_id;

  return jsonb_build_object(
    'success', true,
    'sortie_id', v_sortie_id,
    'patient_id', v_patient_id,
    'nouveau_stock', v_stock_actuel - p_quantite
  );
end;
$$;

-- ============================================================
-- FUNCTION : enregistrer_livraison
-- Incrémente le stock atomiquement et insère la livraison
-- ============================================================
create or replace function public.enregistrer_livraison(
  p_medicament_id uuid,
  p_quantite integer,
  p_user_id uuid,
  p_note text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_nouveau_stock integer;
begin
  update public.medicaments
  set qte_livree = qte_livree + p_quantite,
      stock      = stock + p_quantite
  where id = p_medicament_id
  returning stock into v_nouveau_stock;

  if v_nouveau_stock is null then
    return jsonb_build_object('success', false, 'error', 'Médicament introuvable');
  end if;

  insert into public.livraisons (medicament_id, quantite, user_id, note)
  values (p_medicament_id, p_quantite, p_user_id, p_note);

  return jsonb_build_object('success', true, 'nouveau_stock', v_nouveau_stock);
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users       enable row level security;
alter table public.medicaments enable row level security;
alter table public.patients    enable row level security;
alter table public.sorties     enable row level security;
alter table public.livraisons  enable row level security;

-- Helper : récupérer le rôle de l'utilisateur courant
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.users where id = auth.uid();
$$;

-- ---- USERS ----
create policy "users_select_own" on public.users
  for select using (id = auth.uid() or public.current_user_role() = 'responsable');

create policy "users_insert_responsable" on public.users
  for insert with check (public.current_user_role() = 'responsable');

create policy "users_update_responsable" on public.users
  for update using (public.current_user_role() = 'responsable');

create policy "users_delete_responsable" on public.users
  for delete using (public.current_user_role() = 'responsable' and role = 'assistante');

-- ---- MEDICAMENTS ----
create policy "medicaments_select_all" on public.medicaments
  for select using (auth.uid() is not null);

create policy "medicaments_write_responsable" on public.medicaments
  for all using (public.current_user_role() = 'responsable');

-- ---- PATIENTS ----
create policy "patients_select_all" on public.patients
  for select using (auth.uid() is not null);

create policy "patients_insert_authenticated" on public.patients
  for insert with check (auth.uid() is not null);

create policy "patients_update_responsable" on public.patients
  for update using (public.current_user_role() = 'responsable');

create policy "patients_delete_responsable" on public.patients
  for delete using (public.current_user_role() = 'responsable');

-- ---- SORTIES ----
create policy "sorties_select_own_or_responsable" on public.sorties
  for select using (
    user_id = auth.uid()
    or public.current_user_role() = 'responsable'
  );

create policy "sorties_insert_authenticated" on public.sorties
  for insert with check (auth.uid() is not null);

create policy "sorties_delete_responsable" on public.sorties
  for delete using (public.current_user_role() = 'responsable');

-- ---- LIVRAISONS ----
create policy "livraisons_select_all" on public.livraisons
  for select using (auth.uid() is not null);

create policy "livraisons_write_responsable" on public.livraisons
  for all using (public.current_user_role() = 'responsable');
