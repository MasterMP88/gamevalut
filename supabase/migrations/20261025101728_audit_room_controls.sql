-- Generic transport deadlines and sealed first submissions. Timers are opt-in in the canonical public contract.
alter table gang.rooms add column if not exists stage_deadline timestamptz;
CREATE OR REPLACE FUNCTION gang.snapshot_for_player(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'roomId', r.id,
    'code', r.code,
    'phase', r.phase,
    'entryMode', r.entry_mode,
    'gameId', r.game_id,
    'roundKey', r.round_key,
    'stage', r.stage,
    'publicState', r.public_state,
    'version', r.version,
    'deadlineAt', r.stage_deadline,
    'serverNow', clock_timestamp(),
    'expiresAt', r.expires_at,
    'maxPlayers', r.max_players,
    'playerId', me.id,
    'isFacilitator', (r.facilitator_player_id = me.id),
    'players', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.display_name,
          'active', p.active,
          'joinedAt', p.joined_at,
          'lastSeenAt', p.last_seen_at,
          'deviceKind', p.device_kind,
          'canInput', p.can_input,
          'canDisplay', p.can_display,
          'isFacilitator', (p.id = r.facilitator_player_id)
        )
        order by p.joined_at, p.id
      )
      from gang.players p
      where p.room_id = r.id
    ), '[]'::jsonb)
  )
  from gang.players me
  join gang.rooms r on r.id = me.room_id
  where me.id = p_player_id
    and r.expires_at > now()
$function$
;
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
      stage_deadline=case
        when v_room.stage is not distinct from p_stage and v_room.round_key is not distinct from p_round_key then v_room.stage_deadline
        when p_public_state #>> '{view,timed}' = 'true' then now() + make_interval(secs => least(120,greatest(2,coalesce((p_public_state #>> '{view,seconds}')::integer,30))))
        else null end,
      updated_at=now(),
      version=version+1
  where id=v_room.id;

  update gang.players set last_seen_at=now(),active=true where id=v_player_id;
  return gang.snapshot_for_player(v_player_id);
