import { createHash, timingSafeEqual } from "node:crypto";

export type ShortcutAuthMode = "optional" | "required";

function secureEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function validateShortcutAccess(headers: Headers): { ok: true } | { ok: false; error: string } {
  const configuredKey = process.env.SHORTCUT_API_KEY?.trim();
  const mode = (process.env.SHORTCUT_AUTH_MODE?.toLowerCase() || "optional") as ShortcutAuthMode;
  const suppliedKey = headers.get("x-shortcut-key")?.trim();

  if (mode !== "optional" && mode !== "required") {
    return { ok: false, error: "Shortcut authentication is misconfigured." };
  }
  if (mode === "required" && !configuredKey) {
    return { ok: false, error: "Shortcut authentication is not configured on the server." };
  }
  if (mode === "required" && !suppliedKey) {
    return { ok: false, error: "A Shortcut API key is required." };
  }
  if (suppliedKey && (!configuredKey || !secureEqual(suppliedKey, configuredKey))) {
    return { ok: false, error: "The Shortcut API key is invalid." };
  }
  return { ok: true };
}
