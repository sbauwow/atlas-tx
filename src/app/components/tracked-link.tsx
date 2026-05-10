"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackTelemetryEvent } from "@/lib/telemetry/client";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: string;
  eventTarget?: string;
};

export default function TrackedLink({ event, eventTarget, onClick, children, href, ...rest }: Props) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(eventArg) => {
        try {
          trackTelemetryEvent(event, {
            target: eventTarget ?? null,
            href: href ?? null,
          });
        } catch {
          // Telemetry never blocks navigation.
        }
        onClick?.(eventArg);
      }}
    >
      {children}
    </a>
  );
}
