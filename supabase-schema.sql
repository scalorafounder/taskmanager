-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

create table if not exists user_tasks (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  tasks      jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Only the owner can read/write their tasks
alter table user_tasks enable row level security;

create policy "owner_all" on user_tasks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
