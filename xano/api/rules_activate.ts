import { query, input, s, ref, inp, c, expr, col, withFilters, fl, auth, type InferRow } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { disclosureRules } from "../tables/disclosure_rules.js";

type PolicyResult = { version: number; rules: InferRow<typeof disclosureRules>[] };

// Make a policy version active (admin only). Proves the versioning story: flip the
// active version and what records/releasable and agent/retrieve disclose changes,
// with the returned rule_version following. Each rule's `active` is set to whether
// its version matches the requested one, so exactly one version stays live.
export const rulesActivate = query({
  name: "rules/activate",
  verb: "POST",
  apiGroup: api,
  auth: users,
  input: { version: input.int({ required: true }) },
  stack: [
    s.db.get_by_id({ table: users, id: auth("id"), output: ["id", "role"], as: "caller" }),
    s.precondition({
      expr: expr(ref("caller.role"), "=", c.text("admin")),
      error: c.text("Only an admin can change the active policy version."),
      error_type: "accessdenied",
    }),
    s.db.has({ table: disclosureRules, fieldName: "version", fieldValue: inp("version"), as: "exists" }),
    s.precondition({
      expr: expr(ref("exists"), "=", c.bool(true)),
      error: c.text("That policy version does not exist."),
      error_type: "notfound",
    }),
    s.db.query({ table: disclosureRules, as: "all_rules" }),
    s.foreach({
      list: ref("all_rules"),
      as: "rule",
      body: [
        s.db.edit({
          table: disclosureRules,
          fieldName: "id",
          fieldValue: ref("rule.id"),
          row: { active: withFilters(ref("rule.version"), fl.eq(inp("version"))) },
        }),
      ],
    }),
    s.db.query({
      table: disclosureRules,
      where: expr(col("active"), "=", c.bool(true)),
      sort: [{ sortBy: "sensitivity", dir: "asc" }],
      as: "active_rules",
    }),
  ],
  response: { version: ref("active_rules.0.version"), rules: ref("active_rules") },
  responseShape: null as unknown as PolicyResult,
});
