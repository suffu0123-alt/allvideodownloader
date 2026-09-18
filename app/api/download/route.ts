import { NextRequest, NextResponse } from "next/server";
import { validateShortcutAccess } from "@/lib/auth";
import { CobaltRequestError, requestCobalt } from "@/lib/cobalt";
import { downloadRateLimiter, getClientIp } from "@/lib/rateLimit";
import { parseQuality, validateMediaUrl } from "@/lib/validation";
import {
  isYouTubeUrl,
  prepareYouTubeDownload,
  youtubeFallbackEnabled,
  YouTubeFallbackError,
} from "@/lib/youtubeFallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonHeaders = { "Cache-Control": "no-store" };

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ success: false, error }, { status, headers: { ...jsonHeaders, ...headers } });
}

function getAppOrigin(request: NextRequest): string {
  const configured = process.env.APP_BASE_URL?.trim();
  const candidates: string[] = [];
  if (configured) candidates.push(configured);

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host && !/[\s/\\]/.test(host)) {
    const protocol = forwardedProtocol === "https" || forwardedProtocol === "http"
      ? forwardedProtocol
      : request.nextUrl.protocol.replace(":", "");
    candidates.push(`${protocol}://${host}`);
  }
  candidates.push(request.nextUrl.origin);

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
    } catch {
      // Try the next safe origin candidate.
    }
  }
  return "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 4096) return errorResponse("The request body is too large.", 413);

  const auth = validateShortcutAccess(request.headers);
  if (!auth.ok) return errorResponse(auth.error, auth.error.includes("misconfigured") || auth.error.includes("not configured") ? 503 : 401);

  const limit = downloadRateLimiter.check(getClientIp(request.headers));
  const rateHeaders = {
    "X-RateLimit-Limit": String(limit.limit),
    "X-RateLimit-Remaining": String(limit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(limit.resetAt / 1000)),
  };
  if (!limit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return errorResponse("Too many download requests. Please try again later.", 429, { ...rateHeaders, "Retry-After": String(retryAfter) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, rateHeaders);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Request body must be a JSON object.", 400, rateHeaders);

  const input = body as Record<string, unknown>;
  const validatedUrl = validateMediaUrl(input.url);
  if (!validatedUrl.ok) return errorResponse(validatedUrl.error, 400, rateHeaders);

  const quality = parseQuality(input.quality);
  if (!quality) return errorResponse("Choose a supported video quality.", 400, rateHeaders);

  try {
    if (isYouTubeUrl(validatedUrl.url) && youtubeFallbackEnabled()) {
      const result = await prepareYouTubeDownload(validatedUrl.url, quality, getAppOrigin(request));
      return NextResponse.json(result, { status: 200, headers: { ...jsonHeaders, ...rateHeaders } });
    }
    const result = await requestCobalt(validatedUrl.url, quality);
    return NextResponse.json(result, { status: 200, headers: { ...jsonHeaders, ...rateHeaders } });
  } catch (error) {
    if (error instanceof CobaltRequestError || error instanceof YouTubeFallbackError) {
      return errorResponse(error.message, error.statusCode, rateHeaders);
    }
    return errorResponse("The video could not be processed. Please try again later.", 500, rateHeaders);
  }
}

export function GET() {
  return errorResponse("Use POST with a JSON body containing url and quality.", 405, { Allow: "POST" });
}
