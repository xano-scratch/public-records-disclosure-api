import { apiGroup } from "@xanots/sdk";

// One API group holds every endpoint; the endpoint NAMES carry the group/name
// structure (auth/login, records/releasable, ...). The canonical is pinned (and
// app-specific, so it will not collide with a sibling app on the shared instance)
// which keeps public paths stable and lets getPath() resolve in the browser
// bundle without a lock file.
export const api = apiGroup({
  name: "records-disclosure",
  canonical: "records-disclosure",
  description:
    "Public records disclosure API, one governed read path for human clerks and AI agents.",
});
