-- Private, room-scoped side quests. Rules remain in the canonical TypeScript core.
create table gang.mission_events (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references gang.rooms(id) on delete cascade,
 night_key text not null check (char_length(night_key) between 1 and 96),
 player_id uuid not null references gang.players(id) on delete cascade,
 kind text not null check (kind in ('claim','accuse')),
 payload jsonb not null default '{}',
 created_at timestamptz not null default clock_timestamp(),
 unique(room_id,night_key,player_id,kind)
);
alter table gang.mission_events enable row level security;
revoke all on gang.mission_events from public, anon, authenticated;
create index mission_events_room_night on gang.mission_events(room_id,night_key,created_at);

create function public.gang_mission_event(p_player_token text,p_night_key text,p_kind text,p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare pid uuid; pl gang.players%rowtype; r gang.rooms%rowtype; target uuid;
begin
 pid:=gang.player_id_for_token(p_player_token);
 if pid is null then raise exception 'invalid_player_token'; end if;
 select * into pl from gang.players where id=pid;
 select * into r from gang.rooms where id=pl.room_id for update;
 if not pl.active or not pl.can_input or r.expires_at<=now() or r.phase<>'playing' then raise exception 'room_not_active'; end if;
 if r.public_state->>'missionKey' is distinct from p_night_key then raise exception 'stale_mission'; end if;
 if not coalesce(r.public_state->'missionPlayerIds' ? pid::text,false) then raise exception 'player_not_required'; end if;
 if p_kind is null or p_kind not in ('claim','accuse') or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>2048 then raise exception 'payload_invalid'; end if;
 if p_kind='accuse' then
  target:=(p_payload->>'targetId')::uuid;
  if target is null or target=pid or not coalesce(r.public_state->'missionPlayerIds' ? target::text,false) or not exists(select 1 from gang.players where id=target and room_id=r.id and can_input) then raise exception 'target_player_invalid'; end if;
  if coalesce(p_payload->>'missionId','') !~ '^[a-zA-Z0-9_-]{1,120}$' then raise exception 'payload_invalid'; end if;
  p_payload:=jsonb_build_object('targetId',target,'missionId',p_payload->>'missionId');
 else p_payload:='{}'::jsonb;
 end if;
 insert into gang.mission_events(room_id,night_key,player_id,kind,payload) values(r.id,p_night_key,pid,p_kind,p_payload) on conflict do nothing;
 update gang.rooms set version=version+1 where id=r.id;
 return jsonb_build_object('accepted',true);
end $$;

create function public.gang_mission_events(p_player_token text,p_night_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pid uuid; r gang.rooms%rowtype;
begin
 pid:=gang.player_id_for_token(p_player_token);
 if pid is null then raise exception 'invalid_player_token'; end if;
 select * into r from gang.rooms where id=(select room_id from gang.players where id=pid);
 if r.expires_at<=now() then raise exception 'room_not_found'; end if;
 if r.facilitator_player_id<>pid then raise exception 'facilitator_required'; end if;
 if r.public_state->>'missionKey' is distinct from p_night_key then raise exception 'stale_mission'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'playerId',e.player_id,'kind',e.kind,'at',e.created_at,'payload',e.payload) order by e.created_at,e.id) from gang.mission_events e where e.room_id=r.id and e.night_key=p_night_key),'[]'::jsonb);
end $$;

-- JPEG thumbnails only, one per participant per round. No public bucket or public URL.
create table gang.photos (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references gang.rooms(id) on delete cascade,
 round_key text not null,
 player_id uuid not null references gang.players(id) on delete cascade,
 jpeg text not null check(octet_length(jpeg)<=262144),
 created_at timestamptz not null default now(),
 unique(room_id,round_key,player_id)
);
alter table gang.photos enable row level security;
revoke all on gang.photos from public, anon, authenticated;

create function public.gang_put_photo(p_player_token text,p_round_key text,p_jpeg text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pid uuid; pl gang.players%rowtype; r gang.rooms%rowtype; photo uuid;
begin
 pid:=gang.player_id_for_token(p_player_token);
 if pid is null then raise exception 'invalid_player_token'; end if;
 select * into pl from gang.players where id=pid;
 select * into r from gang.rooms where id=pl.room_id for update;
 if not pl.active or not pl.can_input or r.expires_at<=now() then raise exception 'room_not_active'; end if;
 if r.game_id is distinct from 'photo-hunt' or r.round_key is distinct from p_round_key or coalesce(r.public_state #>> '{view,stage}','')<>'perform' then raise exception 'stale_stage'; end if;
 if r.stage_deadline is not null and clock_timestamp()>r.stage_deadline then raise exception 'stale_stage'; end if;
 if not coalesce(r.public_state->'requiredPlayerIds' ? pid::text,false) then raise exception 'player_not_required'; end if;
 if p_jpeg is null or octet_length(p_jpeg)>262144 or p_jpeg !~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/]*={0,2}$' then raise exception 'photo_invalid'; end if;
 if octet_length(decode(substr(p_jpeg,24),'base64'))>196608 then raise exception 'photo_too_large'; end if;
 if exists(select 1 from gang.actions where room_id=r.id and round_key=p_round_key and player_id=pid and stage=r.stage) then raise exception 'answer_sealed'; end if;
 insert into gang.photos(room_id,round_key,player_id,jpeg) values(r.id,p_round_key,pid,p_jpeg)
 on conflict(room_id,round_key,player_id) do update set jpeg=excluded.jpeg
 returning id into photo;
 return jsonb_build_object('photoId',photo);
end $$;

-- A participant can only attach their own image from this exact room and round.
create function gang.validate_photo_attachment() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.payload ? 'photoId' and not exists(select 1 from gang.photos p where p.id::text=new.payload->>'photoId' and p.room_id=new.room_id and p.round_key=new.round_key and p.player_id=new.player_id) then
  raise exception 'photo_not_owned';
 end if;
 if new.payload->>'noFaces'='true' and not (new.payload ? 'photoId') then
  new.payload:=new.payload-'noFaces';
 end if;
 return new;
end $$;
create trigger validate_photo_attachment before insert or update on gang.actions for each row execute function gang.validate_photo_attachment();

create function public.gang_get_photos(p_player_token text,p_photo_ids uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pid uuid; r gang.rooms%rowtype;
begin
 pid:=gang.player_id_for_token(p_player_token);
 if pid is null then raise exception 'invalid_player_token'; end if;
 select * into r from gang.rooms where id=(select room_id from gang.players where id=pid);
 if r.expires_at<=now() then raise exception 'room_not_found'; end if;
 if not exists(select 1 from gang.players where id=pid and active) then raise exception 'room_not_active'; end if;
 if cardinality(p_photo_ids)>30 then raise exception 'photos_too_many'; end if;
 if coalesce(r.public_state #>> '{view,stage}','') not in ('vote','reveal','score') and coalesce(r.public_state->>'kind','') not in ('finale','end') then raise exception 'photos_not_revealed'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('photoId',p.id,'url',p.jpeg)) from gang.photos p where p.id=any(p_photo_ids) and p.room_id=r.id and (p.round_key=r.round_key or r.public_state->>'kind' in ('finale','end'))),'[]'::jsonb);
end $$;

revoke all on function public.gang_mission_event(text,text,text,jsonb), public.gang_mission_events(text,text), public.gang_put_photo(text,text,text), public.gang_get_photos(text,uuid[]) from public;
grant execute on function public.gang_mission_event(text,text,text,jsonb), public.gang_mission_events(text,text), public.gang_put_photo(text,text,text), public.gang_get_photos(text,uuid[]) to anon,authenticated;
