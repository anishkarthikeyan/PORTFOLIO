"use client";

import { useState, useSyncExternalStore } from "react";
import { play } from "@/lib/sfx";
import styles from "./Journey.module.css";

const KEY = "anish.scores";
interface Entry {
  initials: string;
  score: number;
}

const listeners = new Set<() => void>();
let cache: Entry[] | null = null;
function read(): Entry[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Entry[];
  } catch {
    cache = [];
  }
  return cache;
}
function write(list: Entry[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}
const EMPTY: Entry[] = [];

/**
 * Arcade "enter your initials" high-score table. Stored only in this
 * browser (localStorage) — nothing is sent anywhere.
 */
export function HighScores() {
  const scores = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
  const [initials, setInitials] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = initials.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (!name) return;
    const score = Number(document.querySelector("[data-sum='score']")?.textContent ?? 0) || 0;
    write([...scores, { initials: name, score }].sort((a, b) => b.score - a.score).slice(0, 5));
    setSaved(true);
    play("coin");
  };

  return (
    <div className={styles.scores}>
      {!saved ? (
        <form onSubmit={submit} className={styles.initialsForm}>
          <label htmlFor="initials" className={styles.initialsLabel}>
            Enter your initials
          </label>
          <input
            id="initials"
            className={styles.initialsInput}
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
            maxLength={3}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="initials-hint"
          />
          <button type="submit" className="btn btn-sm">
            Save
          </button>
          <p id="initials-hint" className={styles.initialsHint}>
            Saved only in this browser.
          </p>
        </form>
      ) : (
        <p className={styles.initialsLabel}>Score saved!</p>
      )}
      {scores.length > 0 && (
        <ol className={styles.scoreTable} aria-label="High scores">
          {scores.map((s, i) => (
            <li key={`${s.initials}-${i}`}>
              <span>{i + 1}.</span> <span>{s.initials.padEnd(3, "·")}</span> <span>{String(s.score).padStart(6, "0")}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
