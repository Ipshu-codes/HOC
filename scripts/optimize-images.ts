/**
 * Builds the web images in public/images/ from the original photos in raw-data.
 *
 *   npm run optimize-images
 *
 * For every entry in scripts/image-manifest.json it writes three WebP files:
 *   <name>-640.webp, <name>.webp (1280 px, the default `src`), <name>-1920.webp
 * Widths are the long edge; small originals are never enlarged. All metadata
 * (EXIF, GPS) is stripped. Run it only after changing the manifest — the output
 * is committed, while raw-data is not (it is ~1.5 GB and git-ignored).
 *
 * Alt text is not here: it lives next to each image in the content frontmatter.
 */
import fs from "node:fs/promises";
import path from "node:path";
import heicConvert from "heic-convert";
import sharp from "sharp";

import manifest from "./image-manifest.json";

const RAW_DATA_DIR = process.env.RAW_DATA_DIR ?? "ward16-heritageraw-data/HOC";
const OUT_DIR = "public/images";
const QUALITY = 75;

const VARIANTS = [
  { suffix: "-640", width: 640 },
  { suffix: "", width: 1280 },
  { suffix: "-1920", width: 1920 },
] as const;

interface ManifestImage {
  site: string;
  name: string;
  /** Path of the original, relative to RAW_DATA_DIR. */
  source: string;
}

/** sharp's prebuilt binaries cannot decode iPhone/Samsung HEIC, so convert those to JPEG first. */
async function readSource(file: string): Promise<Buffer> {
  const buffer = await fs.readFile(file);
  if (!file.toLowerCase().endsWith(".heic")) return buffer;
  const jpeg = await heicConvert({ buffer, format: "JPEG", quality: 0.95 });
  return Buffer.from(jpeg);
}

async function optimize(image: ManifestImage): Promise<void> {
  const input = await readSource(path.join(RAW_DATA_DIR, image.source));
  const dir = path.join(OUT_DIR, image.site);
  await fs.mkdir(dir, { recursive: true });

  for (const { suffix, width } of VARIANTS) {
    await sharp(input)
      .rotate() // apply the EXIF orientation, then drop it
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(path.join(dir, `${image.name}${suffix}.webp`));
  }
}

/**
 * The ward logo arrives as a square screenshot with a grey background. Cut out
 * the round emblem (circle given in the manifest), make the outside transparent
 * and save PNGs at several sizes: public/images/logo/ward-logo-<size>.png
 */
async function optimizeLogo(): Promise<void> {
  const { source, circle, sizes } = manifest.logo;
  const { cx, cy, r } = circle;
  const side = Math.round(r * 2);
  const left = Math.max(0, Math.round(cx - r));
  const top = Math.max(0, Math.round(cy - r));

  const cropped = await sharp(path.join(RAW_DATA_DIR, source))
    .extract({ left, top, width: side, height: side })
    .toBuffer();
  const mask = Buffer.from(
    `<svg width="${side}" height="${side}"><circle cx="${cx - left}" cy="${cy - top}" r="${r}" fill="#fff"/></svg>`,
  );
  const round = await sharp(cropped)
    .composite([{ input: mask, blend: "dest-in" }]) // keep only pixels inside the circle
    .png()
    .toBuffer();

  const dir = path.join(OUT_DIR, "logo");
  await fs.mkdir(dir, { recursive: true });
  for (const size of sizes) {
    await sharp(round).resize(size, size).png({ palette: true, compressionLevel: 9 }).toFile(path.join(dir, `ward-logo-${size}.png`));
  }
  console.log(`logo: ${sizes.join(", ")} px`);
}

/**
 * Nani, the chatbot guide: a square crop around the face of the original
 * illustration, saved as small WebP files (shown round with CSS) at 1x and 2x
 * of the sizes used: 28 px message avatar and 40 px header.
 * → public/images/nani/nani-<size>.webp (metadata stripped, as for all images)
 */
async function optimizeNani(): Promise<void> {
  const { source, crop, sizes } = manifest.nani;
  const dir = path.join(OUT_DIR, "nani");
  await fs.mkdir(dir, { recursive: true });
  const face = await sharp(path.join(RAW_DATA_DIR, source))
    .extract({ left: crop.left, top: crop.top, width: crop.size, height: crop.size })
    .toBuffer();
  for (const size of sizes) {
    await sharp(face).resize(size, size).webp({ quality: 82 }).toFile(path.join(dir, `nani-${size}.webp`));
  }
  console.log(`nani: ${sizes.join(", ")} px`);
}

