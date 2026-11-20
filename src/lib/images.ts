import "server-only";

import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

import type { Heritage, HeritageSlug } from "@/types/heritage";

/** A photo ready to render: file variants, intrinsic size and localized alt text. */
export interface SiteImage {
  /** Default file (1280 px), e.g. /images/nanak-math/tulsi-math.webp */
  src: string;
  /** "…-480.webp 480w, …-640.webp 640w, …-960.webp 960w, ….webp 1280w, …-1920.webp 1920w" — only files that exist. */
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  site: HeritageSlug;
}

const PUBLIC_DIR = path.join(process.cwd(), "public");

function sizeOf(src: string): { width: number; height: number } {
  const { width, height } = imageSize(fs.readFileSync(path.join(PUBLIC_DIR, src)));
  if (!width || !height) throw new Error(`Cannot read size of ${src}`);
  return { width, height };
}

/** scripts/optimize-images.ts writes name-480.webp, name-640.webp, name-960.webp, name.webp (1280 px) and name-1920.webp. */
function variantsOf(src: string): string[] {
  return ["-480", "-640", "-960", "", "-1920"]
    .map((suffix) => src.replace(/\.webp$/, `${suffix}.webp`))
    .filter((file) => fs.existsSync(path.join(PUBLIC_DIR, file)));
}

function srcSetFor(src: string): string {
  return variantsOf(src)
    .map((file) => `${file} ${sizeOf(file).width}w`)
    .join(", ");
}

/** An image that is not a site photo (e.g. the map preview), or null if it has not been built. */
export function plainImage(src: string): { src: string; srcSet: string; width: number; height: number } | null {
  if (!fs.existsSync(path.join(PUBLIC_DIR, src))) return null;
  return { src, srcSet: srcSetFor(src), ...sizeOf(src) };
}

/**
 * Looks a photo up in the galleries of the given (visible) sites and returns it
 * with its alt text, or null if it belongs to a site that is not on this build.
 */
export function findSiteImage(src: string, heritages: Heritage[]): SiteImage | null {
  for (const heritage of heritages) {
    const entry = heritage.gallery.find((image) => image.src === src);
    if (entry) {
      return { src, srcSet: srcSetFor(src), ...sizeOf(src), alt: entry.alt, site: heritage.slug };
    }
  }
  return null;
}

/** The site's cover photo (always one of its gallery photos — enforced by the content schema). */
export function coverImage(heritage: Heritage): SiteImage {
  const image = findSiteImage(heritage.cover, [heritage]);
  if (!image) throw new Error(`${heritage.slug}: cover ${heritage.cover} is not in its gallery`);
  return image;
}

/** One photo for the gallery page: a 480/640 px thumbnail, and the larger files for the lightbox only. */
export interface GalleryPhoto {
  site: HeritageSlug;
  alt: string;
  /** The 640 px file, with a srcset that adds the 480 px one for small screens. */
  thumb: { src: string; srcSet: string; width: number; height: number };
  /** 480 / 640 / 960 / 1280 / 1920 px versions, given to the lightbox so the large files load only when opened. */
  full: { src: string; width: number; height: number }[];
}

export function galleryPhotos(heritages: Heritage[]): GalleryPhoto[] {
  return heritages.flatMap((heritage) =>
    heritage.gallery.map((image) => {
      const variants = variantsOf(image.src).map((file) => ({ src: file, ...sizeOf(file) }));
      const small = variants.filter((v) => /-(480|640)\.webp$/.test(v.src));
      const thumb = small.at(-1) ?? variants[0];
      const srcSet = small.map((v) => `${v.src} ${v.width}w`).join(", ");
      return { site: heritage.slug, alt: image.alt, thumb: { ...thumb, srcSet }, full: variants };
    }),
  );
}
