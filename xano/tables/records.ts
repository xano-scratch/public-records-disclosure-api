import { table, f } from "@xanots/sdk";
import { requests } from "./requests.js";

// A record attached to a request. The header is public; the sensitive content is
// broken out per field in record_fields so the disclosure rule can act field by
// field.
export const records = table({
  name: "records",
  schema: {
    request_id: f.tableRef(requests, { required: true }),
    title: f.text({ required: true }),
    record_type: f.enum(["report", "correspondence", "dataset"], { required: true }),
    summary: f.text({ required: true }),
  },
});
