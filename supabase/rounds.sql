alter table public.memberships add column display_name text not null default '';

update public.memberships m
set display_name = split_part(u.email, '@', 1)
from auth.users u
where u.id = m.user_id;

create function public.set_membership_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select split_part(email, '@', 1) into new.display_name from auth.users where id = new.user_id;
  return new;
end;
$$;

create trigger memberships_set_display_name
  before insert on public.memberships
  for each row execute function public.set_membership_display_name();

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  played_on date not null,
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

-- group_id is repeated here so RLS and realtime can filter without a join
create table public.round_scores (
  round_id uuid not null references public.rounds on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  score int not null check (score between 18 and 200),
  primary key (round_id, user_id)
);

alter table public.rounds enable row level security;
alter table public.round_scores enable row level security;

create policy "members read group rounds" on public.rounds
  for select to authenticated
  using (public.is_group_member(group_id));

create policy "members read group scores" on public.round_scores
  for select to authenticated
  using (public.is_group_member(group_id));

grant select on public.rounds, public.round_scores to authenticated;

-- no direct writes: a round and all its scores are saved together, and every player must be in the group
create function public.add_round(gid uuid, played date, scores jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  s jsonb;
begin
  if not public.is_group_member(gid) then
    raise exception 'not a member of this group';
  end if;
  if jsonb_typeof(scores) <> 'array' or jsonb_array_length(scores) = 0 then
    raise exception 'at least one score is required';
  end if;

  insert into public.rounds (group_id, played_on) values (gid, played) returning id into rid;

  for s in select * from jsonb_array_elements(scores) loop
    if not exists (
      select 1 from public.memberships
      where group_id = gid and user_id = (s->>'user_id')::uuid
    ) then
      raise exception 'player is not in this group';
    end if;
    insert into public.round_scores (round_id, group_id, user_id, score)
    values (rid, gid, (s->>'user_id')::uuid, (s->>'score')::int);
  end loop;

  return rid;
end;
$$;

revoke execute on function public.add_round(uuid, date, jsonb) from public, anon;
grant execute on function public.add_round(uuid, date, jsonb) to authenticated;

alter publication supabase_realtime add table public.round_scores;
