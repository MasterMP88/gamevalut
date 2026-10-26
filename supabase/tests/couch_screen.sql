-- Run in BEGIN/ROLLBACK. Existing room RPCs must preserve read-only TV roles.
do $test$
declare rid uuid:=gen_random_uuid();pid uuid:=gen_random_uuid();tok text:=encode(extensions.gen_random_bytes(24),'hex');v bigint;joined jsonb;tv text;c text;pub jsonb;
begin
 c:=upper(substr(md5(rid::text),1,6));
 insert into gang.rooms(id,code) values(rid,c);
 insert into gang.players(id,room_id,token_hash,display_name) values(pid,rid,extensions.digest(tok,'sha256'),'Couch fixture');
 update gang.rooms set facilitator_player_id=pid where id=rid;
 joined:=public.gang_join_display(c,'tv');tv:=joined->>'playerToken';
 select version into v from gang.rooms where id=rid;
 pub:='{"kind":"couch-screen","requiredPlayerIds":[],"heading":"Public prompt","teams":[{"name":"Team A","score":3}]}';
 perform public.gang_set_room_state(tok,v,'playing','the-majority','couch-1','play',pub);
 if public.gang_room_snapshot(tv)->'publicState'<>pub then raise exception 'TV snapshot mismatch';end if;
 if exists(select 1 from gang.players where id=gang.player_id_for_token(tv) and can_input) then raise exception 'TV became a seat';end if;
 select version into v from gang.rooms where id=rid;
 begin
  perform public.gang_set_room_state(tv,v,'finished',null,null,null,'{}');
  raise exception 'TV wrote state';
 exception when raise_exception then if sqlerrm<>'facilitator_required' then raise;end if;end;
 begin
  perform public.gang_set_room_state(tok,v-1,'finished',null,null,null,'{}');
  raise exception 'stale host wrote state';
 exception when raise_exception then if sqlerrm<>'version_conflict' then raise;end if;end;
 delete from gang.rooms where id=rid;
end $test$;
