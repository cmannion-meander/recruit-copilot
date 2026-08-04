import { NextResponse } from "next/server";

/* The capture endpoint. Two lists, one shape.
 *
 * Which form a visitor fills in is the signal Phase 0 exists to read, so the two lists
 * stay separate all the way to Mailjet — separate list ids, never merged, never a tag on
 * one list. Sign-ups land in the same account that already sends for meanderhq.com, so
 * there is one consent record, one suppression list and one export to keep.
 *
 * ADR 0009 records why this speaks Mailjet's own API rather than the provider-agnostic
 * transport ADR 0007 specified.
 *
 * This is a public unauthenticated POST. It will be found and submitted to by bots, and
 * a poisoned list corrupts the only measurement this phase produces. Three defences,
 * none of which depends on the others:
 *
 *   1. A honeypot field. Filled means automated; accepted and discarded.
 *   2. A per-IP rate limit.
 *   3. Field validation with hard length caps.
 *
 * A rejection never reports whether an address is already on a list — that would make
 * the form an enumeration oracle.
 */

const LISTS = ["course", "software"] as const;
const AGENCY_SIZES = ["1", "2-5", "6-10", "10+"] as const;

type List = (typeof LISTS)[number];

const EMAIL_MAX = 254; // RFC 5321 maximum reverse-path length
const ATS_MAX = 120;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const REQUEST_TIMEOUT_MS = 6000;

const DEFAULT_API_BASE = "https://api.mailjet.com/v3/REST";

/* addnoforce adds the contact to the list but never resubscribes someone who has
 * opted out. It is the consent-safe action and the same one meander-backend uses;
 * `addforce` would silently override an unsubscribe. */
const ACTION = "addnoforce";

/* In-memory and therefore per-instance, and cleared by a restart. That is the correct
 * size of solution for a single B1 serving one landing page: no dependency, no shared
 * store, and it blunts the volume that matters. When there is a second instance this
 * stops being sufficient and moves to the provider or a shared store. */
const hits = new Map<string, { count: number; resetAt: number }>();

/* A hard ceiling, not just a sweep. Expiring-only cleanup does nothing against a flood
 * from many addresses at once — the map keeps growing and every later request pays an
 * O(n) scan. Past the cap the whole window is dropped, which hands everyone a fresh
 * allowance. That is the right way to fail: a limiter that forgets is a nuisance, one
 * that exhausts the instance is an outage. */
const RATE_LIMIT_MAX_KEYS = 20_000;

function rateLimited(key: string, now: number) {
  if (hits.size >= RATE_LIMIT_MAX_KEYS) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    if (hits.size >= RATE_LIMIT_MAX_KEYS) {
      console.error(
        `capture: rate-limit table hit ${RATE_LIMIT_MAX_KEYS} live keys and was cleared — ` +
          "this is a distributed flood, not normal traffic.",
      );
      hits.clear();
    }
  }

  const existing = hits.get(key);
  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX;
}

/* The RIGHT-most X-Forwarded-For entry, not the left-most.
 *
 * App Service appends the address it observed to whatever the client sent, so the
 * left-most entry is written by the caller and forging it defeats the limiter outright
 * — verified: twelve requests with a rotating fake left-most IP were never limited.
 * The right-most entry is the one the platform appended, and a client cannot influence
 * it. If a proxy is ever put in front of App Service (Front Door, for instance) this
 * becomes that proxy's address and collapses every visitor into one bucket, which is
 * the point to switch to X-Azure-ClientIP.
 *
 * "unknown" is a shared bucket by design: a request arriving with no forwarded address
 * did not come through the front end, and there is no reason to trust it with its own
 * allowance. */
function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded.split(",");
    // App Service appends the source port: 203.0.113.4:51234
    const last = entries[entries.length - 1].trim().replace(/:\d+$/, "");
    if (last) return last;
  }
  return "unknown";
}

function isEmail(value: string) {
  return value.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/* An unset variable and one that is present but empty mean the same thing. `??` alone
 * does not: `MAILJET_API_BASE=` is a configured empty string, and the request URL then
 * fails to parse rather than falling back. Read through here, always.
 *
 * Read per request rather than at module load, so the values come from the running
 * environment — App Service settings — and are never baked in at build time. */
function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function mailjetConfig(list: List) {
  const key = env("MAILJET_API_KEY");
  const secret = env("MAILJET_SECRET_KEY");
  const listId = list === "course" ? env("MAILJET_LIST_COURSE") : env("MAILJET_LIST_SOFTWARE");
  if (!key || !secret || !listId) return null;
  return {
    listId,
    // Overridable only so a test can point at a stub; the hostname is not expected to change.
    apiBase: env("MAILJET_API_BASE") ?? DEFAULT_API_BASE,
    authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
  };
}

const ok = () => NextResponse.json({ ok: true });

const refuse = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status });

