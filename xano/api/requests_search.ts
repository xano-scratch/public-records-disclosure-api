import { query, input, s, ref, inp, cmp, col } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { requests } from "../tables/requests.js";

// Search request HEADERS (subject / status / requester_type). Authenticated but
// role-agnostic: it returns no field values, only the request metadata, so any
// signed-in caller may browse the queue. Each filter is optional via ignoreEmpty.
export const requestsSearch = query({
  name: "requests/search",
  verb: "GET",
  apiGroup: api,
  auth: users,
  input: {
    subject: input.text(),
    status: input.enum(["open", "fulfilled", "closed"]),
    requester_type: input.enum(["public", "press", "internal"]),
  },
  stack: [
    s.db.query({
      table: requests,
      where: [
        cmp(col("subject"), "includes", inp("subject"), { ignoreEmpty: true }),
        cmp(col("status"), "=", inp("status"), { ignoreEmpty: true }),
        cmp(col("requester_type"), "=", inp("requester_type"), { ignoreEmpty: true }),
      ],
      sort: [{ sortBy: "created_at", dir: "desc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
