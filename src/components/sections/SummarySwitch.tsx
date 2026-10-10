"use client";

import { useRef, useState } from "react";
import type { ContentStatus } from "@/data/types";
import { StatusBadge } from "@/components/ui/Status";
import styles from "./sections.module.css";

type Mode = "both" | "sde" | "aiml";

const TABS: { id: Mode; label: string }[] = [
  { id: "both", label: "Combined" },
  { id: "sde", label: "SDE / Backend" },
  { id: "aiml", label: "AI / ML" },
];

/** Accessible tabs that switch between the two career-direction summaries. */
export function SummarySwitch({
  sde,
  aiml,
}: {
  sde: { text: string; status: ContentStatus };
  aiml: { text: string; status: ContentStatus };
}) {
  const [mode, setMode] = useState<Mode>("both");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + TABS.length) % TABS.length;
    setMode(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className={styles.summary}>
      <div role="tablist" aria-label="Career focus" className="segmented">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`summary-tab-${t.id}`}
            aria-selected={mode === t.id}
            aria-controls="summary-panel"
            tabIndex={mode === t.id ? 0 : -1}
            onClick={() => setMode(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="summary-panel" role="tabpanel" aria-labelledby={`summary-tab-${mode}`} className={styles.summaryPanel}>
        {(mode === "both" || mode === "sde") && (
          <div className={styles.summaryBlock}>
            <p className={styles.summaryLabel}>
              Software engineering <StatusBadge status={sde.status} />
            </p>
            <p>{sde.text}</p>
          </div>
        )}
        {(mode === "both" || mode === "aiml") && (
          <div className={styles.summaryBlock}>
            <p className={styles.summaryLabel}>
              Applied AI / ML <StatusBadge status={aiml.status} />
            </p>
            <p>{aiml.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
