import { table, f } from "@xanots/sdk";

// The versioned disclosure policy, stored as data (not hardcoded logic). Each row
// is one (version, sensitivity) rule: `min_role` is the minimum clearance to
// RELEASE a field of that sensitivity, and `action` is what happens below that
// clearance (redact or withhold). Exactly one version is active at a time.
//
// Role clearance is ranked agent < clerk < admin, an AI agent is deliberately
// the least-privileged caller, which is the whole governance point.
export const disclosureRules = table({
  name: "disclosure_rules",
  schema: {
    version: f.int({ required: true }),
    active: f.bool({ required: true }),
    sensitivity: f.enum(["public", "restricted", "sealed"], { required: true }),
    min_role: f.enum(["clerk", "agent", "admin"], { required: true }),
    action: f.enum(["release", "redact", "withhold"], { required: true }),
    note: f.text(),
  },
});
