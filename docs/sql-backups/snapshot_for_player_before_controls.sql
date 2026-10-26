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
