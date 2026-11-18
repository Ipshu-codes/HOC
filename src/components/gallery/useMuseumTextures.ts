"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

import type { Locale } from "@/types/locale";

/**
 * Textures for the 3D museum. Two kinds:
 *
 * - Plaques are drawn into a canvas with the page's own next/font families, so English and
 *   Devanagari use exactly the faces the DOM uses (no invented typography, no glyph gaps).
 * - Photographs come from the same small WebP thumbnails the DOM gallery uses; they are only
 *   requested for halls that are active, and released ref-counted when those halls go away.
 */

interface MuseumFonts {
  heading: string;
  mono: string;
}

/** next/font exposes its generated family names as CSS variables; read the *computed* value so
 *  the `html[lang="ne"]` override (heading/mono → Mukta) is respected. */
function fontFamilies(): MuseumFonts {
  if (typeof document === "undefined") return { heading: "sans-serif", mono: "monospace" };
  const style = getComputedStyle(document.documentElement);
  const heading = style.getPropertyValue("--font-heading").trim();
  const mono = style.getPropertyValue("--font-mono").trim();
  return { heading: heading || "sans-serif", mono: mono || "monospace" };
}

async function waitForFonts(families: string[], sample: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  // fonts.ts only preloads Latin; the Devanagari subset is fetched on demand when a glyph
  // needs it. Explicitly request it with the plaque's own characters before drawing, or the
  // canvas gets tofu boxes. DOM text on the NE page requests the same face, so this is free.
  // 400 is available in every face used here (Archivo body, JetBrains Mono, Mukta), so the
  // request resolves deterministically instead of relying on synthesized weights.
  await Promise.all(families.map((family) => document.fonts.load(`400 72px ${family}`, sample).catch(() => undefined)));
  await document.fonts.ready.catch(() => undefined);
}

export interface MuseumPlaqueText {
  number: string;
  name: string;
  lang: Locale;
}

/** Draw a plaque into an offscreen canvas. Exported so the glyph check can drive the exact code path. */
export function drawMuseumPlaque(
  ctx: CanvasRenderingContext2D,
  { number, name }: MuseumPlaqueText,
  fonts: MuseumFonts,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `400 ${Math.round(height * 0.115)}px ${fonts.mono}`;
  ctx.fillStyle = "#8c2b2b";
  ctx.fillText(number, width / 2, height * 0.2);

  const size = Math.round(height * 0.19);
  ctx.font = `400 ${size}px ${fonts.heading}`;
  ctx.fillStyle = "#272522";

  // Simple word wrap. Both site names fit on one or two lines; the space between words is
  // meaningful in Nepali too, so do not break words apart.
  const maxWidth = width * 0.88;
  const lines: string[] = [];
  let line = "";
  for (const word of name.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  const leading = size * 1.16;
  const startY = height * 0.55 - ((lines.length - 1) * leading) / 2;
  lines.forEach((text, i) => ctx.fillText(text, width / 2, startY + i * leading));
}

export function useMuseumTextTexture(text: MuseumPlaqueText, active: boolean): THREE.CanvasTexture | null {
  const { number, name, lang } = text;
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;
    const sample = `${number} ${name}`;
    (async () => {
      const fonts = fontFamilies();
      await waitForFonts([fonts.heading, fonts.mono], sample);
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 420;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawMuseumPlaque(ctx, { number, name, lang }, fonts, canvas.width, canvas.height);
      created = new THREE.CanvasTexture(canvas);
      created.colorSpace = THREE.SRGBColorSpace;
      created.anisotropy = 4;
      setTexture(created);
    })();
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [active, number, name, lang]);
  return texture;
}

interface ImageTextureEntry {
  promise: Promise<THREE.Texture>;
  texture: THREE.Texture | null;
  refs: number;
}

const imageTextures = new Map<string, ImageTextureEntry>();
const imageLoader = new THREE.TextureLoader();

function entryFor(src: string): ImageTextureEntry {
  const existing = imageTextures.get(src);
  if (existing) return existing;
  const entry: ImageTextureEntry = {
    promise: undefined as unknown as Promise<THREE.Texture>,
    texture: null,
    refs: 0,
  };
  entry.promise = imageLoader.loadAsync(src).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    entry.texture = texture;
    return texture;
  });
  imageTextures.set(src, entry);
  return entry;
}

export function useMuseumImageTexture(src: string, active: boolean): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(() => imageTextures.get(src)?.texture ?? null);
  useEffect(() => {
    if (!active) return;
    const entry = entryFor(src);
    entry.refs += 1;
    let cancelled = false;
    entry.promise.then((value) => {
      if (!cancelled) setTexture(value);
    }).catch(() => {
      // A missing WebP leaves the cream mat (and the DOM fallback) intact.
    });
    return () => {
      cancelled = true;
      entry.refs -= 1;
      if (entry.refs === 0 && entry.texture) {
        entry.texture.dispose();
        imageTextures.delete(src);
      }
    };
  }, [src, active]);
  return texture;
}
