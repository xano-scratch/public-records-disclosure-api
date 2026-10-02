import { cmp, col, expr, guard, inp, input, query, ref, s } from "@xanots/sdk";
import { access_log } from "../../table/access_log.js";
import { records } from "../../table/records.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// The access trail. Clerks and admins only — the agent cannot read who asked for
// what. Each row is enriched with the record title and the caller's name so the
// trail reads without a second lookup.
export const audit_list = query({
  name: "audit",
  verb: "GET",
  apiGroup: DisclosureApi,
  auth: user,
  description: "List the record-access audit trail (clerk or admin).",
  input: {
    caller_kind: input.text(),
    page: input.int({ default: 1 }),
    per_page: input.int({ default: 100 }),
  },
  stack: [
    ...guard.role(user, ["clerk", "admin"]),
    s.db.query({
      table: access_log,
      where: cmp(col("caller_kind"), "=", inp("caller_kind"), { ignoreEmpty: true }),
      bind: [
        { table: records, as: "rec", join: "left", where: expr(col("record_id"), "=", col("rec.id")) },
        { table: user, as: "usr", join: "left", where: expr(col("caller_id"), "=", col("usr.id")) },
      ],
      eval: [
        { name: "rec.title", as: "record_title" },
        { name: "usr.name", as: "caller_name" },
      ],
      sort: [{ sortBy: "created_at", dir: "desc" }],
      paging: { page: inp("page"), per_page: inp("per_page"), metadata: false },
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
