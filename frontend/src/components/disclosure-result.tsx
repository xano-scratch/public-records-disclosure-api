import { Eye, EyeOff, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { sensitivityMeta } from "@/lib/format";

type Row = Record<string, unknown>;

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function CountPill({ label, count, variant }: { label: string; count: number; variant: "success" | "warning" | "destructive" }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={variant} className="tabular-nums">
        {count}
      </Badge>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Field({ row, kind }: { row: Row; kind: "released" | "redacted" | "withheld" }) {
  const sens = sensitivityMeta(str(row.sensitivity));
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2">
      <div className="min-w-0 space-y-0.5">
        <div className="text-[0.8125rem] font-medium">{str(row.field_name)}</div>
        {kind === "released" ? (
          <div className="text-[0.8125rem] text-muted-foreground">{str(row.field_value)}</div>
        ) : kind === "redacted" ? (
          <div className="font-mono text-[0.8125rem] text-warning">redacted — value withheld for this role</div>
        ) : (
          <div className="font-mono text-[0.8125rem] text-destructive">withheld — not disclosed for this role</div>
        )}
      </div>
      <Badge variant={sens.variant} className="shrink-0">
        {sens.label}
      </Badge>
    </div>
  );
}

function Section({ title, icon: Icon, rows, kind }: { title: string; icon: typeof Eye; rows: Row[]; kind: "released" | "redacted" | "withheld" }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
        <span className="tabular-nums">({rows.length})</span>
      </div>
      <div className="divide-y">
        {rows.map((row, i) => (
          <Field key={i} row={row} kind={kind} />
        ))}
      </div>
    </div>
  );
}

export function DisclosureResult({
  version,
  released,
  redacted,
  withheld,
}: {
  version: unknown;
  released: Row[];
  redacted: Row[];
  withheld: Row[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border bg-card px-3 py-2.5">
        <CountPill label="released" count={released.length} variant="success" />
        <CountPill label="redacted" count={redacted.length} variant="warning" />
        <CountPill label="withheld" count={withheld.length} variant="destructive" />
        <div className="ms-auto text-xs text-muted-foreground">
          decided by policy <span className="font-medium text-foreground">v{str(version)}</span>
        </div>
      </div>
      <Section title="Released" icon={Eye} rows={released} kind="released" />
      <Section title="Redacted" icon={ShieldAlert} rows={redacted} kind="redacted" />
      <Section title="Withheld" icon={EyeOff} rows={withheld} kind="withheld" />
    </div>
  );
}
