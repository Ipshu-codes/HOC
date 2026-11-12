interface SectionDividerProps {
  /** Tailwind text color class; the pattern is drawn in currentColor. */
  className?: string;
}

/**
 * Decorative band of stacked triangles and diamonds, a simple nod to dhaka
 * weaving and Newari woodcarving borders. Purely decorative (aria-hidden).
 */
export default function SectionDivider({ className = "text-gold" }: SectionDividerProps) {
  return (
    <svg aria-hidden="true" focusable="false" className={`block h-4 w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <pattern id="dhaka-band" width="32" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 16 L8 4 L16 16 Z M16 16 L24 4 L32 16 Z" fill="currentColor" opacity="0.55" />
          <path d="M16 0 L20 5 L16 10 L12 5 Z" fill="currentColor" />
          <path d="M0 0 L4 5 L0 10 Z M32 0 L28 5 L32 10 Z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill="url(#dhaka-band)" />
    </svg>
  );
}
