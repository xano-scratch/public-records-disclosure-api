import { Check, EyeOff, Lock } from "lucide-react";

import type { Disclosure, DisclosedField } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SENSITIVITY: Record<string, "muted" | "warning" | "danger"> = {
  public: "muted",
  restricted: "warning",
  sealed: "danger",
};

function ActionBadge({ action }: { action: string }) {
  if (action === "release")
    return (
      <Badge variant="success">
        <Check /> Released
      </Badge>
    );
  if (action === "redact")
    return (
      <Badge variant="warning">
        <EyeOff /> Redacted
      </Badge>
    );
  return (
    <Badge variant="danger">
      <Lock /> Withheld
    </Badge>
  );
}

function FieldValue({ field }: { field: DisclosedField }) {
  if (field.action === "release")
    return <span className="font-mono text-sm text-foreground">{field.value}</span>;
  if (field.action === "redact")
    return (
      <span className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground">
        <span className="rounded bg-amber-500/20 px-2 py-0.5 tracking-widest text-amber-300/70 select-none">
          ██████████
        </span>
        redacted for this role
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground italic">
      withheld (the value never leaves the server)
    </span>
  );
}

export function DisclosureFields({ disclosure }: { disclosure: Disclosure }) {
  if (!disclosure) return null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">policy v{disclosure.rule_version}</Badge>
        <Badge variant="success">{disclosure.released_count} released</Badge>
        <Badge variant="warning">{disclosure.redacted_count} redacted</Badge>
        <Badge variant="danger">{disclosure.withheld_count} withheld</Badge>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border">
        {disclosure.fields.map((field, i) => (
          <li
            key={i}
            className={cn(
              "grid grid-cols-1 gap-2 p-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center",
              field.action !== "release" && "bg-muted/30",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{field.field_name}</span>
              <Badge variant={SENSITIVITY[field.sensitivity] ?? "muted"}>{field.sensitivity}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <FieldValue field={field} />
              <ActionBadge action={field.action} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{disclosure.decision_summary}</p>
    </div>
  );
}
