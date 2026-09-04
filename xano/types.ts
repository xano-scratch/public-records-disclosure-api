// Shared types the backend uses to give its two shared functions (and therefore
// every caller and the frontend) a precise response shape. A lambda's output is
// opaque to InferResponse, so evaluate_disclosure / the audit trail declare these
// via `responseShape`, the frontend then derives them through the query defs.

export type Role = "clerk" | "agent" | "admin";
export type Sensitivity = "public" | "restricted" | "sealed";
export type DisclosureAction = "release" | "redact" | "withhold";

/** One field of a record, after the active disclosure policy has been applied. */
export type DisclosedField = {
  field_name: string;
  sensitivity: Sensitivity;
  action: DisclosureAction;
  /** The real value ONLY when released; null for redacted or withheld fields. */
  value: string | null;
};

/** The result of the one shared releasability rule (evaluate_disclosure). */
export type DisclosureResult = {
  rule_version: number;
  fields: DisclosedField[];
  released_fields: string[];
  redacted_fields: string[];
  withheld_fields: string[];
  /** Everything not released (redacted ∪ withheld), the audit trail's withheld set. */
  not_released_fields: string[];
  released_count: number;
  redacted_count: number;
  withheld_count: number;
  decision_summary: string;
};

/** One enriched row of the access_log audit trail. */
export type AuditRow = {
  id: number;
  created_at: number;
  record_id: number;
  record_title: string;
  caller_id: number;
  caller_name: string;
  caller_role: string;
  caller_kind: "human" | "agent";
  rule_version: number;
  released_fields: string[];
  withheld_fields: string[];
  decision_summary: string;
};
