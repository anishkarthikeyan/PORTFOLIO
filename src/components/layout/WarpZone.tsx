"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WORLD_NAV } from "@/data/worldNav";
import { play } from "@/lib/sfx";
import styles from "./SiteFooter.module.css";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/**
 * Secret warp zone: the Konami code (↑↑↓↓←→←→BA) reveals a row of warp
 * pipes to every world. Purely an easter egg — the same links exist in the
 * header and footer.
 */
export function WarpZone() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = key === KONAMI[i] ? i + 1 : key === KONAMI[0] ? 1 : 0;
      if (i === KONAMI.length) {
        i = 0;
        setOpen(true);
        play("powerup");
        requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  return (
    <nav ref={ref} className={styles.warp} aria-label="Warp zone">
      <p className={styles.warpTitle}>★ Welcome to the warp zone!</p>
      <ul className={styles.warpPipes}>
        {WORLD_NAV.map((w) => (
          <li key={w.world}>
            <Link href={w.href} className={styles.warpPipe} onClick={() => play("pipe")}>
              <span className={styles.warpNum}>{w.world}</span>
              <span className={styles.pipeArt} aria-hidden="true" />
              <span>{w.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
