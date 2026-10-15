alter table public.messages add column image_path text;
alter table public.messages alter column body set default '';
alter table public.messages drop constraint messages_body_check;
alter table public.messages add constraint messages_body_or_image
  check (char_length(body) <= 2000 and (char_length(body) >= 1 or image_path is not null));

-- a photo must live under the message's own group folder
drop policy "members post to their groups" on public.messages;
create policy "members post to their groups" on public.messages
  for insert to authenticated
  with check (
    public.is_group_member(group_id)
    and (image_path is null or image_path like group_id::text || '/%')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-photos', 'chat-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- first folder of the object path is the group id
create policy "members read group photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-photos' and public.is_group_member(((storage.foldername(name))[1])::uuid));

create policy "members upload group photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-photos' and public.is_group_member(((storage.foldername(name))[1])::uuid));
