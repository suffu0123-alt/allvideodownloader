import { spawn } from "node:child_process";
import { once } from "node:events";
import type { Readable, Writable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { getYouTubePlan, type YouTubeSource } from "@/lib/youtubeFallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

const RANGE_SIZE = 2 * 1024 * 1024;
const RANGE_CONCURRENCY = 4;

async function fetchRange(source: YouTubeSource, start: number, end: number, signal: AbortSignal): Promise<Buffer> {
  const headers = Object.fromEntries(
    Object.entries(source.headers).filter(([name]) => !["accept-encoding", "host", "range"].includes(name.toLowerCase())),
  );
  headers["Accept-Encoding"] = "identity";
  headers.Range = `bytes=${start}-${end}`;

  const response = await fetch(source.url, {
    headers,
    redirect: "error",
    signal,
  });
  const expectedContentRange = `bytes ${start}-${end}/`;
  if (response.status !== 206 || !response.headers.get("content-range")?.startsWith(expectedContentRange)) {
    await response.body?.cancel();
    throw new Error("The media server did not honor the requested byte range.");
  }

  const chunk = Buffer.from(await response.arrayBuffer());
  if (chunk.byteLength !== end - start + 1) throw new Error("The media server returned an incomplete byte range.");
  return chunk;
}

async function downloadInRanges(source: YouTubeSource, destination: Writable, signal: AbortSignal): Promise<void> {
  let nextStart = 0;
  const nextBatch = (): Promise<Buffer[]> | null => {
    if (nextStart >= source.contentLength) return null;
    const batch: Promise<Buffer>[] = [];
    for (let index = 0; index < RANGE_CONCURRENCY && nextStart < source.contentLength; index += 1) {
      const start = nextStart;
      const end = Math.min(source.contentLength - 1, start + RANGE_SIZE - 1);
      nextStart = end + 1;
      batch.push(fetchRange(source, start, end, signal));
    }
    return Promise.all(batch);
  };

  let pendingBatch = nextBatch();
  while (pendingBatch) {
    // Promise.all preserves request order, so ffmpeg receives the original file
    // byte-for-byte even though each batch downloads in parallel.
    const chunks = await pendingBatch;
    // Start the next requests before writing this batch to keep the network busy
    // while ffmpeg applies backpressure to the input pipe.
    pendingBatch = nextBatch();
    for (const chunk of chunks) {
      if (!destination.write(chunk)) await once(destination, "drain", { signal });
    }
  }
  destination.end();
}

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const plan = getYouTubePlan(id);
  if (!plan) return jsonError("This download link is invalid or has expired. Prepare the video again.", 404);

  const ffmpeg = process.env.FFMPEG_PATH?.trim();
  if (!ffmpeg) return jsonError("Video merging is not configured on this server.", 503);

  const [video, audio] = plan.sources;
  const args = [
    "-hide_banner", "-loglevel", "error",
    "-i", "pipe:3",
    "-i", "pipe:4",
    "-map", "0:v:0", "-map", "1:a:0",
    "-c", "copy",
    "-movflags", "frag_keyframe+empty_moov",
    "-f", "mp4",
    "pipe:1",
  ];

  const child = spawn(ffmpeg, args, {
    stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  const ffmpegOutput = child.stdio[1] as Readable;
  const ffmpegError = child.stdio[2] as Readable;
  const videoInput = child.stdio[3] as Writable;
  const audioInput = child.stdio[4] as Writable;
  const sourceAbortController = new AbortController();

  // A closed ffmpeg input can otherwise surface as an unhandled EPIPE while a
  // client is cancelling a download.
  videoInput.on("error", () => undefined);
  audioInput.on("error", () => undefined);

  ffmpegError.resume();

  const stop = () => {
    sourceAbortController.abort();
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  };

  void downloadInRanges(video, videoInput, sourceAbortController.signal).catch(stop);
  void downloadInRanges(audio, audioInput, sourceAbortController.signal).catch(stop);

  let firstChunk: Buffer;
  try {
    firstChunk = await new Promise<Buffer>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Video stream timed out")), 20_000);
      const fail = () => {
        clearTimeout(timer);
        reject(new Error("Video stream failed"));
      };
      child.once("error", fail);
      child.once("close", fail);
      ffmpegOutput.once("data", (chunk: Buffer) => {
        clearTimeout(timer);
        child.removeListener("error", fail);
        child.removeListener("close", fail);
        ffmpegOutput.pause();
        resolve(chunk);
      });
    });
  } catch {
    stop();
    return jsonError("The video streams could not be merged. Prepare the video again.", 502);
  }

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(firstChunk);
      ffmpegOutput.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      ffmpegOutput.on("end", () => controller.close());
      ffmpegOutput.on("error", (error: Error) => controller.error(error));
      ffmpegOutput.resume();
    },
    cancel() {
      stop();
    },
  });

  request.signal.addEventListener("abort", stop, { once: true });

  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": contentDisposition(plan.filename),
      "Content-Type": "video/mp4",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
