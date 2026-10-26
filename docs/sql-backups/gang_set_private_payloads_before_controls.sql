CREATE OR REPLACE FUNCTION public.gang_set_private_payloads(p_player_token text, p_round_key text, p_payloads jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_player_id uuid;
  v_room gang.rooms%rowtype;
  v_item jsonb;
  v_target uuid;
  v_payload jsonb;
  v_count integer := 0;
begin
  v_player_id := gang.player_id_for_token(p_player_token);
  if v_player_id is null then raise exception 'invalid_player_token'; end if;

  select * into v_room
  from gang.rooms
  where id=(select room_id from gang.players where id=v_player_id)
  for update;

  if not found or v_room.expires_at <= now() then raise exception 'room_not_found'; end if;
  if v_room.facilitator_player_id <> v_player_id then raise exception 'facilitator_required'; end if;
  if v_room.round_key is distinct from p_round_key then raise exception 'stale_round'; end if;
  if jsonb_typeof(p_payloads) <> 'array' then raise exception 'payloads_invalid'; end if;
  if jsonb_array_length(p_payloads) > 99 then raise exception 'payloads_too_many'; end if;
  if octet_length(p_payloads::text) > 131072 then raise exception 'payloads_too_large'; end if;

  delete from gang.private_payloads
  where room_id=v_room.id and round_key=p_round_key;

  for v_item in select value from jsonb_array_elements(p_payloads)
  loop
    begin
      v_target := nullif(v_item->>'playerId','')::uuid;
    exception when invalid_text_representation then
      raise exception 'target_player_invalid';
    end;
    v_payload := v_item->'payload';

    if v_target is null
       or not exists (
         select 1 from gang.players
         where id=v_target and room_id=v_room.id and active and can_input
       ) then
      raise exception 'target_player_invalid';
    end if;
    if v_payload is null or jsonb_typeof(v_payload) <> 'object' then
      raise exception 'private_payload_invalid';
    end if;
    if octet_length(v_payload::text) > 16384 then raise exception 'private_payload_too_large'; end if;

    insert into gang.private_payloads(room_id,round_key,player_id,payload)
    values(v_room.id,p_round_key,v_target,v_payload)
    on conflict(room_id,round_key,player_id)
    do update set payload=excluded.payload,created_at=now();

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('stored',v_count,'roundKey',p_round_key);
end;
$function$
