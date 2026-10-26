do $test$
declare rid uuid:=gen_random_uuid();pid uuid:=gen_random_uuid();tok text:=encode(extensions.gen_random_bytes(24),'hex');v bigint;result jsonb;
begin
 insert into gang.rooms(id,code) values(rid,upper(substr(md5(rid::text),1,6)));
 insert into gang.players(id,room_id,token_hash,display_name) values(pid,rid,extensions.digest(tok,'sha256'),'Atomic fixture');
 update gang.rooms set facilitator_player_id=pid where id=rid;
 select version into v from gang.rooms where id=rid;
 result:=public.gang_publish_state(tok,v,'playing','undercover','round1','0-private','{"view":{"stage":"private"}}','{"v":1}',jsonb_build_array(jsonb_build_object('playerId',pid,'payload',jsonb_build_object('secret','new secret'))));
 if public.gang_get_private(tok,'round1')->>'secret'<>'new secret' then raise exception 'card not published';end if;
 select version into v from gang.rooms where id=rid;
 begin
  perform public.gang_publish_state(tok,v,'playing','undercover','round2','0-private','{"view":{"stage":"private"}}','{"v":2}',jsonb_build_array(jsonb_build_object('playerId',gen_random_uuid(),'payload','{}'::jsonb)));
  raise exception 'invalid private accepted';
 exception when raise_exception then if sqlerrm<>'target_player_invalid' then raise;end if;end;
 if (select round_key from gang.rooms where id=rid)<>'round1' then raise exception 'partial public write';end if;
 if public.gang_load_runtime(tok)->>'v'<>'1' then raise exception 'partial runtime write';end if;
 delete from gang.rooms where id=rid;
end $test$;
