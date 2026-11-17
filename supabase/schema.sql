-- SimulaFrac · tabla de perfiles y membresía (ejecutar en Supabase → SQL Editor)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  email text,
  trial_end timestamptz not null default now() + interval '7 days',
  member_until timestamptz,
  member_status text,              -- authorized | paused | cancelled
  mp_preapproval_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuario solo puede LEER su propio perfil. Nadie puede modificarlo desde la app:
-- la membresía la actualiza solo el servidor (webhook de Mercado Pago) con la service role key.
drop policy if exists "leer mi perfil" on public.profiles;
create policy "leer mi perfil" on public.profiles for select using (auth.uid() = id);

-- Al registrarse se crea el perfil con 7 días de prueba.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email) values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
