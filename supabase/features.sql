-- ===== edit and delete your own messages =====
alter table public.messages add column edited_at timestamptz;
alter table public.messages add column deleted_at timestamptz;

alter table public.messages drop constraint messages_body_or_image;
alter table public.messages add constraint messages_body_or_image
  check (
    char_length(body) <= 2000
    and (char_length(body) >= 1 or image_path is not null or deleted_at is not null)
  );

create function public.edit_message(mid uuid, new_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  new_body := trim(new_body);
  update public.messages
  set body = new_body, edited_at = now()
  where id = mid
    and user_id = auth.uid()
    and deleted_at is null
    and (char_length(new_body) >= 1 or image_path is not null);
  if not found then
    raise exception 'cannot edit this message';
  end if;
end;
$$;

-- soft delete so the change reaches other people's open chats through realtime
create function public.delete_message(mid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.messages
  set body = '', image_path = null, deleted_at = now()
  where id = mid and user_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'cannot delete this message';
  end if;
end;
$$;

revoke execute on function public.edit_message(uuid, text), public.delete_message(uuid) from public, anon;
grant execute on function public.edit_message(uuid, text), public.delete_message(uuid) to authenticated;

-- ===== rename a group (owner only) =====
create function public.rename_group(gid uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  new_name := trim(new_name);
  if char_length(new_name) not between 1 and 60 then
    raise exception 'name must be 1-60 characters';
  end if;
  update public.groups set name = new_name
  where id = gid
    and exists (
      select 1 from public.memberships
      where group_id = gid and user_id = auth.uid() and role = 'owner'
    );
  if not found then
    raise exception 'only the group owner can rename it';
  end if;
end;
$$;

revoke execute on function public.rename_group(uuid, text) from public, anon;
grant execute on function public.rename_group(uuid, text) to authenticated;
