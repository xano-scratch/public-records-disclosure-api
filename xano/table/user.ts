import { f, table } from "@xanots/sdk";
import { account } from "./account.js";

// table "user" — generated from a Xano bundle.
export const user = table({
  name: "user",
  guid: "efb558104909137dac95907814c26051",
  description: "Stores user information and allows the user to authenticate  against",
  auth: true,
  schema: {
    id: f.int({
      required: true,
    }),
    created_at: f.timestamp({
      default: "now",
      access: "private",
    }),
    name: f.text({
      required: true,
      methods: [
        "trim",
      ],
    }),
    email: f.email({
      nullable: true,
      required: true,
      methods: [
        "trim",
        "lower",
      ],
    }),
    password: f.password({
      nullable: true,
      required: true,
      methods: [
        "min:8",
        "minAlpha:1",
        "minDigit:1",
      ],
    }),
    account_id: f.tableRef(account, {
      description: "Reference to the company the user belongs to.",
    }),
    role: f.enum([
      "clerk",
      "agent",
      "admin",
    ], {
      description: "Disclosure clearance. Ranked agent < clerk < admin: the AI agent is the least-privileged caller, a clerk sees more, an admin sees everything.",
    }),
    password_reset: f.object({
      token: f.password(),
      expiration: f.timestamp({
        nullable: true,
      }),
      used: f.bool(),
    }),
  },
  index: [
    {
      type: "btree|unique",
      fields: [
        {
          name: "email",
          op: "asc",
        },
      ],
    },
  ],
  tags: [
    "xano:quick-start",
  ],
  // One shared, deliberately public demo password per account. Marked public so
  // `deploy --static` accepts it; the README lists it under "Going to production"
  // as the first thing to remove. The column hashes on write, so `auth/login`
  // works with it too. Seed position is identity: user 1 = clerk, 2 = agent, 3 = admin.
  publicSeed: ["password"],
  seed: [
    {
      name: "Priya Nair",
      email: "clerk@records.gov.example",
      password: "ClerkDemo2026",
      role: "clerk",
    },
    {
      name: "Disclosure Agent",
      email: "agent@records.gov.example",
      password: "AgentDemo2026",
      role: "agent",
    },
    {
      name: "Marcus Reed",
      email: "admin@records.gov.example",
      password: "AdminDemo2026",
      role: "admin",
    },
  ],
});
