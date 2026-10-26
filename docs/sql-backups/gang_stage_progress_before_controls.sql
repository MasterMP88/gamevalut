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
    'complete',coalesce(v_required,0)>0 and coalesce(v_submitted,0)>=coalesce(v_required,0),
    'youSubmitted',exists(
      select 1 from gang.actions a
      where a.room_id=v_room.id and a.round_key=v_room.round_key
        and a.stage=v_room.stage and a.player_id=v_player_id
    )
  );
end;
$function$
