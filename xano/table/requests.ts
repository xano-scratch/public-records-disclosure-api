import { f, table } from "@xanots/sdk";
import { user } from "./user.js";

// A public-records disclosure request (FOIA-style). Holds the ask and its status;
// the records attached to it carry the actual fields the disclosure rules act on.
export const requests = table({
  name: "requests",
  description: "A public-records disclosure request.",
  schema: {
    reference: f.text({ required: true, description: "Public tracking reference." }),
    subject: f.text({ required: true, description: "What the request is for." }),
    requester_type: f.enum(["public", "press", "internal"], {
      required: true,
      description: "Who filed the request.",
    }),
    status: f.enum(["open", "fulfilled", "closed"], {
      required: true,
      description: "Lifecycle state of the request.",
    }),
    opened_by: f.tableRef(user, { description: "The staff member who opened it." }),
  },
  index: [
    { type: "btree|unique", fields: [{ name: "reference", op: "asc" }] },
    { type: "btree", fields: [{ name: "status", op: "asc" }] },
    { type: "btree", fields: [{ name: "requester_type", op: "asc" }] },
  ],
  seed: [
    { reference: "REQ-2026-001", subject: "Transportation budget and contractor payments", requester_type: "public", status: "open", opened_by: 1 },
    { reference: "REQ-2026-002", subject: "Police body-camera footage retention policy", requester_type: "press", status: "open", opened_by: 1 },
    { reference: "REQ-2026-003", subject: "Water quality inspections, east district", requester_type: "public", status: "fulfilled", opened_by: 1 },
    { reference: "REQ-2026-004", subject: "Procurement correspondence, parks department", requester_type: "press", status: "open", opened_by: 3 },
    { reference: "REQ-2026-005", subject: "Building permit approvals, first quarter", requester_type: "public", status: "closed", opened_by: 1 },
    { reference: "REQ-2026-006", subject: "Internal audit of overtime claims", requester_type: "internal", status: "open", opened_by: 3 },
    { reference: "REQ-2026-007", subject: "School meal vendor contracts", requester_type: "public", status: "fulfilled", opened_by: 1 },
    { reference: "REQ-2026-008", subject: "Emergency response times, downtown", requester_type: "press", status: "open", opened_by: 1 },
  ],
});
