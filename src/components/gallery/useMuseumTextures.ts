"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

import type { Locale } from "@/types/locale";

/**
 * Textures for the 3D museum. Two kinds:
 *
 * - Plaques are drawn into a canvas with the page's own next/font families, so English and
 *   Devanagari use exactly the faces the DOM uses (no invented typography, no glyph gaps).
 * - Photographs come from the same small WebP thumbnails the DOM gallery uses. Loading priority
 *   follows the visitor, but a decoded texture stays with its mounted frame; requests are shared
 *   through a ref-counted cache and only disposed when the last frame using them unmounts.
 */

interface MuseumFonts {
  heading: string;
  mono: string;
  sans: string;
}

/** next/font exposes its generated family names as CSS variables; read the *computed* value so
 *  the `html[lang="ne"]` override (all three → Mukta) is respected. */
function fontFamilies(): MuseumFonts {
  if (typeof document === "undefined") return { heading: "sans-serif", mono: "monospace", sans: "sans-serif" };
  // --font-mono is scoped to .gallery-page, so read from that element when present. The document
  // root only carries the generic monospace fallback and would make signage lose JetBrains Mono.
  const scope = document.querySelector(".gallery-page") ?? document.documentElement;
  const style = getComputedStyle(scope);
  const heading = style.getPropertyValue("--font-heading").trim();
  const mono = style.getPropertyValue("--font-mono").trim();
  const sans = style.getPropertyValue("--font-sans").trim();
  return {
    heading: heading || "sans-serif",
    mono: mono || "monospace",
    sans: sans || heading || "sans-serif",
  };
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

/** Canvas resolution per metre of wall panel. The face is drawn once per photo and mapped back
 *  onto the same physical size, so text stays crisp without a texture per word. */
const DESCRIPTION_PX_PER_METRE = 600;
const DESCRIPTION_FACE = "#f4efe4";
const DESCRIPTION_INK = "#3a241f";

function breakLongWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const chunks: string[] = [];
  let chunk = "";
  for (const character of Array.from(word)) {
    const candidate = chunk + character;
    if (chunk && ctx.measureText(candidate).width > maxWidth) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

/** Wrap on word boundaries, falling back to character breaks only for a single overlong token. */
function wrapDescription(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const pieces =
      ctx.measureText(word).width > maxWidth ? breakLongWord(ctx, word, maxWidth) : [word];
    pieces.forEach((piece, pieceIndex) => {
      if (pieceIndex > 0) {
        if (line) lines.push(line);
        line = "";
      }
      const candidate = line ? `${line} ${piece}` : piece;
      if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
      else {
        lines.push(line);
        line = piece;
      }
    });
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draw an existing photo description into a cream wall label. Exported so the glyph/wrap check can
 * drive the same code path as the museum. No text is invented: `description` is the photo's own alt.
 */
export function drawMuseumDescription(
  ctx: CanvasRenderingContext2D,
  description: string,
  fontFamily: string,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = DESCRIPTION_FACE;
  ctx.fillRect(0, 0, width, height);

  const maxWidth = width - Math.round(width * 0.07);
  const availableHeight = height - Math.round(height * 0.14);
  let size = Math.round(height * 0.125);
  const minSize = Math.round(height * 0.06);
  let lines: string[] = [];
  let leading = size * 1.22;
  while (size >= minSize) {
    ctx.font = `400 ${size}px ${fontFamily}`;
    lines = wrapDescription(ctx, description, maxWidth);
    leading = size * 1.22;
    if (lines.length * leading <= availableHeight) break;
    size -= 1;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = DESCRIPTION_INK;
  const firstY = height / 2 - ((lines.length - 1) * leading) / 2;
  lines.forEach((text, index) => ctx.fillText(text, width / 2, firstY + index * leading));
}

/** One wall-facing caption texture per mounted photo; created with the same page fonts as the DOM. */
export function useMuseumDescriptionTexture(
  description: string,
  widthMetres: number,
  heightMetres: number,
  active: boolean,
): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    if (!active || !description) return;
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;
    (async () => {
      const fonts = fontFamilies();
      await waitForFonts([fonts.sans], description);
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(widthMetres * DESCRIPTION_PX_PER_METRE);
      canvas.height = Math.round(heightMetres * DESCRIPTION_PX_PER_METRE);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawMuseumDescription(ctx, description, fonts.sans, canvas.width, canvas.height);
      created = new THREE.CanvasTexture(canvas);
      created.colorSpace = THREE.SRGBColorSpace;
      created.anisotropy = 4;
      setTexture(created);
    })();
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [description, widthMetres, heightMetres, active]);
  return texture;
}

interface ImageTextureEntry {
  promise: Promise<THREE.Texture>;
  texture: THREE.Texture | null;
  refs: number;
  settled: boolean;
  failed: boolean;
}

const imageTextures = new Map<string, ImageTextureEntry>();
const imageLoader = new THREE.TextureLoader();

function entryFor(src: string): ImageTextureEntry {
  const existing = imageTextures.get(src);
  // A failed entry is replaced on the next request, but a pending one is always reused so a
  // quick unmount/remount cannot start a second request for the same photograph.
  if (existing && !existing.failed) return existing;
  const entry: ImageTextureEntry = {
    promise: undefined as unknown as Promise<THREE.Texture>,
    texture: null,
    refs: 0,
    settled: false,
    failed: false,
  };
  entry.promise = imageLoader
    .loadAsync(src)
    .then((texture) => {
      if (imageTextures.get(src) !== entry) {
        texture.dispose();
        throw new Error("Texture is no longer cached");
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      // Every frame can unmount while the request is in flight; do not leak a texture nobody owns.
      if (entry.refs === 0) {
        imageTextures.delete(src);
        texture.dispose();
        throw new Error("Texture is no longer needed");
      }
      entry.texture = texture;
      entry.settled = true;
      return texture;
    })
    .catch((error: unknown) => {
      entry.failed = true;
      entry.settled = true;
      if (imageTextures.get(src) === entry && entry.refs === 0) imageTextures.delete(src);
      throw error;
    });
  imageTextures.set(src, entry);
  return entry;
}

function releaseImageTexture(src: string, entry: ImageTextureEntry): void {
  if (imageTextures.get(src) !== entry || entry.refs > 0 || !entry.settled) return;
  imageTextures.delete(src);
  entry.texture?.dispose();
}

export function useMuseumImageTexture(src: string, active: boolean): THREE.Texture | null {
  const [loaded, setLoaded] = useState<{ src: string; texture: THREE.Texture } | null>(null);
  useEffect(() => {
    if (!active) return;
    const entry = entryFor(src);
    entry.refs += 1;
    let cancelled = false;
    entry.promise
      .then((texture) => {
        if (!cancelled) setLoaded({ src, texture });
      })
      .catch(() => {
        // A missing WebP leaves the cream mat (and the DOM fallback) intact.
      });
    return () => {
      cancelled = true;
      entry.refs -= 1;
      setLoaded(null);
      releaseImageTexture(src, entry);
    };
  }, [src, active]);
  // Once decoded, a texture stays on its frame. Only a different photo (`src`) or unmount clears it.
  return loaded?.src === src ? loaded.texture : null;
}
