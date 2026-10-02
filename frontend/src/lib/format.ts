// Shared display helpers: the status/action/sensitivity vocabulary (CRAFT colour
// rules), labels, and date formatting. Keep the badge vocabulary small and
// consistent so a reader learns it once.

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "outline";

export type Meta = { variant: BadgeVariant; label: string };

export function actionMeta(action: string): Meta {
  switch (action) {
    case "release":
      return { variant: "success", label: "Released" };
    case "redact":
      return { variant: "warning", label: "Redacted" };
    case "withhold":
      return { variant: "destructive", label: "Withheld" };
    default:
      return { variant: "secondary", label: action };
  }
}

export function sensitivityMeta(sensitivity: string): Meta {
  switch (sensitivity) {
    case "public":
      return { variant: "secondary", label: "Public" };
    case "restricted":
      return { variant: "warning", label: "Restricted" };
    case "sealed":
      return { variant: "destructive", label: "Sealed" };
    default:
      return { variant: "secondary", label: sensitivity };
  }
}

export function statusMeta(status: string): Meta {
  switch (status) {
    case "open":
      return { variant: "warning", label: "Open" };
    case "fulfilled":
      return { variant: "success", label: "Fulfilled" };
    case "closed":
      return { variant: "secondary", label: "Closed" };
    default:
      return { variant: "secondary", label: status };
  }
}

export function roleLabel(role: string): string {
  switch (role) {
    case "clerk":
      return "Records clerk";
    case "agent":
      return "Disclosure agent";
    case "admin":
      return "Records admin";
    default:
      return role;
  }
}

export function titleCase(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

export function formatDateTime(epochms: number | null | undefined): string {
  if (!epochms) return "—";
  try {
    return new Date(epochms).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
