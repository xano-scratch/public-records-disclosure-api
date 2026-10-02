import { c, guard, inp, input, query, ref, s } from "@xanots/sdk";
import { demo_persona } from "../../table/demo_persona.js";
import { user } from "../../table/user.js";
import { Authentication } from "../authentication.js";

// Public one-click demo sign-in. It only ever mints a token for an email that a
// demo_persona row names, so it can never be pointed at a real account. Delete the
// demo_persona rows (and the demo users) to turn it off.
export const auth_demo = query({
  name: "auth/demo",
  verb: "POST",
  apiGroup: Authentication,
  description: "Mint a token for a seeded demo persona. Public; cannot target a real account.",
  input: {
    persona: input.text({ required: true }),
  },
  stack: [
    s.db.get({
      table: demo_persona,
      fieldName: "key",
      fieldValue: inp("persona"),
      as: "p",
    }),
    guard.found("p", { message: "Demo sign-in is off for that persona." }),
    s.db.get({
      table: user,
      fieldName: "email",
      fieldValue: ref("p.email"),
      output: ["id", "name", "email", "role"],
      as: "u",
    }),
    guard.found("u", { message: "The demo account is not seeded." }),
    s.security.create_auth_token({
      table: user,
      id: ref("u.id"),
      extras: c.obj({}),
      expiration: c.int(86400),
      as: "authToken",
    }),
  ],
  response: {
    authToken: ref("authToken"),
    user_id: ref("u.id"),
  },
});
