import { isIP } from "node:net";

export const ALLOWED_QUALITIES = ["max", "2160", "1440", "1080", "720", "480", "360", "240"] as const;
export type Quality = (typeof ALLOWED_QUALITIES)[number];

// Add a hostname here when enabling another platform. Use exact hosts rather than
// broad suffix matching so lookalike domains cannot pass validation.
export const SUPPORTED_HOSTNAMES = new Set([
  "instagram.com",
  "www.instagram.com",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("::ffff:")
  );
}

export function isPrivateOrLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost") || normalized.endsWith(".local")) return true;
  const ipVersion = isIP(normalized.replace(/^\[|\]$/g, ""));
  if (ipVersion === 4) return isPrivateIpv4(normalized);
  if (ipVersion === 6) return isPrivateIpv6(normalized);
  return false;
}

export type UrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function validateMediaUrl(input: unknown): UrlValidationResult {
  if (typeof input !== "string" || !input.trim()) return { ok: false, error: "Please enter an Instagram or YouTube video URL." };
  if (input.length > 2048) return { ok: false, error: "The URL is too long." };

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return { ok: false, error: "Please enter a valid URL." };
  }

  if (parsed.protocol !== "https:") return { ok: false, error: "Only secure HTTPS video links are supported." };
  if (parsed.username || parsed.password) return { ok: false, error: "URLs containing credentials are not supported." };
  if (parsed.port && parsed.port !== "443") return { ok: false, error: "URLs using custom ports are not supported." };

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (isPrivateOrLocalHostname(hostname)) return { ok: false, error: "Local or private network URLs are not allowed." };
  if (!SUPPORTED_HOSTNAMES.has(hostname)) return { ok: false, error: "This website is not supported. Please use a public Instagram or YouTube link." };

  parsed.hostname = hostname;
  parsed.hash = "";
  return { ok: true, url: parsed.toString() };
}

export function parseQuality(input: unknown): Quality | null {
  if (input === undefined || input === null || input === "") return "1080";
  if (typeof input !== "string") return null;
  return (ALLOWED_QUALITIES as readonly string[]).includes(input) ? input as Quality : null;
}
