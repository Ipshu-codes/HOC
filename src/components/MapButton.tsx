"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/types/locale";

interface MapButtonProps {
  lang: Locale;
  label: string;
}

/**
 * Floating 3D Map button, bottom-left on every page (swapped with Nani, who is bottom-right; hidden on the
 * map page itself). It mirrors Nani's face button: the same round size (size-14), red ring, shadow and
 * distance from the edges, showing a crop of the ward map (built by optimize-images from raw-data
 * "ward 16.jpg"). The picture is alt="": the label is the link's accessible name and the mouse tooltip.
 */
export default function MapButton({ lang, label }: MapButtonProps) {
  const pathname = usePathname();
  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      title={label}
      className="fixed bottom-4 left-[max(1rem,env(safe-area-inset-left))] z-30 block rounded-full md:bottom-6 md:left-[max(1.5rem,env(safe-area-inset-left))]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size files with 2x/3x variants; no optimizer needed */}
      <img
        src="/images/map/map-button-64.webp"
        srcSet="/images/map/map-button-64.webp 64w, /images/map/map-button-128.webp 128w, /images/map/map-button-192.webp 192w"
        sizes="3.5rem"
        width={64}
        height={64}
        alt=""
        decoding="async"
        className="size-14 rounded-full bg-white object-cover shadow-lg ring-4 ring-crimson hover:ring-brick"
      />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
