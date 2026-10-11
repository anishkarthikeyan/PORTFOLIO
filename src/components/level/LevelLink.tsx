"use client";

import Link from "next/link";
import { LEVEL_EVENT, type LevelDetail } from "./events";

/**
 * A normal link that plays the level transition first (enter: the card's
 * door opens + title card; exit: "level exit"). Modified clicks, reduced
 * motion and no-JS all behave like a regular link.
 */
export function LevelLink({
  href,
  mode,
  level,
  title,
  className,
  children,
  ...rest
}: {
  href: string;
  mode: LevelDetail["mode"];
  level?: string;
  title?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link
      href={href}
      className={className}
      {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        e.preventDefault();
        const card = (e.currentTarget as HTMLElement).closest("article");
        if (card && mode === "enter") card.dataset.entering = "true";
        window.dispatchEvent(new CustomEvent<LevelDetail>(LEVEL_EVENT, { detail: { mode, href, level, title } }));
      }}
    >
      {children}
    </Link>
  );
}
