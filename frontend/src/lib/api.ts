// The one contract. Paths come from the generated route manifest; request and
// response TYPES come from the xanots query defs via `import type` (erased at
// build, so the backend never enters the bundle). Never hand-type a URL or a body.
import type { InferResponse } from "@xanots/sdk";
import { ROUTES, routePath, type RouteName } from "../../../xano/routes.gen.js";
import type { auth_me } from "../../../xano/query/authentication/auth_me_GET.js";
import type { auth_demo } from "../../../xano/query/authentication/auth_demo_POST.js";
import type { auth_demo_personas } from "../../../xano/query/authentication/auth_demo_personas_GET.js";
import type { requests_list } from "../../../xano/query/disclosure/requests_list_GET.js";
import type { request_detail } from "../../../xano/query/disclosure/request_detail_GET.js";
import type { request_create } from "../../../xano/query/disclosure/request_create_POST.js";
import type { records_list } from "../../../xano/query/disclosure/records_list_GET.js";
import type { record_retrieve } from "../../../xano/query/disclosure/record_retrieve_POST.js";
import type { agent_retrieve } from "../../../xano/query/disclosure/agent_retrieve_POST.js";
import type { audit_list } from "../../../xano/query/disclosure/audit_list_GET.js";
import type { rules_active } from "../../../xano/query/disclosure/rules_active_GET.js";

declare global {
  interface Window {
    XANO_HOST?: string;
  }
}

/** The deployed backend URL, injected by `deploy --static`, or VITE_XANO_HOST in dev. */
export const XANO_HOST: string =
  (typeof window !== "undefined" && window.XANO_HOST) || import.meta.env.VITE_XANO_HOST || "";

// ---- session token + 401 handling -----------------------------------------

let token: string | null = null;
export function setToken(t: string | null) {
  token = t;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

type QueryValue = string | number | undefined | null;

async function send<T>(
  name: RouteName,
  opts: { params?: Record<string, string | number>; query?: Record<string, QueryValue>; body?: unknown } = {},
): Promise<T> {
  const hadToken = token !== null;
  // routePath exposes one overload per route literal; the implementation accepts
  // (RouteName, params?). Call it through the general signature for a dynamic name.
  const resolvePath = routePath as unknown as (n: RouteName, p?: Record<string, string | number>) => string;
  let path = resolvePath(name, opts.params);
  if (opts.query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) path += `?${s}`;
  }
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const init: RequestInit = { method: ROUTES[name].verb, headers };
  if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(XANO_HOST + path, init);
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }
  if (res.status === 401 && hadToken) {
    onUnauthorized?.();
  }
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const data = await res.json();
      if (data && typeof data.message === "string") message = data.message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- exported types ---------------------------------------------------------

export type Persona = InferResponse<typeof auth_demo_personas>[number];
export type AuthUser = InferResponse<typeof auth_me>;
export type RequestRow = InferResponse<typeof request_create>;
export type RequestsPage = InferResponse<typeof requests_list>;
export type RequestDetail = InferResponse<typeof request_detail>;
export type RecordRow = InferResponse<typeof records_list>[number];
export type RetrieveResult = InferResponse<typeof record_retrieve>;
export type AgentResult = InferResponse<typeof agent_retrieve>;
export type RuleRow = InferResponse<typeof rules_active>[number];
export type AuditRow = InferResponse<typeof audit_list>[number];
export type Role = "clerk" | "agent" | "admin";
export type Sensitivity = "public" | "restricted" | "sealed";
export type RequestStatus = "open" | "fulfilled" | "closed";

// ---- auth -------------------------------------------------------------------

export function demoPersonas() {
  return send<Persona[]>("GET auth/demo/personas");
}
export function signInWithPersona(persona: string) {
  return send<InferResponse<typeof auth_demo>>("POST auth/demo", { body: { persona } });
}
export function signInWithPassword(email: string, password: string) {
  return send<InferResponse<typeof auth_demo>>("POST auth/login", { body: { email, password } });
}
export function signUp(name: string, email: string, password: string) {
  return send<InferResponse<typeof auth_demo>>("POST auth/signup", { body: { name, email, password } });
}
export function me() {
  return send<AuthUser>("GET auth/me");
}

// ---- requests ---------------------------------------------------------------

export function listRequests(q: { q?: string; status?: string; requester_type?: string; page?: number; per_page?: number }) {
  return send<RequestsPage>("GET requests", { query: q });
}
export function getRequest(request_id: number) {
  return send<RequestDetail>("GET requests/{request_id}", { params: { request_id } });
}
export function createRequest(body: { reference: string; subject: string; requester_type: string }) {
  return send<RequestRow>("POST requests", { body });
}
export function setRequestStatus(request_id: number, status: RequestStatus) {
  return send<RequestRow>("POST requests/{request_id}/status", { params: { request_id }, body: { status } });
}

// ---- records + the governed reads ------------------------------------------

export function listRecords(request_id?: number) {
  return send<RecordRow[]>("GET records", { query: { request_id } });
}
export function retrieveRecord(record_id: number) {
  return send<RetrieveResult>("POST records/retrieve", { body: { record_id } });
}
export function agentRetrieve(q: string) {
  return send<AgentResult>("POST agent/retrieve", { body: { q } });
}

// ---- audit + policy ---------------------------------------------------------

export function listAudit(q: { caller_kind?: string; page?: number; per_page?: number } = {}) {
  return send<AuditRow[]>("GET audit", { query: q });
}
export function activeRules() {
  return send<RuleRow[]>("GET rules/active");
}
export function allRules() {
  return send<RuleRow[]>("GET rules");
}
export function activateVersion(version: number) {
  return send<{ version: number; rules: RuleRow[] }>("POST rules/activate", { body: { version } });
}
