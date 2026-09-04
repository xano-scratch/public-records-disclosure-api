import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";

import { api, type ReleasableResult, type RecordRow } from "@/lib/api";
import { ROLE_LABEL, type Session } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DisclosureFields } from "@/components/DisclosureFields";

export function RecordsScreen({ session, initialRecordId }: { session: Session; initialRecordId?: number }) {
  const [subject, setSubject] = useState("");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [selected, setSelected] = useState<number | null>(initialRecordId ?? null);
  const [result, setResult] = useState<ReleasableResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRecords() {
    const rows = await api.listRecords(session.token);
    setRecords(rows);
  }
  useEffect(() => {
    loadRecords().catch((e) => setError(String(e?.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected == null) return;
    setLoading(true);
    setError(null);
    api
      .getReleasable(session.token, selected)
      .then(setResult)
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [selected, session.token]);

  const filtered = records.filter(
    (r) =>
      subject.trim() === "" ||
      r.title.toLowerCase().includes(subject.toLowerCase()) ||
      r.summary.toLowerCase().includes(subject.toLowerCase()),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Records</CardTitle>
          <CardDescription>Pick a record to see what your role may access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Filter records…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <ul className="space-y-1.5">
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelected(r.id)}
                  className={
                    "flex w-full items-start gap-2 rounded-md border p-2.5 text-left text-sm transition-colors hover:bg-accent/40 " +
                    (selected === r.id ? "border-ring bg-accent/40" : "border-transparent")
                  }
                >
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{r.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      #{r.id} · {r.record_type}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-2 text-sm text-muted-foreground">No records.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {result ? result.record.title : "Select a record"}
            <Badge variant="secondary">
              viewing as {ROLE_LABEL[session.user.role]} ({session.user.role})
            </Badge>
          </CardTitle>
          <CardDescription>
            {result
              ? "The same rule the AI agent calls decided this. Change role to watch it change."
              : "Field-level disclosure is computed in the API layer for your role, not stored per row."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
          {loading && <p className="text-sm text-muted-foreground">Applying the disclosure policy…</p>}
          {result && !loading && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{result.record.summary}</p>
              <DisclosureFields disclosure={result.disclosure} />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`?role=agent&view=record&record=${result.record.id}`}>See the AI agent&apos;s view</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`?role=admin&view=record&record=${result.record.id}`}>See an admin&apos;s view</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
