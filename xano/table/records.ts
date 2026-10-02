import { f, table } from "@xanots/sdk";
import { requests } from "./requests.js";

// A document held against a disclosure request. Its fields (record_fields) carry
// the per-field sensitivity the disclosure rules evaluate. The record header
// itself is never sensitive; the field values are.
export const records = table({
  name: "records",
  description: "A record held against a disclosure request.",
  schema: {
    request_id: f.tableRef(requests, { required: true, description: "The request this record belongs to." }),
    title: f.text({ required: true }),
    record_type: f.enum(["report", "correspondence", "dataset"], {
      required: true,
      description: "The kind of document.",
    }),
    summary: f.text({ description: "A one-line, always-public description." }),
  },
  index: [{ type: "btree", fields: [{ name: "request_id", op: "asc" }] }],
  seed: [
    { request_id: 1, title: "Transportation budget report, FY2026", record_type: "report", summary: "Program budget with contractor allocations and negotiation notes." },
    { request_id: 1, title: "Contractor payment ledger", record_type: "dataset", summary: "Payments to transportation contractors by quarter." },
    { request_id: 2, title: "Body-camera retention policy memo", record_type: "correspondence", summary: "Policy memo on how long footage is retained." },
    { request_id: 2, title: "Officer complaint summary", record_type: "report", summary: "Summary of complaints related to the request." },
    { request_id: 3, title: "East district water quality report", record_type: "report", summary: "Laboratory results for east-district sampling sites." },
    { request_id: 3, title: "Water sampling dataset", record_type: "dataset", summary: "Raw measurements behind the quality report." },
    { request_id: 4, title: "Parks procurement email thread", record_type: "correspondence", summary: "Vendor selection correspondence for the parks contract." },
    { request_id: 4, title: "Parks vendor shortlist", record_type: "dataset", summary: "Shortlisted vendors and scoring." },
    { request_id: 5, title: "First-quarter building permit approvals", record_type: "dataset", summary: "Approved permits with applicant details." },
    { request_id: 6, title: "Overtime claims audit findings", record_type: "report", summary: "Internal audit of overtime claims and exceptions." },
    { request_id: 7, title: "School meal vendor contract", record_type: "report", summary: "Awarded vendor contract and terms." },
    { request_id: 7, title: "Vendor bid comparison", record_type: "dataset", summary: "Bid comparison across responding vendors." },
    { request_id: 8, title: "Downtown emergency response log", record_type: "dataset", summary: "Response-time log for downtown incidents." },
    { request_id: 8, title: "Dispatch audio transcript", record_type: "correspondence", summary: "Transcript excerpts from dispatch audio." },
  ],
});
