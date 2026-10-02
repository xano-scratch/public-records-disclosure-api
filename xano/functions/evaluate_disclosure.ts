import { c, col, defineFunction, expr, fl, guard, inp, input, ref, s, withFilters } from "@xanots/sdk";
import { disclosure_rules } from "../table/disclosure_rules.js";
import { record_fields } from "../table/record_fields.js";

// THE one governed rule. Given a record and a caller role, it reads the ACTIVE
// disclosure policy and splits the record's fields into released / redacted /
// withheld. Both the human endpoint (records/retrieve) and the AI-agent endpoint
// (agent/retrieve) call this, so a clerk asking by hand and an agent asking in
// plain language get an identical, auditable answer for the same record and role.
//
// It is policy-as-data: each result set is the record's fields INNER-JOINed to the
// active disclosure_rules rows whose (sensitivity, role, action) matches. A field's
// raw value is only ever selected for the "release" set, so a redacted or withheld
// value never leaves the backend.
export const evaluate_disclosure = defineFunction({
  name: "evaluate_disclosure",
  description: "Apply the active disclosure policy to a record's fields for a caller role.",
  input: {
    record_id: input.int({ required: true }),
    role: input.enum(["clerk", "agent", "admin"], { required: true }),
  },
  stack: [
    // The active policy version (its rows all share one version number).
    s.db.query({
      table: disclosure_rules,
      where: expr(col("active"), "=", c.bool(true)),
      sort: [{ sortBy: "version", dir: "desc" }],
      returnType: "single",
      output: ["version"],
      as: "active_policy",
    }),
    guard.found("active_policy", { message: "No active disclosure policy is configured." }),

    // Released: fields whose (sensitivity, role) maps to "release" under the active
    // policy. Only this set selects the raw field_value.
    s.db.query({
      table: record_fields,
      where: [
        expr(col("record_id"), "=", inp("record_id")),
        expr(col("rule.active"), "=", c.bool(true)),
        expr(col("rule.role"), "=", inp("role")),
        expr(col("rule.action"), "=", c.text("release")),
      ],
      bind: [{ table: disclosure_rules, as: "rule", join: "inner", where: expr(col("sensitivity"), "=", col("rule.sensitivity")) }],
      output: ["field_name", "field_value", "sensitivity"],
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "released",
    }),
    // Redacted: acknowledged, value NOT selected.
    s.db.query({
      table: record_fields,
      where: [
        expr(col("record_id"), "=", inp("record_id")),
        expr(col("rule.active"), "=", c.bool(true)),
        expr(col("rule.role"), "=", inp("role")),
        expr(col("rule.action"), "=", c.text("redact")),
      ],
      bind: [{ table: disclosure_rules, as: "rule", join: "inner", where: expr(col("sensitivity"), "=", col("rule.sensitivity")) }],
      output: ["field_name", "sensitivity"],
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "redacted",
    }),
    // Withheld: not returned, value NOT selected.
    s.db.query({
      table: record_fields,
      where: [
        expr(col("record_id"), "=", inp("record_id")),
        expr(col("rule.active"), "=", c.bool(true)),
        expr(col("rule.role"), "=", inp("role")),
        expr(col("rule.action"), "=", c.text("withhold")),
      ],
      bind: [{ table: disclosure_rules, as: "rule", join: "inner", where: expr(col("sensitivity"), "=", col("rule.sensitivity")) }],
      output: ["field_name", "sensitivity"],
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "withheld",
    }),

    // Counts.
    s.set_var("released_count", ref("released"), { asFilters: [fl.count()] }),
    s.set_var("redacted_count", ref("redacted"), { asFilters: [fl.count()] }),
    s.set_var("withheld_count", ref("withheld"), { asFilters: [fl.count()] }),

    // Field-name lists for the audit row.
    s.array.map({ source: ref("released"), transform: ref("$this.field_name"), as: "released_names" }),
    s.array.map({ source: ref("withheld"), transform: ref("$this.field_name"), as: "withheld_names" }),

    // A human-readable one-line summary of the decision.
    s.set_var(
      "decision_summary",
      withFilters(
        c.text("Released "),
        fl.concat(ref("released_count")),
        fl.concat(c.text(", redacted ")),
        fl.concat(ref("redacted_count")),
        fl.concat(c.text(", withheld ")),
        fl.concat(ref("withheld_count")),
        fl.concat(c.text(" (policy v")),
        fl.concat(ref("active_policy.version")),
        fl.concat(c.text(", role ")),
        fl.concat(inp("role")),
        fl.concat(c.text(")")),
      ),
    ),
  ],
  response: {
    rule_version: ref("active_policy.version"),
    released: ref("released"),
    redacted: ref("redacted"),
    withheld: ref("withheld"),
    released_count: ref("released_count"),
    redacted_count: ref("redacted_count"),
    withheld_count: ref("withheld_count"),
    released_names: ref("released_names"),
    withheld_names: ref("withheld_names"),
    decision_summary: ref("decision_summary"),
  },
});
