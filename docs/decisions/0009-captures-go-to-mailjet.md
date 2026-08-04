# 9. Captures go to Mailjet, and the transport names it

**Status:** accepted
**Amends:** ADR 0007, "Captures post to a route handler in the same app"

## Context

ADR 0007 specified that the capture endpoint forward to "a hosted list provider over its
HTTP API", configured by `CAPTURE_PROVIDER_URL`, `CAPTURE_PROVIDER_TOKEN`,
`CAPTURE_LIST_COURSE` and `CAPTURE_LIST_SOFTWARE`, "with no provider name in a code
identifier, so swapping it is configuration rather than a refactor".

That was written before a provider existed. It was built as specified, and the shape turned
out to fit almost nothing. Bearer auth with the list id in the request body describes Loops
and very little else: EmailOctopus, Resend and Mailchimp all put the list id in the URL path,
Buttondown uses a `Token` scheme, Kit uses a bespoke header, and Mailchimp uses Basic auth
against a datacentre-specific host. A transport generic enough to cover them is not
configuration, it is a small adapter framework — and there is exactly one consumer.

Meanwhile the account already exists. `meanderhq.com` sends through Mailjet today: SPF
includes `spf.mailjet.com`, DKIM is published, and `meander-backend` holds a worked
integration in `learn/integrations/mailjet.py` — retries, consent-safe actions, contact status
lookups, and a set of hard-won notes about the API's behaviour. Adding a second ESP for two
pre-launch lists would mean a second consent record, a second suppression list, a second
export to remember, and a second set of deliverability settings to keep aligned with the
first.

## Decision

The capture endpoint speaks Mailjet's contact API directly.

```
POST https://api.mailjet.com/v3/REST/contactslist/{list}/managecontact
Authorization: Basic base64(MAILJET_API_KEY:MAILJET_SECRET_KEY)
{"Email": "…", "Action": "addnoforce", "Properties": {…}}
```

Configured by `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_LIST_COURSE` and
`MAILJET_LIST_SOFTWARE`, following the naming already used in `meander-backend`.

**Two lists, never merged.** Which form someone fills in is the signal Phase 0 exists to
read. One list with a tag discriminator loses that distinction the first time a bulk send
goes to "everyone", and there is no recovering it afterwards.

**`addnoforce`, not `addforce`.** It adds the contact but never resubscribes someone who has
opted out. Same choice, for the same reason, as the backend.

**An undefined property degrades rather than fails.** Mailjet rejects the *entire contact*
when a property is not defined in the account, and properties ride inline with
`managecontact` — `meander-backend`'s `sync_missing_contacts` docstring records losing a whole
backfill to exactly this, via an `esp_source` key that was never defined. The software form
sends `agency_size` and `current_ats`. If Mailjet 400s, the endpoint retries once with the
address alone and logs the property names and where to define them. Segmentation is worth
having; it is not worth trading a purchase-intent address for.

## Consequences

**ADR 0007's swappability goal is not met, and this is the trade.** Moving off Mailjet now
means editing `manageContact` and the config reader — roughly thirty lines in one file, all
of it in `app/api/capture/route.ts`. That is a smaller, more honest cost than an abstraction
serving one caller, and it is bounded because nothing else in the app knows the ESP exists.

**`agency_size` and `current_ats` must be defined in the Mailjet account** under Contacts →
Properties before the software form's answers are stored. Until then the sign-ups land but
the segmentation is silently absent from the list and present only in the App Service log as
a warning. This is the one manual step that cannot be checked mechanically from this repo.

**The credentials are account-wide, not per-list.** The key and secret in App Service
configuration can read and write every contact list in the Mailjet account, including
Meander's. Compromising the landing page compromises the Meander lists too. Mailjet supports
additional API key pairs; a dedicated pair for this app is the obvious hardening and is not
done yet.

**One account is now a shared dependency across two products.** A Mailjet suspension, a
billing lapse or a deliverability problem on `meanderhq.com` reaches Recruit Copilot's
pre-sale capture. Accepted — the alternative was two of everything — but it is a coupling
that did not exist before this decision.

ADR 0007's closing advice stands and matters more now: export both lists on a schedule from
the first sign-up. When slice 11 brings billing, these two populations are what the pricing
was inferred from.
