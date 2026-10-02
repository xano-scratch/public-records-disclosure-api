import { c, defineFunction, inp, input, ref, s } from "@xanots/sdk";
import { access_log } from "../table/access_log.js";

// The one audit writer. Both the human and the agent retrieval endpoints call it,
// so every read lands one row in access_log no matter which surface it came
// through. caller_id is always the person who triggered the read (auth("id")),
// even for an agent read, so the trail ties an agent action back to a human.
export const log_access = defineFunction({
  name: "log_access",
  description: "Write one audit row for a record retrieval.",
  input: {
    record_id: input.int({ required: true }),
    caller_id: input.int({ required: true }),
    caller_kind: input.enum(["human", "agent"], { required: true }),
    rule_version: input.int({ required: true }),
    released_fields: input.json(),
    withheld_fields: input.json(),
    decision_summary: input.text(),
  },
  stack: [
    s.db.add({
      table: access_log,
      row: {
        record_id: inp("record_id"),
        caller_id: inp("caller_id"),
        caller_kind: inp("caller_kind"),
        rule_version: inp("rule_version"),
        released_fields: inp("released_fields"),
        withheld_fields: inp("withheld_fields"),
        decision_summary: inp("decision_summary"),
      },
      as: "entry",
    }),
  ],
  response: ref("entry"),
});
