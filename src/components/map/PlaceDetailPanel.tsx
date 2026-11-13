"use client";

import { useEffect, useRef, type ReactNode } from "react";

import type { MapPlace } from "@/components/map/types";
import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface PlaceDetailPanelProps {
  place: MapPlace;
  labels: Dictionary["map"];
  lang: Locale;
  onClose: () => void;
  /** Route navigation shown at the bottom while the visitor is walking the route. */
  footer?: ReactNode;
}

/**
 * The full story of one place: photo, introduction, quick facts, the sections written in
 * content/heritage/*.md (History, Legends & Beliefs, …), photos and sources.
 * A side column on extra-wide screens, below the map at intermediate widths, and a bottom sheet on phones.
 * Everything shown comes from the place data; nothing here is hard-coded per site.
 */
export default function PlaceDetailPanel({ place, labels, lang, onClose, footer }: PlaceDetailPanelProps) {
  const t = labels.detail;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const details = place.details;
  const otherLang: Locale = lang === "ne" ? "en" : "ne";

  // Move keyboard / screen-reader focus into the panel when it opens or the stop changes.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [place.id]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="map-detail-title"
      aria-label={fill(t.label, { name: place.name })}
      className="fixed inset-x-0 bottom-0 z-20 flex max-h-[48dvh] flex-col overflow-hidden rounded-t-2xl bg-cream shadow-2xl ring-1 ring-gold/60 lg:static lg:z-auto lg:max-h-none lg:h-[75vh] lg:rounded-xl lg:shadow-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <header className="flex items-start justify-between gap-3 border-b border-gold/40 bg-cream p-4">
        <div className="min-w-0">
          <h2
            id="map-detail-title"
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-2xl font-bold text-brick focus:outline-none"
          >
            {place.name}
          </h2>
          <p lang={otherLang} className="text-lg text-ink/80">
            {place.nameAlt}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-sand px-2 py-0.5 font-bold text-brick">{labels.kinds[place.kind]}</span>
            {place.approximate && <span className="text-crimson">{labels.approximate}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          title={t.close}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand text-xl text-brick hover:bg-gold/30"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div key={place.id} className="flex-1 overflow-y-auto overscroll-contain p-4 pb-6">
        {place.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- static export, see ResponsiveImage
          <img
            src={place.photo.src}
            alt={place.photo.alt}
            width={640}
            height={480}
            className="mb-3 aspect-video w-full rounded-lg object-cover"
          />
        )}
        {place.summary && <p className="text-base">{place.summary}</p>}

        {place.contact && (
          <section aria-labelledby="map-contact" className="mt-4">
            <h3 id="map-contact" className="font-heading text-lg font-bold text-brick">
              {t.contact}
            </h3>
            <dl className="mt-1 space-y-1 text-base">
              <div>
                <dt className="inline font-bold">{t.address}: </dt>
                <dd className="inline">{place.contact.address}</dd>
              </div>
              <div>
                <dt className="inline font-bold">{t.phone}: </dt>
                <dd className="inline">
                  <a href={place.contact.phoneHref} className="text-crimson underline underline-offset-4 hover:text-brick">
                    {place.contact.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="inline font-bold">{t.email}: </dt>
                <dd className="inline break-all">
                  <a href={`mailto:${place.contact.email}`} className="text-crimson underline underline-offset-4 hover:text-brick">
                    {place.contact.email}
                  </a>
                </dd>
              </div>
            </dl>
          </section>
        )}

        {details && (
          <>
            <dl className="mt-4 space-y-2 rounded-lg bg-white p-3 text-base ring-1 ring-gold/40">
              {details.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-sm font-bold text-brick">{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>

            {/* One collapsible section per heading of the page; the first (History) starts open. */}
            <div className="mt-4 space-y-2">
              {details.sections.map((section, index) => (
                <details key={section.id} open={index === 0} className="group rounded-lg bg-white ring-1 ring-gold/40">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 py-2 font-heading text-lg font-bold text-brick">
                    {section.title}
                    <span aria-hidden="true" className="transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  {/* Rendered from our own markdown files in content/ (trusted, build-time only). */}
                  <div className="map-detail-prose px-3 pb-3" dangerouslySetInnerHTML={{ __html: section.html }} />
                </details>
              ))}
            </div>

            {details.photos.length > 0 && (
              <section aria-labelledby="map-photos" className="mt-5">
                <h3 id="map-photos" className="font-heading text-lg font-bold text-brick">
                  {t.photos}
                </h3>
                <ul className="mt-2 flex snap-x gap-2 overflow-x-auto pb-2">
                  {details.photos.map((photo) => (
                    <li key={photo.src} className="w-40 shrink-0 snap-start">
                      {/* eslint-disable-next-line @next/next/no-img-element -- static export, see ResponsiveImage */}
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                        decoding="async"
                        className="aspect-4/3 w-full rounded-lg object-cover"
                      />
                    </li>
                  ))}
                </ul>
                {details.credit && <p className="text-sm text-ink/80">{details.credit}</p>}
                <a
                  href={details.galleryHref}
                  className="mt-1 inline-block font-bold text-crimson underline underline-offset-4 hover:text-brick"
                >
                  {t.seeAllPhotos} <span aria-hidden="true">→</span>
                </a>
              </section>
            )}

            {details.sources.length > 0 && (
              <section aria-labelledby="map-sources" className="mt-5">
                <h3 id="map-sources" className="font-heading text-lg font-bold text-brick">
                  {t.sources}
                </h3>
                <p className="text-sm">{t.sourcesIntro}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {details.sources.map((source) => (
                    <li key={source.key}>
                      {source.url ? (
                        <a href={source.url} className="text-crimson underline underline-offset-4 hover:text-brick">
                          {source.label}
                        </a>
                      ) : (
                        source.label
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {place.href && (
          <a
            href={place.href}
            className="mt-5 inline-block rounded-xl bg-crimson px-4 py-3 font-bold text-white hover:bg-brick"
          >
            {t.openPage} <span aria-hidden="true">→</span>
          </a>
        )}
      </div>

      {footer && <div className="border-t border-gold/40 bg-cream p-3 pb-20 lg:pb-3">{footer}</div>}
    </aside>
  );
}
