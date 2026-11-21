"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface WingVideoProps {
  src: string;
  /** Names the dialog: the wing's site. */
  title: string;
  labels: { play?: string; pause?: string; close?: string };
  onClose: () => void;
}

/**
 * A wing video opened large: just the video (muted, looping), Play/Pause and a close button. It is
 * rendered at the top of the page (a portal), above the museum and its controls. Esc or a click
 * beside the video closes it; keyboard focus starts on the close button.
 */
export default function WingVideo({ src, title, labels, onClose }: WingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    void video.play().catch(() => setPlaying(false));
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative w-[min(60rem,92vw)]" onClick={(event) => event.stopPropagation()}>
        <video ref={videoRef} src={src} muted loop playsInline autoPlay className="aspect-video w-full rounded-lg bg-black" />
        <div className="absolute top-2 right-2 flex gap-2">
          <button type="button" onClick={toggle} className="rounded-full bg-ink/80 px-3 py-1.5 text-sm font-bold text-white focus-visible:outline-cream">
            {playing ? (labels.pause ?? "Pause") : (labels.play ?? "Play")}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={labels.close ?? "Close"}
            className="rounded-full bg-ink/80 px-3 py-1.5 text-sm font-bold text-white focus-visible:outline-cream"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
