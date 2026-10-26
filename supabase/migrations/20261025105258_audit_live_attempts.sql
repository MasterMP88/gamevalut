-- Append-only transport for simultaneous, repeatable inputs. Validation/scoring stays in the canonical runtime.
create table gang.round_attempts (
 id bigint generated always as identity primary key,
 room_id uuid not null references gang.rooms(id) on delete cascade,
 player_id uuid not null references gang.players(id) on delete cascade,
 round_key text not null, stage text not null,
 value text not null check(char_length(value) between 1 and 160),
 created_at timestamptz not null default clock_timestamp()
);
alter table gang.round_attempts enable row level security;
revoke all on gang.round_attempts from public,anon,authenticated;
create index round_attempts_room_stage on gang.round_attempts(room_id,round_key,stage,id);
create function public.gang_round_attempt(p_player_token text,p_round_key text,p_stage text,p_value text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pid uuid; pl gang.players%rowtype; r gang.rooms%rowtype; n integer; latest timestamptz;
begin
 pid:=gang.player_id_for_token(p_player_token);if pid is null then raise exception 'invalid_player_token';end if;
 select * into pl from gang.players where id=pid;
 select * into r from gang.rooms where id=pl.room_id for update;
 if r.expires_at<=now() or not pl.active or not pl.can_input or r.phase<>'playing' then raise exception 'room_not_active';end if;
 if r.round_key is distinct from p_round_key or r.stage is distinct from p_stage or coalesce(r.public_state #>> '{view,repeatable}','false')<>'true' then raise exception 'stale_stage';end if;
 if not coalesce(r.public_state->'requiredPlayerIds' ? pid::text,false) then raise exception 'player_not_required';end if;
 if r.stage_deadline is null or clock_timestamp()>=r.stage_deadline then raise exception 'stale_stage';end if;
 if p_value is null or char_length(btrim(p_value)) not between 1 and 160 then raise exception 'payload_invalid';end if;
 select count(*),max(created_at) into n,latest from gang.round_attempts where room_id=r.id and round_key=p_round_key and stage=p_stage and player_id=pid;
 if n>=24 then raise exception 'attempt_limit';end if;
 if latest>clock_timestamp()-interval '250 milliseconds' then raise exception 'attempt_rate_limit';end if;
 insert into gang.round_attempts(room_id,player_id,round_key,stage,value) values(r.id,pid,p_round_key,p_stage,btrim(p_value));
 return jsonb_build_object('accepted',true,'remaining',23-n);
end $$;
create function public.gang_round_attempts(p_player_token text,p_round_key text,p_stage text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pid uuid; r gang.rooms%rowtype;
begin
 pid:=gang.player_id_for_token(p_player_token);if pid is null then raise exception 'invalid_player_token';end if;
 select * into r from gang.rooms where id=(select room_id from gang.players where id=pid);
 if r.expires_at<=now() then raise exception 'room_not_found';end if;
 if r.facilitator_player_id<>pid then raise exception 'facilitator_required';end if;
 if r.round_key is distinct from p_round_key or r.stage is distinct from p_stage then raise exception 'stale_stage';end if;
 return jsonb_build_object('expired',r.stage_deadline is not null and clock_timestamp()>=r.stage_deadline,'actions',coalesce((select jsonb_agg(jsonb_build_object('playerId',a.player_id,'actionType','attempt','payload',jsonb_build_object('value',a.value),'at',a.created_at) order by a.created_at,a.id) from gang.round_attempts a where room_id=r.id and round_key=p_round_key and stage=p_stage),'[]'::jsonb));
end $$;
-- One RPC per polling tick; both objects are read from one transaction.
create function public.gang_poll(p_player_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare snapshot jsonb;
begin
 snapshot:=public.gang_room_snapshot(p_player_token);
 return jsonb_build_object('snapshot',snapshot,'progress',case when snapshot->>'phase'='playing' then public.gang_stage_progress(p_player_token) else null end);
end $$;
revoke all on function public.gang_round_attempt(text,text,text,text),public.gang_round_attempts(text,text,text),public.gang_poll(text) from public;
grant execute on function public.gang_round_attempt(text,text,text,text),public.gang_round_attempts(text,text,text),public.gang_poll(text) to anon,authenticated;
