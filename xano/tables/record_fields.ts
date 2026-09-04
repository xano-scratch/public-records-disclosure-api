import { table, f } from "@xanots/sdk";
import { records } from "./records.js";

// One field of a record, classified by sensitivity. The disclosure rule reads
// this classification (plus the caller's role and the active policy) to decide
// release / redact / withhold, the raw field_value never leaves the backend
// unless the rule releases it.
export const recordFields = table({
  name: "record_fields",
  schema: {
    record_id: f.tableRef(records, { required: true }),
    field_name: f.text({ required: true }),
    field_value: f.text({ required: true }),
    sensitivity: f.enum(["public", "restricted", "sealed"], { required: true }),
  },
});
