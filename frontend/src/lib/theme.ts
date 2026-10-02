// Light/dark mode. The OS preference is applied before first paint by the inline
// script in index.html; this module layers a persisted user override on top and
// lets components (the sonner Toaster, the header toggle) react to changes.

export type Mode = "light" | "dark";

const KEY = "prd-theme";
const listeners = new Set<(mode: Mode) => void>();

function systemMode(): Mode {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function stored(): Mode | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** The mode in effect right now, resolved from the `dark` class on <html>. */
export function getMode(): Mode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function apply(mode: Mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  listeners.forEach((fn) => fn(mode));
}

/** Apply any stored override on boot. The OS default is already applied inline. */
export function initMode() {
  const choice = stored();
  if (choice) apply(choice);
}

/** Flip the mode and persist the choice. */
export function toggleMode() {
  const next: Mode = getMode() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* sandboxed frame */
  }
  apply(next);
}

/** Subscribe to mode changes; returns an unsubscribe. */
export function watchMode(cb: (mode: Mode) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
