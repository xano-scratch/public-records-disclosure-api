import { useEffect, useState } from "react";
import { Check, EyeOff, Lock } from "lucide-react";

import { api, type ActivePolicy, type RuleRow } from "@/lib/api";
import { ROLE_RANK, type Role, type Session } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROLES: Role[] = ["agent", "clerk", "admin"];
const SENSITIVITIES = ["public", "restricted", "sealed"] as const;
const VERSIONS = [2, 1];

// The same decision the backend's shared rule makes, shown as a matrix so a
// reviewer can read the policy that decided any disclosure.
function decide(rule: RuleRow | undefined, role: Role): "release" | "redact" | "withhold" {
  if (!rule) return "withhold";
  return ROLE_RANK[role] >= ROLE_RANK[rule.min_role as Role] ? "release" : (rule.action as "redact" | "withhold");
}

function Cell({ action }: { action: string }) {
  if (action === "release") return <Badge variant="success"><Check /> release</Badge>;
  if (action === "redact") return <Badge variant="warning"><EyeOff /> redact</Badge>;
  return <Badge variant="danger"><Lock /> withhold</Badge>;
}

export function PolicyScreen({ session }: { session: Session }) {
  const [policy, setPolicy] = useState<ActivePolicy | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = session.user.role === "admin";

  function load() {
    api.getActivePolicy(session.token).then(setPolicy).catch((e) => setError(String(e?.message ?? e)));
  }
  useEffect(load, [session.token]);

  async function activate(version: number) {
    setBusy(version);
    setError(null);
    try {
      const next = await api.activatePolicy(session.token, version);
      setPolicy(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const ruleFor = (sensitivity: string) => policy?.rules.find((r) => r.sensitivity === sensitivity);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Active disclosure policy
            {policy && <Badge variant="default">v{policy.version}</Badge>}
          </CardTitle>
          <CardDescription>
            The policy is stored as data, one rule row per sensitivity. Each rule sets the minimum role to
            release, and what happens below it. Role clearance is ranked agent &lt; clerk &lt; admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {policy && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">Sensitivity</th>
                    <th className="py-2 pr-3 font-medium">AI agent</th>
                    <th className="py-2 pr-3 font-medium">Clerk</th>
                    <th className="py-2 pr-3 font-medium">Admin</th>
                    <th className="py-2 font-medium">Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {SENSITIVITIES.map((s) => {
                    const rule = ruleFor(s);
                    return (
                      <tr key={s} className="border-b last:border-0 align-top">
                        <td className="py-2.5 pr-3">
                          <Badge variant={s === "public" ? "muted" : s === "restricted" ? "warning" : "danger"}>
                            {s}
                          </Badge>
                        </td>
                        {ROLES.map((role) => (
                          <td key={role} className="py-2.5 pr-3">
                            <Cell action={decide(rule, role)} />
                          </td>
                        ))}
                        <td className="py-2.5 text-xs text-muted-foreground">{rule?.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="text-sm text-muted-foreground">
              {isAdmin ? "Switch the active version:" : "Only an admin can switch the active version."}
            </span>
            {VERSIONS.map((v) => (
              <Button
                key={v}
                size="sm"
                variant={policy?.version === v ? "default" : "outline"}
                disabled={!isAdmin || busy !== null || policy?.version === v}
                onClick={() => activate(v)}
              >
                {busy === v ? "Activating…" : policy?.version === v ? `v${v} (active)` : `Activate v${v}`}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            v1 is a stricter prior policy (restricted and sealed both withheld below admin). Activate it, then
            reopen a record or ask the agent, and the disclosure and the audited rule version follow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
