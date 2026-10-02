import { FileText, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as api from "@/lib/api";
import { formatDateTime, statusMeta, titleCase } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

const STATUSES = ["open", "fulfilled", "closed"];
const TYPES = ["public", "press", "internal"];

export default function Requests() {
  const { role } = useSession();
  const canCreate = role === "clerk" || role === "admin";
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const q = sp.get("q") ?? "";
  const status = sp.get("status") ?? "";
  const rt = sp.get("rt") ?? "";
  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);

  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== q) patch({ q: search || null, page: null });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function patch(next: Record<string, string | null>) {
    const merged = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "") merged.delete(k);
      else merged.set(k, v);
    }
    setSp(merged, { replace: true });
  }

  const state = useAsync(() => api.listRequests({ q, status, requester_type: rt, page, per_page: 10 }), [q, status, rt, page]);

  const [createOpen, setCreateOpen] = useState(false);

  const page_data = state.data as (Record<string, unknown> & { items?: api.RequestRow[] }) | null;
  const items = (page_data?.items ?? []) as api.RequestRow[];
  const nextPage = page_data?.nextPage as number | null | undefined;
  const itemsTotal = page_data?.itemsTotal as number | undefined;
  const filtered = Boolean(q || status || rt);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Disclosure requests"
        description="FOIA-style requests. Open one to see its records, then retrieve a record to run the disclosure rules."
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New request
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject"
            className="h-8 pl-8"
          />
        </div>
        <Select value={status || "all"} onValueChange={(v) => patch({ status: v === "all" ? null : v, page: null })}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {titleCase(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rt || "all"} onValueChange={(v) => patch({ rt: v === "all" ? null : v, page: null })}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Requester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All requesters</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {titleCase(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        {state.loading ? (
          <div className="p-3">
            <TableSkeleton rows={8} cols={4} />
          </div>
        ) : state.error ? (
          <div className="p-6">
            <ErrorState message={state.error} onRetry={state.reload} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title={filtered ? "No requests match those filters" : "No requests yet"}
              description={filtered ? "Clear the filters to see every request." : undefined}
              action={
                filtered ? (
                  <Button variant="outline" size="sm" onClick={() => setSp(new URLSearchParams(), { replace: true })}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Reference</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-28">Requester</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-40">Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => {
                const r = row as unknown as Record<string, unknown>;
                const st = statusMeta(String(r.status));
                return (
                  <TableRow
                    key={String(r.id)}
                    className="cursor-pointer"
                    onClick={() => navigate(`/requests/${String(r.id)}`)}
                  >
                    <TableCell className="font-mono text-xs">{String(r.reference)}</TableCell>
                    <TableCell className="font-medium">{String(r.subject)}</TableCell>
                    <TableCell className="text-muted-foreground">{titleCase(String(r.requester_type))}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(r.created_at as number)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {!state.loading && !state.error && items.length > 0 ? (
        <div className="flex items-center justify-between text-[0.8125rem] text-muted-foreground">
          <span className="tabular-nums">{itemsTotal != null ? `${itemsTotal} requests` : ""}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => patch({ page: String(page - 1) })}>
              Previous
            </Button>
            <span className="tabular-nums">Page {page}</span>
            <Button variant="outline" size="sm" disabled={nextPage == null} onClick={() => patch({ page: String(page + 1) })}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {canCreate ? (
        <CreateRequestDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => state.reload()} />
      ) : null}
    </div>
  );
}

function CreateRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [reference, setReference] = useState("");
  const [subject, setSubject] = useState("");
  const [requesterType, setRequesterType] = useState("public");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setReference("");
      setSubject("");
      setRequesterType("public");
      setError(null);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.createRequest({ reference, subject, requester_type: requesterType });
      toast.success("Request opened.");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New disclosure request</DialogTitle>
          <DialogDescription>Open a new request. It starts in the open state.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="REQ-2026-009" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What the request is for" required />
          </div>
          <div className="space-y-1.5">
            <Label>Requester type</Label>
            <Select value={requesterType} onValueChange={setRequesterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {titleCase(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-[0.8125rem] text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Opening…" : "Open request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
