-- ExpenseFlow: admin registration toggle + sign-up enforcement
-- Run once in Supabase → SQL Editor. Replace CHANGE_ME with your admin password first.
-- Safe to re-run (re-running also resets the admin password to whatever you put below).

-- 1. app_settings: remove every existing policy, then only allow reading the flag
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'app_settings'
  loop
    execute format('drop policy %I on public.app_settings', p.policyname);
  end loop;
end $$;

alter table public.app_settings enable row level security;

create policy "Anyone can read registration flag"
on public.app_settings
for select
to anon, authenticated
using (key = 'registration_enabled');

-- 2. Admin password, stored as a bcrypt hash, never readable through the API
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_config (
  id        int primary key default 1 check (id = 1),
  pass_hash text not null
);

alter table public.admin_config enable row level security;
revoke all on public.admin_config from anon, authenticated;

insert into public.admin_config (id, pass_hash)
values (1, extensions.crypt('CHANGE_ME', extensions.gen_salt('bf')))
on conflict (id) do update set pass_hash = excluded.pass_hash;

-- 3. Functions the admin page calls
create or replace function public.admin_check(p_pass text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_config
    where id = 1 and pass_hash = extensions.crypt(p_pass, pass_hash)
  );
$$;

create or replace function public.admin_set_registration(p_pass text, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.admin_check(p_pass) then
    return false;
  end if;

  update public.app_settings
  set value = p_enabled::text, updated_at = now()
  where key = 'registration_enabled';

  return found;
end;
$$;

revoke all on function public.admin_check(text) from public;
revoke all on function public.admin_set_registration(text, boolean) from public;
grant execute on function public.admin_check(text) to anon, authenticated;
grant execute on function public.admin_set_registration(text, boolean) to anon, authenticated;

-- 4. Block new accounts in the database while registration is closed
create or replace function public.enforce_registration_open()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(
       (select value from public.app_settings where key = 'registration_enabled'),
       'false'
     ) <> 'true' then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_registration_open on auth.users;
create trigger enforce_registration_open
before insert on auth.users
for each row execute function public.enforce_registration_open();
