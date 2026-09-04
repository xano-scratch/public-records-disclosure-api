import { table, f } from "@xanots/sdk";
import { users } from "./users.js";

// A public-records request (FOIA-style). Holds only header metadata, never the
// disclosed field values (those live in record_fields).
export const requests = table({
  name: "requests",
  schema: {
    reference: f.text({ required: true }),
    subject: f.text({ required: true }),
    requester_type: f.enum(["public", "press", "internal"], { required: true }),
    status: f.enum(["open", "fulfilled", "closed"], { required: true }),
    opened_by: f.tableRef(users, { required: true }),
  },
});
