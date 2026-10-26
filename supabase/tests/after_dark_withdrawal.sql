do $test$
declare uid uuid:=gen_random_uuid();rid uuid;tok text;pid uuid;guest uuid:=gen_random_uuid();guesttok text:=encode(extensions.gen_random_bytes(24),'hex');r jsonb;v bigint;runtime jsonb;pub jsonb;
begin
 insert into auth.users(id,email) values(uid,'audit-'||uid::text||'@example.invalid');perform set_config('request.jwt.claim.sub',uid::text,true);
 insert into public.entitlements(user_id,product_key,status,source,starts_at,ends_at) values(uid,'night_pass_72h','active','stripe',now()-interval '1 minute',now()+interval '1 hour');
 r:=public.gang_create_room('Audit','catalog',4,'phone');rid:=(r#>>'{snapshot,roomId}')::uuid;pid:=(r#>>'{snapshot,playerId}')::uuid;tok:=r->>'playerToken';
 insert into gang.players(id,room_id,token_hash,display_name) values(guest,rid,extensions.digest(guesttok,'sha256'),'Guest');
 pub:=jsonb_build_object('kind','play','afterDarkKey','audit-game','roster',jsonb_build_array(jsonb_build_object('id',pid),jsonb_build_object('id',guest)),'requiredPlayerIds',jsonb_build_array(pid,guest));
 select version into v from gang.rooms where id=rid;
 perform public.gang_set_room_state(tok,v,'playing','after-dark','round1','answer',pub);
 r:=public.gang_after_dark_control(guesttok,'audit-game',true);
 if not(r->>'withdrawn')::boolean or r->'playerIds'<>'[]'::jsonb then raise exception 'own control or privacy failed';end if;
 select version into v from gang.rooms where id=rid;
 perform public.gang_after_dark_control(guesttok,'audit-game',true);
 if (select version from gang.rooms where id=rid)<>v then raise exception 'repeated withdrawal bumps version';end if;
 if not(public.gang_after_dark_control(tok,'audit-game')->'playerIds' ? guest::text) then raise exception 'facilitator cannot recover withdrawal';end if;
 runtime:='{"rt":{"id":"audit-game","declinedIds":[]}}'::jsonb;
 begin perform public.gang_publish_state(tok,v,'playing','after-dark','round1','reveal',pub,runtime,'[]');raise exception 'stale consent published';exception when raise_exception then if sqlerrm<>'consent_changed' then raise;end if;end;
 if (select stage from gang.rooms where id=rid)<>'answer' then raise exception 'rejected publish mutated state';end if;
 begin perform public.gang_after_dark_control(guesttok,'old-game',true);raise exception 'old game accepted';exception when raise_exception then if sqlerrm<>'stale_stage' then raise;end if;end;
 if has_table_privilege('anon','gang.after_dark_withdrawals','SELECT') then raise exception 'withdrawal list public';end if;
 delete from gang.rooms where id=rid;
 if exists(select 1 from gang.after_dark_withdrawals where room_id=rid) then raise exception 'TTL cascade missing';end if;
 delete from auth.users where id=uid;
end $test$;
