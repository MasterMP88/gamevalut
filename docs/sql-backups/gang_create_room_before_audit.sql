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
