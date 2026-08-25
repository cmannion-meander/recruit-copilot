/* The one file that knows the server exists.
 *
 * Every other file in _state/ — the reducer, the selectors, all fourteen screens — was
 * written against PrototypeState and never needs to change: this module's job is only
 * to (a) fetch that exact shape from GET /api/workspace, and (b) translate each Action
 * into the Django command it names. The reducer's own refusal-checked logic still runs
 * first, locally, for the instant feedback a click needs; this is what makes that
 * feedback durable.
 */

import type { PrototypeState } from "../_fixtures";
import { PENDING_DRAFT_CRITERION } from "../_fixtures/roles";
import type { Action, State } from "./types";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const method = init?.method ?? "GET";
  const headers = new Headers(init?.headers);
  if (method !== "GET" && method !== "HEAD") {
    const token = readCookie("csrftoken");
    if (token) headers.set("X-CSRFToken", token);
  }
  return fetch(path, { ...init, method, headers, credentials: "include" });
}

async function postJSON(path: string, body?: unknown): Promise<Response> {
  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  return request(path, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Ensures a csrftoken cookie exists (session_view sets one via @ensure_csrf_cookie on
 * GET) before the first POST — which for a browser that has never visited is the login
 * itself. */
export async function primeCsrf(): Promise<void> {
  await request("/api/session");
}

export type Session = { user: { username: string; name: string; title: string } | null };

export async function fetchSession(): Promise<Session> {
  const res = await request("/api/session");
  if (!res.ok) return { user: null };
  return res.json();
}

export async function login(username: string, password: string): Promise<Session> {
  const res = await postJSON("/api/session", { username, password });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "The username and password did not match.");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await request("/api/session", { method: "DELETE" });
}

export async function fetchWorkspace(): Promise<PrototypeState> {
  const res = await request("/api/workspace");
  if (!res.ok) throw new Error(`GET /api/workspace failed: ${res.status}`);
  return res.json();
}

/** A refusal from the server, in the same shape every command answers with —
 * requirement, reason, action, named items, invariant. Thrown, not returned, so a
 * caller who does not catch it fails loudly rather than silently. */
export class ApiRefusal extends Error {
  requirement: string;
  reason: string;
  action: string;
  items: { label: string; detail: string | null }[];
  invariant: number | null;

  constructor(payload: {
    requirement: string;
    reason: string;
    action: string;
    items?: { label: string; detail: string | null }[];
    invariant?: number | null;
  }) {
    super(payload.requirement);
    this.requirement = payload.requirement;
    this.reason = payload.reason;
    this.action = payload.action;
    this.items = payload.items ?? [];
    this.invariant = payload.invariant ?? null;
  }
}

async function unwrap(res: Response): Promise<unknown> {
  if (res.status === 422) throw new ApiRefusal(await res.json());
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

/** Translates one reducer Action into its Django command. `state` is the
 * already-hydrated state at dispatch time — used only to look up the handful of
 * fields (a sighting's own detail, a channel to file a hand-entered person under)
 * that the server needs and the Action itself does not carry, matching exactly what
 * the reducer derives locally for the same cases. `reset` and `__hydrate` are
 * client-only and never reach here. */
export async function dispatchToApi(action: Action, state: State): Promise<void> {
  switch (action.type) {
    case "reset":
    case "__hydrate":
      return;

    case "add_criterion":
      await unwrap(
        await postJSON(`/api/roles/${action.role_id}/criteria`, {
          text: PENDING_DRAFT_CRITERION.text,
          cell_label: PENDING_DRAFT_CRITERION.cell_label,
        }),
      );
      return;

    case "assign_criterion":
      await unwrap(
        await postJSON(`/api/criteria/${action.criterion_id}/assign`, {
          stage_id: action.stage_id,
        }),
      );
      return;

    case "open_role":
      await unwrap(await postJSON(`/api/roles/${action.role_id}/open`));
      return;

    case "create_person_from_sighting": {
      const sighting = state.sightings.find((s) => s.id === action.sighting_id);
      if (!sighting) return;
      // The same derivation the reducer applies locally, so the optimistic name and
      // the persisted one agree.
      const full_name = sighting.snapshot_excerpt.split(",")[0]?.trim() ?? "Unnamed";
      await unwrap(
        await postJSON(`/api/sightings/${action.sighting_id}/person`, {
          full_name,
          headline: sighting.source_kind,
          current_employer: sighting.source_name,
          location: "Not recorded",
        }),
      );
      return;
    }

    case "create_candidacy":
      await unwrap(
        await postJSON(`/api/candidacies`, {
          role_id: action.role_id,
          person_id: action.person_id,
          channel_id: action.channel_id,
        }),
      );
      return;

    case "create_person_by_hand": {
      const person = (await unwrap(
        await postJSON(`/api/people`, {
          full_name: action.full_name,
          headline: action.headline,
          current_employer: action.current_employer,
          location: action.location,
          source_url: action.source_url,
          source_name: action.source_name,
          snapshot_excerpt: action.snapshot_excerpt,
        }),
      )) as { person: { id: string } };
      // The reducer files a hand-entered person under a fixed channel; there is no
      // channel picker on this form. Same idea here: the org's own inbound channel,
      // falling back to whichever channel sorts first if none is named that way.
      const channel = state.channels.find((c) => c.kind === "inbound") ?? state.channels[0];
      if (channel) {
        await unwrap(
          await postJSON(`/api/candidacies`, {
            role_id: action.role_id,
            person_id: person.person.id,
            channel_id: channel.id,
          }),
        );
      }
      return;
    }

    case "advance_stage":
      await unwrap(await postJSON(`/api/candidacies/${action.candidacy_id}/advance`));
      return;

    case "record_finding":
      await unwrap(
        await postJSON(`/api/candidacies/${action.candidacy_id}/findings`, {
          stage_id: action.stage_id,
          criterion_id: action.criterion_id,
          status: action.status,
          passage: action.passage,
        }),
      );
      return;

    case "extend_auto_close":
      await unwrap(
        await postJSON(`/api/candidacies/${action.candidacy_id}/extend`, {
          message_text: action.message_text,
        }),
      );
      return;

    case "resolve_signal":
      await unwrap(
        await postJSON(`/api/signals/${action.signal_id}/resolve`, { note: action.note }),
      );
      return;

    case "override_signal":
      await unwrap(
        await postJSON(`/api/signals/${action.signal_id}/override`, {
          reason_text: action.reason_text,
        }),
      );
      return;

    case "reject_candidacy":
      await unwrap(
        await postJSON(`/api/candidacies/${action.candidacy_id}/reject`, {
          reason_code: action.reason_code,
          reason_text: action.reason_text,
        }),
      );
      return;

    case "create_submission":
      await unwrap(await postJSON(`/api/candidacies/${action.candidacy_id}/submission`));
      return;

    case "send_stage_message":
      await unwrap(
        await postJSON(`/api/candidacies/${action.candidacy_id}/messages`, {
          stage_id: action.stage_id,
        }),
      );
      return;

    case "record_checkpoint":
      await unwrap(
        await postJSON(`/api/checkpoints/${action.checkpoint_id}/record`, {
          note: action.note,
          brief_feedback: action.brief_feedback,
        }),
      );
      return;
  }
}
