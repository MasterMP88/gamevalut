-- Out-of-turn safety controls, independent of sealed gameplay answers.
create table gang.pair_controls (
 room_id uuid not null references gang.rooms(id) on delete cascade,
 round_key text not null,
 stage text not null,
 player_id uuid not null references gang.players(id) on delete cascade,
 kind text not null check(kind in ('skip','pause','finish')),
 created_at timestamptz not null default clock_timestamp(),
 primary key(room_id,round_key,stage,player_id,kind)
);
alter table gang.pair_controls enable row level security;
revoke all on gang.pair_controls from public,anon,authenticated;
grant all on gang.pair_controls to service_role;
create or replace function public.couple_control(p_player_token text,p_round_key text,p_stage text,p_kind text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_player uuid; v_room gang.rooms%rowtype; v_result jsonb;
begin
 v_player:=gang.player_id_for_token(p_player_token);
 if v_player is null then raise exception 'invalid_player_token'; end if;
 select r.* into v_room from gang.rooms r join gang.players p on p.room_id=r.id
 where p.id=v_player and p.active and p.can_input for update of r;
 if not found or v_room.expires_at<=now() then raise exception 'room_not_active'; end if;
 if v_room.public_state->>'kind'<>'couple' or v_room.round_key is distinct from p_round_key or v_room.stage is distinct from p_stage then raise exception 'stale_stage'; end if;
 if not (coalesce(v_room.public_state->'seats','[]'::jsonb) ? v_player::text) then raise exception 'player_not_required'; end if;
 if p_kind is not null then
  if p_kind not in ('skip','pause','finish') then raise exception 'control_invalid'; end if;
  insert into gang.pair_controls(room_id,round_key,stage,player_id,kind) values(v_room.id,p_round_key,p_stage,v_player,p_kind) on conflict do nothing;
  update gang.rooms set version=version+1 where id=v_room.id;
  return jsonb_build_object('accepted',true);
 end if;
 if v_room.facilitator_player_id<>v_player then raise exception 'facilitator_required'; end if;
 select coalesce(jsonb_agg(c.kind order by c.created_at),'[]'::jsonb) into v_result from gang.pair_controls c
 where c.room_id=v_room.id and c.round_key=p_round_key and c.stage=p_stage;
 return v_result;
end;
$$;
revoke all on function public.couple_control(text,text,text,text) from public;
grant execute on function public.couple_control(text,text,text,text) to anon,authenticated;
