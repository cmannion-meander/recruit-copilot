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
  useRef,
  useState,
} from "react";
import { Control } from "@/components/control";
import { Refusal } from "@/components/refusal";
import { cn } from "@/lib/utils";
import { dispatchToApi, fetchSession, fetchWorkspace, login, logout, primeCsrf } from "./api";
import { reducer } from "./reducer";
import type { Action, State } from "./types";

type Store = { state: State; dispatch: (action: Action) => void; signOut: () => void };

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

  const signOut = useCallback(() => {
    localDispatch({ type: "__hydrate", payload: EMPTY_STATE });
    setAuthed(false);
    logout()
      .catch((error) => console.error("Sign-out did not reach the server:", error))
      .then(() => primeCsrf()); // the next login form's first POST needs a fresh csrftoken cookie
  }, []);

  // The server round trip for one dispatch — call, then refetch, then hydrate — has to
  // finish before the next one starts, or two in-flight commands' hydrates can resolve
  // out of order and the earlier one's stale read overwrites the later one's fresher
  // state. That looked, from a click, like "advance" doing nothing the first time: the
  // click landed and the server accepted it, but a slower-resolving refetch from the
  // previous command arrived after and quietly reverted the screen. queueRef chains
  // every command's server work onto the last one's, so they always resolve in the
  // order the user issued them — the local optimistic update below stays instant either
  // way, since only the server sync is serialized.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const [pending, setPending] = useState(0);

  const dispatch = useCallback(
    (action: Action) => {
      if (action.type === "reset") {
        // Repurposed for the wired cockpit: "reset" meant "revert to fixtures," which
        // is not a thing this screen can honestly offer once it holds real rows — that
        // would read as data loss on a database-backed screen. Re-sync with the server
        // instead. See prototype-bar.tsx, where the button is labelled to match.
        setPending((n) => n + 1);
        queueRef.current = queueRef.current
          .then(() => fetchWorkspace())
          .then((workspace) => localDispatch({ type: "__hydrate", payload: workspace }))
          .finally(() => setPending((n) => n - 1));
        return;
      }

      localDispatch(action); // instant, optimistic — the reducer's own refusal checks apply
      if (action.type === "__hydrate") return;

      setPending((n) => n + 1);
      queueRef.current = queueRef.current
        .then(() => dispatchToApi(action, state))
        .catch((error) => {
          // A server-side refusal here means the local check and the server disagreed —
          // reconciling to server truth below is the safe response either way.
          console.error("Command did not persist:", error);
        })
        .then(() => fetchWorkspace())
        .then((workspace) => localDispatch({ type: "__hydrate", payload: workspace }))
        .finally(() => setPending((n) => n - 1));
    },
    [state],
  );

  const store = useMemo(() => ({ state, dispatch, signOut }), [state, dispatch, signOut]);

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

  return (
    <PrototypeContext.Provider value={store}>
      {/* The one honest use of "busy" (components/control.tsx): not a spinner, not a
       * toast — a thin ink bar, the same vocabulary the rest of the product already
       * uses for "something is happening," pinned above everything so a click always
       * gets an answer even before the server has one. */}
      {pending > 0 ? (
        <div aria-hidden="true" className="bg-ink fixed inset-x-0 top-0 z-50 h-[2px]" />
      ) : null}
      {children}
    </PrototypeContext.Provider>
  );
}

const INPUT =
  "border-rule-control rounded-rc w-full border bg-transparent px-1.5 py-[5px] text-16 " +
  "focus-visible:outline-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

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
        className="w-[320px]"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onSubmit(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
        }}
      >
        <p className="rc-label text-ink-muted mb-1">RECRUIT COPILOT</p>
        <h1 className="text-22 text-ink mb-6 font-medium tracking-[-.01em]">Sign in</h1>

        <label className="text-14 text-ink-secondary mb-1 block" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          className={cn(INPUT, "mb-4")}
        />

        <label className="text-14 text-ink-secondary mb-1 block" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={cn(INPUT, "mb-6")}
        />

        {error ? (
          <Refusal
            className="mb-6 px-4 py-4"
            requirement="Sign-in needs a username and password that match a real account."
            reason={error}
            action="Check the username and password, then try again."
          />
        ) : null}

        <Control type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Control>
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
