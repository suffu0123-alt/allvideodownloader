import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "iPhone Shortcut Setup",
  description: "Create an Apple Shortcut that saves public Instagram and YouTube videos to Photos.",
};

const mappings = [
  ["Maximum", "max"],
  ["2160p", "2160"],
  ["1440p", "1440"],
  ["1080p", "1080"],
  ["720p", "720"],
  ["480p", "480"],
  ["360p", "360"],
  ["240p", "240"],
];

const steps = [
  <>Add <strong>Get Clipboard</strong>.</>,
  <>Add <strong>Choose from Menu</strong>.</>,
  <>Create these menu options: <strong>Maximum, 2160p, 1440p, 1080p, 720p, 480p, 360p,</strong> and <strong>240p</strong>.</>,
  <>Inside each menu branch, add <strong>Text</strong> with its mapped value below, then add <strong>Set Variable</strong> and name it <strong>Quality</strong>.</>,
  <>After the menu, add <strong>Get Contents of URL</strong>.</>,
  <>Set the URL to <code>http://YOUR-MAC-IP:3000/api/download</code> on the same Wi-Fi, or use your real HTTPS domain after deployment.</>,
  <>Open its options and set <strong>Method</strong> to <strong>POST</strong>.</>,
  <>Set <strong>Request Body</strong> to <strong>JSON</strong>.</>,
  <>Add <code>url</code> with the <strong>Clipboard</strong> variable and <code>quality</code> with the <strong>Quality</strong> variable.</>,
  <>Add <strong>Get Dictionary Value</strong> and get <code>downloadUrl</code> from the previous action.</>,
  <>Add another <strong>Get Contents of URL</strong>, using <code>downloadUrl</code> as its URL.</>,
  <>Add <strong>Save to Photo Album</strong> and pass it the downloaded file.</>,
  <>Add <strong>Show Notification</strong> with: <code>Video saved to Photos ✅</code>.</>,
];

export default function ShortcutPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="page-shell safe-bottom mx-auto w-full max-w-5xl pt-4 sm:px-6 sm:pt-7 lg:px-8">
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-xl text-sm font-extrabold text-slate-950 sm:text-base">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 sm:size-10"><SparklesIcon className="size-4" /></span>
            <span className="truncate">AllVideoDownloader</span>
          </Link>
          <Link href="/" className="focus-ring ml-3 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:text-indigo-700 sm:px-4 sm:text-sm">
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back home</span>
            <ArrowRightIcon className="size-3.5 rotate-180" />
          </Link>
        </nav>

        <header className="pb-9 pt-12 sm:pb-12 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Apple Shortcuts</p>
          <h1 className="mt-3 max-w-3xl text-balance text-[clamp(2.25rem,8vw,3.75rem)] font-black leading-[1.02] tracking-[-0.045em] text-slate-950">Save a copied video to Photos in one run.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">This Shortcut sends a public Instagram or YouTube link to your own downloader API, asks for a preferred quality, and saves the returned video to your photo library.</p>
        </header>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <section className="min-w-0 rounded-3xl border border-white bg-white/90 p-4 shadow-xl shadow-slate-200/50 sm:p-8" aria-labelledby="build-shortcut">
            <h2 id="build-shortcut" className="text-xl font-extrabold text-slate-950">Build the Shortcut</h2>
            <ol className="mt-6 space-y-5">
              {steps.map((step, index) => (
                <li key={index} className="flex min-w-0 gap-3 sm:gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-black text-indigo-700">{index + 1}</span>
                  <div className="min-w-0 break-words pt-1 text-sm leading-6 text-slate-700 [&_code]:break-all [&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900">{step}</div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/40">
              <h2 className="font-extrabold">Quality mappings</h2>
              <div className="mt-4 divide-y divide-white/10">
                {mappings.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-slate-300">{label}</span>
                    <code className="rounded bg-white/10 px-2 py-1 text-xs font-bold text-white">{value}</code>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="flex items-center gap-2 text-indigo-900"><CheckIcon className="size-4" /><h2 className="font-extrabold">Optional private key</h2></div>
              <p className="mt-3 text-sm leading-6 text-indigo-900/80">If your server uses <code className="font-mono text-xs">SHORTCUT_API_KEY</code>, add a Header to the first <strong>Get Contents of URL</strong> action:</p>
              <div className="mt-3 overflow-hidden rounded-xl bg-white p-3 font-mono text-xs leading-6 text-slate-700">
                <div>X-Shortcut-Key</div>
                <div className="break-all text-slate-500">YOUR_KEY</div>
              </div>
              <p className="mt-3 text-xs leading-5 text-indigo-900/70">Keep the key only in your personal Shortcut. Never place it in website code.</p>
            </section>
          </aside>
        </div>

        <section className="mt-6 break-words rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-950 sm:p-5 [&_code]:break-all">
          <strong>Picker note:</strong> Some Instagram carousel posts return multiple items. The website displays each item. The simple Shortcut above expects a single video response with <code className="font-mono text-xs">downloadUrl</code>; use the website for carousel results, or extend the Shortcut to repeat over the returned <code className="font-mono text-xs">items</code> list.
        </section>

        <p className="mb-6 mt-10 text-center text-xs leading-5 text-slate-500">Only download public content you own or have permission to save.</p>
      </div>
    </main>
  );
}