end;
$function$
;
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
  select * into v_room from gang.rooms where id=v_player.room_id for update;

  if not v_player.active or v_room.expires_at <= now() then raise exception 'room_not_active'; end if;
  if v_room.round_key is distinct from p_round_key or v_room.stage is distinct from p_stage then
    raise exception 'stale_stage';
  end if;
  if p_action_type is null or char_length(p_action_type) not between 1 and 32 then raise exception 'action_type_invalid'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'payload_invalid'; end if;
  if octet_length(p_payload::text) > 16384 then raise exception 'payload_too_large'; end if;

  if not v_player.can_input then raise exception 'player_not_required'; end if;
  if jsonb_typeof(v_room.public_state->'requiredPlayerIds')='array' and not (v_room.public_state->'requiredPlayerIds' ? v_player_id::text) then raise exception 'player_not_required'; end if;
  if exists(select 1 from gang.actions where room_id=v_room.id and round_key=p_round_key and stage=p_stage and player_id=v_player_id) then
    return jsonb_build_object('accepted',true,'sealed',true);
  end if;
  if char_length(coalesce(p_payload->>'value','')) > 160 then raise exception 'answer_too_long'; end if;
  if coalesce((v_room.public_state #>> '{view,maxWords}')::integer,0)>0 and cardinality(regexp_split_to_array(btrim(p_payload->>'value'),'\s+')) > (v_room.public_state #>> '{view,maxWords}')::integer then raise exception 'answer_too_many_words'; end if;
  if v_room.stage_deadline is not null and clock_timestamp() > v_room.stage_deadline then p_payload := '{"timedOut":true}'::jsonb; end if;

  insert into gang.actions(room_id,round_key,stage,player_id,action_type,payload)
  values(v_room.id,p_round_key,p_stage,v_player_id,p_action_type,p_payload)
  on conflict(room_id,round_key,stage,player_id,action_type)
  do nothing;

  update gang.players set last_seen_at=now(),active=true where id=v_player_id;

  return jsonb_build_object('accepted',true,'roundKey',p_round_key,'stage',p_stage);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.gang_stage_progress(p_player_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_player_id uuid;
  v_room gang.rooms%rowtype;
  v_required integer;
  v_submitted integer;
  v_required_ids jsonb;
begin
  v_player_id := gang.player_id_for_token(p_player_token);
  if v_player_id is null then raise exception 'invalid_player_token'; end if;

  select * into v_room from gang.rooms
  where id=(select room_id from gang.players where id=v_player_id);

  if not found or v_room.expires_at <= now() then raise exception 'room_not_found'; end if;

  v_required_ids := v_room.public_state->'requiredPlayerIds';

  if jsonb_typeof(v_required_ids)='array' then
    v_required := jsonb_array_length(v_required_ids);
    select count(distinct a.player_id) into v_submitted
    from gang.actions a
    where a.room_id=v_room.id and a.round_key=v_room.round_key and a.stage=v_room.stage
      and exists (
        select 1 from jsonb_array_elements_text(v_required_ids) x(value)
        where x.value=a.player_id::text
      );
  else
    select count(*) into v_required
    from gang.players p where p.room_id=v_room.id and p.active and p.can_input;
    select count(distinct a.player_id) into v_submitted
    from gang.actions a
    join gang.players p on p.id=a.player_id
    where a.room_id=v_room.id and a.round_key=v_room.round_key and a.stage=v_room.stage
      and p.active and p.can_input;
  end if;

  return jsonb_build_object(
    'roundKey',v_room.round_key,
    'stage',v_room.stage,
    'required',coalesce(v_required,0),
    'submitted',coalesce(v_submitted,0),
    'complete',(coalesce(v_required,0)>0 and coalesce(v_submitted,0)>=coalesce(v_required,0)) or (v_room.stage_deadline is not null and clock_timestamp() >= v_room.stage_deadline),
    'youSubmitted',exists(
      select 1 from gang.actions a
      where a.room_id=v_room.id and a.round_key=v_room.round_key
        and a.stage=v_room.stage and a.player_id=v_player_id
    )
  );
end;
$function$
;
CREATE OR REPLACE FUNCTION public.gang_collect_stage_actions(p_player_token text, p_round_key text, p_stage text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_player_id uuid;
  v_room gang.rooms%rowtype;
  v_required_ids jsonb;
  v_required integer;
  v_submitted integer;
begin
  v_player_id := gang.player_id_for_token(p_player_token);
  if v_player_id is null then raise exception 'invalid_player_token'; end if;

  select * into v_room
  from gang.rooms
  where id=(select room_id from gang.players where id=v_player_id) for update;

  if not found or v_room.expires_at <= now() then raise exception 'room_not_found'; end if;
  if v_room.facilitator_player_id <> v_player_id then raise exception 'facilitator_required'; end if;
  if v_room.round_key is distinct from p_round_key or v_room.stage is distinct from p_stage then
    raise exception 'stale_stage';
  end if;

  v_required_ids := v_room.public_state->'requiredPlayerIds';

  if jsonb_typeof(v_required_ids)='array' then
    v_required := jsonb_array_length(v_required_ids);
    select count(distinct a.player_id) into v_submitted
    from gang.actions a
    where a.room_id=v_room.id and a.round_key=p_round_key and a.stage=p_stage
      and exists (
        select 1 from jsonb_array_elements_text(v_required_ids) x(value)
        where x.value=a.player_id::text
      );
  else
    select count(*) into v_required
    from gang.players p where p.room_id=v_room.id and p.active and p.can_input;
    select count(distinct a.player_id) into v_submitted
    from gang.actions a
    join gang.players p on p.id=a.player_id
    where a.room_id=v_room.id and a.round_key=p_round_key and a.stage=p_stage
      and p.active and p.can_input;
  end if;

  if v_room.stage_deadline is not null and clock_timestamp() >= v_room.stage_deadline then
    insert into gang.actions(room_id,round_key,stage,player_id,action_type,payload)
    select v_room.id,p_round_key,p_stage,p.id,'timeout','{"timedOut":true}'::jsonb
    from gang.players p where p.room_id=v_room.id and p.can_input
      and v_required_ids ? p.id::text
      and not exists(select 1 from gang.actions a where a.room_id=v_room.id and a.round_key=p_round_key and a.stage=p_stage and a.player_id=p.id)
    on conflict do nothing;
    v_submitted := v_required;
  end if;

  if coalesce(v_required,0) > 0 and coalesce(v_submitted,0) < coalesce(v_required,0) then
    raise exception 'stage_incomplete';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'playerId',a.player_id,
      'actionType',a.action_type,
      'payload',a.payload,
      'at',a.created_at
    ) order by a.created_at,a.id)
    from gang.actions a
    where a.room_id=v_room.id and a.round_key=p_round_key and a.stage=p_stage
  ),'[]'::jsonb);
end;
$function$
;
