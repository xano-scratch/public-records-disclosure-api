import { useEffect, useState } from "react";
import { Bot, ClipboardList, FileSearch, ScrollText, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { api } from "@/lib/api";
import {
  clearSession,
  DEMO_ACCOUNTS,
  loadSession,
  ROLE_LABEL,
  saveSession,
  type Session,
} from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoginScreen } from "@/components/LoginScreen";
import { RecordsScreen } from "@/components/RecordsScreen";
import { AgentScreen } from "@/components/AgentScreen";
import { AuditScreen } from "@/components/AuditScreen";
import { PolicyScreen } from "@/components/PolicyScreen";

type View = "record" | "agent" | "audit" | "policy";

const NAV: { key: View; label: string; icon: typeof Bot }[] = [
  { key: "record", label: "Records", icon: FileSearch },
  { key: "agent", label: "Agent console", icon: Bot },
  { key: "audit", label: "Audit trail", icon: ScrollText },
  { key: "policy", label: "Policy", icon: SlidersHorizontal },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [view, setView] = useState<View>("record");
  const [recordId, setRecordId] = useState<number | undefined>(undefined);
  const [question, setQuestion] = useState<string | undefined>(undefined);
  const [booting, setBooting] = useState(true);

  // Deep-link boot: ?role=&view=&record=&q=&seed= lets a link (or the screenshot
  // capture) land on a specific governed view, signed in as a specific role.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const role = p.get("role");
    const v = p.get("view") as View | null;
    const rec = p.get("record");
    const q = p.get("q");
    const seed = p.get("seed");
    if (v && NAV.some((n) => n.key === v)) setView(v);
    if (rec) setRecordId(Number(rec));
    if (q) setQuestion(q);

    (async () => {
      try {
        if (seed) await api.seedDemo();
        const acct = DEMO_ACCOUNTS.find((a) => a.role === role);
        if (acct) {
          const res = await api.login({ email: acct.email, password: acct.password });
          const s: Session = { token: res.token as string, user: res.user as Session["user"] };
          saveSession(s);
          setSession(s);
        }
      } catch {
        /* fall through to whatever session (or login screen) we have */
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (booting && !session) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  if (!session) return <LoginScreen onSignedIn={setSession} />;

  function signOut() {
    clearSession();
    setSession(null);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-400" />
            <span className="font-semibold tracking-tight">Public Records Disclosure API</span>
            <Badge variant="outline" className="hidden sm:inline-flex">
              Play 4 · Government
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-medium leading-tight">{session.user.display_name}</div>
              <div className="text-xs text-muted-foreground">
                {ROLE_LABEL[session.user.role]} · {session.user.email}
              </div>
            </div>
            <Badge variant="secondary">{session.user.role}</Badge>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="size-4" /> {n.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === "record" && <RecordsScreen session={session} initialRecordId={recordId} />}
        {view === "agent" && <AgentScreen session={session} initialQuestion={question} />}
        {view === "audit" && <AuditScreen session={session} />}
        {view === "policy" && <PolicyScreen session={session} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ClipboardList className="size-3.5" />
          Field-level disclosure is computed in the API layer for every caller (human or AI agent), never
          with row-level security. Every retrieval is audited.
        </span>
      </footer>
    </div>
  );
}
