CREATE OR REPLACE FUNCTION public.gang_set_room_state(p_player_token text, p_expected_version bigint, p_phase text, p_game_id text, p_round_key text, p_stage text, p_public_state jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_player_id uuid;
  v_room gang.rooms%rowtype;
begin
  v_player_id := gang.player_id_for_token(p_player_token);
  if v_player_id is null then raise exception 'invalid_player_token'; end if;

  select * into v_room from gang.rooms
  where id=(select room_id from gang.players where id=v_player_id)
  for update;

  if not found or v_room.expires_at <= now() then raise exception 'room_not_found'; end if;
  if v_room.facilitator_player_id <> v_player_id then raise exception 'facilitator_required'; end if;
  if v_room.version <> p_expected_version then raise exception 'version_conflict'; end if;
  if p_phase not in ('lobby','playing','paused','finished') then raise exception 'phase_invalid'; end if;
  if p_public_state is null or jsonb_typeof(p_public_state) <> 'object' then raise exception 'public_state_invalid'; end if;
  if octet_length(p_public_state::text) > 65536 then raise exception 'public_state_too_large'; end if;
  if p_game_id is not null and char_length(p_game_id) > 64 then raise exception 'game_id_invalid'; end if;
  if p_round_key is not null and char_length(p_round_key) > 96 then raise exception 'round_key_invalid'; end if;
  if p_stage is not null and char_length(p_stage) > 32 then raise exception 'stage_invalid'; end if;

  update gang.rooms
  set phase=p_phase,
      game_id=p_game_id,
      round_key=p_round_key,
      stage=p_stage,
      public_state=p_public_state,
      updated_at=now(),
      version=version+1
  where id=v_room.id;

  update gang.players set last_seen_at=now(),active=true where id=v_player_id;
  return gang.snapshot_for_player(v_player_id);
end;
$function$
