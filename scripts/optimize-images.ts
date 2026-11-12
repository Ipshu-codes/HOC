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

async function main(): Promise<void> {
  try {
    await fs.access(RAW_DATA_DIR);
  } catch {
    console.error(`Raw data not found at "${RAW_DATA_DIR}". Set RAW_DATA_DIR to the folder holding the Drive download.`);
    process.exit(1);
  }

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
