import { c, expr, guard, inp, input, query, ref, s } from "@xanots/sdk";
import { requests } from "../../table/requests.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// Move a request through its lifecycle (open -> fulfilled -> closed). Clerks and
// admins only. A closed request is terminal and cannot change again — the rule the
// README promises, enforced here with guard.require.
export const request_status = query({
  name: "requests/{request_id}/status",
  verb: "POST",
  apiGroup: DisclosureApi,
  auth: user,
  description: "Change a request's status (clerk or admin). Closed is terminal.",
  input: {
    request_id: input.int({ required: true }),
    status: input.enum(["open", "fulfilled", "closed"], { required: true }),
  },
  stack: [
    ...guard.role(user, ["clerk", "admin"]),
    s.db.get({
      table: requests,
      fieldValue: inp("request_id"),
      as: "request",
    }),
    guard.found("request", { message: "No such request." }),
    guard.require(expr(ref("request.status"), "!=", c.text("closed")), {
      message: "A closed request is final and cannot change status.",
    }),
    s.db.edit({
      table: requests,
      fieldValue: inp("request_id"),
      row: { status: inp("status") },
      as: "request",
    }),
  ],
  response: ref("request"),
});
