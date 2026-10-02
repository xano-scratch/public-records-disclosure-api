// Decoded from a Xano bundle, then extended. This is your source now: edit it and commit it.
import { workspace } from "@xanots/sdk";
import { Getting_Started_Template_create_event_log } from "./_shared.js";
import { evaluate_disclosure } from "./functions/evaluate_disclosure.js";
import { log_access } from "./functions/log_access.js";
import { record_resolver } from "./agents/record_resolver.js";
import { Authentication } from "./query/authentication.js";
import { auth_login } from "./query/authentication/auth_login_POST.js";
import { auth_me } from "./query/authentication/auth_me_GET.js";
import { auth_signup } from "./query/authentication/auth_signup_POST.js";
import { auth_demo } from "./query/authentication/auth_demo_POST.js";
import { auth_demo_personas } from "./query/authentication/auth_demo_personas_GET.js";
import { DisclosureApi } from "./query/disclosure.js";
import { requests_list } from "./query/disclosure/requests_list_GET.js";
import { request_detail } from "./query/disclosure/request_detail_GET.js";
import { request_create } from "./query/disclosure/request_create_POST.js";
import { request_status } from "./query/disclosure/request_status_POST.js";
import { records_list } from "./query/disclosure/records_list_GET.js";
import { record_retrieve } from "./query/disclosure/record_retrieve_POST.js";
import { agent_retrieve } from "./query/disclosure/agent_retrieve_POST.js";
import { audit_list } from "./query/disclosure/audit_list_GET.js";
import { rules_active } from "./query/disclosure/rules_active_GET.js";
import { rules_list } from "./query/disclosure/rules_list_GET.js";
import { rules_activate } from "./query/disclosure/rules_activate_POST.js";
import { account } from "./table/account.js";
import { access_log } from "./table/access_log.js";
import { demo_persona } from "./table/demo_persona.js";
import { disclosure_rules } from "./table/disclosure_rules.js";
import { event_log } from "./table/event_log.js";
import { record_fields } from "./table/record_fields.js";
import { records } from "./table/records.js";
import { requests } from "./table/requests.js";
import { user } from "./table/user.js";
import { workspaceSettings } from "./workspace.js";

export default workspace("public-records-disclosure-api")
  .registerWorkspace(workspaceSettings)
  .registerTables([
    account,
    user,
    event_log,
    demo_persona,
    requests,
    records,
    record_fields,
    disclosure_rules,
    access_log,
  ])
  .registerFunctions([
    Getting_Started_Template_create_event_log,
    evaluate_disclosure,
    log_access,
  ])
  .registerAgents([record_resolver])
  .registerApiGroups([Authentication, DisclosureApi])
  .registerQueries([
    auth_signup,
    auth_login,
    auth_me,
    auth_demo,
    auth_demo_personas,
    requests_list,
    request_detail,
    request_create,
    request_status,
    records_list,
    record_retrieve,
    agent_retrieve,
    audit_list,
    rules_active,
    rules_list,
    rules_activate,
  ]);

// Every object in the tree, by name — import from here rather than from its file.
export {
  Authentication,
  DisclosureApi,
  Getting_Started_Template_create_event_log,
  account,
  access_log,
  agent_retrieve,
  auth_demo,
  auth_demo_personas,
  auth_login,
  auth_me,
  auth_signup,
  audit_list,
  demo_persona,
  disclosure_rules,
  evaluate_disclosure,
  event_log,
  log_access,
  record_fields,
  record_resolver,
  record_retrieve,
  records,
  records_list,
  request_create,
  request_detail,
  request_status,
  requests,
  requests_list,
  rules_activate,
  rules_active,
  rules_list,
  user,
  workspaceSettings,
};
