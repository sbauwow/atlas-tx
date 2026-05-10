/**
 * Breathing accent dot for "live"/"active" indicators. Pure CSS animation;
 * no client component needed.
 */
export default function PulseDot({
  size = 8,
  color = "var(--color-accent)",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`atlas-pulse-dot inline-block rounded-full align-middle ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  );
}
