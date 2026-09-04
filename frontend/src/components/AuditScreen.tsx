import { useEffect, useState } from "react";
import { Bot, ShieldAlert, User } from "lucide-react";

import { api, ApiError, type AuditRow } from "@/lib/api";
import type { Session } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function whenLabel(epochMs: number): string {
  try {
    return new Date(epochMs).toLocaleString();
  } catch {
    return String(epochMs);
  }
}

export function AuditScreen({ session }: { session: Session }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAudit(session.token)
      .then(setRows)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) setDenied(true);
        else setError(e instanceof Error ? e.message : String(e));
      });
  }, [session.token]);

  if (denied)
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <ShieldAlert className="size-5 text-amber-400" />
          The audit trail is restricted to clerks and admins. Your role ({session.user.role}) cannot read it.
          That refusal is enforced by the same API-layer RBAC, and it was logged.
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit trail</CardTitle>
        <CardDescription>
          One row per retrieval, human or agent, with the deciding policy version and the fields released
          versus withheld. This is the accountability the whole design exists to produce.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {!rows && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">Caller</th>
                  <th className="py-2 pr-3 font-medium">Record</th>
                  <th className="py-2 pr-3 font-medium">Policy</th>
                  <th className="py-2 pr-3 font-medium">Released</th>
                  <th className="py-2 font-medium">Withheld</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 align-top">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">{whenLabel(r.created_at)}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        {r.caller_kind === "agent" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                        <span className="font-medium">{r.caller_name}</span>
                      </div>
                      <div className="mt-1 flex gap-1">
                        <Badge variant={r.caller_kind === "agent" ? "warning" : "muted"}>{r.caller_kind}</Badge>
                        <Badge variant="outline">{r.caller_role}</Badge>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{r.record_title}</span>
                      <span className="block text-xs text-muted-foreground">#{r.record_id}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant="secondary">v{r.rule_version}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-emerald-300">
                      {(r.released_fields ?? []).length ? (r.released_fields ?? []).join(", ") : "none"}
                    </td>
                    <td className="py-2.5 text-rose-300/90">
                      {(r.withheld_fields ?? []).length ? (r.withheld_fields ?? []).join(", ") : "none"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-muted-foreground">
                      No accesses logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
