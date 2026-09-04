import { query, input, s, ref, inp, cmp, col } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";
import { records } from "../tables/records.js";

// List record HEADERS, optionally narrowed to one request. Header metadata only
// (title / type / summary), the sensitive field values are disclosed only
// through records/releasable, under the policy.
export const recordsList = query({
  name: "records/list",
  verb: "GET",
  apiGroup: api,
  auth: users,
  input: { request_id: input.int() },
  stack: [
    s.db.query({
      table: records,
      where: [cmp(col("request_id"), "=", inp("request_id"), { ignoreEmpty: true })],
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
