"use client";

import { useRef } from "react";

/**
 * A list of links where arrow keys move focus between items.
 * Tab order is untouched, so it never traps or surprises keyboard users.
 */
export function RovingGrid({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLUListElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key) || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLAnchorElement>("a"));
    const i = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (i === -1) return;
    e.preventDefault();
    const n = items.length;
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? n - 1 : e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
    items[next].focus();
  };

  return (
    <ul ref={ref} className={className} aria-label={label} onKeyDown={onKeyDown}>
      {children}
    </ul>
  );
}
