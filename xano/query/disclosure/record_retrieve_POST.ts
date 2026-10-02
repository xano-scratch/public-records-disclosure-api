import { auth, c, guard, inp, input, query, ref, s } from "@xanots/sdk";
import { evaluate_disclosure } from "../../functions/evaluate_disclosure.js";
import { log_access } from "../../functions/log_access.js";
import { records } from "../../table/records.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// The human path. Retrieve a record's releasable fields under the active policy for
// the CALLER's own role, then log the access. This is a POST, not a GET, because
// every retrieval writes one audit row — the point of the domain. It calls the SAME
// evaluate_disclosure rule the agent endpoint calls, so the two cannot diverge.
export const record_retrieve = query({
  name: "records/retrieve",
  verb: "POST",
  apiGroup: DisclosureApi,
  auth: user,
  description: "Retrieve a record's releasable fields for the caller's role; logs the access.",
  input: {
    record_id: input.int({ required: true }),
  },
  stack: [
    // Who is asking, and at what clearance.
    s.db.get({
      table: user,
      fieldValue: auth("id"),
      output: ["id", "name", "role"],
      as: "caller",
    }),
    guard.found("caller", { errorType: "unauthorized", message: "Your session is not valid." }),
    // The record must exist.
    s.db.get({
      table: records,
      fieldValue: inp("record_id"),
      as: "record",
    }),
    guard.found("record", { message: "No such record." }),
    // Apply the one shared rule for the caller's role.
    s.function.run({
      fn: evaluate_disclosure,
      input: { record_id: inp("record_id"), role: ref("caller.role") },
      as: "eval",
    }),
    // Write the audit row through the one shared writer.
    s.function.run({
      fn: log_access,
      input: {
        record_id: inp("record_id"),
        caller_id: auth("id"),
        caller_kind: c.text("human"),
        rule_version: ref("eval.rule_version"),
        released_fields: ref("eval.released_names"),
        withheld_fields: ref("eval.withheld_names"),
        decision_summary: ref("eval.decision_summary"),
      },
      as: "logged",
    }),
  ],
  response: {
    record: ref("record"),
    role: ref("caller.role"),
    rule_version: ref("eval.rule_version"),
    released: ref("eval.released"),
    redacted: ref("eval.redacted"),
    withheld: ref("eval.withheld"),
    released_count: ref("eval.released_count"),
    redacted_count: ref("eval.redacted_count"),
    withheld_count: ref("eval.withheld_count"),
  },
});
