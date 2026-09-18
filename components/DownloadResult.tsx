import { DownloadIcon, ImageIcon, VideoIcon } from "@/components/Icons";

export type DownloadItem = {
  type: "image" | "video" | "audio";
  downloadUrl: string;
  filename: string;
  thumbnailUrl?: string;
};

export type DownloadSuccess =
  | { success: true; type: "video"; downloadUrl: string; filename: string; requestedQuality: string }
  | { success: true; type: "picker"; items: DownloadItem[]; requestedQuality: string };

type Props = {
  result: DownloadSuccess;
  onReset: () => void;
};

const qualityLabel = (quality: string) => quality === "max" ? "Maximum" : `${quality}p`;

function DownloadLink({ href, filename, children }: { href: string; filename: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      download={filename}
      rel="noopener noreferrer"
      className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:translate-y-px sm:w-auto"
    >
      <DownloadIcon className="size-4" />
      {children}
    </a>
  );
}

export function DownloadResult({ result, onReset }: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4"><path d="m4 10 4 4 8-8" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold text-emerald-950">Video ready</h2>
          <p className="mt-0.5 text-xs text-emerald-800">Requested quality: {qualityLabel(result.requestedQuality)}</p>
        </div>
      </div>

      {result.type === "video" ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-3">
          <p className="line-clamp-2 break-all text-sm font-semibold leading-5 text-slate-800" title={result.filename}>{result.filename}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DownloadLink href={result.downloadUrl} filename={result.filename}>Download Video</DownloadLink>
            <button type="button" onClick={onReset} className="focus-ring min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Download Again</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-6 text-emerald-900">This post contains multiple media items. Choose what you want to save.</p>
          {result.items.map((item, index) => {
            const label = item.type === "image" ? "Image" : item.type === "audio" ? "Audio" : "Video";
            return (
              <div key={`${item.downloadUrl}-${index}`} className="flex min-w-0 flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  {item.thumbnailUrl ? (
                    // The source is supplied by the trusted Cobalt response, and a plain img supports arbitrary media hosts.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" className="size-12 shrink-0 rounded-lg bg-slate-100 object-cover" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                      {item.type === "image" ? <ImageIcon className="size-5" /> : <VideoIcon className="size-5" />}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label} {index + 1}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{item.filename}</p>
                  </div>
                </div>
                <DownloadLink href={item.downloadUrl} filename={item.filename}>Download</DownloadLink>
              </div>
            );
          })}
          <button type="button" onClick={onReset} className="focus-ring w-full min-h-11 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50">Download Again</button>
        </div>
      )}
    </div>
  );
}
