import { query, ref, s } from "@xanots/sdk";
import { demo_persona } from "../../table/demo_persona.js";
import { Authentication } from "../authentication.js";

// Public: the sign-in screen's persona list. No secrets in it (no emails, no
// passwords) — only the key, label, and one-line description per persona.
export const auth_demo_personas = query({
  name: "auth/demo/personas",
  verb: "GET",
  apiGroup: Authentication,
  description: "List the demo sign-in personas. Public; carries no credentials.",
  stack: [
    s.db.query({
      table: demo_persona,
      output: ["key", "label", "description"],
      sort: [{ sortBy: "id", dir: "asc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
