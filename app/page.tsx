import Link from "next/link";
import { Downloader } from "@/components/Downloader";
import { ArrowRightIcon, CheckIcon, LinkIcon, SparklesIcon } from "@/components/Icons";

const steps = [
  { number: "01", title: "Copy video link", text: "Copy a public Instagram or YouTube video link." },
  { number: "02", title: "Paste the link", text: "Paste it above, or use the clipboard button." },
  { number: "03", title: "Choose quality", text: "Pick your preferred output resolution." },
  { number: "04", title: "Download", text: "Save the available media directly to your device." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="page-shell safe-bottom mx-auto flex w-full max-w-7xl flex-col pt-4 sm:px-6 sm:pt-7 lg:px-8">
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-xl text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 sm:size-10">
              <SparklesIcon className="size-4" />
            </span>
            <span className="truncate">AllVideoDownloader</span>
          </Link>
          <Link
            href="/shortcut"
            className="focus-ring ml-3 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-3 text-xs font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-indigo-200 hover:text-indigo-700 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Shortcut</span>
            <span className="hidden sm:inline">iPhone Shortcut</span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </nav>

        <section className="grid items-center gap-9 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(32rem,1.1fr)] lg:gap-14 lg:pb-24 lg:pt-24" aria-labelledby="page-title">
          <header className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/90 px-3 py-1.5 text-xs font-bold text-indigo-700 sm:text-sm">
              <CheckIcon className="size-3.5" />
              Fast, private and server-side
            </div>
            <h1 id="page-title" className="text-balance text-[clamp(2.5rem,10vw,4.75rem)] font-black leading-[0.98] tracking-[-0.055em] text-slate-950">
              Save videos.<br />Keep the <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">quality.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-slate-600 sm:text-lg lg:mx-0 lg:max-w-lg">
              Download public Instagram and YouTube videos in the resolution that works for your device.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 sm:text-sm lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><CheckIcon className="size-4 text-emerald-500" /> No account needed</span>
              <span className="inline-flex items-center gap-1.5"><CheckIcon className="size-4 text-emerald-500" /> Up to 4K</span>
              <span className="inline-flex items-center gap-1.5"><CheckIcon className="size-4 text-emerald-500" /> Mobile ready</span>
            </div>
          </header>

          <div className="relative mx-auto w-full max-w-3xl lg:mx-0" aria-label="Video downloader">
            <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/45 via-transparent to-cyan-200/45 blur-2xl" aria-hidden="true" />
            <Downloader />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl border-t border-slate-200/70 py-14 sm:py-20" aria-labelledby="how-it-works">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Simple by design</p>
            <h2 id="how-it-works" className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Four steps. Any screen.</h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-white bg-white/75 p-5 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-6">
                <span className="text-xs font-black tracking-widest text-indigo-500">{step.number}</span>
                <h3 className="mt-4 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-14 flex w-full max-w-6xl flex-col items-stretch justify-between gap-6 rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/40 sm:p-8 md:flex-row md:items-center">
          <div className="flex min-w-0 gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10">
              <LinkIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold">One tap from your iPhone</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">Build a Shortcut that downloads a copied public video and saves it to Photos.</p>
            </div>
          </div>
          <Link href="/shortcut" className="focus-ring inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-indigo-50">
            View setup guide
            <ArrowRightIcon className="size-4" />
          </Link>
        </section>

        <footer className="border-t border-slate-200/80 py-6 text-center text-xs leading-5 text-slate-500">
          For public content you own or have permission to download.
        </footer>
      </div>
    </main>
  );
}
