"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/types/locale";

interface MapButtonProps {
  lang: Locale;
  /** Accessible name and tooltip, e.g. "3D Map". */
  label: string;
  /** The word shown in the circle, e.g. "Map" (part of the label, so speech control can say it). */
  short: string;
}

/**
 * Floating 3D Map button, bottom-left on every page (swapped with Nani, who is bottom-right; hidden on the
 * map page itself): a small red circle with the word "Map", as far from the edges as Nani's face.
 */
export default function MapButton({ lang, label, short }: MapButtonProps) {
  const pathname = usePathname();
  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      title={label}
      aria-label={label}
      className="fixed bottom-4 left-[max(1rem,env(safe-area-inset-left))] z-30 flex size-12 items-center justify-center rounded-full bg-crimson text-sm font-bold text-white shadow-lg ring-2 ring-white hover:bg-brick md:bottom-6 md:left-[max(1.5rem,env(safe-area-inset-left))]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {short}
    </Link>
  );
}
