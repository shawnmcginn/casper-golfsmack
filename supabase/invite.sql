alter table public.groups
  add column invite_code text not null unique
  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

create function public.join_group(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into gid from public.groups where invite_code = lower(trim(code));
  if gid is null then
    raise exception 'invalid invite code';
  end if;
  insert into public.memberships (group_id, user_id, role)
  values (gid, auth.uid(), 'member')
  on conflict do nothing;
  return gid;
end;
$$;

revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.join_group(text) to authenticated;
