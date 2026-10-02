import { cmp, col, inp, input, query, ref, s } from "@xanots/sdk";
import { records } from "../../table/records.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// Browse record headers, optionally scoped to one request. Headers only — titles,
// types, summaries. No field values: those go through records/retrieve so the
// disclosure rules run and the access is logged.
export const records_list = query({
  name: "records",
  verb: "GET",
  apiGroup: DisclosureApi,
  auth: user,
  description: "List record headers, optionally by request.",
  input: {
    request_id: input.int(),
  },
  stack: [
    s.db.query({
      table: records,
      where: cmp(col("request_id"), "=", inp("request_id"), { ignoreEmpty: true }),
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
