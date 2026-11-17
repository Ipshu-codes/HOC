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
 * map page itself). Icon only, so it covers little text: a 44 px red circle (icon 22 px) at every width,
 * inside a 48 × 48 px tap area. The tap area is pulled 2 px towards the corner so the circle sits
 * as far from the edges as Nani's face. The label is its accessible name and the mouse tooltip.
 */
export default function MapButton({ lang, label }: MapButtonProps) {
  const pathname = usePathname();
  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      title={label}
      className="group fixed bottom-[calc(1rem-2px)] left-[calc(max(1rem,env(safe-area-inset-left))-2px)] z-30 flex size-[48px] items-center justify-center rounded-full md:bottom-[calc(1.5rem-2px)] md:left-[calc(max(1.5rem,env(safe-area-inset-left))-2px)]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="flex size-[44px] items-center justify-center rounded-full bg-crimson text-white shadow-md ring-2 ring-white group-hover:bg-brick">
        <span aria-hidden="true" className="text-[22px] leading-none">
          🗺
        </span>
        <span className="sr-only">{label}</span>
      </span>
    </Link>
  );
}
