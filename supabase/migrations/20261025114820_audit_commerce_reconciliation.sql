-- Service-role-only webhook leases, per-source grants, atomic subscription/access reconciliation.
-- Verified before rollout: no existing Stripe subscriptions/entitlements/events in this project.
-- Another deployment with paid customers must backfill exact Stripe sources first.
do $$begin
 if exists(select 1 from public.entitlements where source='stripe') then raise exception 'backfill_existing_stripe_sources_before_migration';end if;
end$$;
alter table public.stripe_webhook_events add column if not exists attempt_id uuid;
alter table public.stripe_webhook_events add column if not exists started_at timestamptz;
create table public.stripe_resource_leases(resource text primary key,attempt_id uuid not null,expires_at timestamptz not null);
create table public.stripe_access_grants(
 resource text primary key,user_id uuid not null references auth.users(id) on delete cascade,
 product_key text not null check(product_key in ('night_pass_72h','unlimited_monthly','unlimited_annual')),
 status text not null check(status in ('active','expired','revoked')),
 starts_at timestamptz not null,ends_at timestamptz,subscription_id uuid references public.subscriptions(id) on delete set null,updated_at timestamptz not null default now()
);
create index stripe_access_grants_user_product on public.stripe_access_grants(user_id,product_key);
alter table public.stripe_resource_leases enable row level security;
alter table public.stripe_access_grants enable row level security;
revoke all on public.stripe_resource_leases,public.stripe_access_grants from public,anon,authenticated;
grant all on public.stripe_resource_leases,public.stripe_access_grants to service_role;
create or replace function public.stripe_claim_event(p_id text,p_type text,p_attempt uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 insert into public.stripe_webhook_events(event_id,event_type,status,attempt_id,started_at)
 values(p_id,p_type,'processing',p_attempt,now())
 on conflict(event_id) do update set status='processing',attempt_id=p_attempt,started_at=now(),error=null
 where stripe_webhook_events.status='failed' or (stripe_webhook_events.status='processing' and coalesce(stripe_webhook_events.started_at,stripe_webhook_events.created_at)<now()-interval '4 minutes');
 get diagnostics affected=row_count;
 if affected=0 and exists(select 1 from public.stripe_webhook_events where event_id=p_id and status='processing') then raise exception 'event_in_progress_retry';end if;
 return affected>0;
end;$$;
create or replace function public.stripe_lock_resource(p_resource text,p_attempt uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 insert into public.stripe_resource_leases values(p_resource,p_attempt,now()+interval '120 seconds')
 on conflict(resource) do update set attempt_id=p_attempt,expires_at=excluded.expires_at where stripe_resource_leases.expires_at<now();
 get diagnostics affected=row_count;return affected>0;
end;$$;
create or replace function public.stripe_apply_access(p_resource text,p_attempt uuid,p_entitlement jsonb,p_subscription jsonb default null) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=(p_entitlement->>'user_id')::uuid;product text:=p_entitlement->>'product_key';old_product text;subid uuid;key text;best public.stripe_access_grants%rowtype;existing public.stripe_access_grants%rowtype;start_time timestamptz:=(p_entitlement->>'starts_at')::timestamptz;end_time timestamptz:=(p_entitlement->>'ends_at')::timestamptz;
begin
 if not exists(select 1 from public.stripe_resource_leases where resource=p_resource and attempt_id=p_attempt and expires_at>now() for update) then raise exception 'reconciliation_lease_lost';end if;
 if product not in ('night_pass_72h','unlimited_monthly','unlimited_annual') or p_entitlement->>'status' not in ('active','expired','revoked') then raise exception 'invalid_grant';end if;
 perform pg_advisory_xact_lock(hashtextextended('stripe:'||uid::text,0));
 select * into existing from public.stripe_access_grants where resource=p_resource;
 old_product:=existing.product_key;
 if existing.user_id is not null and existing.user_id<>uid then raise exception 'grant_owner_mismatch';end if;
 if product='night_pass_72h' and existing.resource is not null then start_time:=existing.starts_at;end_time:=existing.ends_at;end if;
 if p_subscription is not null then
  if p_subscription->>'user_id'<>uid::text or p_subscription->>'plan_key'<>product then raise exception 'subscription_mismatch';end if;
  insert into public.subscriptions(user_id,provider,provider_customer_id,provider_subscription_id,plan_key,status,current_period_end,updated_at)
  values(uid,'stripe',p_subscription->>'provider_customer_id',p_subscription->>'provider_subscription_id',product,p_subscription->>'status',(p_subscription->>'current_period_end')::timestamptz,now())
  on conflict(provider_subscription_id) do update set plan_key=excluded.plan_key,status=excluded.status,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at
  where subscriptions.user_id=uid returning id into subid;
  if subid is null then raise exception 'subscription_owner_mismatch';end if;
 end if;
 insert into public.stripe_access_grants(resource,user_id,product_key,status,starts_at,ends_at,subscription_id)
 values(p_resource,uid,product,p_entitlement->>'status',start_time,end_time,subid)
 on conflict(resource) do update set product_key=excluded.product_key,status=excluded.status,starts_at=excluded.starts_at,ends_at=excluded.ends_at,subscription_id=excluded.subscription_id,updated_at=now();
 foreach key in array array[product,old_product] loop
  if key is null then continue;end if;
  select * into best from public.stripe_access_grants where user_id=uid and product_key=key and status='active' and starts_at<=now() and (ends_at is null or ends_at>now()) order by ends_at desc nulls first limit 1;
  if not found then
   best.status:=case when exists(select 1 from public.stripe_access_grants where user_id=uid and product_key=key and status='revoked') then 'revoked' else 'expired' end;
   best.starts_at:=now();best.ends_at:=now();best.subscription_id:=null;
  end if;
  insert into public.entitlements(user_id,product_key,source,status,starts_at,ends_at,subscription_id)
  values(uid,key,'stripe',best.status,best.starts_at,best.ends_at,best.subscription_id)
  on conflict(user_id,product_key) do update set status=excluded.status,starts_at=excluded.starts_at,ends_at=excluded.ends_at,subscription_id=excluded.subscription_id where entitlements.source='stripe';
 end loop;
end;$$;
revoke all on function public.stripe_claim_event(text,text,uuid),public.stripe_lock_resource(text,uuid),public.stripe_apply_access(text,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.stripe_claim_event(text,text,uuid),public.stripe_lock_resource(text,uuid),public.stripe_apply_access(text,uuid,jsonb,jsonb) to service_role;
