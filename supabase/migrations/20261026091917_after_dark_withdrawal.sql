-- Durable, owner-only withdrawal, independent of current turn / sealed answers.
create table gang.after_dark_withdrawals (
 room_id uuid not null references gang.rooms(id) on delete cascade,
 game_key text not null check(length(game_key) between 1 and 160),
 player_id uuid not null references gang.players(id) on delete cascade,
 created_at timestamptz not null default clock_timestamp(),
 primary key(room_id,game_key,player_id)
);
alter table gang.after_dark_withdrawals enable row level security;
revoke all on gang.after_dark_withdrawals from public,anon,authenticated;
grant all on gang.after_dark_withdrawals to service_role;
create function public.gang_after_dark_control(p_player_token text,p_game_key text,p_withdraw boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_player uuid;v_room gang.rooms%rowtype;v_ids jsonb;v_withdrawn boolean;
begin
 v_player:=gang.player_id_for_token(p_player_token);
 if v_player is null then raise exception 'invalid_player_token';end if;
 select r.* into v_room from gang.rooms r join gang.players p on p.room_id=r.id
 where p.id=v_player and p.active and p.can_input for update of r;
 if not found or v_room.expires_at<=now() then raise exception 'room_not_active';end if;
 if v_room.game_id is distinct from 'after-dark' or v_room.public_state->>'afterDarkKey' is distinct from p_game_key then raise exception 'stale_stage';end if;
 if p_withdraw then
  if not exists(select 1 from jsonb_array_elements(coalesce(v_room.public_state->'roster','[]'::jsonb)) p where p->>'id'=v_player::text)
    and not exists(select 1 from gang.after_dark_withdrawals where room_id=v_room.id and game_key=p_game_key and player_id=v_player)
  then raise exception 'player_not_required';end if;
  insert into gang.after_dark_withdrawals(room_id,game_key,player_id) values(v_room.id,p_game_key,v_player) on conflict do nothing;
  if found then update gang.rooms set version=version+1 where id=v_room.id;end if;
 end if;
 select exists(select 1 from gang.after_dark_withdrawals where room_id=v_room.id and game_key=p_game_key and player_id=v_player) into v_withdrawn;
 if v_room.facilitator_player_id=v_player then
  select coalesce(jsonb_agg(player_id),'[]'::jsonb) into v_ids from gang.after_dark_withdrawals where room_id=v_room.id and game_key=p_game_key;
 else v_ids:='[]'::jsonb;end if;
 return jsonb_build_object('withdrawn',v_withdrawn,'playerIds',v_ids);
end $$;
revoke all on function public.gang_after_dark_control(text,text,boolean) from public;
grant execute on function public.gang_after_dark_control(text,text,boolean) to anon,authenticated;

-- Do not publish stale, already collected answers after a withdrawal raced a
-- facilitator update. Rules still run in the canonical core; DB enforces consent.
create or replace function public.gang_publish_state(
 p_player_token text,p_expected_version bigint,p_phase text,p_game_id text,p_round_key text,p_stage text,
 p_public_state jsonb,p_runtime_state jsonb,p_private_payloads jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb;v_room uuid;v_player uuid;v_key text;
begin
 v_player:=gang.player_id_for_token(p_player_token);
 select r.id into v_room from gang.rooms r join gang.players p on p.room_id=r.id
 where p.id=v_player and p.active and r.facilitator_player_id=v_player for update of r;
 if v_room is null then raise exception 'facilitator_required';end if;
 v_key:=p_runtime_state#>>'{rt,id}';
 if p_game_id='after-dark' and exists(
  select 1 from gang.after_dark_withdrawals w where w.room_id=v_room and w.game_key=v_key
   and not(coalesce(p_runtime_state#>'{rt,declinedIds}','[]'::jsonb) ? w.player_id::text)
 ) then raise exception 'consent_changed';end if;
 snapshot:=public.gang_set_room_state(p_player_token,p_expected_version,p_phase,p_game_id,p_round_key,p_stage,p_public_state);
 perform public.gang_save_runtime(p_player_token,p_runtime_state);
 if p_round_key is not null then perform public.gang_set_private_payloads(p_player_token,p_round_key,coalesce(p_private_payloads,'[]'::jsonb));end if;
 return snapshot;
end $$;
revoke all on function public.gang_publish_state(text,bigint,text,text,text,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.gang_publish_state(text,bigint,text,text,text,text,jsonb,jsonb,jsonb) to anon,authenticated;
