create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.memberships (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner', 'member')),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.memberships enable row level security;

-- security definer so policies can check membership without recursing into memberships' own RLS
create function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- creates the group and its owner membership atomically
create function public.create_group(group_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.groups (name) values (group_name) returning id into new_id;
  insert into public.memberships (group_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

create policy "members read their groups" on public.groups
  for select to authenticated
  using (public.is_group_member(id));

create policy "members read group memberships" on public.memberships
  for select to authenticated
  using (public.is_group_member(group_id));

grant select on public.groups, public.memberships to authenticated;

revoke execute on function public.is_group_member(uuid), public.create_group(text) from public, anon;
grant execute on function public.is_group_member(uuid), public.create_group(text) to authenticated;
