import { table, f } from "@xanots/sdk";
import { records } from "./records.js";
import { users } from "./users.js";

// The audit trail: one row per retrieval, whether the caller was a human clerk or
// an AI agent. Records the deciding rule version and which fields were released
// versus withheld, so a reviewer can reconstruct every disclosure decision.
export const accessLog = table({
  name: "access_log",
  schema: {
    record_id: f.tableRef(records, { required: true }),
    caller_id: f.tableRef(users, { required: true }),
    caller_kind: f.enum(["human", "agent"], { required: true }),
    rule_version: f.int({ required: true }),
    released_fields: f.json(),
    withheld_fields: f.json(),
    decision_summary: f.text(),
  },
});
