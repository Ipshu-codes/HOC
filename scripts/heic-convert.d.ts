// heic-convert ships without TypeScript types.
declare module "heic-convert" {
  interface ConvertOptions {
    buffer: Buffer | ArrayBufferLike;
    format: "JPEG" | "PNG";
    /** 0–1, JPEG only. */
    quality?: number;
  }
  export default function convert(options: ConvertOptions): Promise<ArrayBuffer>;
}