const UNAVAILABLE =
  "The list did not accept that just now. Try again in a minute, or write to hello@recruitcopilot.com.";

type ManageContact = { Email: string; Action: string; Properties?: Record<string, string> };

async function manageContact(
  config: { listId: string; authorization: string; apiBase: string },
  body: ManageContact,
) {
  const url = `${config.apiBase}/contactslist/${encodeURIComponent(config.listId)}/managecontact`;
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: config.authorization },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return refuse("The form did not send. Try again.", 400);
  }

  /* The limiter runs first, before the honeypot. The other order lets anything that
   * fills the honeypot make unlimited requests — a bot that knows the field name buys
   * itself an exemption from the only volume control there is. */
  if (rateLimited(clientKey(request), Date.now())) {
    return refuse(
      "Too many submissions from this connection. Wait ten minutes, or write to hello@recruitcopilot.com.",
      429,
    );
  }

  // Honeypot. A visitor cannot reach this field, so a value in it means automation.
  // Accepted rather than refused: a bot told it was caught simply tries something else.
  if (String(form.get("company_website") ?? "").trim().length > 0) {
    return ok();
  }

  const list = String(form.get("list") ?? "");
  if (!LISTS.includes(list as List)) {
    return refuse("Unknown list.", 400);
  }

  const email = String(form.get("email") ?? "").trim();
  if (!isEmail(email)) {
    return refuse("Enter an email address in the form name@example.com.", 400);
  }

  const properties: Record<string, string> = {};

  if (list === "software") {
    const agencySize = String(form.get("agency_size") ?? "");
    if (!AGENCY_SIZES.includes(agencySize as (typeof AGENCY_SIZES)[number])) {
      return refuse("Choose an agency size from the list.", 400);
    }
    properties.agency_size = agencySize;

    const currentAts = String(form.get("current_ats") ?? "").trim();
    if (currentAts) properties.current_ats = currentAts.slice(0, ATS_MAX);
  }

  const config = mailjetConfig(list as List);
  if (!config) {
    // Deliberately not accepted-and-logged. Writing addresses to the App Service log
    // stream is not storage, and telling a visitor it worked when nothing was recorded
    // is the one outcome worse than the form being down.
    console.error(
      `capture: refusing the "${list}" list — MAILJET_API_KEY, MAILJET_SECRET_KEY and ` +
        "the list id must all be set. See .env.example.",
    );
    return refuse(
      "The list is not accepting sign-ups yet. Write to hello@recruitcopilot.com and you will be added by hand.",
      503,
    );
  }

  const hasProperties = Object.keys(properties).length > 0;

  try {
    let response = await manageContact(config, {
      Email: email,
      Action: ACTION,
      ...(hasProperties ? { Properties: properties } : {}),
    });

    /* Mailjet rejects the whole contact — not just the field — if a property is not
     * defined in the account, and properties ride inline with managecontact. That
     * failure mode has already cost meander-backend a backfill (see the docstring on
     * sync_missing_contacts). Losing a purchase-intent address to a schema mismatch is
     * not an acceptable trade, so the address goes on the list either way and the
     * missing definition is made loud instead of fatal. */
    if (response.status === 400 && hasProperties) {
      console.error(
        `capture: Mailjet refused the "${list}" contact with properties ` +
          `[${Object.keys(properties).join(", ")}] — define them under Contacts → ` +
          "Properties, or they will keep being dropped. Retrying with the address alone.",
      );
      response = await manageContact(config, { Email: email, Action: ACTION });
    }

    if (!response.ok) {
      // The status is operational detail. The address never reaches the log.
      console.error(`capture: Mailjet refused the "${list}" list with ${response.status}`);
      return refuse(UNAVAILABLE, 502);
    }
  } catch (thrown) {
    console.error(
      `capture: Mailjet unreachable for the "${list}" list —`,
      thrown instanceof Error ? thrown.message : thrown,
    );
    return refuse(UNAVAILABLE, 502);
  }

  return ok();
}
