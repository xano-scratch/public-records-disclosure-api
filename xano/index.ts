import { workspace } from "@xanots/sdk";

import { users } from "./tables/users.js";
import { requests } from "./tables/requests.js";
import { records } from "./tables/records.js";
import { recordFields } from "./tables/record_fields.js";
import { disclosureRules } from "./tables/disclosure_rules.js";
import { accessLog } from "./tables/access_log.js";

import { evaluateDisclosure } from "./functions/evaluate_disclosure.js";
import { logAccess } from "./functions/log_access.js";
import { recordResolver } from "./agents/record_resolver.js";

import { api } from "./api/_group.js";
import { login } from "./api/login.js";
import { requestsSearch } from "./api/requests_search.js";
import { recordsList } from "./api/records_list.js";
import { recordsReleasable } from "./api/records_releasable.js";
import { agentRetrieve } from "./api/agent_retrieve.js";
import { auditQueries } from "./api/audit_queries.js";
import { rulesActive } from "./api/rules_active.js";
import { rulesActivate } from "./api/rules_activate.js";
import { seedRun } from "./api/seed_run.js";

/**
 * Public Records Disclosure API.
 *
 * A governed government-records backend where a human clerk and an AI agent call
 * ONE shared rule (evaluate_disclosure) to fetch a record, and the same versioned
 * policy decides which fields are released, redacted, or withheld. A second shared
 * function (log_access) writes the audit row for both paths. Withholding is
 * computed here in the API layer (native RBAC), never row-level security.
 */
export default workspace("public-records-disclosure-api")
  .registerTables([users, requests, records, recordFields, disclosureRules, accessLog])
  .registerApiGroups([api])
  .registerFunctions([evaluateDisclosure, logAccess])
  .registerAgents([recordResolver])
  .registerQueries([
    login,
    requestsSearch,
    recordsList,
    recordsReleasable,
    agentRetrieve,
    auditQueries,
    rulesActive,
    rulesActivate,
    seedRun,
  ]);
