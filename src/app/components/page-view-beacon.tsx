"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { track } from "./track";

export default function PageViewBeacon() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const query = searchParams?.toString() || "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fullPath = query ? `${pathname}?${query}` : pathname;
    try {
      track("pageview", undefined, fullPath);
    } catch {
      // Telemetry never blocks rendering.
    }
  }, [pathname, query]);

  return null;
}
