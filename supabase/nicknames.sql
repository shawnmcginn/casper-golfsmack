create function public.set_nickname(gid uuid, nickname text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  nickname := trim(nickname);
  if char_length(nickname) not between 1 and 30 then
    raise exception 'nickname must be 1-30 characters';
  end if;
  update public.memberships set display_name = nickname
  where group_id = gid and user_id = auth.uid();
  if not found then
    raise exception 'not a member of this group';
  end if;
end;
$$;

revoke execute on function public.set_nickname(uuid, text) from public, anon;
grant execute on function public.set_nickname(uuid, text) to authenticated;

-- chat messages now take the sender's nickname in that group
create or replace function public.set_message_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := auth.uid();
  select display_name into new.author_name
  from public.memberships
  where group_id = new.group_id and user_id = auth.uid();
  return new;
end;
$$;
