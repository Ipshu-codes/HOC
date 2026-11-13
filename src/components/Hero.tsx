import Link from "next/link";

import ResponsiveImage from "@/components/ResponsiveImage";
import type { SiteImage } from "@/lib/images";

interface HeroProps {
  image: SiteImage;
  title: string;
  subtitle: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
}

/** Full-width photo with a dark-red gradient, title, subtitle and two buttons. */
export default function Hero({ image, title, subtitle, primary, secondary }: HeroProps) {
  return (
    // data-nani-compact: while the hero is on screen Nani is her round face, so the big figure never covers these buttons (Chatbot.tsx).
    <section data-nani-compact className="relative isolate flex min-h-[26rem] items-end overflow-hidden md:min-h-[34rem]">
      <ResponsiveImage image={image} sizes="100vw" priority className="absolute inset-0 -z-10 size-full object-cover" />
      {/* Strong at the bottom where the text sits, so white text keeps AA contrast over any photo. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-brick via-brick/75 to-brick/10" />

      <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-10 md:pb-14">
        <h1 className="max-w-3xl text-4xl leading-tight font-bold text-white md:text-6xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-cream md:text-xl">{subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={primary.href}
            className="rounded-xl bg-crimson px-5 py-3 font-bold text-white shadow-lg hover:bg-brick focus-visible:outline-cream"
          >
            {primary.label}
          </Link>
          <Link
            href={secondary.href}
            className="rounded-xl border-2 border-cream px-5 py-3 font-bold text-cream hover:bg-cream hover:text-brick focus-visible:outline-cream"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
