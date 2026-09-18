export const QUALITY_OPTIONS = [
  { value: "max", label: "Maximum Quality" },
  { value: "2160", label: "2160p - 4K" },
  { value: "1440", label: "1440p - 2K" },
  { value: "1080", label: "1080p - Full HD" },
  { value: "720", label: "720p - HD" },
  { value: "480", label: "480p" },
  { value: "360", label: "360p" },
  { value: "240", label: "240p" },
] as const;

type QualitySelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function QualitySelector({ value, onChange, disabled = false }: QualitySelectorProps) {
  return (
    <div>
      <label htmlFor="quality" className="mb-2 block text-sm font-bold text-slate-800">Preferred quality</label>
      <div className="relative">
        <select
          id="quality"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="focus-ring h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 font-semibold text-slate-800 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        >
          {QUALITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500">
          <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">Selected quality is preferred quality. The downloaded resolution depends on what the source platform provides.</p>
    </div>
  );
}
