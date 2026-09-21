import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@site/shared";
import { api } from "./client";
import type { ApiClient } from "./client";
import { ApiError } from "./errors";

export interface SessionValue {
  /** "loading" until the first /auth/me answer (or failure) arrives. */
  readonly status: "loading" | "ready";
  /** The operator, or null when anonymous (or when the session could not be checked; see `error`). */
  readonly user: User | null;
  /** Set when the last session check failed (API down, timeout); cleared by the next success. */
  readonly error: ApiError | null;
  /** Re-check the session with GET /api/auth/me. Never throws. */
  refresh(): Promise<void>;
  /** POST /api/auth/login. Throws ApiError on failure. The password is passed through, never kept. */
  login(username: string, password: string): Promise<User>;
  /** POST /api/auth/logout. Throws ApiError on failure and leaves the current user in place. */
  logout(): Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export interface SessionProviderProps {
  readonly children: ReactNode;
  /** Defaults to the shared client. Tests pass a stub. */
  readonly client?: ApiClient;
}

export function SessionProvider({ children, client = api }: SessionProviderProps) {
  const [status, setStatus] = useState<SessionValue["status"]>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  // A refresh takes a ticket when it starts; a completed login or logout bumps the counter too.
  // An answer whose ticket is no longer current (for example an initial /me that finishes after a
  // login) is ignored so it cannot overwrite newer state. A failed login or logout bumps nothing,
  // so a refresh already in flight still lands.
  const version = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const mine = ++version.current;
    try {
      const me = await client.getMe();
      if (!mounted.current || mine !== version.current) return;
      setUser(me);
      setError(null);
    } catch (e) {
      if (!mounted.current || mine !== version.current) return;
      setUser(null);
      setError(e instanceof ApiError ? e : new ApiError({ code: "network_error", status: 0, message: "Session check failed." }));
    }
    setStatus("ready");
  }, [client]);

  const login = useCallback(
    async (username: string, password: string) => {
      const next = await client.login(username, password);
      version.current += 1;
      if (mounted.current) {
        setUser(next);
        setError(null);
        setStatus("ready");
      }
      return next;
    },
    [client],
  );

  const logout = useCallback(async () => {
    await client.logout();
    version.current += 1;
    if (mounted.current) {
      setUser(null);
      setError(null);
      setStatus("ready");
    }
  }, [client]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SessionValue>(
    () => ({ status, user, error, refresh, login, logout }),
    [status, user, error, refresh, login, logout],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
