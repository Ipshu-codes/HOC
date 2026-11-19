"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/types/locale";

interface MapButtonProps {
  lang: Locale;
  /** Accessible name and tooltip, e.g. "3D Map". */
  label: string;
  /** Visible label (also part of the accessible name, for speech control). */
  short: string;
}

/**
 * Floating 3D Map button, fixed at the bottom-left on every page (hidden on the map page itself).
 */
export default function MapButton({ lang, label, short }: MapButtonProps) {
  const pathname = usePathname();

  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      title={label}
      aria-label={label}
      className="map-launch fixed left-[max(1rem,env(safe-area-inset-left))] z-30 flex items-center justify-center md:left-[max(1.5rem,env(safe-area-inset-left))]"
    >
      {short}
    </Link>
  );
}
