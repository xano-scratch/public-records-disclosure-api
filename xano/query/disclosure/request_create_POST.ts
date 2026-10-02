import { auth, c, col, expr, guard, inp, input, query, ref, s } from "@xanots/sdk";
import { requests } from "../../table/requests.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// Open a new disclosure request. Clerks and admins only; the agent cannot open
// requests. New requests always start "open" and are stamped with the caller's id,
// never an id from the request body.
export const request_create = query({
  name: "requests",
  verb: "POST",
  apiGroup: DisclosureApi,
  auth: user,
  description: "Open a new disclosure request (clerk or admin).",
  input: {
    reference: input.text({ required: true }),
    subject: input.text({ required: true }),
    requester_type: input.enum(["public", "press", "internal"], { required: true }),
  },
  stack: [
    ...guard.role(user, ["clerk", "admin"]),
    // Validate the reference is free before writing (the column is unique).
    s.db.query({
      table: requests,
      where: expr(col("reference"), "=", inp("reference")),
      returnType: "exists",
      as: "reference_taken",
    }),
    guard.require(expr(ref("reference_taken"), "=", c.bool(false)), {
      errorType: "badrequest",
      message: "That reference is already in use.",
    }),
    s.db.add({
      table: requests,
      row: {
        reference: inp("reference"),
        subject: inp("subject"),
        requester_type: inp("requester_type"),
        status: "open",
        opened_by: auth("id"),
      },
      as: "request",
    }),
  ],
  response: ref("request"),
});
