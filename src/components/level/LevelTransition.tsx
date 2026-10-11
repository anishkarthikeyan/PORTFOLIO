"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { play } from "@/lib/sfx";
import { LEVEL_EVENT, type LevelDetail } from "./events";
import styles from "./Level.module.css";

/**
 * Full-screen level title card between the archive and a case study.
 * Lives in the root layout so it survives the route change.
 */
export function LevelTransition() {
  const router = useRouter();
  const [card, setCard] = useState<(LevelDetail & { phase: "in" | "out" }) | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const onLevel = (e: Event) => {
      const d = (e as CustomEvent<LevelDetail>).detail;
      setCard({ ...d, phase: "in" });
      play(d.mode === "enter" ? "pipe" : "warp");
      timers.push(setTimeout(() => router.push(d.href), d.mode === "enter" ? 700 : 450));
      timers.push(setTimeout(() => setCard((c) => (c ? { ...c, phase: "out" } : c)), d.mode === "enter" ? 1500 : 1000));
      timers.push(setTimeout(() => setCard(null), d.mode === "enter" ? 1900 : 1400));
    };
    window.addEventListener(LEVEL_EVENT, onLevel);
    return () => {
      window.removeEventListener(LEVEL_EVENT, onLevel);
      timers.forEach(clearTimeout);
    };
  }, [router]);

  if (!card) return null;
  return (
    <div className={styles.card} data-phase={card.phase} aria-hidden="true">
      {card.mode === "enter" ? (
        <>
          <p className={styles.level}>Level {card.level}</p>
          <p className={styles.title}>{card.title}</p>
          <p className={styles.start}>Start!</p>
        </>
      ) : (
        <>
          <p className={styles.level}>Exiting level</p>
          <p className={styles.start}>Back to the project islands</p>
        </>
      )}
    </div>
  );
}
