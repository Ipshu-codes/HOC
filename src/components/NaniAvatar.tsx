/**
 * Display sizes of the round face picture (CSS px); each has a 2x file. 56 is the compact
 * floating button (e.g. over the home hero); otherwise the button shows the big cut-out figure.
 */
type NaniSize = 28 | 40 | 56;

interface NaniAvatarProps {
  size: NaniSize;
  /** "" when the picture sits next to text that already names Nani. */
  alt: string;
  /** Gentle bob-and-tilt loop (CSS); switched off for visitors who prefer reduced motion. */
  animated?: boolean;
  className?: string;
}

/**
 * Nani's face, for the chat header and message avatars. Files come from scripts/optimize-images.ts
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
