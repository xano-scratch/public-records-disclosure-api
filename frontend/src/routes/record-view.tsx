import { ArrowLeft, FileText, ScrollText } from "lucide-react";
import { Link, useParams } from "react-router";

import { DisclosureResult } from "@/components/disclosure-result";
import { EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as api from "@/lib/api";
import { roleLabel, titleCase } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

export default function RecordView() {
  const { recordId } = useParams();
  const id = Number(recordId);
  const { role } = useSession();
  const state = useAsync(() => api.retrieveRecord(id), [id]);

  const result = state.data as Record<string, unknown> | null;
  const record = (result?.record ?? null) as Record<string, unknown> | null;

  return (
    <div className="space-y-5">
      <Link to="/requests" className="inline-flex items-center gap-1 text-[0.8125rem] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Requests
      </Link>

      {state.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : !record ? (
        <EmptyState icon={FileText} title="Record not found" />
      ) : (
        <>
          <Card className="gap-2 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">{String(record.title)}</h1>
                <p className="text-[0.8125rem] text-muted-foreground">{String(record.summary)}</p>
              </div>
              <Badge variant="outline" className="shrink-0 font-normal">
                {titleCase(String(record.record_type))}
              </Badge>
            </div>
            <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <ScrollText className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Shown under the active policy for your clearance ({role ? roleLabel(role) : "your role"}). This retrieval was
                written to the audit trail, exactly as an agent read would be.
              </span>
            </div>
          </Card>

          <DisclosureResult
            version={result?.rule_version}
            released={(result?.released ?? []) as Record<string, unknown>[]}
            redacted={(result?.redacted ?? []) as Record<string, unknown>[]}
            withheld={(result?.withheld ?? []) as Record<string, unknown>[]}
          />
        </>
      )}
    </div>
  );
}
