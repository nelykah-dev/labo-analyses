-- =====================================================================
-- Migration 0001 — Fondations auth + CRUD
-- Tables : profiles, patients, analyses_catalogue + RLS par rôle.
-- À exécuter dans l'éditeur SQL du projet Supabase (aucune clé ici).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles : rôle applicatif lié à auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'PATIENT'
    check (role in ('ADMIN', 'MEDECIN', 'TECHNICIEN', 'PATIENT')),
  created_at timestamptz not null default now()
);

-- Rôle de l'utilisateur connecté (security definer : évite la récursion RLS).
create or replace function public.role_utilisateur()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.est_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.role_utilisateur() = 'ADMIN', false);
$$;

-- Chaque nouvel utilisateur crée son profil avec le rôle par défaut PATIENT.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'PATIENT')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. patients
-- ---------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  date_naissance date not null,
  numero_dossier text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. analyses_catalogue
-- ---------------------------------------------------------------------
create table if not exists public.analyses_catalogue (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  unite text not null,
  type_echantillon text not null,
  ref_min numeric not null,
  ref_max numeric not null check (ref_max >= ref_min),
  prix numeric not null check (prix >= 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. RLS activé partout
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.analyses_catalogue enable row level security;

-- profiles : lecture du propre profil, ou tout profil pour un ADMIN.
drop policy if exists "profiles_select_propre_ou_admin" on public.profiles;
create policy "profiles_select_propre_ou_admin"
  on public.profiles for select
  using (id = auth.uid() or public.est_admin());

-- profiles : seul un ADMIN peut changer un rôle (personne ne modifie le sien).
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.est_admin())
  with check (public.est_admin());

-- patients : consultation par le personnel soignant, écriture MEDECIN/ADMIN,
-- suppression ADMIN seul.
drop policy if exists "patients_select_personnel" on public.patients;
create policy "patients_select_personnel"
  on public.patients for select
  using (public.role_utilisateur() in ('ADMIN', 'MEDECIN', 'TECHNICIEN'));

drop policy if exists "patients_insert_medecin" on public.patients;
create policy "patients_insert_medecin"
  on public.patients for insert
  with check (public.role_utilisateur() in ('ADMIN', 'MEDECIN'));

drop policy if exists "patients_update_medecin" on public.patients;
create policy "patients_update_medecin"
  on public.patients for update
  using (public.role_utilisateur() in ('ADMIN', 'MEDECIN'));

drop policy if exists "patients_delete_admin" on public.patients;
create policy "patients_delete_admin"
  on public.patients for delete
  using (public.est_admin());

-- analyses_catalogue : lecture par le personnel, écriture réservée à l'ADMIN.
drop policy if exists "analyses_select_personnel" on public.analyses_catalogue;
create policy "analyses_select_personnel"
  on public.analyses_catalogue for select
  using (public.role_utilisateur() in ('ADMIN', 'MEDECIN', 'TECHNICIEN'));

drop policy if exists "analyses_write_admin" on public.analyses_catalogue;
create policy "analyses_write_admin"
  on public.analyses_catalogue for insert
  with check (public.est_admin());

drop policy if exists "analyses_update_admin" on public.analyses_catalogue;
create policy "analyses_update_admin"
  on public.analyses_catalogue for update
  using (public.est_admin());

drop policy if exists "analyses_delete_admin" on public.analyses_catalogue;
create policy "analyses_delete_admin"
  on public.analyses_catalogue for delete
  using (public.est_admin());

-- ---------------------------------------------------------------------
-- 5. Profil ADMIN de départ : remplacer l'UUID par un utilisateur réel
--    créé via l'inscription puis :
-- update public.profiles set role = 'ADMIN' where id = '<uuid>';
-- ---------------------------------------------------------------------
