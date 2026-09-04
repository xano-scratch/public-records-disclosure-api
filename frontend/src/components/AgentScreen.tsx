import { useEffect, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, Sparkles, User } from "lucide-react";

import { api, type AgentResult, type ReleasableResult } from "@/lib/api";
import { ROLE_LABEL, type Session } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DisclosureFields } from "@/components/DisclosureFields";

const SAMPLES = [
  "Show me the transportation budget report",
  "I need the paving contractor correspondence",
  "Pull the east district air quality dataset",
];

export function AgentScreen({ session, initialQuestion }: { session: Session; initialQuestion?: string }) {
  const [question, setQuestion] = useState(initialQuestion ?? SAMPLES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentResult | null>(null);
  const [human, setHuman] = useState<ReleasableResult | null>(null);

  async function ask(q: string) {
    setBusy(true);
    setError(null);
    setAgent(null);
    setHuman(null);
    try {
      const a = await api.agentRetrieve(session.token, q);
      setAgent(a);
      // The same record, read straight through the human endpoint at the SAME role.
      const h = await api.getReleasable(session.token, a.resolved_record_id as number);
      setHuman(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The agent could not answer.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialQuestion) ask(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const identical =
    agent && human &&
    JSON.stringify([...agent.disclosure!.released_fields].sort()) ===
      JSON.stringify([...human.disclosure!.released_fields].sort()) &&
    agent.disclosure!.rule_version === human.disclosure!.rule_version;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" /> Agent console
            <Badge variant="secondary">
              acting as {ROLE_LABEL[session.user.role]} ({session.user.role})
            </Badge>
          </CardTitle>
          <CardDescription>
            Ask in plain language. The agent resolves your request to one record, then the record is
            disclosed through the exact same rule and audit a human caller would hit, at your role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => ask(question)} disabled={busy || question.trim() === ""}>
              <Bot /> {busy ? "Asking the agent…" : "Ask the agent"}
            </Button>
            {SAMPLES.map((s) => (
              <Button key={s} variant="ghost" size="sm" disabled={busy} onClick={() => { setQuestion(s); ask(s); }}>
                {s}
              </Button>
            ))}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </CardContent>
      </Card>

      {agent && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent resolved your request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">#{agent.resolved_record_id}</Badge>
                <span className="font-medium">{agent.record.title}</span>
                <Badge variant="outline">{agent.record.record_type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Rationale: </span>
                {agent.rationale}
              </p>
            </CardContent>
          </Card>

          {identical && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              Identical disclosure. The AI agent path and the human path returned the same released fields and
              the same policy version. One governed rule, no shortcut for the agent.
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="size-4" /> AI agent path
                  <Badge variant="secondary">agent/retrieve</Badge>
                </CardTitle>
                <CardDescription>What the agent was allowed to return.</CardDescription>
              </CardHeader>
              <CardContent>
                <DisclosureFields disclosure={agent.disclosure} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4" /> Human path
                  <Badge variant="secondary">records/releasable</Badge>
                </CardTitle>
                <CardDescription>The same record, same role, read by hand.</CardDescription>
              </CardHeader>
              <CardContent>
                {human ? (
                  <DisclosureFields disclosure={human.disclosure} />
                ) : (
                  <p className="text-sm text-muted-foreground">Reading…</p>
                )}
              </CardContent>
            </Card>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Both calls wrote an audit row <ArrowRight className="size-3" /> see the Audit trail.
          </p>
        </>
      )}
    </div>
  );
}
