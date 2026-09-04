import { useState } from "react";
import { Bot, DatabaseZap, ShieldCheck, User, UserCog } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { DEMO_ACCOUNTS, saveSession, type Role, type Session } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_ICON: Record<Role, typeof Bot> = { agent: Bot, clerk: User, admin: UserCog };

export function LoginScreen({ onSignedIn }: { onSignedIn: (s: Session) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(role: Role, email: string, password: string, seedFirst = false) {
    setBusy(role);
    setError(null);
    try {
      if (seedFirst) await api.seedDemo();
      const res = await api.login({ email, password });
      const s: Session = { token: res.token as string, user: res.user as Session["user"] };
      saveSession(s);
      onSignedIn(s);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 404) && !seedFirst) {
        // The environment may have been swept, load demo data once and retry.
        return signIn(role, email, password, true);
      }
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 p-6">
      <header className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" /> Play 4 · Agent Intelligence Layer · Government
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Public Records Disclosure API</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          One governed read path for a public-records office. A human clerk and an AI agent call the same
          rule to fetch a record, and the same versioned policy decides which fields are released, redacted,
          or withheld, with a full audit row every time.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sign in as a demo role</CardTitle>
          <CardDescription>
            Each role has a different clearance. Sign in as the AI agent to see the least-privileged view,
            then as a clerk or admin to watch the disclosure change under the same policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((acct) => {
            const Icon = ROLE_ICON[acct.role];
            return (
              <button
                key={acct.role}
                onClick={() => signIn(acct.role, acct.email, acct.password)}
                disabled={busy !== null}
                className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent/40 disabled:opacity-60"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-5" />
                  <Badge variant="outline">{acct.role}</Badge>
                </div>
                <div className="font-medium">{acct.label}</div>
                <div className="text-xs text-muted-foreground">{acct.blurb}</div>
                <div className="mt-1 text-xs font-medium text-primary">
                  {busy === acct.role ? "Signing in…" : "Sign in →"}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {error && (
        <p className="text-center text-sm text-rose-400">
          {error}{" "}
          <button
            className="underline"
            onClick={() => signIn("agent", DEMO_ACCOUNTS[0].email, DEMO_ACCOUNTS[0].password, true)}
          >
            Load demo data and retry
          </button>
        </p>
      )}

      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("seed");
            try {
              await api.seedDemo();
              setError(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Seed failed.");
            }
            setBusy(null);
          }}
        >
          <DatabaseZap /> Reset demo data
        </Button>
      </div>
    </main>
  );
}
