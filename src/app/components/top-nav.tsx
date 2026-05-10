import Link from "next/link";
import TrackedLink from "@/app/components/tracked-link";

const NAV_LINKS: Array<{ label: string; href: string }> = [
  { label: "Overview", href: "/" },
  { label: "Analytics", href: "/analytics" },
  { label: "Operators", href: "/operators" },
  { label: "Water", href: "/water" },
  { label: "Counties", href: "/counties" },
  { label: "Education", href: "/education" },
  { label: "Glossary", href: "/glossary" },
  { label: "API health", href: "/api/health" },
];

export default function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white">
          <span aria-hidden="true" className="inline-block size-2 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
          Atlas TX
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
          <TrackedLink
            event="outbound"
            eventTarget="repo:github.com/sbauwow/atlas-tx@nav"
            href="https://github.com/sbauwow/atlas-tx"
            className="ml-2 rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            GitHub
          </TrackedLink>
        </nav>
      </div>
    </header>
  );
}
