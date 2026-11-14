-- FollowUp CRM schema
create table if not exists public.business_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  owner_name text,
  business_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  service_type text,
  status text not null default 'potential',
  last_contact_at timestamptz,
  next_follow_up date,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  customer_id uuid references public.customers(id) on delete cascade,
  title text not null,
  description text,
  source text not null default 'other',
  status text not null default 'new',
  received_at timestamptz not null default now(),
  next_follow_up date,
  notes text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz not null,
  priority text not null default 'medium',
  done boolean not null default false,
  done_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  body text not null,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  dedupe_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists notifications_dedupe_uidx
  on public.notifications (user_id, dedupe_key) where dedupe_key is not null;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type text not null,
  description text not null,
  customer_id uuid,
  created_at timestamptz not null default now()
);

-- auto-create business profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.business_profiles (id, owner_name, business_name, email)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.raw_user_meta_data->>'business_name', ''),
          new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.business_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

create policy "own profile" on public.business_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own customers" on public.customers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own leads" on public.leads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notes" on public.notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own activity" on public.activity_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
