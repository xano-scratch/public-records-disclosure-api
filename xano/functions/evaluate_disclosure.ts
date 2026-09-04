import { defineFunction, input, s, ref, inp, c, expr, col, withFilters, fl } from "@xanots/sdk";
import { disclosureRules } from "../tables/disclosure_rules.js";
import { recordFields } from "../tables/record_fields.js";
import type { DisclosureResult } from "../types.js";

// THE single releasability rule. The human read path (records/releasable) and the
// AI-agent read path (agent/retrieve) both call this function, so a clerk asking
// by hand and an agent asking in plain language get an identical, auditable answer
// for the same record and role.
//
// Policy-as-data: it reads the ACTIVE disclosure_rules rows and applies them; the
// policy itself lives in auditable rows, not in this code. The applier is one
// small pure lambda over the already-fetched rows, no row-level security, all
// withholding computed here in the API layer.
export const evaluateDisclosure = defineFunction({
  name: "evaluate_disclosure",
  description:
    "The one shared releasability rule. Reads the active disclosure_rules and applies (sensitivity, caller role) -> release / redact / withhold per field. Never returns a raw value for a field it does not release.",
  input: {
    record_id: input.int({ required: true }),
    role: input.enum(["clerk", "agent", "admin"], { required: true }),
  },
  stack: [
    // The active policy: one rule row per sensitivity for the live version.
    s.db.query({
      table: disclosureRules,
      where: expr(col("active"), "=", c.bool(true)),
      sort: [{ sortBy: "sensitivity", dir: "asc" }],
      as: "rules",
    }),
    s.precondition({
      expr: expr(withFilters(ref("rules"), fl.count()), ">", c.int(0)),
      error: c.text("No active disclosure policy is configured."),
      error_type: "standard",
    }),
    // The record's classified fields.
    s.db.query({
      table: recordFields,
      where: expr(col("record_id"), "=", inp("record_id")),
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "fields",
    }),
    // Pure applier over the fetched rows. No DB access, no await, just the
    // (sensitivity, role) -> action mapping, with the raw value dropped for
    // anything not released.
    s.lambda({
      as: "result",
      code: ({ $var, $input }) => {
        const RANK: Record<string, number> = { agent: 0, clerk: 1, admin: 2 };
        const callerRank = RANK[$input.role] ?? 0;
        const ruleBySensitivity: Record<string, { min_role: string; action: string }> = {};
        for (const r of $var.rules) ruleBySensitivity[r.sensitivity] = r;

        const fields = ($var.fields ?? []).map((fld: { field_name: string; field_value: string; sensitivity: string }) => {
          const rule = ruleBySensitivity[fld.sensitivity];
          const minRank = rule ? (RANK[rule.min_role] ?? 99) : 99;
          const released = !!rule && callerRank >= minRank;
          const action = released ? "release" : rule ? rule.action : "withhold";
          return {
            field_name: fld.field_name,
            sensitivity: fld.sensitivity,
            action,
            value: action === "release" ? fld.field_value : null,
          };
        });

        const namesWhere = (actions: string[]) =>
          fields.filter((f: { action: string }) => actions.includes(f.action)).map((f: { field_name: string }) => f.field_name);
        const releasedCount = namesWhere(["release"]).length;
        const redactedCount = namesWhere(["redact"]).length;
        const withheldCount = namesWhere(["withhold"]).length;
        const version = $var.rules[0] ? $var.rules[0].version : 0;

        return {
          rule_version: version,
          fields,
          released_fields: namesWhere(["release"]),
          redacted_fields: namesWhere(["redact"]),
          withheld_fields: namesWhere(["withhold"]),
          not_released_fields: namesWhere(["redact", "withhold"]),
          released_count: releasedCount,
          redacted_count: redactedCount,
          withheld_count: withheldCount,
          decision_summary:
            "Released " + releasedCount + " of " + fields.length + " fields under policy v" + version +
            " (" + redactedCount + " redacted, " + withheldCount + " withheld).",
        };
      },
    }),
  ],
  response: ref("result"),
  // The lambda output is opaque to InferResponse; pin the shape so every caller
  // (and the frontend, through the query defs) types it.
  responseShape: null as unknown as DisclosureResult,
});
