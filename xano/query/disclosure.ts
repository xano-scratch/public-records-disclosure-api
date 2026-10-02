import { apiGroup } from "@xanots/sdk";

// The one governed API layer. Every disclosure decision, for a human or the AI
// agent, is enforced by the endpoints in this group. canonical is pinned so the
// public paths are stable and `xano:routes` resolves without a lock file.
export const DisclosureApi = apiGroup({
  name: "Records Disclosure",
  canonical: "disclosure",
  description: "Governed public-records disclosure: search, retrieve, agent-retrieve, audit, and policy.",
});
