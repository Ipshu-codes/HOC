"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatNumber } from "@/lib/format";
import type { Locale } from "@/types/locale";

export interface NarrationState {
  playing: boolean;
  /** Listen has been pressed at least once for this story (its player stays in view). */
  started: boolean;
  /** Seconds. `duration` is 0 until the browser has read the file's length. */
  time: number;
  duration: number;
}

export interface Narration extends NarrationState {
  toggle: () => void;
  /** Stops and rewinds; the player goes back to a plain Listen button. */
  stop: () => void;
}

const IDLE: NarrationState = { playing: false, started: false, time: 0, duration: 0 };
const AUDIO_EVENTS = ["play", "pause", "ended", "timeupdate", "durationchange", "loadedmetadata"] as const;

/**
 * One spoken story, `src` in the page's language. There is only ever one <audio> element: it is made on
 * the first Listen (nothing is downloaded before that, and nothing plays by itself), and it is thrown
 * away when `src` changes (the visitor switched language) or the museum unmounts, so the old language
 * never keeps playing.
 */
export function useNarration(src: string | null): Narration {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<NarrationState>(IDLE);

  useEffect(
    () => () => {
      const audio = audioRef.current;
      audioRef.current = null;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setState(IDLE);
    },
    [src],
  );

  const toggle = useCallback(() => {
    if (!src) return;
    let audio = audioRef.current;
    if (!audio) {
      const created = new Audio(src);
      created.preload = "auto";
      const sync = () => {
        if (audioRef.current !== created) return;
        setState({
          playing: !created.paused && !created.ended,
          started: true,
          time: created.currentTime,
          duration: Number.isFinite(created.duration) ? created.duration : 0,
        });
      };
      AUDIO_EVENTS.forEach((type) => created.addEventListener(type, sync));
      audioRef.current = created;
      audio = created;
    }
    // play() after the end starts the story again from the beginning.
    if (audio.paused) void audio.play().catch(() => setState((previous) => ({ ...previous, playing: false })));
    else audio.pause();
  }, [src]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setState(IDLE);
  }, []);

  return { ...state, toggle, stop };
}

/** "1:05" in the page's digits. */
function clock(seconds: number, lang: Locale): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = formatNumber(Math.floor(whole / 60), lang);
  const rest = formatNumber(whole % 60, lang);
  return `${minutes}:${rest.length < 2 ? `${lang === "ne" ? "०" : "0"}${rest}` : rest}`;
}

export interface NarrationLabels {
  listen: string;
  pause: string;
  /** Accessible names; "{name}" is the site's name. */
  label: string;
  pauseLabel: string;
  /** "{name}", "{time}", "{duration}". */
  progress: string;
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="5" height="7" rx="1.5" fill="currentColor" />
      <rect x="16" y="14" width="5" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

/**
 * Listen / Pause with a headphone icon; once started, a thin progress line and the time. Used in a
 * photograph's close-up card and, while the visitor walks the wing, floating above the wing's name.
 */
export function NarrationControl({
  narration,
  name,
  labels,
  lang,
  floating = false,
  iconOnly = false,
}: {
  narration: Narration;
  name: string;
  labels: NarrationLabels;
  lang: Locale;
  floating?: boolean;
  /** Phones' photo sheet: a round icon button, so it shares the row with the arrows and Read more. */
  iconOnly?: boolean;
}) {
  const { playing, started, time, duration } = narration;
  const named = (text: string) => text.replace("{name}", name);
  const share = duration > 0 ? Math.min(1, time / duration) : 0;
  return (
    <div className={`narration${floating ? " narration-floating" : ""}${iconOnly ? " narration-icon-only" : ""}${playing ? " is-playing" : ""}`}>
      <button
        type="button"
        className="narration-button"
        aria-label={named(playing ? labels.pauseLabel : labels.label)}
        title={iconOnly ? (playing ? labels.pause : labels.listen) : undefined}
        onClick={narration.toggle}
      >
        {playing ? <PauseIcon /> : <HeadphonesIcon />}
        {!iconOnly && <span>{playing ? labels.pause : labels.listen}</span>}
      </button>
      {started && (
        <div className="narration-progress">
          <span
            className="narration-track"
            role="progressbar"
            aria-label={name}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(share * 100)}
            aria-valuetext={named(labels.progress).replace("{time}", clock(time, lang)).replace("{duration}", clock(duration, lang))}
          >
            <span className="narration-fill" style={{ transform: `scaleX(${share})` }} />
          </span>
          <span className="narration-time" aria-hidden="true">
            {clock(time, lang)}
            {duration > 0 && ` / ${clock(duration, lang)}`}
          </span>
        </div>
      )}
    </div>
  );
}
