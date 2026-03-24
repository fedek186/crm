-- 1) Marcar un usuario existente como administrador en Supabase Auth.
-- Reemplazá el email por el de tu admin real.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
where email = 'admin@tuempresa.com';

-- 2) Función reutilizable para chequear admin desde el JWT.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$;

comment on function public.is_admin() is 'Devuelve true cuando el JWT del usuario autenticado contiene app_metadata.is_admin = true';

-- 3) Activar RLS en merchants.
alter table public.merchants
add column if not exists deleted_at timestamp;

alter table public.merchants enable row level security;
alter table public.merchants force row level security;

-- 4) Limpiar políticas viejas de merchants si existían.
drop policy if exists "Admins can select merchants" on public.merchants;
drop policy if exists "Admins can insert merchants" on public.merchants;
drop policy if exists "Admins can update merchants" on public.merchants;
drop policy if exists "Admins can delete merchants" on public.merchants;

-- 5) Crear políticas admin-only para merchants.
create policy "Admins can select merchants"
on public.merchants
for select
to authenticated
using (public.is_admin() and deleted_at is null);

create policy "Admins can insert merchants"
on public.merchants
for insert
to authenticated
with check (public.is_admin() and deleted_at is null);

create policy "Admins can update merchants"
on public.merchants
for update
to authenticated
using (public.is_admin() and deleted_at is null)
with check (public.is_admin());

-- 6) Ejemplo genérico para repetir en otras tablas.
-- Reemplazá public.tu_tabla por el nombre real.
-- alter table public.tu_tabla enable row level security;
-- alter table public.tu_tabla force row level security;
-- drop policy if exists "Admins can manage tu_tabla" on public.tu_tabla;
-- create policy "Admins can manage tu_tabla"
-- on public.tu_tabla
-- for all
-- to authenticated
-- using (public.is_admin())
-- with check (public.is_admin());

-- 7) Verificación opcional: muestra el claim admin dentro de la sesión actual.
select auth.jwt() -> 'app_metadata' ->> 'is_admin' as current_session_is_admin;
