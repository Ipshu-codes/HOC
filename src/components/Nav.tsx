"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import LanguageToggle from "@/components/LanguageToggle";
import type { Dictionary, NavItem } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface NavProps {
  lang: Locale;
  dict: Dictionary;
  items: NavItem[];
}

/**
 * Sticky brick-red nav bar. From 768px (Tailwind `md`) the links sit in a row;
 * below that they collapse behind a hamburger button. This is a client
 * component only because the menu has open/closed state.
 */
export default function Nav({ lang, dict, items }: NavProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass =
    "block rounded-md px-3 py-2 font-medium text-cream hover:bg-crimson hover:text-white focus-visible:bg-crimson focus-visible:outline-cream";

  return (
    <nav aria-label={dict.nav.label} className="sticky top-0 z-40 bg-brick shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-cream hover:bg-crimson focus-visible:outline-cream md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
          onClick={() => setOpen((value) => !value)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          <span>{dict.nav.menu}</span>
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <LanguageToggle lang={lang} dict={dict} />
      </div>

      {/* Mobile menu: rendered always (hidden when closed) so aria-controls points at a real element. */}
      <ul id={menuId} hidden={!open} className="space-y-1 border-t border-cream/20 px-4 pt-2 pb-4 md:hidden">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={linkClass} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
