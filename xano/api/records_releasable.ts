import { query, input, s, ref, inp, c, expr, auth } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { records } from "../tables/records.js";
import { evaluateDisclosure } from "../functions/evaluate_disclosure.js";
import { logAccess } from "../functions/log_access.js";

// The HUMAN read path. Resolves the caller's role, applies the SAME shared
// disclosure rule the agent path uses, and writes one audit row (caller_kind:
// human). record_id rides the path (it addresses one record).
export const recordsReleasable = query({
  name: "records/releasable/{record_id}",
  verb: "GET",
  apiGroup: api,
  auth: users,
  input: { record_id: input.int({ required: true }) },
  stack: [
    s.db.get_by_id({ table: users, id: auth("id"), output: ["id", "role", "display_name"], as: "caller" }),
    // Field-match get binds null (not 400) if the id names no row, so a bad id
    // fails cleanly as a 404 below.
    s.db.get({ table: records, fieldName: "id", fieldValue: inp("record_id"), as: "rec" }),
    s.precondition({
      expr: expr(ref("rec", { safe: true }), "!=", c.null()),
      error: c.text("Record not found."),
      error_type: "notfound",
    }),
    s.function.run({
      fn: evaluateDisclosure,
      input: { record_id: inp("record_id"), role: ref("caller.role") },
      as: "disc",
    }),
    s.function.run({
      fn: logAccess,
      input: {
        record_id: inp("record_id"),
        caller_id: auth("id"),
        caller_kind: c.text("human"),
        rule_version: ref("disc.rule_version"),
        released_fields: ref("disc.released_fields"),
        withheld_fields: ref("disc.not_released_fields"),
        decision_summary: ref("disc.decision_summary"),
      },
      as: "logged",
    }),
  ],
  response: {
    record: {
      id: ref("rec.id"),
      title: ref("rec.title"),
      record_type: ref("rec.record_type"),
      summary: ref("rec.summary"),
    },
    caller_role: ref("caller.role"),
    disclosure: ref("disc"),
  },
});
