import { f, table } from "@xanots/sdk";
import { records } from "./records.js";
import { user } from "./user.js";

// One row per retrieval, written by the shared `log_access` function that both the
// human endpoint and the agent endpoint call. caller_kind records WHICH surface the
// read came through (a person's direct read, or the AI agent surface); caller_id is
// always the person who triggered it, so an agent read is still tied to a human.
export const access_log = table({
  name: "access_log",
  description: "Audit trail of record retrievals. One row per read, human or agent.",
  schema: {
    record_id: f.tableRef(records, { required: true }),
    caller_id: f.tableRef(user, { required: true, description: "The person who triggered the read." }),
    caller_kind: f.enum(["human", "agent"], { required: true, description: "The surface the read came through." }),
    rule_version: f.int({ required: true, description: "The disclosure policy version that decided this read." }),
    released_fields: f.json({ description: "Names of fields released in full." }),
    withheld_fields: f.json({ description: "Names of fields withheld entirely." }),
    decision_summary: f.text({ description: "Human-readable summary of the decision." }),
  },
  index: [
    { type: "btree", fields: [{ name: "record_id", op: "asc" }] },
    { type: "btree", fields: [{ name: "caller_kind", op: "asc" }] },
  ],
  seed: [
    { record_id: 1, caller_id: 2, caller_kind: "agent", rule_version: 2, released_fields: ["Program summary", "Published allocations"], withheld_fields: ["Negotiation notes"], decision_summary: "Released 2, redacted 1, withheld 1 (policy v2, role agent)" },
    { record_id: 1, caller_id: 1, caller_kind: "human", rule_version: 2, released_fields: ["Program summary", "Published allocations", "Contractor names"], withheld_fields: [], decision_summary: "Released 3, redacted 1, withheld 0 (policy v2, role clerk)" },
    { record_id: 5, caller_id: 2, caller_kind: "agent", rule_version: 2, released_fields: ["Sampling sites", "Summary findings"], withheld_fields: ["Property owner contacts"], decision_summary: "Released 2, redacted 1, withheld 1 (policy v2, role agent)" },
    { record_id: 9, caller_id: 1, caller_kind: "human", rule_version: 2, released_fields: ["Permit categories", "Approval dates", "Applicant addresses"], withheld_fields: [], decision_summary: "Released 3, redacted 1, withheld 0 (policy v2, role clerk)" },
    { record_id: 3, caller_id: 3, caller_kind: "human", rule_version: 2, released_fields: ["Policy title", "Retention window", "Exemption rationale", "Officer identifiers"], withheld_fields: [], decision_summary: "Released 4, redacted 0, withheld 0 (policy v2, role admin)" },
    { record_id: 13, caller_id: 2, caller_kind: "agent", rule_version: 2, released_fields: ["Incident types", "Average response time"], withheld_fields: ["Caller phone numbers"], decision_summary: "Released 2, redacted 0, withheld 1 (policy v2, role agent)" },
  ],
});
