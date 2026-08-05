"use client";

/* React context plus useReducer, in memory only.
 *
 * No persistence. No localStorage, no sessionStorage, no cookie, no IndexedDB, no
 * network. A reload returns to the identical starting state, on purpose: these screens
 * get filmed and every take has to start the same way, and a prototype that remembers
 * yesterday's clicking is a prototype nobody can demonstrate twice.
 */
import { createContext, useContext, useMemo, useReducer } from "react";
import { initialPrototypeState, reducer } from "./reducer";
import type { Action, State } from "./types";

type Store = { state: State; dispatch: (action: Action) => void };

const PrototypeContext = createContext<Store | null>(null);

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialPrototypeState);
  const store = useMemo(() => ({ state, dispatch }), [state]);
  return <PrototypeContext.Provider value={store}>{children}</PrototypeContext.Provider>;
}

export function usePrototype(): Store {
  const store = useContext(PrototypeContext);
  if (!store) {
    throw new Error("usePrototype must be used inside the /prototype route group.");
  }
  return store;
}
