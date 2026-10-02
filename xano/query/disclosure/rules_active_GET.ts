import { c, col, expr, inp, input, query, ref, s } from "@xanots/sdk";
import { disclosure_rules } from "../../table/disclosure_rules.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// The policy currently deciding every disclosure: the active version's rows, so a
// reviewer can read exactly which (sensitivity, role) maps to which action. Every
// row shares one version number.
export const rules_active = query({
  name: "rules/active",
  verb: "GET",
  apiGroup: DisclosureApi,
  auth: user,
  description: "The active disclosure policy version and its per-cell actions.",
  input: {},
  stack: [
    s.db.query({
      table: disclosure_rules,
      where: expr(col("active"), "=", c.bool(true)),
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
