"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import BrandLink from "@/components/BrandLink";
import LanguageToggle from "@/components/LanguageToggle";
import type { Dictionary, NavItem } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

export interface MuseumContact {
  /** "Ward No. 16, Kathmandu Metropolitan City" (content/ward.json). */
  organisation: string;
  address: string;
  phone: string;
  phoneHref: string;
  email: string;
  /** Our own 3D map at the ward office; null when the office has no coordinates. */
  mapHref: string | null;
}

interface MuseumTopBarProps {
  lang: Locale;
  /** The site menu; the site has no header, so it lives here. `menu` names the button on pages outside it. */
  nav: { label: string; menu: string; items: NavItem[] };
  /** The menu item of the page being shown, or null (e.g. the 3D map). */
  currentHref: string | null;
  /** The Ward No. 16 emblem, top left: a link to Overview (the museum). */
  wardLogo: { src: string; width: number; height: number; homeHref: string; homeLabel: string };
  languageLabels: Dictionary["language"];
  contact: MuseumContact;
  contactLabels: {
    button: string;
    heading: string;
    address: string;
    phone: string;
    email: string;
    viewOnMap: string;
    close: string;
    /** Link to the full Contact page. */
    more: string;
    moreHref: string;
  };
  logo: { src: string; width: number; height: number };
}

/**
 * The museum's control row, the same on every page (the site has no header): the Ward No. 16 emblem
 * (home, i.e. the museum) and the menu on the left: About, Heritages, Gallery and Map open their panels,
 * Contact its popup. Narrower screens fold the menu into a dropdown named after the current page.
 * The RatnaInTech logo sits beside the language toggle on the right.
 * The contact popup is a native <dialog>: Esc closes it, focus stays inside, and focus returns to the
 * Contact button afterwards; a click on the dimmed backdrop closes it too.
 */
export default function MuseumTopBar({ lang, nav, currentHref, wardLogo, languageLabels, contact, contactLabels, logo }: MuseumTopBarProps) {
  const menuId = useId();
  const contactTitleId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = nav.items.find((item) => item.href === currentHref);
  const buttonText = current?.label ?? nav.menu;
  // The menu's own pages (About, Heritages, Gallery, Map) appear as buttons beside Contact on wide screens.
  const isContact = (href: string) => href.endsWith("/contact/");
  const isHome = (href: string) => href === wardLogo.homeHref;
  const panels = nav.items.filter((item) => !isContact(item.href) && !isHome(item.href));

  // The menu closes on Esc, on a click elsewhere, and when focus leaves it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Handled here: an open information panel must not close as well.
        event.preventDefault();
        setMenuOpen(false);
        menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  function openContact() {
    setMenuOpen(false);
    dialogRef.current?.showModal();
  }

  return (
    <div className="museum-topbar" lang={lang}>
      <div className="museum-topbar-group">
        <BrandLink href={wardLogo.homeHref} label={wardLogo.homeLabel} className="museum-ward-logo">
          {/* alt="": the link's name ("Ward No. 16 Heritage — home") already says what it is. */}
          <Image src={wardLogo.src} alt="" width={wardLogo.width} height={wardLogo.height} sizes="56px" priority />
        </BrandLink>
        <div
          ref={menuRef}
          className="museum-menu-wrap"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
          }}
        >
          <button
            type="button"
            className="museum-pill"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={`${nav.label}: ${buttonText}`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="15" height="15" className="museum-pill-menu" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
            </svg>
            <span className="museum-pill-text">{buttonText}</span>
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" className={menuOpen ? "rotate-180" : undefined}>
              <path d="M3 6l5 5 5-5" />
            </svg>
          </button>
          <nav id={menuId} aria-label={nav.label} className="museum-menu" hidden={!menuOpen}>
            <ul>
              {nav.items.map((item) => (
                <li key={item.href}>
                  {isContact(item.href) ? (
                    <button type="button" aria-haspopup="dialog" onClick={openContact}>
                      {item.label}
                    </button>
                  ) : (
                    // prefetch={false}: the menu must not download other pages' images in the background.
                    <Link
                      href={item.href}
                      prefetch={false}
                      aria-current={item.href === currentHref ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <nav aria-label={nav.label} className="museum-nav-pills">
          <ul>
            {panels.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} className="museum-pill" aria-current={item.href === currentHref ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" className="museum-pill" aria-haspopup="dialog" aria-label={contactLabels.button} onClick={openContact}>
          {/* Only phones show the envelope (instead of the word); elsewhere Contact is a plain pill like the rest. */}
          <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="15" height="15" className="museum-pill-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3.5" width="12" height="9" rx="1" />
            <path d="M2.5 4.5 8 9l5.5-4.5" />
          </svg>
          <span className="museum-pill-text museum-pill-contact">{contactLabels.button}</span>
        </button>
      </div>

      <div className="museum-topbar-group">
        <span className="museum-logo">
          <Image src={logo.src} alt="RatnaInTech" width={logo.width} height={logo.height} sizes="80px" />
        </span>
        <div className="museum-lang">
          <LanguageToggle lang={lang} labels={languageLabels} />
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="museum-contact"
        aria-labelledby={contactTitleId}
        onClick={(event) => {
          // A click on the backdrop lands on the <dialog> element itself, outside its inner box.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="museum-contact-box">
          <div className="flex items-start justify-between gap-4">
            <h2 id={contactTitleId} className="museum-contact-title">
              {contactLabels.heading}
            </h2>
            <button type="button" className="museum-contact-close" aria-label={contactLabels.close} onClick={() => dialogRef.current?.close()}>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          <p className="museum-contact-org">{contact.organisation}</p>
          <dl className="museum-contact-list">
            <div>
              <dt>{contactLabels.address}</dt>
              <dd>
                {contact.address}
                {contact.mapHref && (
                  <>
                    {" · "}
                    <Link href={contact.mapHref} prefetch={false}>
                      {contactLabels.viewOnMap}
                    </Link>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>{contactLabels.phone}</dt>
              <dd>
                <a href={contact.phoneHref}>{contact.phone}</a>
              </dd>
            </div>
            <div>
              <dt>{contactLabels.email}</dt>
              <dd>
                <a href={`mailto:${contact.email}`} className="break-all">
                  {contact.email}
                </a>
              </dd>
            </div>
          </dl>
          <Link href={contactLabels.moreHref} prefetch={false} className="museum-contact-more">
            {contactLabels.more} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </dialog>
    </div>
  );
}
