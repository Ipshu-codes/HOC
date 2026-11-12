import Link from "next/link";

// A static export has no server to send a 301, so "/" is a tiny HTML page that
// redirects with <meta http-equiv="refresh"> (React hoists it into <head>).
export default function RootRedirect() {
  return (
    <main className="p-8">
      <meta httpEquiv="refresh" content="0; url=/en/" />
      <link rel="canonical" href="/en/" />
      <p>
        <Link href="/en/" className="text-crimson underline">
          Ward No. 16 Heritage — English
        </Link>
        {" · "}
        <Link href="/ne/" className="text-crimson underline" lang="ne">
          वडा नं. १६ सम्पदा — नेपाली
        </Link>
      </p>
    </main>
  );
}
