import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function SparklesIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3Z" /><path d="m19 14-.75 2.25L16 17l2.25.75L19 20l.75-2.25L22 17l-2.25-.75L19 14Z" /><path d="m5 3-.75 2.25L2 6l2.25.75L5 9l.75-2.25L8 6l-2.25-.75L5 3Z" /></svg>;
}

export function ArrowRightIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>;
}

export function CheckIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

export function ClipboardIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><rect width="14" height="16" x="5" y="5" rx="2" /><path d="M9 5V3h6v2" /></svg>;
}

export function DownloadIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
}

export function LinkIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
}

export function WarningIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="m10.3 3.7-8.1 14A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.7-3.3l-8.1-14a2 2 0 0 0-3.4 0Z" /></svg>;
}

export function ImageIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>;
}

export function VideoIcon(props: IconProps) {
  return <svg {...base} {...props} aria-hidden="true"><path d="m16 13 5 3V8l-5 3" /><rect width="13" height="14" x="3" y="5" rx="2" /></svg>;
}
