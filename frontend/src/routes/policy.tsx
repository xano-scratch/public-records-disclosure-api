import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorState, PageHeader } from "@/components/states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as api from "@/lib/api";
import { actionMeta, sensitivityMeta } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

type Row = Record<string, unknown>;

const SENSITIVITIES = ["public", "restricted", "sealed"];
const ROLES = ["agent", "clerk", "admin"];

export default function Policy() {
  const { role } = useSession();
  const canActivate = role === "admin";
  const state = useAsync(() => api.allRules(), []);
  const [target, setTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = (state.data ?? []) as Row[];
  const versions = Array.from(new Set(rows.map((r) => Number(r.version)))).sort((a, b) => b - a);

  function actionFor(version: number, sensitivity: string, r: string): string {
    const match = rows.find(
      (row) => Number(row.version) === version && String(row.sensitivity) === sensitivity && String(row.role) === r,
    );
    return match ? String(match.action) : "—";
  }
  function isActive(version: number): boolean {
    return rows.some((row) => Number(row.version) === version && row.active === true);
  }

  async function activate() {
    if (target == null) return;
    setBusy(true);
    try {
      await api.activateVersion(target);
      toast.success(`Policy version ${target} is now active.`);
      state.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not activate that version.");
    } finally {
      setBusy(false);
      setTarget(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Disclosure policy"
        description="The rules, as data. Each cell maps a field's sensitivity and the caller's role to an action. Exactly one version is active; switching it changes what every caller sees."
      />

      {state.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : (
        versions.map((version) => {
          const active = isActive(version);
          return (
            <Card key={version} className="gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <h2 className="text-sm font-medium">Version {version}</h2>
                  {active ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="size-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      Inactive
                    </Badge>
                  )}
                </div>
                {canActivate && !active ? (
                  <Button size="sm" variant="outline" onClick={() => setTarget(version)}>
                    Make active
                  </Button>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Sensitivity</TableHead>
                      {ROLES.map((r) => (
                        <TableHead key={r} className="capitalize">
                          {r}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SENSITIVITIES.map((s) => (
                      <TableRow key={s}>
                        <TableCell>
                          <Badge variant={sensitivityMeta(s).variant}>{sensitivityMeta(s).label}</Badge>
                        </TableCell>
                        {ROLES.map((r) => {
                          const meta = actionMeta(actionFor(version, s, r));
                          return (
                            <TableCell key={r}>
                              <Badge variant={meta.variant}>{meta.label}</Badge>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!canActivate ? (
                <p className="text-xs text-muted-foreground">Only an admin can change the active version.</p>
              ) : null}
            </Card>
          );
        })
      )}

      <AlertDialog open={target != null} onOpenChange={(v) => !v && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate policy version {target}?</AlertDialogTitle>
            <AlertDialogDescription>
              This immediately changes what every caller, human and agent, can see. The previously active version
              becomes inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={activate} disabled={busy}>
              Make active
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