/**
 * Nani as a large half-body figure for the floating button: the plain pale
 * background of the illustration is made transparent so she can stand on the
 * page. Background = pixels close to the average corner colour that are
 * (a) connected to the image border, or (b) enclosed patches of at least
 * `minPocket` pixels (e.g. the gaps between braids and neck). The mask is shrunk
 * by one pixel (no pale halo) and softened before resizing.
 * → public/images/nani/nani-figure-<height>.webp
 */
async function optimizeNaniFigure(): Promise<void> {
  const { source, figure } = manifest.nani;
  const { data, info } = await sharp(path.join(RAW_DATA_DIR, source))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  if (info.channels !== 3) throw new Error(`Expected an RGB image, got ${info.channels} channels`);
  const at = (x: number, y: number) => (y * w + x) * 3;
  const corners = [at(2, 2), at(w - 3, 2), at(2, h >> 1), at(w - 3, h >> 1)];
  const bg = [0, 1, 2].map((c) => corners.reduce((sum, i) => sum + data[i + c], 0) / corners.length);
  const near = (pixel: number, tolerance: number) =>
    (data[pixel * 3] - bg[0]) ** 2 + (data[pixel * 3 + 1] - bg[1]) ** 2 + (data[pixel * 3 + 2] - bg[2]) ** 2 <=
    tolerance ** 2;

  /** Flood fill from `seeds` over pixels near the background colour; returns the pixels reached. */
  const flood = (seeds: number[], tolerance: number, seen: Uint8Array): number[] => {
    const region: number[] = [];
    const stack = seeds.filter((p) => !seen[p] && near(p, tolerance));
    for (const p of stack) seen[p] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      region.push(p);
      const x = p % w;
      for (const n of [p - w, p + w, x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1]) {
        if (n >= 0 && n < w * h && !seen[n] && near(n, tolerance)) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    return region;
  };

  const transparent = new Uint8Array(w * h);
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  for (const p of flood(border, figure.tolerance, new Uint8Array(w * h))) transparent[p] = 1;

  const seen = Uint8Array.from(transparent);
  for (let p = 0; p < w * h; p++) {
    if (seen[p]) continue;
    const pocket = flood([p], figure.pocketTolerance, seen);
    if (pocket.length >= figure.minPocket) for (const q of pocket) transparent[q] = 1;
  }

  // Alpha: opaque figure, shrunk by one pixel where it touches the background.
  const alpha = Buffer.alloc(w * h, 255);
  for (let p = 0; p < w * h; p++) {
    const x = p % w;
    const edge = [p - w, p + w, x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1].some((n) => n >= 0 && n < w * h && transparent[n]);
    if (transparent[p] || edge) alpha[p] = 0;
  }
  // extractChannel(0): keep the blurred mask single-channel (one byte per pixel).
  const softAlpha = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
    .blur(1.2)
    .extractChannel(0)
    .raw()
    .toBuffer();
  if (softAlpha.length !== w * h) throw new Error(`Alpha mask has ${softAlpha.length} bytes, expected ${w * h}`);

  // Crop to the figure (rows/columns that contain any visible pixel).
  let top = h, bottom = 0, left = w, right = 0;
  for (let p = 0; p < w * h; p++) {
    if (softAlpha[p] > 8) {
      const x = p % w, y = Math.floor(p / w);
      top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x);
    }
  }
  // Two separate steps on purpose: sharp runs operations in its own fixed order (extract
  // before joinChannel), so cropping in the same pipeline would misplace the alpha channel.
  const full = await sharp(data, { raw: { width: w, height: h, channels: 3 } })
    .joinChannel(softAlpha, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  const rgba = await sharp(full)
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .png()
    .toBuffer();

  const dir = path.join(OUT_DIR, "nani");
  for (const height of figure.heights) {
    await sharp(rgba)
      .resize({ height })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(path.join(dir, `nani-figure-${height}.webp`));
  }
  console.log(`nani figure: ${figure.heights.join(", ")} px tall (${right - left + 1}×${bottom - top + 1} source)`);
}

async function main(): Promise<void> {
  try {
    await fs.access(RAW_DATA_DIR);
  } catch {
    console.error(`Raw data not found at "${RAW_DATA_DIR}". Set RAW_DATA_DIR to the folder holding the Drive download.`);
    process.exit(1);
  }

  await optimizeLogo();
  await optimizeNani();
  await optimizeNaniFigure();

  const images: ManifestImage[] = manifest.images;
  for (const [i, image] of images.entries()) {
    await optimize(image);
    console.log(`[${i + 1}/${images.length}] ${image.site}/${image.name}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
