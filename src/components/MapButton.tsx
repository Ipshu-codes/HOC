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
 * map page itself). Kept small so it covers little text: a 48 px round icon on phones (the label stays as its
 * accessible name), a compact pill with the label from 768 px.
 */
export default function MapButton({ lang, label }: MapButtonProps) {
  const pathname = usePathname();
  if (pathname.startsWith(`/${lang}/map`)) return null;

  return (
    <Link
      href={`/${lang}/map/`}
      className="fixed bottom-4 left-[max(1rem,env(safe-area-inset-left))] z-30 flex size-12 items-center justify-center rounded-full bg-crimson text-xl font-bold text-white shadow-lg ring-2 ring-white hover:bg-brick md:bottom-6 md:left-[max(1.5rem,env(safe-area-inset-left))] md:size-auto md:gap-1.5 md:px-3.5 md:py-2 md:text-sm"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span aria-hidden="true">🗺</span>
      <span className="sr-only md:not-sr-only">{label}</span>
    </Link>
  );
}
