import { Bot, FileText, Layers, ScrollText, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { CardsSkeleton, ErrorState, PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import * as api from "@/lib/api";
import { actionMeta, formatDateTime, roleLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

function Stat({ icon: Icon, label, value, hint }: { icon: typeof FileText; label: string; value: string; hint?: string }) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

export default function Overview() {
  const { user, role } = useSession();
  const canAudit = role === "clerk" || role === "admin";

  const state = useAsync(async () => {
    const [reqs, recs, rules] = await Promise.all([
      api.listRequests({ per_page: 1 }),
      api.listRecords(),
      api.activeRules(),
    ]);
    let audit: api.AuditRow[] = [];
    if (canAudit) {
      try {
        audit = await api.listAudit({ per_page: 6 });
      } catch {
        audit = [];
      }
    }
    const version = (rules[0] as { version?: unknown } | undefined)?.version;
    const total = (reqs as { itemsTotal?: number }).itemsTotal ?? (reqs as { items?: unknown[] }).items?.length ?? 0;
    return { total, records: recs.length, version, audit };
  }, [canAudit]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name ?? ""}`}
        description={`You are signed in as a ${role ? roleLabel(role).toLowerCase() : "user"}. What you can see is decided by the active disclosure policy, not by this screen.`}
      />

      {state.loading ? (
        <CardsSkeleton count={4} />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={FileText} label="Disclosure requests" value={String(state.data?.total ?? 0)} />
            <Stat icon={Layers} label="Records on file" value={String(state.data?.records ?? 0)} />
            <Stat icon={ShieldCheck} label="Active policy" value={`v${String(state.data?.version ?? "?")}`} hint="governs every read" />
            <Stat
              icon={ScrollText}
              label="Recent accesses"
              value={canAudit ? String(state.data?.audit.length ?? 0) : "—"}
              hint={canAudit ? "shown below" : "clerk or admin only"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-3 p-5">
              <h2 className="text-sm font-medium">How disclosure works here</h2>
              <ul className="space-y-2 text-[0.8125rem] text-muted-foreground">
                <li>Public fields are released to everyone.</li>
                <li>Restricted and sealed fields depend on your role. The AI agent is the least-privileged caller.</li>
                <li>
                  One rule decides for a human read and an agent read alike, so they cannot diverge. Open the{" "}
                  <Link to="/agent" className="font-medium text-primary hover:underline">
                    agent console
                  </Link>{" "}
                  to see them match.
                </li>
                <li>Every retrieval writes one audit row.</li>
              </ul>
            </Card>

            <Card className="gap-3 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Recent activity</h2>
                {canAudit ? (
                  <Link to="/audit" className="text-xs font-medium text-primary hover:underline">
                    View trail
                  </Link>
                ) : null}
              </div>
              {!canAudit ? (
                <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-[0.8125rem] text-muted-foreground">
                  <Bot className="mt-0.5 size-4 shrink-0" />
                  <span>The audit trail is for clerks and admins. As the agent, your own reads are still logged there.</span>
                </div>
              ) : (state.data?.audit.length ?? 0) === 0 ? (
                <p className="text-[0.8125rem] text-muted-foreground">No accesses logged yet.</p>
              ) : (
                <div className="divide-y">
                  {(state.data?.audit ?? []).map((row, i) => {
                    const r = row as Record<string, unknown>;
                    const kind = String(r.caller_kind);
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 py-2 text-[0.8125rem]">
                        <div className="min-w-0">
                          <span className="font-medium">{String(r.caller_name ?? `User #${String(r.caller_id)}`)}</span>{" "}
                          <span className="text-muted-foreground">read {String(r.record_title ?? `record #${String(r.record_id)}`)}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={kind === "agent" ? "default" : "secondary"}>{kind}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at as number)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
