import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import * as api from "./api";

const TOKEN_KEY = "prd-token";

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function writeToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sandboxed frame */
  }
}

type AuthResult = { authToken?: string | null; user_id?: number };

type SessionValue = {
  user: api.AuthUser | null;
  role: api.Role | null;
  booting: boolean;
  signInPersona: (persona: string) => Promise<void>;
  signInPassword: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.AuthUser | null>(null);
  const [booting, setBooting] = useState(true);

  const signOut = useCallback(() => {
    api.setToken(null);
    writeToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    // Any 401 on an authenticated request ends the session.
    api.setUnauthorizedHandler(() => {
      signOut();
      toast.error("Your session ended. Sign in again.");
    });
    // Restore a stored session on boot, dropping the token if it no longer works.
    const stored = readToken();
    if (!stored) {
      setBooting(false);
      return;
    }
    api.setToken(stored);
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        api.setToken(null);
        writeToken(null);
      })
      .finally(() => setBooting(false));
  }, [signOut]);

  async function finish(result: AuthResult) {
    if (!result.authToken) throw new api.ApiError(500, "Sign-in did not return a token.");
    api.setToken(result.authToken);
    writeToken(result.authToken);
    const u = await api.me();
    setUser(u);
  }

  const value: SessionValue = {
    user,
    role: (user?.role as api.Role | undefined) ?? null,
    booting,
    signInPersona: async (persona) => finish(await api.signInWithPersona(persona)),
    signInPassword: async (email, password) => finish(await api.signInWithPassword(email, password)),
    signUp: async (name, email, password) => finish(await api.signUp(name, email, password)),
    signOut,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
