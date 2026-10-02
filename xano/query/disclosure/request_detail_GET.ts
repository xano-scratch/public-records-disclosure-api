import { col, expr, guard, inp, input, query, ref, s } from "@xanots/sdk";
import { records } from "../../table/records.js";
import { requests } from "../../table/requests.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// One request's header plus the records attached to it (headers only). The record
// values stay behind records/retrieve, where the disclosure rules run.
export const request_detail = query({
  name: "requests/{request_id}",
  verb: "GET",
  apiGroup: DisclosureApi,
  auth: user,
  description: "A request's header and the records attached to it.",
  input: {
    request_id: input.int({ required: true }),
  },
  stack: [
    s.db.get({
      table: requests,
      fieldValue: inp("request_id"),
      as: "request",
    }),
    guard.found("request", { message: "No such request." }),
    s.db.query({
      table: records,
      where: expr(col("request_id"), "=", inp("request_id")),
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "records",
    }),
  ],
  response: {
    request: ref("request"),
    records: ref("records"),
  },
});
