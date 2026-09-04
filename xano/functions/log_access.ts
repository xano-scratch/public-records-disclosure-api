import { defineFunction, input, s, ref, inp } from "@xanots/sdk";
import { accessLog } from "../tables/access_log.js";

// THE single audit writer. Both read paths call it, so the trail records human and
// agent accesses identically: one row per retrieval, carrying the deciding rule
// version and the released vs withheld field names.
export const logAccess = defineFunction({
  name: "log_access",
  description:
    "The one shared audit writer both read paths call. Appends one access_log row per retrieval with the caller, caller kind (human or agent), rule version, and released vs withheld field names.",
  input: {
    record_id: input.int({ required: true }),
    caller_id: input.int({ required: true }),
    caller_kind: input.enum(["human", "agent"], { required: true }),
    rule_version: input.int({ required: true }),
    released_fields: input.list(input.text()),
    withheld_fields: input.list(input.text()),
    decision_summary: input.text(),
  },
  stack: [
    s.db.add({
      table: accessLog,
      row: {
        record_id: inp("record_id"),
        caller_id: inp("caller_id"),
        caller_kind: inp("caller_kind"),
        rule_version: inp("rule_version"),
        released_fields: inp("released_fields"),
        withheld_fields: inp("withheld_fields"),
        decision_summary: inp("decision_summary"),
      },
      as: "row",
    }),
  ],
  response: ref("row"),
});
