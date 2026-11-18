"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useId, useRef, useState } from "react";

import BrandLink from "@/components/BrandLink";
import LanguageToggle from "@/components/LanguageToggle";
import type { Dictionary, NavItem } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface SiteHeaderProps {
  lang: Locale;
  /** Only the strings the header needs: the whole dictionary would be sent to the browser. */
  labels: Dictionary["nav"];
  languageLabels: Dictionary["language"];
  homeLabel: string;
  title: string;
  subtitle: string;
  otherLanguage: Locale;
  otherLanguageLine: string;
  items: NavItem[];
  logoSrc: string;
}

/**
 * The fixed header (Biegajaca layout, docs/ui-match/reference-notes.md): MENU on the left, the ward
 * name in the centre (one link home), the EN | ने switch and the Contact button on the right. On phones:
 * name left, then the language switch and MENU.
 *
 * MENU opens a full-screen menu with the nav links. While it is open:
 *   - Tab moves only between MENU and the menu links (focus trap); the rest of the page is `inert`
 *     and does not scroll;
 *   - Esc closes it and focus goes back to MENU; choosing a link closes it too.
 */
export default function SiteHeader(props: SiteHeaderProps) {
  const { lang, labels, items } = props;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // The nav list's Contact item, shown as the header's outline button.
  const contact = items.find((item) => item.href.endsWith("#contact") || item.href.endsWith("/contact/"));

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    // Everything except the header and the menu becomes inert (not focusable, not read out).
    const others = [document.getElementById("main-content"), document.querySelector("footer"), ...document.querySelectorAll("body > [data-floating]")].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    others.forEach((el) => {
      el.inert = true;
    });
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab") return;
      const stops = [buttonRef.current, ...(panelRef.current?.querySelectorAll<HTMLElement>("a") ?? [])].filter(
        (el): el is HTMLElement => el !== null,
      );
      const index = stops.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (index <= 0 ? stops.length - 1 : index - 1) : index === stops.length - 1 ? 0 : index + 1;
      event.preventDefault();
      stops[next]?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      others.forEach((el) => {
        el.inert = false;
      });
      root.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <header className="site-header" data-menu-open={open ? "" : undefined}>
        <button
          ref={buttonRef}
          type="button"
          className="menu-btn mono"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? undefined : labels.openMenu}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" className="menu-btn-lines" />
          <span>{open ? labels.closeMenu : labels.menu}</span>
        </button>

        <div className="hdr-brand min-w-0">
          <BrandLink href={`/${lang}/`} label={props.homeLabel} className="flex min-w-0 items-center gap-2.5 rounded-sm focus-visible:outline-offset-4">
            {/* alt="": the link's name ("Ward No. 16, home") already says what it is. */}
            <Image src={props.logoSrc} alt="" width={128} height={128} priority className="size-9 shrink-0 rounded-full md:size-10" />
            <span className="block min-w-0 leading-none">
              <span className="hdr-title block">{props.title}</span>
              <span className="hdr-sub mono block truncate">{props.subtitle}</span>
              <span lang={props.otherLanguage} className="sr-only">
                {props.otherLanguageLine}
              </span>
            </span>
          </BrandLink>
        </div>

        <div className="hdr-right flex items-center gap-3">
          <LanguageToggle lang={lang} labels={props.languageLabels} />
          {contact && (
            <Link href={contact.href} prefetch={false} className="btn btn-outline hdr-contact">
              {contact.label}
            </Link>
          )}
        </div>
      </header>

      <div ref={panelRef} id={menuId} className="menu-panel" hidden={!open}>
        <nav aria-label={labels.label}>
          <ul className="menu-links">
            {items.map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="menu-link"
                  style={{ "--i": index } as CSSProperties}
                  onClick={() => close(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
