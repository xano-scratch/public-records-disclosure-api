import { table, f } from "@xanots/sdk";

// The auth table that backs native, API-layer RBAC. A login endpoint mints a
// token against it; every protected endpoint names it as `auth:` and reads the
// caller's row to gate on `role`. `id` + `created_at` are auto-injected.
export const users = table({
  name: "users",
  auth: true,
  schema: {
    email: f.email({ required: true }),
    // Hashed on write. Read it back only via a `db.get` `output` naming it, and
    // compare with s.security.check_password (never through input.password -
    // that double-hashes the submission).
    password: f.password({ required: true }),
    role: f.enum(["clerk", "agent", "admin"], { required: true }),
    display_name: f.text({ required: true }),
  },
  index: [{ type: "unique", fields: [{ name: "email" }] }],
});
