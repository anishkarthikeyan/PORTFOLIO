"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentStatus } from "@/data/types";
import { StatusBadge } from "@/components/ui/Status";
import styles from "./sections.module.css";

type Mode = "both" | "sde" | "aiml";

/**
 * RPG-style typing for a paragraph: types once when first seen (motion only).
 * Screen readers always get the full text.
 */
function Typed({ text, active }: { text: string; active: boolean }) {
  const [n, setN] = useState(text.length);
  const started = useRef(false);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 3;
      setN(Math.min(text.length, i));
      if (i >= text.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [active, text]);
  const done = n >= text.length;
  return (
    <>
      <span aria-hidden={!done}>{done ? text : text.slice(0, n)}</span>
      {!done && <span className="sr-only">{text}</span>}
    </>
  );
}

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
  const panel = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: "0px 0px -25% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
      <div
        ref={panel}
        id="summary-panel"
        role="tabpanel"
        aria-labelledby={`summary-tab-${mode}`}
        className={`${styles.summaryPanel} ${styles.rpgDialog}`}
      >
        {(mode === "both" || mode === "sde") && (
          <div className={styles.summaryBlock}>
            <p className={styles.summaryLabel}>
              Software engineering <StatusBadge status={sde.status} />
            </p>
            <p>
              <Typed text={sde.text} active={seen} />
            </p>
          </div>
        )}
        {(mode === "both" || mode === "aiml") && (
          <div className={styles.summaryBlock}>
            <p className={styles.summaryLabel}>
              Applied AI / ML <StatusBadge status={aiml.status} />
            </p>
            <p>
              <Typed text={aiml.text} active={seen} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
