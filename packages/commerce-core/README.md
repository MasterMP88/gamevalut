# @game/commerce-core

Canonical, provider-light commercial rules for NOCTURNE.

## Approved public offers

| Offer | Price | Rule |
| --- | ---: | --- |
| Free Preview | €0 | playable through scene 5; gate before scene 6 |
| Night Pass | €6.99 once | 72 hours of all couple games and GANG hosting; guests free |
| Unlimited | €9.99/month | recurring |
| Unlimited Year | €49.99/year | recommended offer |

The three paid offers already exist in the live **GameNights** Stripe account. This
package contains their public Stripe Price IDs so server integrations can allowlist
them. It contains no Stripe secret.

## Non-negotiable access rules

- Never interrupt an active scene or GANG round with a paywall.
- Free Preview ends **before scene 6**, not during scene 5.
- A paid entitlement is valid only while active and inside its optional time window.
- Unknown Stripe prices never grant access.
- GANG MODE follows **one host pays, everyone plays**:
  guests need neither an account nor payment.
- The exact set of paid products that unlocks a GANG host is intentionally a runtime
  configuration. A standalone GANG Pass is not silently launched by this package.

## Integration contract

1. Browser sends an approved `OfferKey`, never an arbitrary Stripe price.
2. Server resolves the allowlisted Stripe price and creates Checkout.
3. Checkout sets the authenticated user ID as `client_reference_id` (or equivalent
   signed metadata).
4. A verified Stripe webhook is the only writer of subscription/entitlement grants.
5. For Night Pass, set `ends_at` to purchase time + 72 hours.
6. For subscriptions, synchronize entitlement expiry/status from the Stripe
   subscription period/status.
7. UI reads the user's own entitlement row through RLS and applies
   `accessForCoupleScene` before beginning scene 6.
8. GANG join routes never ask guests to pay.

VAT / Stripe Tax behavior is intentionally not encoded here because NOCTURNE's tax
treatment has not yet been finalized.
