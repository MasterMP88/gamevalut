CREATE OR REPLACE FUNCTION public.gang_submit_action(p_player_token text, p_round_key text, p_stage text, p_action_type text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_player_id uuid;
  v_player gang.players%rowtype;
  v_room gang.rooms%rowtype;
begin
  v_player_id := gang.player_id_for_token(p_player_token);
  if v_player_id is null then raise exception 'invalid_player_token'; end if;
  select * into v_player from gang.players where id=v_player_id;
  select * into v_room from gang.rooms where id=v_player.room_id;

  if not v_player.active or v_room.expires_at <= now() then raise exception 'room_not_active'; end if;
  if v_room.round_key is distinct from p_round_key or v_room.stage is distinct from p_stage then
    raise exception 'stale_stage';
  end if;
  if p_action_type is null or char_length(p_action_type) not between 1 and 32 then raise exception 'action_type_invalid'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'payload_invalid'; end if;
  if octet_length(p_payload::text) > 16384 then raise exception 'payload_too_large'; end if;

  insert into gang.actions(room_id,round_key,stage,player_id,action_type,payload)
  values(v_room.id,p_round_key,p_stage,v_player_id,p_action_type,p_payload)
  on conflict(room_id,round_key,stage,player_id,action_type)
  do update set payload=excluded.payload,created_at=now();

  update gang.players set last_seen_at=now(),active=true where id=v_player_id;

  return jsonb_build_object('accepted',true,'roundKey',p_round_key,'stage',p_stage);
end;
$function$
