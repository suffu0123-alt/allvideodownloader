import type { Quality } from "@/lib/validation";

type CobaltPickerItem = { type?: unknown; url?: unknown; thumb?: unknown };
type CobaltPayload = {
  status?: unknown;
  url?: unknown;
  filename?: unknown;
  picker?: unknown;
  audio?: unknown;
  audioFilename?: unknown;
  error?: { code?: unknown; context?: unknown } | unknown;
};

export type MediaItem = {
  type: "image" | "video" | "audio";
  downloadUrl: string;
  filename: string;
  thumbnailUrl?: string;
};

export type CobaltResult =
  | { success: true; type: "video"; downloadUrl: string; filename: string; requestedQuality: Quality }
  | { success: true; type: "picker"; items: MediaItem[]; requestedQuality: Quality };

export class CobaltRequestError extends Error {
  constructor(message: string, public readonly statusCode = 502) {
    super(message);
    this.name = "CobaltRequestError";
  }
}

const FRIENDLY_ERRORS: Record<string, string> = {
  "error.api.auth.api_key.invalid": "The video service rejected its API key. Please contact the site owner.",
  "error.api.auth.api_key.missing": "The video service requires an API key. Please contact the site owner.",
  "error.api.link.invalid": "That video link is not valid or is no longer available.",
  "error.api.link.unsupported": "That link is not supported.",
  "error.api.fetch.fail": "The source platform could not provide this video. It may be unavailable or private.",
  "error.api.content.video.unavailable": "This video is unavailable or not publicly accessible.",
  "error.api.rate_limit": "The video service is busy. Please try again later.",
};

function parseApiUrl(): URL {
  const raw = process.env.COBALT_API_URL?.trim();
  if (!raw) throw new CobaltRequestError("The download service has not been configured yet.", 503);
  try {
    const url = new URL(raw);
    if (!(["http:", "https:"] as string[]).includes(url.protocol) || url.username || url.password) throw new Error("unsafe URL");
    return url;
  } catch {
    throw new CobaltRequestError("The download service is incorrectly configured.", 503);
  }
}

function normalizedHttpUrl(value: unknown, base: URL): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const parsed = new URL(value, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function cleanFilename(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const cleaned = value.replace(/[\u0000-\u001f\u007f/\\]/g, "_").trim();
  return cleaned.slice(0, 180) || fallback;
}

function extensionFor(type: string): string {
  if (type === "photo") return "jpg";
  if (type === "gif") return "gif";
  if (type === "audio") return "mp3";
  return "mp4";
}

function friendlyCobaltError(payload: CobaltPayload): string {
  const error = payload.error;
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
  if (FRIENDLY_ERRORS[code]) return FRIENDLY_ERRORS[code];
  if (code.includes("private") || code.includes("login") || code.includes("auth")) {
    return "This content is not publicly accessible. Private or login-protected media is not supported.";
  }
  if (code.includes("rate")) return "The video service is busy. Please try again later.";
  return "The video could not be processed. Check that it is public and try again.";
}

export async function requestCobalt(mediaUrl: string, quality: Quality): Promise<CobaltResult> {
  const apiUrl = parseApiUrl();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const apiKey = process.env.COBALT_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Api-Key ${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response: Response;

  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ url: mediaUrl, videoQuality: quality, downloadMode: "auto" }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new CobaltRequestError("The video service took too long to respond. Please try again.", 504);
    throw new CobaltRequestError("The video service is temporarily unavailable. Please try again later.", 502);
  } finally {
    clearTimeout(timeout);
  }

  let payload: CobaltPayload;
  try {
    payload = await response.json() as CobaltPayload;
  } catch {
    throw new CobaltRequestError("The video service returned an invalid response.", 502);
  }

  if (!response.ok || payload.status === "error") {
    throw new CobaltRequestError(friendlyCobaltError(payload), response.status === 429 ? 429 : 422);
  }

  if (payload.status === "redirect" || payload.status === "tunnel") {
    const downloadUrl = normalizedHttpUrl(payload.url, apiUrl);
    if (!downloadUrl) throw new CobaltRequestError("The video service did not return a safe download link.", 502);
    return {
      success: true,
      type: "video",
      downloadUrl,
      filename: cleanFilename(payload.filename, "video.mp4"),
      requestedQuality: quality,
    };
  }

  if (payload.status === "picker") {
    const items: MediaItem[] = [];
    const picker = Array.isArray(payload.picker) ? payload.picker as CobaltPickerItem[] : [];
    picker.forEach((item, index) => {
      const downloadUrl = normalizedHttpUrl(item.url, apiUrl);
      if (!downloadUrl) return;
      const rawType = typeof item.type === "string" ? item.type : "video";
      const type = rawType === "photo" ? "image" : "video";
      const media: MediaItem = {
        type,
        downloadUrl,
        filename: `media-${index + 1}.${extensionFor(rawType)}`,
      };
      const thumbnailUrl = normalizedHttpUrl(item.thumb, apiUrl);
      if (thumbnailUrl) media.thumbnailUrl = thumbnailUrl;
      items.push(media);
    });

    const audioUrl = normalizedHttpUrl(payload.audio, apiUrl);
    if (audioUrl) {
      items.push({
        type: "audio",
        downloadUrl: audioUrl,
        filename: cleanFilename(payload.audioFilename, "audio.mp3"),
      });
    }

    if (!items.length) throw new CobaltRequestError("The video service returned no downloadable media.", 502);
    return { success: true, type: "picker", items, requestedQuality: quality };
  }

  if (payload.status === "local-processing") {
    throw new CobaltRequestError("This media requires local processing, which this downloader does not proxy. Try another quality.", 422);
  }

  throw new CobaltRequestError("The video service returned an unsupported response.", 502);
}
