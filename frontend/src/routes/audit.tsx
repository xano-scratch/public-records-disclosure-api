import { ScrollText } from "lucide-react";
import { useSearchParams } from "react-router";

import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as api from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useAsync } from "@/lib/use-async";

type Row = Record<string, unknown>;

function names(v: unknown): string {
  return Array.isArray(v) && v.length ? v.join(", ") : "—";
}

export default function Audit() {
  const [sp, setSp] = useSearchParams();
  const kind = sp.get("kind") ?? "";
  const data = useAsync(() => api.listAudit({ caller_kind: kind }), [kind]);
  const rows = (data.data ?? []) as Row[];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit trail"
        description="Every record retrieval, human or agent, with the policy version that decided it and which fields were released or withheld."
        actions={
          <Select
            value={kind || "all"}
            onValueChange={(v) => {
              const next = new URLSearchParams(sp);
              if (v === "all") next.delete("kind");
              else next.set("kind", v);
              setSp(next, { replace: true });
            }}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="All callers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All callers</SelectItem>
              <SelectItem value="human">Human</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card className="overflow-hidden p-0">
        {data.loading ? (
          <div className="p-3">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : data.error ? (
          <div className="p-6">
            <ErrorState message={data.error} onRetry={data.reload} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={ScrollText} title="No accesses logged yet" description="Retrieve a record or ask the agent, and it will appear here." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Caller</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead className="w-20">Policy</TableHead>
                  <TableHead>Released</TableHead>
                  <TableHead>Withheld</TableHead>
                  <TableHead className="w-40">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => {
                  const callerKind = String(r.caller_kind);
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={callerKind === "agent" ? "default" : "secondary"}>{callerKind}</Badge>
                          <span className="truncate text-[0.8125rem]">{String(r.caller_name ?? `User #${String(r.caller_id)}`)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{String(r.record_title ?? `Record #${String(r.record_id)}`)}</TableCell>
                      <TableCell className="tabular-nums">v{String(r.rule_version)}</TableCell>
                      <TableCell className="max-w-56 truncate text-[0.8125rem] text-success">{names(r.released_fields)}</TableCell>
                      <TableCell className="max-w-56 truncate text-[0.8125rem] text-destructive">{names(r.withheld_fields)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(r.created_at as number)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
