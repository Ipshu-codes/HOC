import type { Dictionary } from "@/lib/i18n";

interface HeritageSectionNavProps {
  labels: Dictionary["heritage"];
}

/** Mobile shortcuts between the site's story and its practical visiting details. */
export default function HeritageSectionNav({ labels }: HeritageSectionNavProps) {
  return (
    <nav
      aria-label={labels.onThisPage}
      className="fixed inset-x-0 z-20 mx-auto flex w-[min(calc(100%-2rem),28rem)] gap-1 rounded-full bg-ink/95 p-1.5 shadow-xl ring-1 ring-white/30 backdrop-blur md:hidden"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <a
        href="#history"
        className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-cream px-4 font-bold text-ink hover:bg-crimson hover:text-white"
      >
        {labels.explore}
      </a>
      <a
        href="#how-to-visit"
        className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-cream px-4 font-bold text-ink hover:bg-crimson hover:text-white"
      >
        {labels.visit}
      </a>
    </nav>
  );
}
