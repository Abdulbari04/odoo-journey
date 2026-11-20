-- شغّل ده في Supabase > SQL Editor (ينفع تشغّله أكتر من مرة)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text, job text,
  kv jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);

alter table public.profiles enable row level security;
alter table public.stats enable row level security;
alter table public.admins enable row level security;

drop policy if exists "own row read" on public.profiles;
drop policy if exists "own row insert" on public.profiles;
drop policy if exists "own row update" on public.profiles;
drop policy if exists "admin sees self" on public.admins;
drop policy if exists "own stats write" on public.stats;
drop policy if exists "own stats update" on public.stats;
drop policy if exists "own or admin read" on public.stats;

create policy "own row read"   on public.profiles for select using (auth.uid() = id);
create policy "own row insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own row update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin sees self" on public.admins for select using (auth.uid() = user_id);
create policy "own stats write" on public.stats for insert with check (auth.uid() = user_id);
create policy "own stats update" on public.stats for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own or admin read" on public.stats for select using (auth.uid() = user_id or exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- بعد ما تسجّل حسابك في الموقع، خليه أدمن (غيّر الإيميل):
-- insert into public.admins select id from auth.users where email = 'your@email.com';

-- ===== المجتمع: تعليقات الموديولات (شغّله مرة، وتقدر تعيده بأمان) =====
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  module text not null,
  text text not null check (char_length(text) between 1 and 400),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
drop policy if exists "comments read" on public.comments;
drop policy if exists "comments insert" on public.comments;
drop policy if exists "comments delete" on public.comments;
create policy "comments read" on public.comments for select to authenticated using (true);
create policy "comments insert" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "comments delete" on public.comments for delete to authenticated using (auth.uid() = user_id or exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ===== المجتمع: الملفات الشخصية والمتصدرون =====
create table if not exists public.people (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  job text default '',
  bio text default '',
  avatar text default '',
  pts int not null default 0,
  mods int not null default 0,
  lvls int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.people enable row level security;
drop policy if exists "people read" on public.people;
drop policy if exists "people insert" on public.people;
drop policy if exists "people update" on public.people;
create policy "people read" on public.people for select to authenticated using (true);
create policy "people insert" on public.people for insert to authenticated with check (auth.uid() = user_id);
create policy "people update" on public.people for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
