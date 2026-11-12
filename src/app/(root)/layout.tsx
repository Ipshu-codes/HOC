import "@/app/globals.css";

// Separate root layout for the bare "/" URL, which only redirects to /en/.
// (Every real page lives under app/[lang]/, which has its own root layout.)
export default function RootRedirectLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
