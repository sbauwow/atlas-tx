import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import PageViewBeacon from "@/app/components/page-view-beacon";
import TopNav from "@/app/components/top-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas TX — Texas OSINT maps from open data",
  description:
    "County-level Texas maps built from public datasets. Water and water quality first; more lanes on the way.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-50 flex flex-col">
        <TopNav />
        {children}
        <footer className="mt-12 border-t border-white/5 px-6 py-6 text-sm text-slate-400">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>Atlas TX · Texas OSINT maps from open data</div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/analytics" className="transition-colors hover:text-white">Analytics</Link>
              <Link href="/watchlists" className="transition-colors hover:text-white">Watchlists</Link>
              <Link href="/operators" className="transition-colors hover:text-white">Operators</Link>
              <Link href="/glossary" className="transition-colors hover:text-white">Glossary</Link>
              <Link href="/education" className="transition-colors hover:text-white">Education</Link>
            </div>
          </div>
        </footer>
        <Suspense fallback={null}>
          <PageViewBeacon />
        </Suspense>
      </body>
    </html>
  );
}
