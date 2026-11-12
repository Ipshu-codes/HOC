import type { Dictionary } from "@/lib/i18n";

interface DraftBannerProps {
  /** Pass the `draft` flag of the content shown on the page. */
  draft: boolean;
  dict: Dictionary;
}

/**
 * Red warning strip shown in `npm run dev` on pages whose content has `draft: true`.
 * It never appears in a production build — and a production build cannot run
 * while drafts exist anyway (see scripts/check-content.ts).
 */
export default function DraftBanner({ draft, dict }: DraftBannerProps) {
  if (!draft || process.env.NODE_ENV === "production") return null;

  return (
    <div role="alert" className="bg-crimson px-4 py-2 text-center font-bold text-white">
      {dict.draft.banner}
    </div>
  );
}
