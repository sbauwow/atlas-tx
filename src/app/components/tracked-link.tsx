"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "./track";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: string;
  eventTarget?: string;
};

export default function TrackedLink({ event, eventTarget, onClick, children, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(eventArg) => {
        try {
          track(event, eventTarget);
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
