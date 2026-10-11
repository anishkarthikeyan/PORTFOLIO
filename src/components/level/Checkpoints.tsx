"use client";

import { useEffect, useRef } from "react";
import { play } from "@/lib/sfx";
import styles from "./Level.module.css";

/**
 * Level progress for a case study: each section is a checkpoint. When a
 * section is reached, its contents link raises a flag and the bar fills.
 * Works on top of the plain table of contents (no JS = plain links).
 */
export function Checkpoints({ ids }: { ids: string[] }) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reached = new Set<string>();
    const update = () => {
      const pct = Math.round((reached.size / ids.length) * 100);
      fillRef.current?.style.setProperty("--p", `${pct}%`);
      if (countRef.current) countRef.current.textContent = `${reached.size}/${ids.length}`;
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || reached.has(e.target.id)) continue;
          reached.add(e.target.id);
          document.querySelector(`[data-checkpoint="${e.target.id}"]`)?.setAttribute("data-reached", "true");
          if (reached.size > 1) play("coin");
        }
        update();
      },
      { rootMargin: "0px 0px -55% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);

  return (
    <div className={styles.progress} aria-hidden="true">
      <span>Level progress</span>
      <span className={styles.bar}>
        <span ref={fillRef} className={styles.fill} />
      </span>
      <span ref={countRef}>0/{ids.length}</span>
    </div>
  );
}
