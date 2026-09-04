import { query, s, ref, c, expr, or, auth } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { accessLog } from "../tables/access_log.js";
import { records } from "../tables/records.js";
import type { AuditRow } from "../types.js";

// The audit trail: every retrieval, human or agent, with the deciding rule
// version and released vs withheld field names. Clerks and admins only (an agent
// cannot read the trail of its own governed access). Rows are enriched with the
// caller name and record title from small side lookups.
export const auditQueries = query({
  name: "audit/queries",
  verb: "GET",
  apiGroup: api,
  auth: users,
  stack: [
    s.db.get_by_id({ table: users, id: auth("id"), output: ["id", "role"], as: "caller" }),
    s.precondition({
      expr: or(
        expr(ref("caller.role"), "=", c.text("admin")),
        expr(ref("caller.role"), "=", c.text("clerk")),
      ),
      error: c.text("Only clerks and admins can read the audit trail."),
      error_type: "accessdenied",
    }),
    s.db.query({ table: accessLog, sort: [{ sortBy: "created_at", dir: "desc" }], as: "logs" }),
    s.db.query({ table: users, output: ["id", "display_name", "role"], as: "all_users" }),
    s.db.query({ table: records, output: ["id", "title"], as: "all_records" }),
    s.lambda({
      as: "rows",
      code: ({ $var }) => {
        const uById: Record<string, { display_name: string; role: string }> = {};
        for (const u of $var.all_users) uById[u.id] = u;
        const rById: Record<string, { title: string }> = {};
        for (const r of $var.all_records) rById[r.id] = r;
        return ($var.logs ?? []).map((l: {
          id: number; created_at: number; record_id: number; caller_id: number;
          caller_kind: string; rule_version: number; released_fields: string[];
          withheld_fields: string[]; decision_summary: string;
        }) => ({
          id: l.id,
          created_at: l.created_at,
          record_id: l.record_id,
          record_title: rById[l.record_id] ? rById[l.record_id].title : "(unknown record)",
          caller_id: l.caller_id,
          caller_name: uById[l.caller_id] ? uById[l.caller_id].display_name : "(unknown caller)",
          caller_role: uById[l.caller_id] ? uById[l.caller_id].role : "?",
          caller_kind: l.caller_kind,
          rule_version: l.rule_version,
          released_fields: l.released_fields,
          withheld_fields: l.withheld_fields,
          decision_summary: l.decision_summary,
        }));
      },
    }),
  ],
  response: ref("rows"),
  responseShape: null as unknown as AuditRow[],
});
