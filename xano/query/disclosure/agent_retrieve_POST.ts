import { auth, c, expr, fl, guard, inp, input, query, ref, s } from "@xanots/sdk";
import { record_resolver } from "../../agents/record_resolver.js";
import { evaluate_disclosure } from "../../functions/evaluate_disclosure.js";
import { log_access } from "../../functions/log_access.js";
import { records } from "../../table/records.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// The Play-4 surface. The AI agent resolves a plain-language ask to one record id,
// then the endpoint runs the SAME evaluate_disclosure rule as the human path — but
// at the FIXED least-privileged "agent" clearance, no matter who triggered it. So
// an admin triggering the agent still cannot make it disclose sealed data. The
// access is logged with caller_kind "agent" and the triggering person's id.
export const agent_retrieve = query({
  name: "agent/retrieve",
  verb: "POST",
  apiGroup: DisclosureApi,
  auth: user,
  description: "Agent retrieval: resolve a plain-language ask to a record, apply the rule at agent clearance, log it.",
  input: {
    q: input.text({ required: true }),
  },
  stack: [
    // Hand the agent a bounded catalog of records as JSON so it can only pick a real id.
    s.db.query({
      table: records,
      output: ["id", "title", "summary"],
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "catalog_rows",
    }),
    s.set_var("catalog_json", ref("catalog_rows"), { asFilters: [fl.json_encode()] }),
    // Resolve the natural-language request to a single record id (structured output).
    s.ai.agent.run({
      agent: record_resolver,
      args: { q: inp("q"), catalog: ref("catalog_json") },
      as: "run",
    }),
    // A resolved id of 0 means no match; guard it before any lookup (a 0 id to
    // db.get answers HTTP 400, so the 404 below would never run).
    s.precondition({
      expr: expr(ref("run.result.record_id"), ">", c.int(0)),
      error_type: "notfound",
      error: c.text("The agent found no matching record for that request."),
    }),
    s.db.get({
      table: records,
      fieldValue: ref("run.result.record_id"),
      as: "record",
    }),
    guard.found("record", { message: "The agent found no matching record for that request." }),
    // The SAME rule as the human path, pinned to the least-privileged agent clearance.
    s.function.run({
      fn: evaluate_disclosure,
      input: { record_id: ref("run.result.record_id"), role: c.text("agent") },
      as: "eval",
    }),
    // Same audit writer; caller_id is the person who triggered the agent.
    s.function.run({
      fn: log_access,
      input: {
        record_id: ref("run.result.record_id"),
        caller_id: auth("id"),
        caller_kind: c.text("agent"),
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
    role: c.text("agent"),
    resolved_record_id: ref("run.result.record_id"),
    rationale: ref("run.result.rationale"),
    rule_version: ref("eval.rule_version"),
    released: ref("eval.released"),
    redacted: ref("eval.redacted"),
    withheld: ref("eval.withheld"),
    released_count: ref("eval.released_count"),
    redacted_count: ref("eval.redacted_count"),
    withheld_count: ref("eval.withheld_count"),
  },
});
