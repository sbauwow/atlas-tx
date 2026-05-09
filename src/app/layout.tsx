import type { Metadata } from "next";
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
  title: "Atlas TX",
  description:
    "Texas county intelligence for environment, social strain, and local fiscal capacity.",
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
            <div>Atlas TX public-interest county intelligence</div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="/analytics" className="transition-colors hover:text-white">Analytics</a>
              <a href="/glossary" className="transition-colors hover:text-white">Glossary</a>
              <a href="/education" className="transition-colors hover:text-white">Education</a>
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
