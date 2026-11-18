-- شغّل ده في Supabase > SQL Editor مرة واحدة
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  job text,
  kv jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own row read"   on public.profiles for select using (auth.uid() = id);
create policy "own row insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own row update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ===== لوحة الأدمن =====
create table if not exists public.stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.stats enable row level security;
alter table public.admins enable row level security;
create policy "admin sees self" on public.admins for select using (auth.uid() = user_id);
create policy "own stats write" on public.stats for insert with check (auth.uid() = user_id);
create policy "own stats update" on public.stats for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own or admin read" on public.stats for select using (auth.uid() = user_id or exists (select 1 from public.admins a where a.user_id = auth.uid()));
-- بعد ما تسجّل حسابك في الموقع، خليه أدمن (غيّر الإيميل):
-- insert into public.admins select id from auth.users where email = 'your@email.com';
