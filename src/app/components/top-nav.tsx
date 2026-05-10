import Link from "next/link";
import TrackedLink from "@/app/components/tracked-link";

const NAV_LINKS: Array<{ label: string; href: string }> = [
  { label: "Overview", href: "/" },
  { label: "Maps", href: "/maps" },
  { label: "Counties", href: "/counties" },
  { label: "Analytics", href: "/analytics" },
  { label: "Permits", href: "/permits" },
  { label: "Education", href: "/education" },
  { label: "Data", href: "/data" },
];

export default function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <svg
            aria-hidden="true"
            viewBox="0 0 64 64"
            className="size-7 drop-shadow-[0_0_10px_rgba(34,211,238,0.35)]"
          >
            <path
              d="M22 10 L34 10 L34 22 L52 22 L54 28 L54 36 L50 42 L44 46 L40 52 L26 38 L14 30 L12 24 L22 22 Z"
              fill="#0f172a"
              stroke="#22d3ee"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M30 24 L31.8 29.53 L37.61 29.53 L32.91 32.95 L34.7 38.47 L30 35.06 L25.3 38.47 L27.09 32.95 L22.39 29.53 L28.2 29.53 Z"
              fill="#22d3ee"
            />
          </svg>
          <span className="leading-none">
            <span className="block text-base font-semibold tracking-tight">Atlas</span>
            <span className="block text-[9px] font-medium uppercase tracking-[0.22em] text-cyan-300">Texas</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/citizen"
            className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 font-medium text-cyan-100 transition-colors hover:border-cyan-300/50 hover:bg-cyan-300/15"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
              <rect x="4" y="2" width="8" height="12" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="5.5" y="3.5" width="5" height="1.8" rx="0.4" fill="currentColor" opacity="0.45" />
              <rect x="5.5" y="6" width="5" height="1.8" rx="0.4" fill="currentColor" opacity="0.7" />
              <rect x="5.5" y="8.5" width="5" height="1.8" rx="0.4" fill="currentColor" opacity="0.95" />
              <rect x="5.5" y="11" width="5" height="1.8" rx="0.4" fill="currentColor" opacity="0.55" />
            </svg>
            Submit a strip
          </Link>
          <TrackedLink
            event="outbound"
            eventTarget="repo:github.com/sbauwow/atlas-tx@nav"
            href="https://github.com/sbauwow/atlas-tx"
            className="ml-1 rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            GitHub
          </TrackedLink>
        </nav>
      </div>
    </header>
  );
}
