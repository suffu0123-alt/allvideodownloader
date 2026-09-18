"use client";

import { FormEvent, useState } from "react";
import { ClipboardIcon, DownloadIcon, WarningIcon } from "@/components/Icons";
import { DownloadResult, type DownloadSuccess } from "@/components/DownloadResult";
import { QualitySelector } from "@/components/QualitySelector";

type ApiError = { success: false; error: string };

export function Downloader() {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("1080");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<DownloadSuccess | null>(null);
  const [error, setError] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");

  async function pasteFromClipboard() {
    setPasteMessage("");
    try {
      if (!navigator.clipboard?.readText) throw new Error("Clipboard unavailable");
      const value = await navigator.clipboard.readText();
      if (!value.trim()) {
        setPasteMessage("Your clipboard is empty.");
        return;
      }
      setUrl(value.trim());
      setPasteMessage("Pasted");
    } catch {
      setPasteMessage("Clipboard access was blocked. Press and hold the field to paste.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: url.trim(), quality }),
      });
      const data = await response.json() as DownloadSuccess | ApiError;
      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error : "The video could not be processed.");
      }
      setResult(data);
      setStatus("success");
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError("");
    setPasteMessage("");
    setUrl("");
  }

  const loading = status === "loading";

  return (
    <div className="w-full min-w-0 rounded-[1.5rem] border border-white bg-white/95 p-4 shadow-2xl shadow-slate-300/40 backdrop-blur sm:rounded-[1.75rem] sm:p-7">
      <form onSubmit={submit} noValidate>
        <label htmlFor="video-url" className="mb-2 block text-sm font-bold text-slate-800">Video URL</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="video-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            required
            aria-describedby="url-help paste-status"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={loading}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Paste Instagram or YouTube video link..."
            className="focus-ring h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 placeholder:text-slate-400 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          />
          <button
            type="button"
            onClick={pasteFromClipboard}
            disabled={loading}
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ClipboardIcon className="size-4" />
            Paste
          </button>
        </div>
        <p id="url-help" className="mt-2 text-xs leading-5 text-slate-500">Public Instagram and YouTube links are supported.</p>
        {pasteMessage && <p id="paste-status" className="mt-1 text-xs text-slate-500" role="status">{pasteMessage}</p>}

        <div className="my-5 h-px bg-slate-100" />
        <QualitySelector value={quality} onChange={setQuality} disabled={loading} />

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="focus-ring mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-indigo-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="size-5 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
              Processing video...
            </>
          ) : (
            <>
              <DownloadIcon className="size-5" />
              Download Video
            </>
          )}
        </button>
      </form>

      {status === "error" && (
        <div className="mt-5 flex min-w-0 gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-900" role="alert">
          <WarningIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <div className="min-w-0">
            <p className="text-sm font-bold">We couldn&apos;t prepare that video</p>
            <p className="mt-1 break-words text-sm leading-6 text-rose-800">{error}</p>
          </div>
        </div>
      )}

      {status === "success" && result && <DownloadResult result={result} onReset={reset} />}
    </div>
  );
}
