/** Display sizes of Nani's picture (CSS px); each has a 2x file for high-density screens. */
type NaniSize = 28 | 40 | 64;

interface NaniAvatarProps {
  size: NaniSize;
  /** "" when the picture sits next to text that already names Nani. */
  alt: string;
  /** Gentle bob-and-tilt loop (CSS); switched off for visitors who prefer reduced motion. */
  animated?: boolean;
  className?: string;
}

/**
 * Nani, the chatbot guide. Files come from scripts/optimize-images.ts
 * (public/images/nani/nani-<size>.webp, a face crop of the original illustration).
 */
export default function NaniAvatar({ size, alt, animated = false, className = "" }: NaniAvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size files with a 2x variant; no optimizer needed
    <img
      src={`/images/nani/nani-${size}.webp`}
      srcSet={`/images/nani/nani-${size}.webp 1x, /images/nani/nani-${size * 2}.webp 2x`}
      width={size}
      height={size}
      alt={alt}
      decoding="async"
      className={`shrink-0 rounded-full bg-sand object-cover ${animated ? "nani-animated" : ""} ${className}`}
    />
  );
}
