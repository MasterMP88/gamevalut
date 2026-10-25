-- Publish the public phase, facilitator state and owner-only cards in one transaction.
create function public.gang_publish_state(
 p_player_token text,p_expected_version bigint,p_phase text,p_game_id text,p_round_key text,p_stage text,
 p_public_state jsonb,p_runtime_state jsonb,p_private_payloads jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb;
begin
 -- This locks the room and checks the facilitator lease before any write can commit.
 snapshot:=public.gang_set_room_state(p_player_token,p_expected_version,p_phase,p_game_id,p_round_key,p_stage,p_public_state);
 perform public.gang_save_runtime(p_player_token,p_runtime_state);
 if p_round_key is not null then
  perform public.gang_set_private_payloads(p_player_token,p_round_key,coalesce(p_private_payloads,'[]'::jsonb));
 end if;
 return snapshot;
end $$;
revoke all on function public.gang_publish_state(text,bigint,text,text,text,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.gang_publish_state(text,bigint,text,text,text,text,jsonb,jsonb,jsonb) to anon,authenticated;
