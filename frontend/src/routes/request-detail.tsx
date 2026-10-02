import { ArrowLeft, ChevronRight, FileText, Layers } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/states";
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
import * as api from "@/lib/api";
import { formatDateTime, statusMeta, titleCase } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

export default function RequestDetail() {
  const { requestId } = useParams();
  const id = Number(requestId);
  const { role } = useSession();
  const canManage = role === "clerk" || role === "admin";
  const navigate = useNavigate();

  const state = useAsync(() => api.getRequest(id), [id]);
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  async function changeStatus(status: api.RequestStatus) {
    setBusy(true);
    try {
      await api.setRequestStatus(id, status);
      toast.success(`Request marked ${status}.`);
      state.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the status.");
    } finally {
      setBusy(false);
      setConfirmClose(false);
    }
  }

  const detail = state.data as { request?: Record<string, unknown>; records?: Record<string, unknown>[] } | null;
  const request = detail?.request;
  const records = detail?.records ?? [];
  const status = request ? String(request.status) : "";

  return (
    <div className="space-y-5">
      <Link to="/requests" className="inline-flex items-center gap-1 text-[0.8125rem] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Requests
      </Link>

      {state.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : !request ? (
        <EmptyState icon={FileText} title="Request not found" />
      ) : (
        <>
          <Card className="gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="font-mono text-xs text-muted-foreground">{String(request.reference)}</div>
                <h1 className="text-lg font-semibold tracking-tight">{String(request.subject)}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{titleCase(String(request.requester_type))} requester</span>
                  <span>·</span>
                  <span>opened {formatDateTime(request.created_at as number)}</span>
                </div>
              </div>
              <Badge variant={statusMeta(status).variant}>{statusMeta(status).label}</Badge>
            </div>

            {canManage ? (
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button size="sm" variant="outline" disabled={busy || status !== "open"} onClick={() => changeStatus("fulfilled")}>
                  Mark fulfilled
                </Button>
                <Button size="sm" variant="outline" disabled={busy || status === "closed"} onClick={() => setConfirmClose(true)}>
                  Close request
                </Button>
                {status === "closed" ? <span className="self-center text-xs text-muted-foreground">Closed requests are final.</span> : null}
              </div>
            ) : null}
          </Card>

          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Layers className="size-4 text-muted-foreground" /> Records ({records.length})
            </h2>
            {records.length === 0 ? (
              <EmptyState icon={Layers} title="No records attached to this request" />
            ) : (
              <div className="grid gap-2">
                {records.map((rec) => (
                  <button
                    key={String(rec.id)}
                    onClick={() => navigate(`/records/${String(rec.id)}`)}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.8125rem] font-medium">{String(rec.title)}</span>
                        <Badge variant="outline" className="font-normal">
                          {titleCase(String(rec.record_type))}
                        </Badge>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{String(rec.summary)}</div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                      Retrieve <ChevronRight className="size-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this request?</AlertDialogTitle>
            <AlertDialogDescription>
              A closed request is final and cannot be reopened or changed. This does not delete any records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => changeStatus("closed")} disabled={busy}>
              Close request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
