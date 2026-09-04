import { query, input, s, ref, inp, c, expr } from "@xanots/sdk";
import { api } from "./_group.js";
import { users } from "../tables/users.js";

// Verify credentials and mint a role-carrying session token. The submitted
// password is taken as text (never input.password, which would double-hash) and
// the stored hash is pulled via `output` (the column is internal otherwise).
export const login = query({
  name: "auth/login",
  verb: "POST",
  apiGroup: api,
  auth: false,
  input: {
    email: input.email({ required: true, methods: ["lower", "trim"] }),
    password: input.text({ required: true }),
  },
  stack: [
    s.db.get({
      table: users,
      fieldName: "email",
      fieldValue: inp("email"),
      output: ["id", "email", "password", "role", "display_name"],
      as: "u",
    }),
    s.precondition({
      expr: expr(ref("u", { safe: true }), "!=", c.null()),
      error: c.text("Invalid email or password."),
      error_type: "unauthorized",
    }),
    s.security.check_password({
      text_password: inp("password"),
      hash_password: ref("u.password"),
      as: "ok",
    }),
    s.precondition({
      expr: expr(ref("ok"), "=", c.bool(true)),
      error: c.text("Invalid email or password."),
      error_type: "unauthorized",
    }),
    s.security.create_auth_token({ table: users, id: ref("u.id"), as: "token" }),
  ],
  response: {
    token: ref("token"),
    user: {
      id: ref("u.id"),
      email: ref("u.email"),
      role: ref("u.role"),
      display_name: ref("u.display_name"),
    },
  },
});
