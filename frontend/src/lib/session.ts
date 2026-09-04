export type Role = "clerk" | "agent" | "admin";
export type SessionUser = { id: number; email: string; role: Role; display_name: string };
export type Session = { token: string; user: SessionUser };

const KEY = "prda.session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
export function saveSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function clearSession() {
  localStorage.removeItem(KEY);
}

// The seeded demo accounts, one per role, so the login screen can offer one-tap
// sign-in. Passwords are demo fixtures (the same ones seed/run loads).
export const DEMO_ACCOUNTS: {
  role: Role;
  email: string;
  password: string;
  label: string;
  blurb: string;
}[] = [
  {
    role: "agent",
    email: "agent@records.gov.example",
    password: "agent-demo-2026",
    label: "Records Assistant (AI)",
    blurb: "Least clearance. Sees public fields; restricted redacted, sealed withheld.",
  },
  {
    role: "clerk",
    email: "clerk@records.gov.example",
    password: "clerk-demo-2026",
    label: "Dana the Clerk",
    blurb: "Human clerk. Also sees restricted fields; sealed still withheld.",
  },
  {
    role: "admin",
    email: "admin@records.gov.example",
    password: "admin-demo-2026",
    label: "Alex the Admin",
    blurb: "Full clearance. Sees every field and can switch the active policy.",
  },
];

export const ROLE_RANK: Record<Role, number> = { agent: 0, clerk: 1, admin: 2 };
export const ROLE_LABEL: Record<Role, string> = { agent: "AI agent", clerk: "Clerk", admin: "Admin" };
