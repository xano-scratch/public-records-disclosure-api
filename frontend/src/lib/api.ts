// The one contract: every path and every request/response TYPE is derived from the
// xanots query defs. Change a def and this file follows, no hand-typed URLs, no
// hand-mirrored response shapes.
//
// Split-route-metadata: the lean defs are value-imported for getPath()/verb. The
// agent endpoint's def builds an LLM graph, so importing it would drag that graph
// into the browser bundle, it is type-only imported (erased) and its path lives in
// ROUTES below, kept in sync with `npx xanots routes xano/index.ts`.

import type { InferInput, InferResponse } from "@xanots/sdk";

import { login as loginDef } from "../../../xano/api/login.js";
import { requestsSearch as requestsSearchDef } from "../../../xano/api/requests_search.js";
import { recordsList as recordsListDef } from "../../../xano/api/records_list.js";
import { recordsReleasable as recordsReleasableDef } from "../../../xano/api/records_releasable.js";
import { auditQueries as auditQueriesDef } from "../../../xano/api/audit_queries.js";
import { rulesActive as rulesActiveDef } from "../../../xano/api/rules_active.js";
import { rulesActivate as rulesActivateDef } from "../../../xano/api/rules_activate.js";
import { seedRun as seedRunDef } from "../../../xano/api/seed_run.js";
// Stack-heavy (pulls the agent graph): type-only import, path via ROUTES.
import type { agentRetrieve as agentRetrieveDef } from "../../../xano/api/agent_retrieve.js";

/** The deployed backend base URL, injected by `xanots deploy --static`, or dev fallback. */
export const XANO_HOST: string =
  (typeof window !== "undefined" && (window as { XANO_HOST?: string }).XANO_HOST) ||
  import.meta.env.VITE_XANO_HOST ||
  "";

export const ROUTES = {
  agentRetrieve: { path: "/api:records-disclosure/agent/retrieve", verb: "POST" },
} as const;

// Types derived from the defs (the one contract).
export type LoginBody = InferInput<typeof loginDef>;
export type LoginResult = InferResponse<typeof loginDef>;
export type RequestRow = InferResponse<typeof requestsSearchDef>[number];
export type RecordRow = InferResponse<typeof recordsListDef>[number];
export type ReleasableResult = InferResponse<typeof recordsReleasableDef>;
export type Disclosure = ReleasableResult["disclosure"];
export type DisclosedField = NonNullable<Disclosure>["fields"][number];
export type AgentResult = InferResponse<typeof agentRetrieveDef>;
export type AuditRow = InferResponse<typeof auditQueriesDef>[number];
export type ActivePolicy = InferResponse<typeof rulesActiveDef>;
export type RuleRow = ActivePolicy["rules"][number];

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, method: string, opts: { token?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(XANO_HOST + path, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = (j && (j.message as string)) || msg;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}

export const api = {
  seedDemo: () => call<{ ok: boolean; message: string }>(seedRunDef.getPath(), seedRunDef.verb, {}),
  login: (body: LoginBody) => call<LoginResult>(loginDef.getPath(), loginDef.verb, { body }),
  searchRequests: (token: string, p: { subject?: string; status?: string; requester_type?: string }) =>
    call<RequestRow[]>(requestsSearchDef.getPath() + qs(p), requestsSearchDef.verb, { token }),
  listRecords: (token: string, request_id?: number) =>
    call<RecordRow[]>(recordsListDef.getPath() + qs({ request_id }), recordsListDef.verb, { token }),
  getReleasable: (token: string, record_id: number) =>
    call<ReleasableResult>(recordsReleasableDef.getPath({ params: { record_id } }), recordsReleasableDef.verb, { token }),
  agentRetrieve: (token: string, question: string) =>
    call<AgentResult>(ROUTES.agentRetrieve.path, ROUTES.agentRetrieve.verb, { token, body: { question } }),
  getAudit: (token: string) => call<AuditRow[]>(auditQueriesDef.getPath(), auditQueriesDef.verb, { token }),
  getActivePolicy: (token: string) => call<ActivePolicy>(rulesActiveDef.getPath(), rulesActiveDef.verb, { token }),
  activatePolicy: (token: string, version: number) =>
    call<ActivePolicy>(rulesActivateDef.getPath(), rulesActivateDef.verb, { token, body: { version } }),
};
