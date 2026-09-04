import { query, s, ref, c } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { requests } from "../tables/requests.js";
import { records } from "../tables/records.js";
import { recordFields } from "../tables/record_fields.js";
import { disclosureRules } from "../tables/disclosure_rules.js";
import { accessLog } from "../tables/access_log.js";

// Public reset-and-seed so a fresh ephemeral is browsable immediately and the demo
// is repeatable. Truncates every table (resetting ids for stable deep-links), then
// loads three demo users, two requests, three records with sensitivity-graded
// fields, and two policy versions (v2 active, v1 a stricter prior version).
export const seedRun = query({
  name: "seed/run",
  verb: "POST",
  apiGroup: api,
  auth: false,
  stack: [
    s.db.truncate({ table: accessLog, reset: true }),
    s.db.truncate({ table: recordFields, reset: true }),
    s.db.truncate({ table: records, reset: true }),
    s.db.truncate({ table: requests, reset: true }),
    s.db.truncate({ table: disclosureRules, reset: true }),
    s.db.truncate({ table: users, reset: true }),

    // Users (ids 1..3). Passwords are demo fixtures, plaintext here, hashed on write.
    s.db.add({ table: users, row: { email: c.text("clerk@records.gov.example"), password: c.text("clerk-demo-2026"), role: c.text("clerk"), display_name: c.text("Dana the Clerk") }, as: "u_clerk" }),
    s.db.add({ table: users, row: { email: c.text("agent@records.gov.example"), password: c.text("agent-demo-2026"), role: c.text("agent"), display_name: c.text("Records Assistant (AI)") }, as: "u_agent" }),
    s.db.add({ table: users, row: { email: c.text("admin@records.gov.example"), password: c.text("admin-demo-2026"), role: c.text("admin"), display_name: c.text("Alex the Admin") }, as: "u_admin" }),

    // Requests (ids 1..2).
    s.db.add({ table: requests, row: { reference: c.text("FOIA-2026-014"), subject: c.text("Transportation department budget and contractor correspondence"), requester_type: c.text("press"), status: c.text("open"), opened_by: ref("u_clerk.id") }, as: "req1" }),
    s.db.add({ table: requests, row: { reference: c.text("FOIA-2026-021"), subject: c.text("Air quality monitoring dataset for the east district"), requester_type: c.text("public"), status: c.text("open"), opened_by: ref("u_clerk.id") }, as: "req2" }),

    // Records (ids 1..3).
    s.db.add({ table: records, row: { request_id: ref("req1.id"), title: c.text("Transportation budget report FY2026"), record_type: c.text("report"), summary: c.text("Budget report for the transportation department covering FY2026 planning and contractor work.") }, as: "rec1" }),
    s.db.add({ table: records, row: { request_id: ref("req1.id"), title: c.text("Contractor correspondence thread"), record_type: c.text("correspondence"), summary: c.text("Email thread between the department and a paving contractor about the east district schedule.") }, as: "rec2" }),
    s.db.add({ table: records, row: { request_id: ref("req2.id"), title: c.text("East district air quality dataset"), record_type: c.text("dataset"), summary: c.text("Hourly particulate readings from the east district sensor network.") }, as: "rec3" }),

    // Record 1 fields: 2 public, 1 restricted, 1 sealed.
    s.db.add({ table: recordFields, row: { record_id: ref("rec1.id"), field_name: c.text("Department"), field_value: c.text("Transportation"), sensitivity: c.text("public") } }),
    s.db.add({ table: recordFields, row: { record_id: ref("rec1.id"), field_name: c.text("Reporting period"), field_value: c.text("FY2026 first half"), sensitivity: c.text("public") } }),
    s.db.add({ table: recordFields, row: { record_id: ref("rec1.id"), field_name: c.text("Procurement officer"), field_value: c.text("M. Okafor, Procurement office"), sensitivity: c.text("restricted") } }),
    s.db.add({ table: recordFields, row: { record_id: ref("rec1.id"), field_name: c.text("Investigation reference"), field_value: c.text("OIG-2026-77, open inquiry"), sensitivity: c.text("sealed") } }),

    // Record 2 fields: 1 public, 1 restricted, 1 sealed.
    s.db.add({ table: recordFields, row: { record_id: ref("rec2.id"), field_name: c.text("Subject line"), field_value: c.text("Repaving schedule, east district"), sensitivity: c.text("public") } }),
    s.db.add({ table: recordFields, row: { record_id: ref("rec2.id"), field_name: c.text("Contractor contact"), field_value: c.text("J. Halstead, Halstead Paving"), sensitivity: c.text("restricted") } }),
    s.db.add({ table: recordFields, row: { record_id: ref("rec2.id"), field_name: c.text("Complainant identity"), field_value: c.text("Protected under order 2026-CV-3312"), sensitivity: c.text("sealed") } }),

    // Record 3 fields: 2 public, 1 restricted.
    s.db.add({ table: recordFields, row: { record_id: ref("rec3.id"), field_name: c.text("Sensor network"), field_value: c.text("East district particulate sensors"), sensitivity: c.text("public") } }),
    s.db.add({ table: recordFields, row: { record_id: ref("rec3.id"), field_name: c.text("Sampling interval"), field_value: c.text("Hourly"), sensitivity: c.text("public") } }),
    s.db.add({ table: recordFields, row: { record_id: ref("rec3.id"), field_name: c.text("Site coordinates"), field_value: c.text("Cluster near 40.71N, 74.01W"), sensitivity: c.text("restricted") } }),

    // Policy v2 (active): agents see public only, clerks also see restricted,
    // admins see everything.
    s.db.add({ table: disclosureRules, row: { version: c.int(2), active: c.bool(true), sensitivity: c.text("public"), min_role: c.text("agent"), action: c.text("redact"), note: c.text("Public fields are released to every role.") } }),
    s.db.add({ table: disclosureRules, row: { version: c.int(2), active: c.bool(true), sensitivity: c.text("restricted"), min_role: c.text("clerk"), action: c.text("redact"), note: c.text("Restricted fields are redacted for agents; released to clerks and admins.") } }),
    s.db.add({ table: disclosureRules, row: { version: c.int(2), active: c.bool(true), sensitivity: c.text("sealed"), min_role: c.text("admin"), action: c.text("withhold"), note: c.text("Sealed fields are withheld for everyone except admins.") } }),

    // Policy v1 (inactive prior version): stricter, restricted and sealed both
    // withheld below admin.
    s.db.add({ table: disclosureRules, row: { version: c.int(1), active: c.bool(false), sensitivity: c.text("public"), min_role: c.text("agent"), action: c.text("redact"), note: c.text("Public fields released to every role.") } }),
    s.db.add({ table: disclosureRules, row: { version: c.int(1), active: c.bool(false), sensitivity: c.text("restricted"), min_role: c.text("admin"), action: c.text("withhold"), note: c.text("Legacy policy: restricted fields withheld below admin.") } }),
    s.db.add({ table: disclosureRules, row: { version: c.int(1), active: c.bool(false), sensitivity: c.text("sealed"), min_role: c.text("admin"), action: c.text("withhold"), note: c.text("Sealed fields withheld below admin.") } }),
  ],
  response: { ok: c.bool(true), message: c.text("Demo data loaded.") },
});
