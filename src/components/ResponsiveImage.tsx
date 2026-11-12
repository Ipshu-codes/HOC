import type { SiteImage } from "@/lib/images";

interface ResponsiveImageProps {
  image: SiteImage;
  /** CSS `sizes` hint, e.g. "(min-width: 768px) 33vw, 50vw". */
  sizes: string;
  className?: string;
  /** Above-the-fold image (the hero): load immediately with high priority. */
  priority?: boolean;
}

/**
 * Plain <img> with a srcset of the 640/1280/1920 px WebP files made by
 * scripts/optimize-images.ts. next/image cannot build a srcset in a static
 * export (it needs its image server), so we do it ourselves.
 */
export default function ResponsiveImage({ image, sizes, className, priority = false }: ResponsiveImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see comment above
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
