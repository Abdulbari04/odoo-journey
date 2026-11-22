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

-- ===== v5.2: ردود ومنشن وتفاعلات + مسابقات + كود دعوة (شغّله مرة، وتقدر تعيده بأمان) =====
alter table public.comments add column if not exists reply_to text;
alter table public.comments add column if not exists reply_name text;
alter table public.people add column if not exists code text;
alter table public.people add column if not exists inv text;
alter table public.people add column if not exists cw int;
alter table public.people add column if not exists cs int;
alter table public.people add column if not exists cn int;

create table if not exists public.reactions (
  comment_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, emoji)
);
alter table public.reactions enable row level security;
drop policy if exists "rx read" on public.reactions;
drop policy if exists "rx insert" on public.reactions;
drop policy if exists "rx update" on public.reactions;
drop policy if exists "rx delete" on public.reactions;
create policy "rx read" on public.reactions for select to authenticated using (true);
create policy "rx insert" on public.reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "rx update" on public.reactions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rx delete" on public.reactions for delete to authenticated using (auth.uid() = user_id);

-- ===== v5.3: فيديوهات الموديولات (شغّله مرة، وتقدر تعيده بأمان) =====
create table if not exists public.videos (
  module text primary key,
  url text not null,
  kind text not null default 'link',
  updated_at timestamptz not null default now()
);
alter table public.videos enable row level security;
drop policy if exists "videos read" on public.videos;
drop policy if exists "videos admin write" on public.videos;
create policy "videos read" on public.videos for select using (true);
create policy "videos admin write" on public.videos for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- مخزن ملفات الفيديو (عام للقراءة، والرفع للأدمن فقط)
insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict (id) do nothing;
drop policy if exists "videos files read" on storage.objects;
drop policy if exists "videos files admin" on storage.objects;
create policy "videos files read" on storage.objects for select using (bucket_id = 'videos');
create policy "videos files admin" on storage.objects for all to authenticated
  using (bucket_id = 'videos' and exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (bucket_id = 'videos' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ===== v5.4: رسائل مباشرة خاصة بين المستخدمين (شغّله مرة، وتقدر تعيده بأمان) =====
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  from_name text,
  to_name text,
  text text not null check (char_length(text) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists messages_to_idx on public.messages (to_user, created_at);
alter table public.messages enable row level security;
drop policy if exists "msg read own" on public.messages;
drop policy if exists "msg send" on public.messages;
drop policy if exists "msg delete own" on public.messages;
create policy "msg read own" on public.messages for select to authenticated using (auth.uid() = from_user or auth.uid() = to_user);
create policy "msg send" on public.messages for insert to authenticated with check (auth.uid() = from_user);
create policy "msg delete own" on public.messages for delete to authenticated using (auth.uid() = from_user);

-- ===== ترقية حساب الأدمن (سجّل في الموقع بنفس الإيميل الأول، وبعدين شغّل ده) =====
insert into public.admins
select id from auth.users where email = 'mabary90@gmail.com'
on conflict do nothing;
