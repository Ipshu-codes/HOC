"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/types/locale";

interface MapButtonProps {
  lang: Locale;
  label: string;
}

/** Floating "🗺 3D Map" button, bottom-right on every page as in the sketch (hidden on the map page itself). */
export default function MapButton({ lang, label }: MapButtonProps) {
  const pathname = usePathname();
  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      className="map-fab fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full bg-crimson px-5 py-3 font-bold text-white shadow-lg ring-2 ring-white hover:bg-brick md:right-6 md:bottom-6"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span aria-hidden="true">🗺</span>
      {label}
    </Link>
  );
}
