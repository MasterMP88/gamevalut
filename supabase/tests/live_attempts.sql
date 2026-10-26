do $test$
declare rid uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
 ta text:=encode(extensions.gen_random_bytes(24),'hex');tb text:=encode(extensions.gen_random_bytes(24),'hex'); result jsonb;
begin
 insert into gang.rooms(id,code) values(rid,upper(substr(md5(rid::text),1,6)));
 insert into gang.players(id,room_id,token_hash,display_name) values(a,rid,extensions.digest(ta,'sha256'),'Test A'),(b,rid,extensions.digest(tb,'sha256'),'Test B');
 update gang.rooms set facilitator_player_id=a,phase='playing',round_key='draw-1',stage='1-answer',stage_deadline=now()+interval '30 seconds',public_state=jsonb_build_object('requiredPlayerIds',jsonb_build_array(b),'view',jsonb_build_object('repeatable',true)) where id=rid;
 perform public.gang_round_attempt(tb,'draw-1','1-answer','wrong');
 update gang.round_attempts set created_at=clock_timestamp()-interval '1 second' where room_id=rid;
 perform public.gang_round_attempt(tb,'draw-1','1-answer','right');
 result:=public.gang_round_attempts(ta,'draw-1','1-answer');
 if jsonb_array_length(result->'actions')<>2 then raise exception 'attempt lost';end if;
 begin perform public.gang_round_attempt(tb,'draw-1','1-answer','too fast');raise exception 'rate not limited';exception when raise_exception then if sqlerrm<>'attempt_rate_limit' then raise;end if;end;
 insert into gang.round_attempts(room_id,player_id,round_key,stage,value) select rid,b,'draw-1','1-answer','fixture '||i from generate_series(1,22) i;
 begin perform public.gang_round_attempt(tb,'draw-1','1-answer','25th');raise exception 'attempt cap missing';exception when raise_exception then if sqlerrm<>'attempt_limit' then raise;end if;end;
 begin perform public.gang_round_attempts(tb,'draw-1','1-answer');raise exception 'attempts leaked';exception when raise_exception then if sqlerrm<>'facilitator_required' then raise;end if;end;
 begin perform public.gang_round_attempt(ta,'draw-1','1-answer','cheat');raise exception 'artist guessed';exception when raise_exception then if sqlerrm<>'player_not_required' then raise;end if;end;
 result:=public.gang_poll(tb);if result #>> '{snapshot,roomId}'<>rid::text then raise exception 'combined poll failed';end if;
 update gang.rooms set stage_deadline=now()-interval '1 second' where id=rid;
 begin perform public.gang_round_attempt(tb,'draw-1','1-answer','late');raise exception 'late accepted';exception when raise_exception then if sqlerrm<>'stale_stage' then raise;end if;end;
 result:=public.gang_round_attempts(ta,'draw-1','1-answer');if result->>'expired'<>'true' then raise exception 'missing expiry';end if;
 delete from gang.rooms where id=rid;
end $test$;
