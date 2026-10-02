import { cmp, col, inp, input, query, ref, s } from "@xanots/sdk";
import { requests } from "../../table/requests.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// Search disclosure requests. Returns request headers only — no record fields and
// no values, so this endpoint discloses nothing sensitive. Every optional filter
// drops out when its input is empty (ignoreEmpty).
export const requests_list = query({
  name: "requests",
  verb: "GET",
  apiGroup: DisclosureApi,
  auth: user,
  description: "List and filter disclosure requests (headers only).",
  input: {
    q: input.text(),
    status: input.text(),
    requester_type: input.text(),
    page: input.int({ default: 1 }),
    per_page: input.int({ default: 20 }),
  },
  stack: [
    s.db.query({
      table: requests,
      where: [
        cmp(col("subject"), "includes", inp("q"), { ignoreEmpty: true }),
        cmp(col("status"), "=", inp("status"), { ignoreEmpty: true }),
        cmp(col("requester_type"), "=", inp("requester_type"), { ignoreEmpty: true }),
      ],
      sort: [{ sortBy: "created_at", dir: "desc" }],
      paging: { page: inp("page"), per_page: inp("per_page"), metadata: true, totals: true },
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
