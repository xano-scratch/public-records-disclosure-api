import { Bot, CheckCircle2, Info, Sparkles, User } from "lucide-react";
import { useState } from "react";

import { DisclosureResult } from "@/components/disclosure-result";
import { PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import * as api from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { useSession } from "@/lib/session";

const EXAMPLES = [
  "Show me the transportation budget report",
  "Water quality in the east district",
  "The school meal vendor contract",
];

type Row = Record<string, unknown>;

function releasedNames(res: Row): string[] {
  return ((res.released ?? []) as Row[]).map((r) => String(r.field_name)).sort();
}

export default function AgentConsole() {
  const { role } = useSession();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentRes, setAgentRes] = useState<Row | null>(null);
  const [humanRes, setHumanRes] = useState<Row | null>(null);

  async function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    setQ(text);
    setBusy(true);
    setError(null);
    setAgentRes(null);
    setHumanRes(null);
    try {
      const a = (await api.agentRetrieve(text)) as Row;
      setAgentRes(a);
      // The same record, read directly at YOUR clearance, to compare against the agent's read.
      const recordId = Number(a.resolved_record_id);
      if (recordId > 0) {
        try {
          setHumanRes((await api.retrieveRecord(recordId)) as Row);
        } catch {
          setHumanRes(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The agent could not answer.");
    } finally {
      setBusy(false);
    }
  }

  const identical =
    agentRes && humanRes
      ? JSON.stringify(releasedNames(agentRes)) === JSON.stringify(releasedNames(humanRes)) &&
        String(agentRes.rule_version) === String(humanRes.rule_version)
      : false;
  const agentCount = agentRes ? releasedNames(agentRes).length : 0;
  const humanCount = humanRes ? releasedNames(humanRes).length : 0;
  const record = agentRes?.record as Row | undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agent console"
        description="Ask the AI agent for a record in plain language. It resolves the record, then the same disclosure rule runs at the least-privileged agent clearance. The result is logged like any read."
      />

      <Card className="gap-3 p-4">
        <Textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Show me the transportation budget report"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(q);
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => ask(q)} disabled={busy || !q.trim()}>
            <Sparkles className="size-4" /> {busy ? "Asking the agent…" : "Ask the agent"}
          </Button>
          <span className="text-xs text-muted-foreground">or try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => ask(ex)}
              disabled={busy}
              className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-60"
            >
              {ex}
            </button>
          ))}
        </div>
      </Card>

      {error ? (
        <Card className="gap-2 border-destructive/40 p-4">
          <div className="flex items-center gap-2 text-[0.8125rem] text-destructive">
            <Info className="size-4" /> {error}
          </div>
        </Card>
      ) : null}

      {agentRes && record ? (
        <div className="space-y-4">
          <Card className="gap-2 p-4">
            <div className="flex items-start gap-2">
              <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <div className="text-[0.8125rem]">
                  The agent resolved your request to <span className="font-medium">{String(record.title)}</span>.
                </div>
                <div className="text-xs text-muted-foreground">{String(agentRes.rationale ?? "")}</div>
              </div>
            </div>
          </Card>

          {humanRes ? (
            identical ? (
              <div className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-[0.8125rem]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>
                  <span className="font-medium">Identical result.</span> The AI agent surface returns exactly what the
                  governed read returns for this clearance, down to the rule version. No path bypasses the policy.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-[0.8125rem]">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  The agent runs at the least-privileged <span className="font-medium">agent</span> clearance. Your{" "}
                  {role ? roleLabel(role).toLowerCase() : "own"} clearance releases {Math.max(0, humanCount - agentCount)}{" "}
                  more field(s) of the same record, by the same policy.
                </span>
              </div>
            )
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bot className="size-4 text-primary" /> AI agent surface
                <Badge variant="secondary" className="font-normal">
                  agent clearance
                </Badge>
              </div>
              <DisclosureResult
                version={agentRes.rule_version}
                released={(agentRes.released ?? []) as Row[]}
                redacted={(agentRes.redacted ?? []) as Row[]}
                withheld={(agentRes.withheld ?? []) as Row[]}
              />
            </div>
            {humanRes ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="size-4 text-primary" /> Direct read
                  <Badge variant="secondary" className="font-normal">
                    {role ? `${role} clearance` : "your clearance"}
                  </Badge>
                </div>
                <DisclosureResult
                  version={humanRes.rule_version}
                  released={(humanRes.released ?? []) as Row[]}
                  redacted={(humanRes.redacted ?? []) as Row[]}
                  withheld={(humanRes.withheld ?? []) as Row[]}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
