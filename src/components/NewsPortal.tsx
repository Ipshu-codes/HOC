"use client";

import { useEffect, useMemo, useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";
import type { Notice, WardEvent } from "@/types/news";

type Labels = Dictionary["news"];

interface NewsPortalProps {
  lang: Locale;
  labels: Labels;
  notices: Notice[];
  events: WardEvent[];
  initialToday: string;
}

function kathmanduToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Date-only values are kept as YYYY-MM-DD; UTC noon avoids shifts during localized display. */
function dateValue(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatNumber(value: number, lang: Locale): string {
  return new Intl.NumberFormat(lang === "ne" ? "ne-NP" : "en-US").format(value);
}

function displayDate(date: string, lang: Locale, labels: Labels, includeYear = true): string {
  const [year, month, day] = date.split("-").map(Number);
  if (lang === "ne") {
    return `${formatNumber(day, lang)} ${labels.months[month - 1]}${includeYear ? ` ${formatNumber(year, lang)}` : ""}`;
  }
  return `${labels.months[month - 1]} ${formatNumber(day, lang)}${includeYear ? `, ${formatNumber(year, lang)}` : ""}`;
}

function localized(text: { en: string; ne: string }, lang: Locale) {
  return text[lang];
}

function categoryLabel(type: WardEvent["type"] | Notice["category"], labels: Labels) {
  return labels.categories[type];
}

function eventDates(event: WardEvent): string[] {
  const dates = [event.date];
  if (!event.endDate) return dates;
  const end = dateValue(event.endDate);
  let cursor = dateValue(event.date);
  while (cursor < end) {
    cursor = new Date(cursor.getTime() + 86_400_000);
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

export default function NewsPortal({ lang, labels, notices, events, initialToday }: NewsPortalProps) {
  const [today, setToday] = useState(initialToday);
  const [month, setMonth] = useState(() => dateValue(initialToday));
  const [selectedDate, setSelectedDate] = useState(initialToday);

  useEffect(() => {
    const updateToday = () => {
      const current = kathmanduToday();
      setToday((previous) => {
        if (previous !== current) {
          setMonth(dateValue(current));
          setSelectedDate(current);
        }
        return current;
      });
    };
    updateToday();
    const timer = window.setInterval(updateToday, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const publishedNotices = useMemo(
    () => notices.filter((notice) => notice.status === "published").sort((a, b) => b.date.localeCompare(a.date)),
    [notices],
  );
  const publishedEvents = useMemo(
    () => events.filter((event) => event.status === "published"),
    [events],
  );
  const upcomingEvents = useMemo(
    () => publishedEvents.filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [publishedEvents, today],
  );

  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + dayCount) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= dayCount ? day : null;
  });
  const eventsByDate = new Map<string, WardEvent[]>();
  for (const event of publishedEvents) {
    for (const date of eventDates(event)) {
      const list = eventsByDate.get(date) ?? [];
      list.push(event);
      eventsByDate.set(date, list);
    }
  }
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const displayedMonth = `${labels.months[monthIndex]} ${formatNumber(year, lang)}`;
  const previousMonth = () => setMonth(new Date(Date.UTC(year, monthIndex - 1, 1)));
  const nextMonth = () => setMonth(new Date(Date.UTC(year, monthIndex + 1, 1)));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <header className="mb-10 border-b border-gold/50 pb-7 md:mb-12">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-crimson">
          {lang === "ne" ? "वडा नं. १६ · काठमाडौं" : "Ward No. 16 · Kathmandu"}
        </p>
        <h1 className="text-4xl font-bold md:text-5xl">{labels.title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/80">{labels.intro}</p>
      </header>

      <section aria-labelledby="news-notices-heading" className="mb-12 md:mb-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="news-notices-heading" className="text-3xl font-bold">{labels.newsTitle}</h2>
          <span className="hidden text-sm text-ink/65 sm:inline">{publishedNotices.length}</span>
        </div>
        {publishedNotices.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {publishedNotices.map((notice) => (
              <article key={notice.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gold/40">
                {notice.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- local editorial images in the static export
                  <img src={notice.image} alt="" className="aspect-[16/7] w-full object-cover" loading="lazy" />
                )}
                <div className="p-5 md:p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sand px-3 py-1 text-sm font-bold text-brick">
                      {categoryLabel(notice.category, labels)}
                    </span>
                    {notice.demo && <span className="text-xs font-bold text-crimson">{labels.demoLabel}</span>}
                    <time className="ml-auto text-sm text-ink/70" dateTime={notice.date}>
                      {displayDate(notice.date, lang, labels, false)}
                    </time>
                  </div>
                  <h3 className="text-xl font-bold text-brick">{localized(notice.title, lang)}</h3>
                  <p className="mt-2 leading-relaxed text-ink/85">{localized(notice.description, lang)}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-gold/50 bg-white/70 p-6 text-ink/75">{labels.noNews}</p>
        )}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.5fr)] lg:gap-10">
        <section aria-labelledby="upcoming-events-heading">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 id="upcoming-events-heading" className="text-3xl font-bold">{labels.upcomingTitle}</h2>
            <span className="shrink-0 rounded-full bg-crimson/10 px-3 py-1 text-sm font-bold text-brick">{upcomingEvents.length} / 5</span>
          </div>
          {upcomingEvents.length ? (
            <ol className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMonth(dateValue(event.date));
                      setSelectedDate(event.date);
                    }}
                    className="group flex w-full gap-4 rounded-xl border border-gold/40 bg-white p-4 text-left shadow-sm transition hover:border-crimson/50 hover:shadow-md focus-visible:outline-offset-4"
                  >
                    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-sand text-brick">
                      <span className="text-xl font-bold leading-none">{formatNumber(dateValue(event.date).getUTCDate(), lang)}</span>
                      <span className="mt-1 text-xs font-bold uppercase">{labels.monthsShort[dateValue(event.date).getUTCMonth()]}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold leading-snug text-brick group-hover:text-crimson">{localized(event.title, lang)}</span>
                        {event.demo && <span className="text-xs font-bold text-crimson">{labels.demoLabel}</span>}
                      </span>
                      <span className="mt-1 block text-sm text-ink/70">
                        {categoryLabel(event.type, labels)} <span aria-hidden="true">·</span> {displayDate(event.date, lang, labels)}
                      </span>
                      {event.description && <span className="mt-2 block text-sm leading-relaxed text-ink/80">{localized(event.description, lang)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl border border-gold/50 bg-white/70 p-6 text-ink/75">{labels.noEvents}</p>
          )}
        </section>

        <section aria-labelledby="events-calendar-heading" className="min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gold/40 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="events-calendar-heading" className="text-2xl font-bold sm:text-3xl">{labels.calendarTitle}</h2>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={previousMonth} aria-label={labels.previousMonth} className="flex size-10 items-center justify-center rounded-lg text-xl font-bold text-brick hover:bg-sand focus-visible:outline-offset-2">
                <span aria-hidden="true">‹</span>
              </button>
              <button type="button" onClick={nextMonth} aria-label={labels.nextMonth} className="flex size-10 items-center justify-center rounded-lg text-xl font-bold text-brick hover:bg-sand focus-visible:outline-offset-2">
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
          <p className="mb-4 text-sm text-ink/70" aria-live="polite">{displayedMonth}</p>
          <p className="sr-only" id="calendar-help">{labels.calendarHelp}</p>
          <table className="w-full table-fixed border-collapse" aria-describedby="calendar-help">
            <thead>
              <tr>
                {labels.weekdays.map((weekday) => (
                  <th key={weekday} scope="col" className="pb-2 text-center text-xs font-bold text-ink/65 sm:pb-3 sm:text-sm">{weekday}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, week) => (
                <tr key={week}>
                  {cells.slice(week * 7, week * 7 + 7).map((day, weekday) => {
                    if (!day) return <td key={`${week}-${weekday}`} aria-hidden="true" className="border-t border-sand/80 p-0.5 sm:p-1" />;
                    const key = dateKey(year, monthIndex, day);
                    const dayEvents = eventsByDate.get(key) ?? [];
                    const selected = key === selectedDate;
                    const isToday = key === today;
                    return (
                      <td key={key} className="border-t border-sand/80 p-0.5 align-top sm:p-1">
                        <button
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${displayDate(key, lang, labels)}${dayEvents.length ? `: ${dayEvents.map((event) => localized(event.title, lang)).join(", ")}` : ""}`}
                          onClick={() => setSelectedDate(key)}
                          className={`flex min-h-[3.8rem] w-full flex-col items-center rounded-md p-1 text-center transition sm:min-h-[5.25rem] sm:items-stretch sm:p-1.5 ${selected ? "bg-crimson/10 ring-2 ring-crimson/60" : "hover:bg-sand/70"} ${isToday ? "font-bold" : ""}`}
                        >
                          <span className={`flex size-7 items-center justify-center rounded-full text-sm sm:size-8 ${isToday ? "bg-brick text-white" : "text-ink"}`}>
                            {formatNumber(day, lang)}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="mt-1 flex w-full flex-col items-center gap-0.5 sm:items-start">
                              <span aria-hidden="true" className="flex gap-1 sm:hidden">
                                {dayEvents.slice(0, 3).map((event) => <span key={event.id} className={`size-1.5 rounded-full ${event.important ? "bg-brick" : "bg-crimson/60"}`} />)}
                              </span>
                              {dayEvents.slice(0, 2).map((event) => (
                                <span key={event.id} className={`hidden max-w-full truncate rounded px-1 text-left text-[0.65rem] leading-5 sm:block ${event.important ? "bg-brick/10 font-bold text-brick" : "bg-sand text-ink/80"}`}>
                                  {localized(event.title, lang)}
                                </span>
                              ))}
                              {dayEvents.length > 2 && <span className="hidden text-[0.65rem] font-bold text-brick sm:block">{labels.moreEvents.replace("{count}", String(dayEvents.length - 2))}</span>}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 border-t border-gold/40 pt-4" aria-live="polite">
            <h3 className="text-lg font-bold text-brick">{labels.selectDate.replace("{date}", displayDate(selectedDate, lang, labels))}</h3>
            {selectedEvents.length ? (
              <ul className="mt-3 space-y-3">
                {selectedEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 rounded-lg bg-cream p-3">
                    <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full ${event.important ? "bg-brick" : "bg-crimson/65"}`} />
                    <span className="min-w-0">
                      <span className="font-bold text-brick">{localized(event.title, lang)}</span>
                      {event.demo && <span className="ml-2 text-xs font-bold text-crimson">{labels.demoLabel}</span>}
                      <span className="mt-0.5 block text-sm text-ink/70">{categoryLabel(event.type, labels)}</span>
                      {event.description && <span className="mt-1 block text-sm leading-relaxed text-ink/80">{localized(event.description, lang)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink/70">{labels.noEventsOnDate}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
