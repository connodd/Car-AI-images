create extension if not exists pgcrypto;

create table if not exists public.projects(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check(mode in('professional','rollers','wheels')),
  instructions text,
  status text not null default 'DRAFT' check(status in('DRAFT','UPLOADING','PREPARING','GENERATING','FINALIZING','COMPLETE','FAILED')),
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

create policy "projects read own" on public.projects for select using(auth.uid()=user_id);
create policy "projects insert own" on public.projects for insert with check(auth.uid()=user_id);
create policy "assets read own" on public.assets for select using(auth.uid()=user_id);
create policy "assets insert own" on public.assets for insert with check(auth.uid()=user_id);
create policy "billing read own" on public.billing_profiles for select using(auth.uid()=user_id);
create policy "payments read own" on public.payments for select using(auth.uid()=user_id);
create policy "subscriptions read own" on public.subscriptions for select using(auth.uid()=user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('revframe-inputs','revframe-inputs',false,20971520,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('revframe-results','revframe-results',false,26214400,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy "upload own revframe inputs" on storage.objects for insert to authenticated
with check(bucket_id='revframe-inputs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "read own revframe inputs" on storage.objects for select to authenticated
using(bucket_id='revframe-inputs' and (storage.foldername(name))[1]=auth.uid()::text);
