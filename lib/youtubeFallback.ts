import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { promisify } from "node:util";
import type { Quality } from "@/lib/validation";

const execFileAsync = promisify(execFile);
const PLAN_TTL_MS = 10 * 60 * 1000;

type YtDlpFormat = {
  url?: unknown;
  http_headers?: unknown;
  vcodec?: unknown;
  acodec?: unknown;
  filesize?: unknown;
};

type YtDlpResult = {
  title?: unknown;
  requested_formats?: unknown;
};

export type YouTubeSource = {
  url: string;
  headers: Record<string, string>;
  contentLength: number;
};

export type YouTubePlan = {
  sources: YouTubeSource[];
  filename: string;
  expiresAt: number;
};

const globalPlans = globalThis as typeof globalThis & {
  __youtubeDownloadPlans?: Map<string, YouTubePlan>;
};

const plans = globalPlans.__youtubeDownloadPlans ?? new Map<string, YouTubePlan>();
globalPlans.__youtubeDownloadPlans = plans;

export class YouTubeFallbackError extends Error {
  constructor(message: string, public readonly statusCode = 502) {
    super(message);
    this.name = "YouTubeFallbackError";
  }
}

export function isYouTubeUrl(url: string): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(hostname);
}

export function youtubeFallbackEnabled(): boolean {
  return Boolean(process.env.YTDLP_PATH?.trim() && process.env.FFMPEG_PATH?.trim());
}

function formatSelector(quality: Quality): string {
  const height = quality === "max" ? "" : `[height<=${quality}]`;
  return `bestvideo${height}[ext=mp4]+bestaudio[ext=m4a]`;
}

function safeHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const headers: Record<string, string> = {};
  for (const [name, rawValue] of Object.entries(value)) {
    if (!/^[A-Za-z0-9-]+$/.test(name) || typeof rawValue !== "string") continue;
    if (rawValue.includes("\r") || rawValue.includes("\n")) continue;
    headers[name] = rawValue;
  }
  return headers;
}

function safeMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const isGoogleVideo = hostname === "googlevideo.com" || hostname.endsWith(".googlevideo.com");
    return parsed.protocol === "https:" && isGoogleVideo ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function safeContentLength(format: YtDlpFormat | undefined, mediaUrl: string): number | null {
  const fromMetadata = typeof format?.filesize === "number" ? format.filesize : Number.NaN;
  const fromUrl = Number(new URL(mediaUrl).searchParams.get("clen"));
  const value = Number.isSafeInteger(fromMetadata) ? fromMetadata : fromUrl;
  return Number.isSafeInteger(value) && value > 0 && value <= 25 * 1024 * 1024 * 1024 ? value : null;
}

function safeFilename(title: unknown): string {
  const base = typeof title === "string" ? title : "video";
  const cleaned = base.replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "_").trim().slice(0, 160);
  return `${cleaned || "video"}.mp4`;
}

function prunePlans() {
  const now = Date.now();
  for (const [id, plan] of plans) {
    if (plan.expiresAt <= now) plans.delete(id);
  }
}

export async function prepareYouTubeDownload(url: string, quality: Quality, appOrigin: string) {
  const executable = process.env.YTDLP_PATH?.trim();
  if (!executable) throw new YouTubeFallbackError("YouTube downloading is not configured on this server.", 503);

  let stdout: string;
  try {
    const result = await execFileAsync(executable, [
      "--no-playlist",
      "--no-warnings",
      "--dump-single-json",
      "--skip-download",
      "--socket-timeout", "10",
      "--extractor-retries", "2",
      "-f", formatSelector(quality),
      url,
    ], {
      encoding: "utf8",
      maxBuffer: 12 * 1024 * 1024,
      timeout: 30_000,
      windowsHide: true,
    });
    stdout = result.stdout;
  } catch {
    throw new YouTubeFallbackError("YouTube could not prepare this public video. It may be unavailable or restricted.", 422);
  }

  let data: YtDlpResult;
  try {
    data = JSON.parse(stdout) as YtDlpResult;
  } catch {
    throw new YouTubeFallbackError("YouTube returned an invalid media response.");
  }

  const formats = Array.isArray(data.requested_formats) ? data.requested_formats as YtDlpFormat[] : [];
  const video = formats.find((format) => format.vcodec !== "none");
  const audio = formats.find((format) => format.acodec !== "none" && format.vcodec === "none");
  const sources = [video, audio].map((format) => {
    const mediaUrl = safeMediaUrl(format?.url);
    const contentLength = mediaUrl ? safeContentLength(format, mediaUrl) : null;
    return mediaUrl && contentLength
      ? { url: mediaUrl, headers: safeHeaders(format?.http_headers), contentLength }
      : null;
  }).filter((source): source is YouTubeSource => source !== null);

  if (sources.length !== 2) {
    throw new YouTubeFallbackError("YouTube did not provide compatible video and audio streams for this quality.", 422);
  }

  prunePlans();
  const id = randomBytes(24).toString("base64url");
  const filename = safeFilename(data.title);
  plans.set(id, { sources, filename, expiresAt: Date.now() + PLAN_TTL_MS });

  const downloadUrl = new URL(`/api/media/youtube?id=${encodeURIComponent(id)}`, appOrigin);

  return {
    success: true as const,
    type: "video" as const,
    downloadUrl: downloadUrl.toString(),
    filename,
    requestedQuality: quality,
  };
}

export function getYouTubePlan(id: string): YouTubePlan | null {
  if (!/^[A-Za-z0-9_-]{32}$/.test(id)) return null;
  const plan = plans.get(id);
  if (!plan || plan.expiresAt <= Date.now()) {
    plans.delete(id);
    return null;
  }
  return plan;
}
