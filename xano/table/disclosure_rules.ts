import { f, table } from "@xanots/sdk";

// The disclosure policy, as data. Each row maps (sensitivity, caller role) to one
// action: release (value returned), redact (acknowledged, value withheld), or
// withhold (not returned at all). Exactly one version is active at a time; the
// `evaluate_disclosure` function reads the active rows and applies them. Switching
// the active version (admin, via `rules/activate`) changes what every caller sees,
// which is the whole point of versioned policy.
//
// Clearance is ranked agent < clerk < admin, so the AI agent is the least-privileged
// caller by design. Version 2 is the balanced policy shipped active; version 1 is a
// stricter prior policy kept for the version-switch demo.
export const disclosure_rules = table({
  name: "disclosure_rules",
  description: "A versioned field-disclosure policy. One row per (version, sensitivity, role).",
  schema: {
    version: f.int({ required: true }),
    active: f.bool({ required: true, description: "Exactly one version's rows are active." }),
    sensitivity: f.enum(["public", "restricted", "sealed"], { required: true }),
    role: f.enum(["clerk", "agent", "admin"], { required: true, description: "The caller role this rule decides for." }),
    action: f.enum(["release", "redact", "withhold"], { required: true }),
    note: f.text({ description: "Why this cell is set the way it is." }),
  },
  index: [
    { type: "btree", fields: [{ name: "active", op: "asc" }] },
    { type: "btree", fields: [{ name: "version", op: "asc" }] },
  ],
  seed: [
    // ---- Version 2: balanced policy (active) ----
    { version: 2, active: true, sensitivity: "public", role: "agent", action: "release", note: "Public fields are released to everyone." },
    { version: 2, active: true, sensitivity: "public", role: "clerk", action: "release", note: "Public fields are released to everyone." },
    { version: 2, active: true, sensitivity: "public", role: "admin", action: "release", note: "Public fields are released to everyone." },
    { version: 2, active: true, sensitivity: "restricted", role: "agent", action: "redact", note: "The agent sees restricted fields acknowledged but not their values." },
    { version: 2, active: true, sensitivity: "restricted", role: "clerk", action: "release", note: "A clerk may read restricted fields." },
    { version: 2, active: true, sensitivity: "restricted", role: "admin", action: "release", note: "An admin may read restricted fields." },
    { version: 2, active: true, sensitivity: "sealed", role: "agent", action: "withhold", note: "The agent never sees sealed fields." },
    { version: 2, active: true, sensitivity: "sealed", role: "clerk", action: "redact", note: "A clerk sees sealed fields acknowledged but redacted." },
    { version: 2, active: true, sensitivity: "sealed", role: "admin", action: "release", note: "An admin may read sealed fields." },
    // ---- Version 1: stricter prior policy (inactive) ----
    { version: 1, active: false, sensitivity: "public", role: "agent", action: "release", note: "Public fields are released to everyone." },
    { version: 1, active: false, sensitivity: "public", role: "clerk", action: "release", note: "Public fields are released to everyone." },
    { version: 1, active: false, sensitivity: "public", role: "admin", action: "release", note: "Public fields are released to everyone." },
    { version: 1, active: false, sensitivity: "restricted", role: "agent", action: "withhold", note: "Stricter: the agent did not see restricted fields at all." },
    { version: 1, active: false, sensitivity: "restricted", role: "clerk", action: "redact", note: "Stricter: a clerk saw restricted fields redacted." },
    { version: 1, active: false, sensitivity: "restricted", role: "admin", action: "release", note: "An admin may read restricted fields." },
    { version: 1, active: false, sensitivity: "sealed", role: "agent", action: "withhold", note: "The agent never sees sealed fields." },
    { version: 1, active: false, sensitivity: "sealed", role: "clerk", action: "withhold", note: "Stricter: a clerk did not see sealed fields at all." },
    { version: 1, active: false, sensitivity: "sealed", role: "admin", action: "release", note: "An admin may read sealed fields." },
  ],
});
