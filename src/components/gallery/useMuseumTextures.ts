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

/** Canvas resolution per metre of wall label: about 74 px per line of type, sharp up close and,
 *  with mipmaps and anisotropic filtering, clean at an angle too. */
const DESCRIPTION_PX_PER_METRE = 700;
const DESCRIPTION_MAX_PX = 4096;
const DESCRIPTION_FACE = "#f6f1e6";
const DESCRIPTION_INK = "#2e1c17";
const DESCRIPTION_GOLD = "#a8823a";

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
    const pieces = ctx.measureText(word).width > maxWidth ? breakLongWord(ctx, word, maxWidth) : [word];
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

export interface DescriptionLayout {
  /** Metres, as planned by museum-layout's descriptionPanel(). */
  width: number;
  height: number;
  font: number;
  padding: number;
}

/**
 * Draw an existing photo description into a cream wall label with a thin antique-gold rule. The type
 * size is the one the layout planned; only text that would not fit is set a little smaller. Exported
 * so the glyph/wrap check can drive the same code path. No text is invented: it is the photo's own alt.
 */
export function drawMuseumDescription(
  ctx: CanvasRenderingContext2D,
  description: string,
  fontFamily: string,
  width: number,
  height: number,
  fontPx: number,
  paddingPx: number,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = DESCRIPTION_FACE;
  ctx.fillRect(0, 0, width, height);
  const rule = Math.max(2, Math.round(fontPx * 0.05));
  const inset = Math.round(paddingPx * 0.35);
  ctx.strokeStyle = DESCRIPTION_GOLD;
  ctx.lineWidth = rule;
  ctx.strokeRect(inset, inset, width - 2 * inset, height - 2 * inset);

  const maxWidth = width - 2 * paddingPx;
  const available = height - 2 * paddingPx;
  let size = fontPx;
  let lines: string[] = [];
  let leading = size * 1.42;
  while (size >= fontPx * 0.6) {
    ctx.font = `400 ${size}px ${fontFamily}`;
    lines = wrapDescription(ctx, description, maxWidth);
    leading = size * 1.42;
    if (lines.length * leading <= available + 1) break;
    size -= 1;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = DESCRIPTION_INK;
  const firstY = height / 2 - ((lines.length - 1) * leading) / 2;
  lines.forEach((text, index) => ctx.fillText(text, paddingPx, firstY + index * leading));
}

/** One wall-facing caption texture per mounted photo; created with the same page fonts as the DOM. */
export function useMuseumDescriptionTexture(description: string, panel: DescriptionLayout, active: boolean): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const { width, height, font, padding } = panel;
  useEffect(() => {
    if (!active || !description) return;
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;
    (async () => {
      const fonts = fontFamilies();
      await waitForFonts([fonts.sans], description);
      if (cancelled) return;
      // Very wide labels keep their proportions within the canvas size limit.
      const scale = Math.min(DESCRIPTION_PX_PER_METRE, DESCRIPTION_MAX_PX / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawMuseumDescription(ctx, description, fonts.sans, canvas.width, canvas.height, Math.round(font * scale), Math.round(padding * scale));
      created = new THREE.CanvasTexture(canvas);
      created.colorSpace = THREE.SRGBColorSpace;
      created.anisotropy = 8;
      setTexture(created);
    })();
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [description, width, height, font, padding, active]);
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

/* ---- Directional signboards: an engraved brass plate (after the Patan Museum plaque style) ---- */

const SIGN_PX_PER_METRE = 380;

/** Draw one signboard face. The words are exactly the given label; the arrow is drawn, not typed. */
export function drawMuseumSign(
  ctx: CanvasRenderingContext2D,
  label: string,
  dir: -1 | 1,
  fontFamily: string,
  width: number,
  height: number,
): void {
  // Warm brass, brushed horizontally, a little darker towards the edges.
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#9c7629");
  base.addColorStop(0.35, "#d6b765");
  base.addColorStop(0.6, "#b98f3c");
  base.addColorStop(1, "#8f6a24");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 520; i += 1) {
    const y = Math.random() * height;
    ctx.fillStyle = i % 2 ? "rgb(255 240 200 / 0.05)" : "rgb(60 40 10 / 0.05)";
    ctx.fillRect(0, y, width, 1 + Math.random() * 1.5);
  }
  // Age: soft patches of tarnish.
  for (let i = 0; i < 7; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = height * (0.25 + Math.random() * 0.4);
    const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
    patch.addColorStop(0, "rgb(70 48 14 / 0.16)");
    patch.addColorStop(1, "rgb(70 48 14 / 0)");
    ctx.fillStyle = patch;
    ctx.fillRect(0, 0, width, height);
  }
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, width * 0.62);
  vignette.addColorStop(0, "rgb(0 0 0 / 0)");
  vignette.addColorStop(1, "rgb(40 26 6 / 0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Engraving: a dark cut with a light lower edge, for the border, arrow and letters alike.
  const engrave = (draw: () => void) => {
    ctx.save();
    ctx.translate(0, height * 0.006);
    ctx.fillStyle = "rgb(255 236 180 / 0.55)";
    ctx.strokeStyle = "rgb(255 236 180 / 0.55)";
    draw();
    ctx.restore();
    ctx.fillStyle = "rgb(52 34 8 / 0.88)";
    ctx.strokeStyle = "rgb(52 34 8 / 0.88)";
    draw();
  };
  const inset = height * 0.08;
  ctx.lineWidth = height * 0.012;
  engrave(() => ctx.strokeRect(inset, inset, width - 2 * inset, height - 2 * inset));

  // Screws in the corners.
  for (const [x, y] of [
    [inset * 0.5, inset * 0.5],
    [width - inset * 0.5, inset * 0.5],
    [inset * 0.5, height - inset * 0.5],
    [width - inset * 0.5, height - inset * 0.5],
  ]) {
    const screw = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, height * 0.028);
    screw.addColorStop(0, "#f3dc9a");
    screw.addColorStop(1, "#5c4214");
    ctx.fillStyle = screw;
    ctx.beginPath();
    ctx.arc(x, y, height * 0.026, 0, Math.PI * 2);
    ctx.fill();
  }

  // Arrow on the side it points to.
  const arrowW = height * 0.44;
  const arrowH = height * 0.28;
  const cy = height / 2;
  const ax = dir === 1 ? width - inset * 2.2 - arrowW : inset * 2.2;
  engrave(() => {
    ctx.beginPath();
    if (dir === 1) {
      ctx.moveTo(ax, cy - arrowH * 0.16);
      ctx.lineTo(ax + arrowW * 0.58, cy - arrowH * 0.16);
      ctx.lineTo(ax + arrowW * 0.58, cy - arrowH / 2);
      ctx.lineTo(ax + arrowW, cy);
      ctx.lineTo(ax + arrowW * 0.58, cy + arrowH / 2);
      ctx.lineTo(ax + arrowW * 0.58, cy + arrowH * 0.16);
      ctx.lineTo(ax, cy + arrowH * 0.16);
    } else {
      ctx.moveTo(ax + arrowW, cy - arrowH * 0.16);
      ctx.lineTo(ax + arrowW * 0.42, cy - arrowH * 0.16);
      ctx.lineTo(ax + arrowW * 0.42, cy - arrowH / 2);
      ctx.lineTo(ax, cy);
      ctx.lineTo(ax + arrowW * 0.42, cy + arrowH / 2);
      ctx.lineTo(ax + arrowW * 0.42, cy + arrowH * 0.16);
      ctx.lineTo(ax + arrowW, cy + arrowH * 0.16);
    }
    ctx.closePath();
    ctx.fill();
  });

  // The label, as large as the plate allows beside the arrow.
  const textLeft = dir === 1 ? inset * 1.5 : ax + arrowW + inset * 0.7;
  const textRight = dir === 1 ? ax - inset * 0.7 : width - inset * 1.5;
  const maxWidth = textRight - textLeft;
  let size = Math.round(height * 0.5);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  while (size > height * 0.16) {
    ctx.font = `700 ${size}px ${fontFamily}`;
    if (ctx.measureText(label).width <= maxWidth) break;
    size -= 2;
  }
  engrave(() => ctx.fillText(label, (textLeft + textRight) / 2, cy + size * 0.04));
}

export function useMuseumSignTexture(
  label: string,
  dir: -1 | 1,
  widthMetres: number,
  heightMetres: number,
): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;
    (async () => {
      const fonts = fontFamilies();
      // Playfair (serif, like engraved museum lettering) for English; the heading stack falls back to
      // Mukta for Devanagari, so the Nepali signs use the page's own face too.
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.load(`700 72px ${fonts.heading}`, label).catch(() => undefined);
        await document.fonts.ready.catch(() => undefined);
      }
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(widthMetres * SIGN_PX_PER_METRE);
      canvas.height = Math.round(heightMetres * SIGN_PX_PER_METRE);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawMuseumSign(ctx, label, dir, fonts.heading, canvas.width, canvas.height);
      created = new THREE.CanvasTexture(canvas);
      created.colorSpace = THREE.SRGBColorSpace;
      created.anisotropy = 8;
      setTexture(created);
    })();
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [label, dir, widthMetres, heightMetres]);
  return texture;
}

/* ---- Red carpet: one woven tile, repeated along the walking path ---- */

/** Metres of carpet per texture repeat. */
export const CARPET_TILE = 2;

export function useCarpetTexture(): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    // Deep burgundy (between the site's brick and ink), a soft pile, and muted gold border bands.
    ctx.fillStyle = "#6c1820";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i += 1) {
      ctx.fillStyle = i % 2 ? "rgb(150 40 48 / 0.18)" : "rgb(30 6 8 / 0.18)";
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3);
    }
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = "rgb(0 0 0 / 0.05)";
      ctx.fillRect(0, y, w, 1);
    }
    const band = (x: number, width: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, 0, width, h);
      ctx.fillRect(w - x - width, 0, width, h);
    };
    band(0, 7, "#4a0f15");
    band(12, 9, "#a8823a");
    band(25, 3, "#a8823a");
    const created = new THREE.CanvasTexture(canvas);
    created.colorSpace = THREE.SRGBColorSpace;
    created.wrapT = THREE.RepeatWrapping;
    created.anisotropy = 8;
    // The canvas is ready synchronously; a microtask keeps setState out of the effect body.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setTexture(created);
    });
    return () => {
      cancelled = true;
      created.dispose();
    };
  }, []);
  return texture;
}
