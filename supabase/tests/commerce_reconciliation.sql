-- Run together with the migration in BEGIN/ROLLBACK before deployment.
do $test$
declare uid uuid:=gen_random_uuid();attempt uuid:=gen_random_uuid();other uuid:=gen_random_uuid();v_resource text:='checkout:audit-'||uid::text;r jsonb;until_before timestamptz;subrow jsonb;oldstatus text;
begin
 insert into auth.users(id,email) values(uid,'audit-'||uid::text||'@example.invalid');
 if not public.stripe_claim_event(v_resource,'checkout.session.completed',attempt) then raise exception 'event not claimed';end if;
 begin perform public.stripe_claim_event(v_resource,'checkout.session.completed',other);raise exception 'processing duplicate acknowledged';exception when raise_exception then if sqlerrm<>'event_in_progress_retry' then raise;end if;end;
 update public.stripe_webhook_events set status='processed' where event_id=v_resource;
 if public.stripe_claim_event(v_resource,'checkout.session.completed',other) then raise exception 'processed duplicate claimed';end if;
 if not public.stripe_lock_resource(v_resource,attempt) then raise exception 'lease not acquired';end if;
 if public.stripe_lock_resource(v_resource,other) then raise exception 'concurrent lease';end if;
 r:=jsonb_build_object('user_id',uid,'product_key','night_pass_72h','source','stripe','status','active','starts_at',now()-interval '1 minute','ends_at',now()+interval '72 hours');
 perform public.stripe_apply_access(v_resource,attempt,r);
 select ends_at into until_before from public.entitlements where user_id=uid and product_key='night_pass_72h';
 perform public.stripe_apply_access(v_resource,attempt,r||jsonb_build_object('starts_at',now()+interval '1 day','ends_at',now()+interval '4 days'));
 if (select ends_at from public.entitlements where user_id=uid and product_key='night_pass_72h')<>until_before then raise exception 'duplicate extended pass';end if;
 perform public.stripe_apply_access(v_resource,attempt,r||'{"status":"revoked"}'::jsonb);
 if (select status from public.entitlements where user_id=uid and product_key='night_pass_72h')<>'revoked' then raise exception 'refund not revoked';end if;
 perform public.stripe_apply_access(v_resource,attempt,r);
 if (select status from public.entitlements where user_id=uid and product_key='night_pass_72h')<>'active' then raise exception 'won dispute not restored';end if;
 update public.stripe_resource_leases set expires_at=now()-interval '1 second' where stripe_resource_leases.resource=v_resource;
 begin perform public.stripe_apply_access(v_resource,attempt,r);raise exception 'expired lease applied';exception when raise_exception then if sqlerrm<>'reconciliation_lease_lost' then raise;end if;end;
 if not public.stripe_lock_resource(v_resource,other) then raise exception 'replacement lease failed';end if;
 begin perform public.stripe_apply_access(v_resource,attempt,r);raise exception 'old worker applied';exception when raise_exception then if sqlerrm<>'reconciliation_lease_lost' then raise;end if;end;
 -- Separate grants prevent a refund of an old purchase from revoking a newer valid pass.
 perform public.stripe_lock_resource(v_resource||'-new',attempt);
 perform public.stripe_apply_access(v_resource||'-new',attempt,r||jsonb_build_object('ends_at',now()+interval '74 hours'));
 perform public.stripe_apply_access(v_resource,other,r||'{"status":"revoked"}'::jsonb);
 if (select status from public.entitlements where user_id=uid and product_key='night_pass_72h')<>'active' then raise exception 'old refund removed new pass';end if;
 -- Changing subscription plan removes the stale previous-plan grant atomically.
 subrow:=jsonb_build_object('user_id',uid,'plan_key','unlimited_monthly','provider_subscription_id','sub_audit_'||uid::text,'provider_customer_id','cus_audit','status','active','current_period_end',now()+interval '30 days');
 r:=r||'{"product_key":"unlimited_monthly"}'::jsonb;
 perform public.stripe_lock_resource('subscription:'||uid::text,attempt);
 perform public.stripe_apply_access('subscription:'||uid::text,attempt,r,subrow);
 perform public.stripe_apply_access('subscription:'||uid::text,attempt,r||'{"product_key":"unlimited_annual"}'::jsonb,subrow||'{"plan_key":"unlimited_annual"}'::jsonb);
 if (select status from public.entitlements where user_id=uid and product_key='unlimited_monthly')='active' then raise exception 'old plan survived switch';end if;
 if (select status from public.entitlements where user_id=uid and product_key='unlimited_annual')<>'active' then raise exception 'new plan absent';end if;
 if has_function_privilege('anon','public.stripe_apply_access(text,uuid,jsonb,jsonb)','EXECUTE') or has_function_privilege('authenticated','public.stripe_claim_event(text,text,uuid)','EXECUTE') then raise exception 'privileged RPC exposed';end if;
 if has_table_privilege('authenticated','public.stripe_access_grants','SELECT') then raise exception 'private grants exposed';end if;
 delete from auth.users where id=uid;
 delete from public.stripe_resource_leases where resource like '%'||uid::text||'%';
 delete from public.stripe_webhook_events where event_id=v_resource;
end $test$;
