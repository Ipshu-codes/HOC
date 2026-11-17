"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/types/locale";

interface MapButtonProps {
  lang: Locale;
  label: string;
}

/**
 * Floating "🗺 3D Map" button, bottom-left on every page (swapped with Nani, who is bottom-right; hidden on the
 * map page itself). Kept small so it covers little text:
 * - phones: a 40 px red circle (icon ~20 px) inside a 44 × 44 px tap area. The link is pulled 2 px towards
 *   the corner so the circle sits as far from the edges as Nani's face on the right. The label stays as its
 *   accessible name.
 * - from 768 px: a slim "3D Map" pill (icon ~16 px).
 */
export default function MapButton({ lang, label }: MapButtonProps) {
  const pathname = usePathname();
  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      className="group fixed bottom-[calc(1rem-2px)] left-[calc(max(1rem,env(safe-area-inset-left))-2px)] z-30 flex size-[44px] items-center justify-center rounded-full md:bottom-6 md:left-[max(1.5rem,env(safe-area-inset-left))] md:size-auto"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="flex size-[40px] items-center justify-center gap-1 rounded-full bg-crimson font-bold text-white shadow-lg ring-2 ring-white group-hover:bg-brick md:size-auto md:px-3 md:py-1.5 md:text-sm">
        <span aria-hidden="true" className="text-[20px] leading-none md:text-[16px]">
          🗺
        </span>
        <span className="sr-only md:not-sr-only">{label}</span>
      </span>
    </Link>
  );
}
