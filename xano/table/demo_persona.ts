import { f, table } from "@xanots/sdk";

// One-click demo sign-in. Each row names a seeded user by email; the `auth/demo`
// endpoint only ever mints a token for an email listed here, so it can never be
// pointed at a real account. Delete these rows (and the demo users) to turn
// demo sign-in off, as the README's "Going to production" section explains.
export const demo_persona = table({
  name: "demo_persona",
  description:
    "One-click demo sign-in personas. Delete these rows to turn demo sign-in off.",
  schema: {
    key: f.text({ required: true }),
    label: f.text({ required: true }),
    description: f.text(),
    email: f.email({ required: true }),
  },
  index: [{ type: "btree|unique", fields: [{ name: "key", op: "asc" }] }],
  seed: [
    {
      key: "agent",
      label: "Disclosure agent (AI)",
      description:
        "The least-privileged caller. Sees public fields, nothing sealed. Start here: the agent console proves it gets the same governed answer as the direct read.",
      email: "agent@records.gov.example",
    },
    {
      key: "clerk",
      label: "Priya (records clerk)",
      description:
        "A records clerk. Sees public and restricted fields; sealed fields are redacted. Can read the audit trail.",
      email: "clerk@records.gov.example",
    },
    {
      key: "admin",
      label: "Marcus (records admin)",
      description:
        "A records administrator. Sees every field and can switch which disclosure policy version is active.",
      email: "admin@records.gov.example",
    },
  ],
});
