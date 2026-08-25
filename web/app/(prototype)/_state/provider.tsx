"use client";

/* React context plus useReducer, backed by Postgres.
 *
 * The contract with every other file under _state/ and every one of the fourteen
 * screens is unchanged: usePrototype() still returns { state, dispatch }, dispatch
 * still takes an Action, and state still has the exact shape of PrototypeState. What
 * changed is what's behind that contract — state starts empty, is hydrated from
 * GET /api/workspace, and every dispatch runs the reducer locally for instant feedback
 * (the same refusal-checked logic the fixture-only prototype always had) and then fires
 * the matching command at the server, reconciling to whatever Postgres actually holds
 * once it answers. The server is the authority; the reducer is only ever the preview.
 *
 * There is no login screen in the app shell — this provider is the gate. A session
 * that isn't there yet renders a small form instead of the cockpit, and nothing below
 * it ever has to know that was possible.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { dispatchToApi, fetchSession, fetchWorkspace, login, primeCsrf } from "./api";
import { reducer } from "./reducer";
import type { Action, State } from "./types";

type Store = { state: State; dispatch: (action: Action) => void };

const PrototypeContext = createContext<Store | null>(null);

const EMPTY_STATE: State = {
  organization: { id: "", name: "", wordmark: "", place: "" },
  users: [],
  clients: [],
  contacts: [],
  roles: [],
  briefs: [],
  briefVersions: [],
  criteria: [],
  briefStages: [],
  sourcingScopes: [],
  channels: [],
  searches: [],
  people: [],
  sightings: [],
  terminalStages: [],
  candidacies: [],
  candidateMessages: [],
  placements: [],
  placementCheckpoints: [],
  documents: [],
  reviews: [],
  findings: [],
  evidence: [],
  crosscheckSignals: [],
  decisions: [],
  exclusions: [],
  decisionEvents: [],
  submissionRecords: [],
  seq: 0,
};

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const [state, localDispatch] = useReducer(reducer, EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSession().then(async (session) => {
      if (cancelled) return;
      if (!session.user) {
        await primeCsrf(); // the login form's first POST needs a csrftoken cookie to send
        setReady(true);
        return;
      }
      const workspace = await fetchWorkspace();
      if (cancelled) return;
      localDispatch({ type: "__hydrate", payload: workspace });
      setAuthed(true);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(username: string, password: string) {
    setSigningIn(true);
    setAuthError(null);
    try {
      await login(username, password);
      const workspace = await fetchWorkspace();
      localDispatch({ type: "__hydrate", payload: workspace });
      setAuthed(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setSigningIn(false);
    }
  }

  const dispatch = useCallback(
    (action: Action) => {
      localDispatch(action); // instant, optimistic — the reducer's own refusal checks apply
      if (action.type === "reset" || action.type === "__hydrate") return;
      dispatchToApi(action, state)
        .catch((error) => {
          // A server-side refusal here means the local check and the server disagreed —
          // reconciling to server truth below is the safe response either way.
          console.error("Command did not persist:", error);
        })
        .then(() => fetchWorkspace())
        .then((workspace) => localDispatch({ type: "__hydrate", payload: workspace }));
    },
    [state],
  );

  const store = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  if (!ready) {
    return (
      <div className="bg-paper flex h-screen items-center justify-center">
        <p className="text-ink-muted text-14">Loading…</p>
      </div>
    );
  }

  if (!authed) {
    return <LoginGate onSubmit={handleLogin} error={authError} pending={signingIn} />;
  }

  return <PrototypeContext.Provider value={store}>{children}</PrototypeContext.Provider>;
}

function LoginGate({
  onSubmit,
  error,
  pending,
}: {
  onSubmit: (username: string, password: string) => void;
  error: string | null;
  pending: boolean;
}) {
  return (
    <div className="bg-paper flex h-screen items-center justify-center">
      <form
        className="border-rule w-[320px] border p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onSubmit(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
        }}
      >
        <p className="rc-label text-ink-muted mb-4">RECRUIT COPILOT</p>
        <label className="text-14 text-ink-secondary mb-1 block" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          className="border-rule-control rounded-rc mb-3 w-full border px-2 py-1.5 text-16"
        />
        <label className="text-14 text-ink-secondary mb-1 block" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="border-rule-control rounded-rc mb-3 w-full border px-2 py-1.5 text-16"
        />
        {error ? <p className="text-14 mb-3 text-open">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="border-rule-control rounded-rc w-full border px-2 py-1.5 text-16"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export function usePrototype(): Store {
  const store = useContext(PrototypeContext);
  if (!store) {
    throw new Error("usePrototype must be used inside the /prototype route group.");
  }
  return store;
}
