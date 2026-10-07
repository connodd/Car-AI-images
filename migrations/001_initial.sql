create extension if not exists pgcrypto;

create table if not exists public.projects(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check(mode in('professional','rollers','wheels')),
  instructions text check(instructions is null or char_length(instructions)<=600),
  status text not null default 'UPLOADING' check(status in('DRAFT','UPLOADING','PREPARING','GENERATING','FINALIZING','COMPLETE','FAILED')),
  entitlement_type text check(entitlement_type in('single','subscription')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists projects_user_created_idx on public.projects(user_id,created_at desc);

create table if not exists public.assets(
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in('reference','wheel_reference','result')),
  path text not null unique,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.payments(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  mode text not null,
  status text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.subscriptions(
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.webhook_events(
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.assets enable row level security;
alter table public.billing_profiles enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "projects read own" on public.projects;
drop policy if exists "projects create upload only" on public.projects;
drop policy if exists "assets read own" on public.assets;
drop policy if exists "assets create input only" on public.assets;
drop policy if exists "billing read own" on public.billing_profiles;
drop policy if exists "payments read own" on public.payments;
drop policy if exists "subscriptions read own" on public.subscriptions;

create policy "projects read own" on public.projects for select using(auth.uid()=user_id);
create policy "projects create upload only" on public.projects for insert
  with check(auth.uid()=user_id and status='UPLOADING' and entitlement_type is null and error_message is null and completed_at is null);
create policy "assets read own" on public.assets for select using(auth.uid()=user_id);
create policy "assets create input only" on public.assets for insert
  with check(
    auth.uid()=user_id
    and kind in('reference','wheel_reference')
    and split_part(path,'/',1)=auth.uid()::text
    and exists(
      select 1 from public.projects p
      where p.id=project_id and p.user_id=auth.uid() and p.status='UPLOADING'
    )
  );
create policy "billing read own" on public.billing_profiles for select using(auth.uid()=user_id);
create policy "payments read own" on public.payments for select using(auth.uid()=user_id);
create policy "subscriptions read own" on public.subscriptions for select using(auth.uid()=user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('revframe-inputs','revframe-inputs',false,20971520,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('revframe-results','revframe-results',false,26214400,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "upload own revframe inputs" on storage.objects;
drop policy if exists "read own revframe inputs" on storage.objects;
create policy "upload own revframe inputs" on storage.objects for insert to authenticated
with check(bucket_id='revframe-inputs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "read own revframe inputs" on storage.objects for select to authenticated
using(bucket_id='revframe-inputs' and (storage.foldername(name))[1]=auth.uid()::text);
