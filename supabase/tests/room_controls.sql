-- Run inside BEGIN/ROLLBACK; fixture also deletes its own room.
do $test$
declare
 rid uuid:=gen_random_uuid(); pid uuid:=gen_random_uuid(); tok text:=encode(extensions.gen_random_bytes(24),'hex'); v bigint; result jsonb;
begin
 insert into gang.rooms(id,code) values(rid,upper(substr(md5(rid::text),1,6)));
 insert into gang.players(id,room_id,token_hash,display_name) values(pid,rid,extensions.digest(tok,'sha256'),'Ephemeral audit fixture');
 update gang.rooms set facilitator_player_id=pid where id=rid;
 select version into v from gang.rooms where id=rid;
 perform public.gang_set_room_state(tok,v,'playing','panic-button','test-round','0-react',jsonb_build_object('requiredPlayerIds',jsonb_build_array(pid),'view',jsonb_build_object('timed',true,'seconds',5)));
 perform public.gang_submit_action(tok,'test-round','0-react','answer','{"value":"first"}');
 perform public.gang_submit_action(tok,'test-round','0-react','answer','{"value":"overwrite"}');
 select payload into result from gang.actions where room_id=rid and stage='0-react';
 if result->>'value' <> 'first' then raise exception 'First answer not sealed'; end if;
 select version into v from gang.rooms where id=rid;
 perform public.gang_set_room_state(tok,v,'playing','panic-button','test-round','1-react',jsonb_build_object('requiredPlayerIds',jsonb_build_array(pid),'view',jsonb_build_object('timed',true,'seconds',5)));
 update gang.rooms set stage_deadline=clock_timestamp()-interval '1 second' where id=rid;
 result:=public.gang_stage_progress(tok);
 if result->>'complete' <> 'true' then raise exception 'Deadline did not complete stage'; end if;
 result:=public.gang_collect_stage_actions(tok,'test-round','1-react');
 if result #>> '{0,payload,timedOut}' <> 'true' then raise exception 'Missing timeout action'; end if;
 select version into v from gang.rooms where id=rid;
 perform public.gang_set_room_state(tok,v,'playing','bad-answers-only','test-round','2-answer',jsonb_build_object('requiredPlayerIds',jsonb_build_array(pid),'view',jsonb_build_object('maxWords',5)));
 begin
  perform public.gang_submit_action(tok,'test-round','2-answer','answer','{"value":"eins zwei drei vier fünf sechs"}');
  raise exception 'Word limit was not enforced';
 exception when raise_exception then
  if sqlerrm <> 'answer_too_many_words' then raise; end if;
 end;
 delete from gang.rooms where id=rid;
end $test$;
