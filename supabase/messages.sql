create table public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  author_name text not null default '',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_group_created_idx on public.messages (group_id, created_at);

alter table public.messages enable row level security;

-- stamps the sender from the session so the client can't spoof user or name
create function public.set_message_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := auth.uid();
  select split_part(email, '@', 1) into new.author_name from auth.users where id = auth.uid();
  return new;
end;
$$;

create trigger messages_set_author
  before insert on public.messages
  for each row execute function public.set_message_author();

create policy "members read group messages" on public.messages
  for select to authenticated
  using (public.is_group_member(group_id));

create policy "members post to their groups" on public.messages
  for insert to authenticated
  with check (public.is_group_member(group_id));

grant select, insert on public.messages to authenticated;

alter publication supabase_realtime add table public.messages;
