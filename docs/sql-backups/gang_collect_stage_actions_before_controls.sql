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
  where id=(select room_id from gang.players where id=v_player_id);

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
