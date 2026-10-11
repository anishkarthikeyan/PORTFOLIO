"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { play, setSound } from "@/lib/sfx";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { HERO_FRAMES, HERO_PALETTE } from "./heroSprite";
import { WORLD_NAV } from "@/data/worldNav";
import styles from "./Journey.module.css";

const SEEN_KEY = "anish.started";
const SAVE_KEY = "anish.save";

/**
 * "Press Start" title screen shown once per browser on the home page.
 * Start = enter the game with sound on. Skip = straight to the portfolio,
 * silent. Never shown for reduced motion, direct links (#section) or when
 * already seen. Esc skips; Enter starts.
 */
export function TitleScreen() {
  const [show, setShow] = useState(false);
  /** World to continue from (returning visitors with a save point). */
  const [cont, setCont] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let seen = false;
    let saved = 0;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
      saved = Number(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "{}").world) || 0;
    } catch {
      /* private mode: treat as not seen, but don't block */
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || window.location.hash) return;
    if (seen && saved < 2) return;
    const savedWorld = seen ? saved : null;
    // Decide after mount so returning visitors never see a flash.
    const id = requestAnimationFrame(() => {
      setCont(savedWorld);
      setShow(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const finish = useCallback((withSound: boolean, goTo?: string) => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
      if (goTo === "#home") localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    setSound(withSound);
    if (withSound) play("start");
    setLeaving(true);
    setTimeout(() => {
      setShow(false);
      if (goTo && goTo !== "#home") window.location.hash = goTo;
      else document.getElementById("main")?.focus({ preventScroll: true });
    }, 900);
  }, []);

  useEffect(() => {
    if (!show) return;
    startRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [show, finish]);

  if (!show) return null;
  return (
    <div className={styles.title} data-leaving={leaving} role="dialog" aria-modal="true" aria-labelledby="title-logo">
      <div className={styles.titleInner}>
        <p className={styles.titleEyebrow}>A portfolio you can play</p>
        <p id="title-logo" className={styles.titleLogo}>
          ANISH<span>.EXE</span>
        </p>
        <div className={styles.titleHero} aria-hidden="true">
          <PixelSprite rows={[...HERO_FRAMES.idle]} palette={HERO_PALETTE} scale={6} />
          <div className={styles.titleGround} />
        </div>
        {cont ? (
          <>
            <p className={styles.continueQ}>Continue?</p>
            <button
              ref={startRef}
              type="button"
              className={styles.pressStart}
              onClick={() => finish(true, `#${WORLD_NAV.find((w) => w.world === cont)?.href.split("#")[1] ?? "home"}`)}
            >
              <span aria-hidden="true">▶</span> World {cont} · {WORLD_NAV.find((w) => w.world === cont)?.title}
            </button>
            <button type="button" className={styles.skip} onClick={() => finish(true, "#home")}>
              New game
            </button>
          </>
        ) : (
          <button ref={startRef} type="button" className={styles.pressStart} onClick={() => finish(true)}>
            <span aria-hidden="true">▶</span> Press start
          </button>
        )}
        <p className={styles.titleSound}>Sound on · scroll to play · press M for the world map</p>
        <button type="button" className={styles.skip} onClick={() => finish(false)}>
          Skip to portfolio
        </button>
      </div>
    </div>
  );
}
