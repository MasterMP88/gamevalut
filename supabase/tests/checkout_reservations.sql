do $test$
declare uid uuid:=gen_random_uuid();p jsonb;a jsonb;b jsonb;
begin
 insert into auth.users(id,email) values(uid,'audit-'||uid::text||'@example.invalid');
 p:=jsonb_build_object('client_reference_id',uid,'metadata',jsonb_build_object('user_id',uid,'offer_key','night_pass_72h'),'customer_email','original@example.invalid');
 a:=public.stripe_reserve_checkout(uid,'night_pass_72h',p);
 b:=public.stripe_reserve_checkout(uid,'night_pass_72h',p||'{"customer_email":"changed@example.invalid"}'::jsonb);
 if a<>b then raise exception 'reservation or frozen request changed';end if;
 b:=public.stripe_reserve_checkout(uid,'unlimited_annual',jsonb_set(p,'{metadata,offer_key}','"unlimited_annual"'));
 if a<>b then raise exception 'parallel plan replaced an open checkout';end if;
 begin perform public.stripe_reserve_checkout(uid,'night_pass_72h',jsonb_set(p,'{client_reference_id}','"someone-else"'));raise exception 'mismatched identity accepted';exception when raise_exception then if sqlerrm<>'checkout_identity_mismatch' then raise;end if;end;
 if has_function_privilege('anon','public.stripe_reserve_checkout(uuid,text,jsonb)','EXECUTE') or has_function_privilege('authenticated','public.stripe_reserve_checkout(uuid,text,jsonb)','EXECUTE') or has_table_privilege('authenticated','public.stripe_checkout_attempts','SELECT') then raise exception 'payment reservation exposed';end if;
 delete from public.stripe_checkout_attempts where user_id=uid and attempt_id=gen_random_uuid();
 if not exists(select 1 from public.stripe_checkout_attempts where user_id=uid) then raise exception 'stale worker released current attempt';end if;
 delete from auth.users where id=uid;
 if exists(select 1 from public.stripe_checkout_attempts where user_id=uid) then raise exception 'deletion cascade missing';end if;
end $test$;
