import { query, ref, s } from "@xanots/sdk";
import { disclosure_rules } from "../../table/disclosure_rules.js";
import { user } from "../../table/user.js";
import { DisclosureApi } from "../disclosure.js";

// Every disclosure policy version, active and inactive, so the policy screen can
// show the full matrix and offer the version switch. Grouped client-side by version.
export const rules_list = query({
  name: "rules",
  verb: "GET",
  apiGroup: DisclosureApi,
  auth: user,
  description: "All disclosure policy versions and their rules.",
  stack: [
    s.db.query({
      table: disclosure_rules,
      sort: [
        { sortBy: "version", dir: "desc" },
        { sortBy: "id", dir: "asc" },
      ],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
