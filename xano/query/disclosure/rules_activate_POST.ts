import { c, col, expr, fl, guard, inp, input, query, ref, s, withFilters } from "@xanots/sdk";
import { disclosure_rules } from "../../table/disclosure_rules.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// Switch which policy version is active. Admin only. This is the governed write
// that proves versioning: after it, every caller (human or agent) sees what the new
// version says. Guarded behind an AlertDialog in the UI; a real write with a toast.
export const rules_activate = query({
  name: "rules/activate",
  verb: "POST",
  apiGroup: DisclosureApi,
  auth: user,
  description: "Make a disclosure policy version active (admin only).",
  input: {
    version: input.int({ required: true }),
  },
  stack: [
    ...guard.role(user, "admin"),
    // The version must exist before we flip anything.
    s.db.query({
      table: disclosure_rules,
      where: expr(col("version"), "=", inp("version")),
      returnType: "exists",
      as: "version_exists",
    }),
    guard.require(expr(ref("version_exists"), "=", c.bool(true)), {
      errorType: "badrequest",
      message: "No such policy version.",
    }),
    // Set active on exactly the chosen version's rows, inactive on the rest, in one
    // bulk patch: each row's active becomes (its version == the requested version).
    s.db.query({ table: disclosure_rules, output: ["id", "version"], as: "all_rules" }),
    s.array.map({
      source: ref("all_rules"),
      transform: {
        id: ref("$this.id"),
        active: withFilters(ref("$this.version"), fl.eq(inp("version"))),
      },
      as: "patch_items",
    }),
    s.db.bulk.patch({ table: disclosure_rules, items: ref("patch_items") }),
    // Return the now-active rows.
    s.db.query({
      table: disclosure_rules,
      where: expr(col("active"), "=", c.bool(true)),
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "rows",
    }),
  ],
  response: {
    version: inp("version"),
    rules: ref("rows"),
  },
});
