-- Execute inside BEGIN/ROLLBACK. Only transient identities and rooms are used.
do $test$
declare uid uuid:=gen_random_uuid();rid uuid;tok text;pid uuid;otherid uuid:=gen_random_uuid();othertok text:=encode(extensions.gen_random_bytes(24),'hex');r jsonb;v bigint;i integer;
begin
 insert into auth.users(id,email) values(uid,'audit-'||uid::text||'@example.invalid');
 perform set_config('request.jwt.claim.sub',uid::text,true);
 begin
  perform public.gang_create_room('Audit','catalog',2,'phone');raise exception 'unauthorized host';
 exception when insufficient_privilege then null;end;
 insert into public.entitlements(user_id,product_key,status,source,starts_at,ends_at) values(uid,'night_pass_72h','active','stripe',now()-interval '1 minute',now()+interval '1 hour');
 r:=public.gang_create_room('Audit','catalog',2,'phone');rid:=(r#>>'{snapshot,roomId}')::uuid;pid:=(r#>>'{snapshot,playerId}')::uuid;tok:=r->>'playerToken';
 for i in 1..4 loop perform public.gang_create_room('Audit','catalog',2,'phone');end loop;
 begin perform public.gang_create_room('Audit','catalog',2,'phone');raise exception 'room cap absent';exception when raise_exception then if sqlerrm<>'room_limit_reached' then raise;end if;end;
 insert into gang.players(id,room_id,token_hash,display_name) values(otherid,rid,extensions.digest(othertok,'sha256'),'Other');
 select version into v from gang.rooms where id=rid;
 perform public.gang_set_room_state(tok,v,'playing','couple/coop','pair1','answer',jsonb_build_object('kind','couple','seats',jsonb_build_array(pid,otherid),'requiredPlayerIds',jsonb_build_array(pid)));
 perform public.couple_control(othertok,'pair1','answer','skip');
 if public.couple_control(tok,'pair1','answer',null)<>'["skip"]'::jsonb then raise exception 'out-of-turn control missing';end if;
 begin perform public.couple_control(othertok,'pair1','answer',null);raise exception 'guest read controls';exception when raise_exception then if sqlerrm<>'facilitator_required' then raise;end if;end;
 begin perform public.couple_control(othertok,'old','answer','finish');raise exception 'stale control';exception when raise_exception then if sqlerrm<>'stale_stage' then raise;end if;end;
 update gang.rooms set expires_at=now()-interval '1 second' where id=rid;
 perform gang.cleanup_expired_rooms();
 if exists(select 1 from gang.pair_controls where room_id=rid) or exists(select 1 from gang.players where room_id=rid) then raise exception 'TTL cascade failed';end if;
 if not exists(select 1 from cron.job where jobname='nocturne-room-retention' and active and schedule='*/5 * * * *') then raise exception 'cleanup schedule missing';end if;
 delete from auth.users where id=uid;
end $test$;
