import { Bot, Landmark, ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import * as api from "@/lib/api";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

const PERSONA_ICON: Record<string, typeof Bot> = { agent: Bot, clerk: UserCog, admin: ShieldCheck };

export default function SignIn() {
  const { user, signInPersona, signInPassword } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const personas = useAsync(() => api.demoPersonas(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  async function pickPersona(key: string) {
    setBusy(key);
    try {
      await signInPersona(key);
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in.");
      setBusy(null);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBusy("form");
    try {
      await signInPassword(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(null);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Landmark className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Public Records Disclosure</h1>
          <p className="text-[0.8125rem] text-muted-foreground">
            A governed records API where a clerk and an AI agent get the same audited answer. Continue as a
            demo persona to look around.
          </p>
        </div>

        <Card className="gap-0 p-2">
          {personas.loading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : personas.error ? (
            <div className="space-y-2 p-4 text-center text-[0.8125rem] text-muted-foreground">
              <p>Could not load demo sign-in.</p>
              <Button variant="outline" size="sm" onClick={personas.reload}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(personas.data ?? []).map((p) => {
                const Icon = PERSONA_ICON[p.key] ?? UserCog;
                return (
                  <button
                    key={p.key}
                    data-testid="demo-login"
                    disabled={busy !== null}
                    onClick={() => pickPersona(p.key)}
                    className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="relative text-center">
          <span className="relative z-10 bg-background px-2 text-xs text-muted-foreground">or sign in with an account</span>
          <div className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
        </div>

        <form onSubmit={submitPassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {formError ? <p className="text-[0.8125rem] text-destructive">{formError}</p> : null}
          <Button type="submit" className="w-full" disabled={busy !== null}>
            {busy === "form" ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-[0.8125rem] text-muted-foreground">
          New here?{" "}
          <Link to="/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
