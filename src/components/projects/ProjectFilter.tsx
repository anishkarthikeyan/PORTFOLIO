"use client";

import { useEffect, useState } from "react";
import type { Track } from "@/data/types";
import styles from "./Projects.module.css";

type Filter = "all" | Track;

const OPTIONS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sde", label: "Software Engineering" },
  { id: "aiml", label: "AI / Machine Learning" },
];

/**
 * Filters server-rendered project cards by track. Without JavaScript every
 * card stays visible. `#projects-sde` / `#projects-aiml` preselect a track.
 */
export function ProjectFilter({
  items,
  counts,
}: {
  items: { track: Track; key: string; node: React.ReactNode }[];
  counts: Record<Filter, number>;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash;
      if (h === "#projects-sde") setFilter("sde");
      else if (h === "#projects-aiml") setFilter("aiml");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const shown = items.filter((i) => filter === "all" || i.track === filter);

  return (
    <>
      <div className={styles.filterRow}>
        <div className="segmented" role="group" aria-label="Filter projects by career track">
          {OPTIONS.map((o) => (
            <button key={o.id} type="button" aria-pressed={filter === o.id} onClick={() => setFilter(o.id)}>
              {o.label}
              <span className={styles.count} aria-label={`${counts[o.id]} projects`}>
                {counts[o.id]}
              </span>
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Showing {shown.length} project{shown.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className={styles.grid}>
        {shown.map((i) => (
          <div key={i.key} className={styles.cell}>
            {i.node}
          </div>
        ))}
      </div>
    </>
  );
}
