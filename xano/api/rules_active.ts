import { query, s, ref, c, expr, col, withFilters, fl, type InferRow } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { disclosureRules } from "../tables/disclosure_rules.js";

type PolicyResult = { version: number; rules: InferRow<typeof disclosureRules>[] };

// The policy a reviewer can read to understand any disclosure: the active version
// and its per-sensitivity (min_role, action) rules.
export const rulesActive = query({
  name: "rules/active",
  verb: "GET",
  apiGroup: api,
  auth: users,
  stack: [
    s.db.query({
      table: disclosureRules,
      where: expr(col("active"), "=", c.bool(true)),
      sort: [{ sortBy: "sensitivity", dir: "asc" }],
      as: "rows",
    }),
    s.precondition({
      expr: expr(withFilters(ref("rows"), fl.count()), ">", c.int(0)),
      error: c.text("No active policy is configured."),
      error_type: "standard",
    }),
  ],
  response: { version: ref("rows.0.version"), rules: ref("rows") },
  // The numeric-index ref for `version` types as unknown; pin the shape so the
  // frontend gets `{ version: number; rules: RuleRow[] }`.
  responseShape: null as unknown as PolicyResult,
});
