do $test$
declare rid uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid();
 a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
 ta text:=encode(extensions.gen_random_bytes(24),'hex'); tb text:=encode(extensions.gen_random_bytes(24),'hex'); tc text:=encode(extensions.gen_random_bytes(24),'hex');
 image_id uuid; result jsonb;
begin
 insert into gang.rooms(id,code) values(rid,upper(substr(md5(rid::text),1,6))),(outsider,upper(substr(md5(outsider::text),1,6)));
 insert into gang.players(id,room_id,token_hash,display_name) values(a,rid,extensions.digest(ta,'sha256'),'Test A'),(b,rid,extensions.digest(tb,'sha256'),'Test B'),(c,outsider,extensions.digest(tc,'sha256'),'Other room');
 update gang.rooms set facilitator_player_id=a,phase='playing',game_id='photo-hunt',round_key='r1',stage='0-perform',public_state=jsonb_build_object('missionKey','night','missionPlayerIds',jsonb_build_array(a,b),'requiredPlayerIds',jsonb_build_array(a,b),'view',jsonb_build_object('stage','perform')) where id=rid;
 perform public.gang_mission_event(ta,'night','claim');
 perform public.gang_mission_event(ta,'night','claim');
 if (select count(*) from gang.mission_events where room_id=rid)<>1 then raise exception 'duplicate claim'; end if;
 begin perform public.gang_mission_events(tb,'night');raise exception 'private events leaked';exception when raise_exception then if sqlerrm<>'facilitator_required' then raise; end if;end;
 begin perform public.gang_mission_event(tb,'night','accuse',jsonb_build_object('targetId',c,'missionId','fake'));raise exception 'cross room target';exception when raise_exception then if sqlerrm<>'target_player_invalid' then raise; end if;end;
 result:=public.gang_put_photo(ta,'r1','data:image/jpeg;base64,/9j/2Q==');image_id:=(result->>'photoId')::uuid;
 begin perform public.gang_get_photos(tb,array[image_id]);raise exception 'premature reveal';exception when raise_exception then if sqlerrm<>'photos_not_revealed' then raise; end if;end;
 begin perform public.gang_submit_action(tb,'r1','0-perform','answer',jsonb_build_object('value','copy','photoId',image_id));raise exception 'photo spoof';exception when raise_exception then if sqlerrm<>'photo_not_owned' then raise; end if;end;
 perform public.gang_submit_action(ta,'r1','0-perform','answer',jsonb_build_object('value','my image','photoId',image_id,'noFaces',true));
 update gang.rooms set public_state=jsonb_set(public_state,'{view,stage}','"vote"') where id=rid;
 result:=public.gang_get_photos(tb,array[image_id]);
 if jsonb_array_length(result)<>1 or result #>> '{0,url}'<>'data:image/jpeg;base64,/9j/2Q==' then raise exception 'gallery failed'; end if;
 update gang.rooms set public_state='{"view":{"stage":"vote"}}' where id=outsider;
 if jsonb_array_length(public.gang_get_photos(tc,array[image_id]))<>0 then raise exception 'cross room image leaked'; end if;
 delete from gang.rooms where id in (rid,outsider);
end $test$;
