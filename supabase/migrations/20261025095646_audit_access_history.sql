-- Audit: host creation must be authorized by the server, joining stays token based.
CREATE OR REPLACE FUNCTION public.gang_create_room(p_display_name text, p_entry_mode text DEFAULT 'director'::text, p_max_players integer DEFAULT 12, p_device_kind text DEFAULT 'phone'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room_id uuid := gen_random_uuid();
  v_player_id uuid := gen_random_uuid();
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_code text;
  v_name text := regexp_replace(coalesce(p_display_name,''), '\s+', ' ', 'g');
  i integer := 0;
begin
  if auth.uid() is null or not exists (
    select 1 from public.entitlements e
    where e.user_id = auth.uid() and e.status = 'active'
      and e.product_key in ('unlimited_monthly','unlimited_annual')
      and (e.starts_at is null or e.starts_at <= now())
      and (e.ends_at is null or e.ends_at > now())
  ) then raise exception 'host_access_required' using errcode = '42501'; end if;
  v_name := btrim(v_name);
  if char_length(v_name) < 1 or char_length(v_name) > 32 then
    raise exception 'display_name_invalid';
  end if;
  if p_entry_mode not in ('director','catalog','mix') then
    raise exception 'entry_mode_invalid';
  end if;
  if p_max_players < 2 or p_max_players > 99 then
    raise exception 'max_players_invalid';
  end if;
  if p_device_kind not in ('phone','tablet','desktop','tv') then
    raise exception 'device_kind_invalid';
  end if;

  -- Opportunistic TTL cleanup; cascades room-owned player/action/private data.
  delete from gang.rooms where expires_at <= now();

  loop
    i := i + 1;
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from gang.rooms where code = v_code);
    if i > 20 then raise exception 'room_code_generation_failed'; end if;
  end loop;

  insert into gang.rooms(id, code, entry_mode, max_players)
  values (v_room_id, v_code, p_entry_mode, p_max_players);

  insert into gang.players(id, room_id, token_hash, display_name, device_kind)
  values (v_player_id, v_room_id, extensions.digest(v_token, 'sha256'), v_name, p_device_kind);

  update gang.rooms
  set facilitator_player_id = v_player_id, updated_at = now(), version = version + 1
  where id = v_room_id;

  return jsonb_build_object(
    'playerToken', v_token,
    'snapshot', gang.snapshot_for_player(v_player_id)
  );
end;
$function$
;
revoke all on function public.gang_create_room(text,text,integer,text) from public, anon;
grant execute on function public.gang_create_room(text,text,integer,text) to authenticated;

-- Only content identifiers and timestamps; never questions, names, answers or secrets.
create table if not exists public.content_history (
 user_id uuid not null references auth.users(id) on delete cascade,
 content_id text not null check (content_id ~ '^[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,119}$'),
 seen_at timestamptz not null default now(),
 primary key(user_id, content_id)
);
alter table public.content_history enable row level security;
revoke all on public.content_history from public, anon;
grant select, insert, update, delete on public.content_history to authenticated;
grant all on public.content_history to service_role;
create policy content_history_owner_select on public.content_history for select to authenticated using ((select auth.uid()) = user_id);
create policy content_history_owner_insert on public.content_history for insert to authenticated with check ((select auth.uid()) = user_id);
create policy content_history_owner_update on public.content_history for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy content_history_owner_delete on public.content_history for delete to authenticated using ((select auth.uid()) = user_id);
create index content_history_recent on public.content_history (user_id, seen_at desc);
