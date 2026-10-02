import { f, table } from "@xanots/sdk";
import { records } from "./records.js";

// The heart of the domain: one row per field of a record, each classified
// public / restricted / sealed. The disclosure rules map (sensitivity, caller
// role) to release / redact / withhold, so WHICH fields a caller sees is decided
// here plus the active policy, never by row-level security.
export const record_fields = table({
  name: "record_fields",
  description: "A single classified field of a record.",
  schema: {
    record_id: f.tableRef(records, { required: true }),
    field_name: f.text({ required: true }),
    field_value: f.text({ required: true, description: "The underlying value. Only returned when the active policy releases it for the caller role." }),
    sensitivity: f.enum(["public", "restricted", "sealed"], {
      required: true,
      description: "Classification the disclosure rules act on.",
    }),
  },
  index: [
    { type: "btree", fields: [{ name: "record_id", op: "asc" }] },
    { type: "btree", fields: [{ name: "sensitivity", op: "asc" }] },
  ],
  seed: [
    // record 1 — Transportation budget report (the agent-demo target: 2 public, 1 restricted, 1 sealed)
    { record_id: 1, field_name: "Program summary", field_value: "Covers transit, roads, and fleet programs for the fiscal year.", sensitivity: "public" },
    { record_id: 1, field_name: "Published allocations", field_value: "Allocations by program as printed in the annual report.", sensitivity: "public" },
    { record_id: 1, field_name: "Contractor names", field_value: "Awarded contractors pending a disclosure review.", sensitivity: "restricted" },
    { record_id: 1, field_name: "Negotiation notes", field_value: "Internal notes on bid negotiations and claimed exemptions.", sensitivity: "sealed" },
    // record 2 — Contractor payment ledger
    { record_id: 2, field_name: "Reporting period", field_value: "Quarterly, aligned to the fiscal calendar.", sensitivity: "public" },
    { record_id: 2, field_name: "Vendor categories", field_value: "Paving, signals, fleet maintenance.", sensitivity: "public" },
    { record_id: 2, field_name: "Per-contractor totals", field_value: "Totals by contractor, under review for release.", sensitivity: "restricted" },
    { record_id: 2, field_name: "Bank routing details", field_value: "Contractor banking and routing identifiers.", sensitivity: "sealed" },
    // record 3 — Body-camera retention policy memo
    { record_id: 3, field_name: "Policy title", field_value: "Body-worn camera footage retention standard.", sensitivity: "public" },
    { record_id: 3, field_name: "Retention window", field_value: "Footage retained for the standard published period.", sensitivity: "public" },
    { record_id: 3, field_name: "Exemption rationale", field_value: "Rationale for ongoing-investigation holds.", sensitivity: "restricted" },
    { record_id: 3, field_name: "Officer identifiers", field_value: "Badge numbers referenced in the memo.", sensitivity: "sealed" },
    // record 4 — Officer complaint summary
    { record_id: 4, field_name: "Complaint count", field_value: "Aggregate count for the period.", sensitivity: "public" },
    { record_id: 4, field_name: "Category breakdown", field_value: "Counts by complaint category.", sensitivity: "restricted" },
    { record_id: 4, field_name: "Complainant identities", field_value: "Names and contact details of complainants.", sensitivity: "sealed" },
    // record 5 — East district water quality report
    { record_id: 5, field_name: "Sampling sites", field_value: "Public list of east-district sampling locations.", sensitivity: "public" },
    { record_id: 5, field_name: "Summary findings", field_value: "Overall compliance summary for the district.", sensitivity: "public" },
    { record_id: 5, field_name: "Non-compliant readings", field_value: "Readings above the action threshold, under review.", sensitivity: "restricted" },
    { record_id: 5, field_name: "Property owner contacts", field_value: "Contacts for affected private properties.", sensitivity: "sealed" },
    // record 6 — Water sampling dataset
    { record_id: 6, field_name: "Measurement units", field_value: "Units and method references.", sensitivity: "public" },
    { record_id: 6, field_name: "Site coordinates", field_value: "Precise coordinates of each sampling point.", sensitivity: "restricted" },
    { record_id: 6, field_name: "Lab technician notes", field_value: "Technician annotations on anomalous samples.", sensitivity: "sealed" },
    // record 7 — Parks procurement email thread
    { record_id: 7, field_name: "Thread subject", field_value: "Vendor selection for the parks maintenance contract.", sensitivity: "public" },
    { record_id: 7, field_name: "Participants", field_value: "Staff and vendors on the thread.", sensitivity: "restricted" },
    { record_id: 7, field_name: "Price negotiation lines", field_value: "Back-and-forth on pricing terms.", sensitivity: "sealed" },
    // record 8 — Parks vendor shortlist
    { record_id: 8, field_name: "Scoring criteria", field_value: "Published evaluation criteria.", sensitivity: "public" },
    { record_id: 8, field_name: "Shortlisted vendors", field_value: "Vendors advanced to the shortlist.", sensitivity: "restricted" },
    { record_id: 8, field_name: "Internal scoring comments", field_value: "Evaluator comments on each vendor.", sensitivity: "sealed" },
    // record 9 — First-quarter building permit approvals
    { record_id: 9, field_name: "Permit categories", field_value: "Residential, commercial, and civic categories.", sensitivity: "public" },
    { record_id: 9, field_name: "Approval dates", field_value: "Approval dates for the quarter.", sensitivity: "public" },
    { record_id: 9, field_name: "Applicant addresses", field_value: "Applicant mailing addresses.", sensitivity: "restricted" },
    { record_id: 9, field_name: "Reviewer private notes", field_value: "Reviewer notes on borderline applications.", sensitivity: "sealed" },
    // record 10 — Overtime claims audit findings
    { record_id: 10, field_name: "Audit scope", field_value: "Departments and period covered.", sensitivity: "public" },
    { record_id: 10, field_name: "Finding summaries", field_value: "Summaries of each finding, pending review.", sensitivity: "restricted" },
    { record_id: 10, field_name: "Named employees", field_value: "Employees named in specific findings.", sensitivity: "sealed" },
    // record 11 — School meal vendor contract
    { record_id: 11, field_name: "Contract term", field_value: "Start and end of the contract term.", sensitivity: "public" },
    { record_id: 11, field_name: "Service scope", field_value: "Meals served and sites covered.", sensitivity: "public" },
    { record_id: 11, field_name: "Pricing schedule", field_value: "Per-unit pricing schedule, under review.", sensitivity: "restricted" },
    { record_id: 11, field_name: "Signatory personal details", field_value: "Personal contact details of signatories.", sensitivity: "sealed" },
    // record 12 — Vendor bid comparison
    { record_id: 12, field_name: "Evaluation rubric", field_value: "Published scoring rubric.", sensitivity: "public" },
    { record_id: 12, field_name: "Bid rankings", field_value: "Ranked results of the evaluation.", sensitivity: "restricted" },
    { record_id: 12, field_name: "Losing bid internals", field_value: "Internal detail from unsuccessful bids.", sensitivity: "sealed" },
    // record 13 — Downtown emergency response log
    { record_id: 13, field_name: "Incident types", field_value: "Categories of incidents logged.", sensitivity: "public" },
    { record_id: 13, field_name: "Average response time", field_value: "Average response time for the period.", sensitivity: "public" },
    { record_id: 13, field_name: "Caller phone numbers", field_value: "Phone numbers of reporting callers.", sensitivity: "sealed" },
    // record 14 — Dispatch audio transcript
    { record_id: 14, field_name: "Transcript date", field_value: "Date of the dispatch audio.", sensitivity: "public" },
    { record_id: 14, field_name: "Dispatcher remarks", field_value: "Dispatcher remarks during the incident.", sensitivity: "restricted" },
    { record_id: 14, field_name: "Caller names", field_value: "Names spoken by or about callers.", sensitivity: "sealed" },
  ],
});
