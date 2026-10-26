-- One unresolved Stripe Checkout per account. Never exposed to browser roles.
create table public.stripe_checkout_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempt_id uuid not null unique default gen_random_uuid(),
  offer_key text not null check (offer_key in ('night_pass_72h','unlimited_monthly','unlimited_annual')),
  params jsonb not null check (jsonb_typeof(params)='object' and octet_length(params::text)<=16384),
  session_id text unique,
  created_at timestamptz not null default now()
);
alter table public.stripe_checkout_attempts enable row level security;
revoke all on public.stripe_checkout_attempts from public, anon, authenticated;
grant all on public.stripe_checkout_attempts to service_role;

create function public.stripe_reserve_checkout(p_user uuid,p_offer text,p_params jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result public.stripe_checkout_attempts%rowtype;
begin
  if p_params->>'client_reference_id' is distinct from p_user::text
    or p_params#>>'{metadata,offer_key}' is distinct from p_offer
    or p_params#>>'{metadata,user_id}' is distinct from p_user::text
  then raise exception 'checkout_identity_mismatch'; end if;
  -- Serializes first insert and a replacement after expiry across server workers.
  perform pg_advisory_xact_lock(hashtextextended('checkout:'||p_user::text,0));
  insert into public.stripe_checkout_attempts(user_id,offer_key,params)
    values(p_user,p_offer,p_params) on conflict(user_id) do nothing;
  select * into strict result from public.stripe_checkout_attempts where user_id=p_user;
  return to_jsonb(result);
end $$;
revoke all on function public.stripe_reserve_checkout(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.stripe_reserve_checkout(uuid,text,jsonb) to service_role;
