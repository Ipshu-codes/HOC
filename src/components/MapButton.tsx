"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/types/locale";

interface MapButtonProps {
  lang: Locale;
  label: string;
}

/**
 * Floating "🗺" 3D Map button, bottom-left on every page (swapped with Nani, who is bottom-right; hidden on the
 * map page itself). Kept small so it covers almost no text: a 36 px red circle (icon 18 px) at every width,
 * inside a 44 × 44 px tap area. The tap area is pulled 4 px towards the corner so the circle sits
 * as far from the edges as Nani's face. The label is its accessible name and the mouse tooltip.
 */
export default function MapButton({ lang, label }: MapButtonProps) {
  const pathname = usePathname();
  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      title={label}
      className="group fixed bottom-[calc(1rem-4px)] left-[calc(max(1rem,env(safe-area-inset-left))-4px)] z-30 flex size-[44px] items-center justify-center rounded-full md:bottom-[calc(1.5rem-4px)] md:left-[calc(max(1.5rem,env(safe-area-inset-left))-4px)]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="flex size-[36px] items-center justify-center rounded-full bg-crimson text-white shadow-md ring-2 ring-white group-hover:bg-brick">
        <span aria-hidden="true" className="text-[18px] leading-none">
          🗺
        </span>
        <span className="sr-only">{label}</span>
      </span>
    </Link>
  );
}
