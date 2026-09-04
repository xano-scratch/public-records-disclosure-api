import { query, input, s, ref, inp, c, expr, auth, withFilters, fl } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { records } from "../tables/records.js";
import { recordResolver } from "../agents/record_resolver.js";
import { evaluateDisclosure } from "../functions/evaluate_disclosure.js";
import { logAccess } from "../functions/log_access.js";

// The AI-AGENT read path (Play 4). The agent resolves a plain-language request to
// one record id, then the endpoint runs the SAME shared disclosure rule with the
// caller's role and writes one audit row (caller_kind: agent). Same rule, same
// audit, whether a human or an agent asks.
export const agentRetrieve = query({
  name: "agent/retrieve",
  verb: "POST",
  apiGroup: api,
  auth: users,
  input: { question: input.text({ required: true }) },
  stack: [
    s.db.get_by_id({ table: users, id: auth("id"), output: ["id", "role", "display_name"], as: "caller" }),
    // A bounded candidate catalog for the agent to route within.
    s.db.query({
      table: records,
      output: ["id", "title", "record_type", "summary"],
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "catalog_rows",
    }),
    s.set_var(
      "catalog",
      withFilters(
        ref("catalog_rows"),
        fl.map(({ $this }) => "#" + $this.id + ": " + $this.title + " (" + $this.record_type + ") - " + $this.summary),
        fl.join("\n"),
      ),
    ),
    s.ai.agent.run({
      agent: recordResolver,
      args: { question: inp("question"), catalog: ref("catalog") },
      as: "run",
    }),
    // Guard the resolved id BEFORE any lookup, the agent returns 0 for "no match"
    // and a 0 id fed to a by-id lookup would 400.
    s.precondition({
      expr: expr(ref("run.result.record_id"), ">", c.int(0)),
      error: c.text("The agent could not match that request to a record."),
      error_type: "notfound",
    }),
    s.db.get({ table: records, fieldName: "id", fieldValue: ref("run.result.record_id"), as: "rec" }),
    s.precondition({
      expr: expr(ref("rec", { safe: true }), "!=", c.null()),
      error: c.text("The agent selected a record that does not exist."),
      error_type: "notfound",
    }),
    s.function.run({
      fn: evaluateDisclosure,
      input: { record_id: ref("run.result.record_id"), role: ref("caller.role") },
      as: "disc",
    }),
    s.function.run({
      fn: logAccess,
      input: {
        record_id: ref("run.result.record_id"),
        caller_id: auth("id"),
        caller_kind: c.text("agent"),
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
    resolved_record_id: ref("run.result.record_id"),
    rationale: ref("run.result.rationale"),
    disclosure: ref("disc"),
  },
});
