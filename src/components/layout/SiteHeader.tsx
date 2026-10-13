"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { links } from "@/data/portfolio";
import { WORLD_NAV } from "@/data/worldNav";
import { isConfigured } from "@/lib/content";
import { isSoundOn, onSoundChange, play, restoreSound, setSound } from "@/lib/sfx";
import { openTerminal } from "@/components/terminal/events";
import { WorldMap } from "@/components/worldmap/WorldMap";
import styles from "./SiteHeader.module.css";

/**
 * The header is a world selector: six world tiles (each a normal link to its
 * section, labelled with the section name), plus sound, world map (pause
 * menu) and terminal. The journey controller marks the current and visited
 * worlds on the tiles.
 */
export function SiteHeader() {
  const mapRef = useRef<HTMLDialogElement>(null);
  const sound = useSyncExternalStore(onSoundChange, isSoundOn, () => false);

  useEffect(() => {
    restoreSound();
  }, []);

  // "M" opens/closes the world map (when not typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.key.toLowerCase() === "m" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const d = mapRef.current;
        if (!d) return;
        if (d.open) d.close();
        else d.showModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMap = () => {
    mapRef.current?.showModal();
    play("pipe");
  };
  const closeMap = () => mapRef.current?.close();

  // Replay: back to the spawn point with a fresh game (score, coins, blocks,
  // save point). A reload is the simplest way to reset every world's state.
  const replay = () => {
    play("pipe");
    try {
      localStorage.removeItem("anish.save");
    } catch {
      /* storage unavailable */
    }
    history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
    // Already at "/" (no #section): reload. Otherwise load "/" fresh, which drops the hash.
    if (window.location.pathname === "/" && !window.location.hash) window.location.reload();
    else window.location.assign("/");
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/#home" className={styles.brand} aria-label="Anish Karthikeyan — home">
          <span className={styles.logo} aria-hidden="true">
            A
          </span>
          <span className="pixel">
            ANISH <span className={styles.brandAccent}>KARTHIKEYAN</span>
          </span>
        </Link>

        <nav aria-label="Worlds" className={styles.worlds}>
          <ol className={styles.tiles}>
            {WORLD_NAV.map((w) => (
              <li key={w.world}>
                <Link
                  href={w.href}
                  className={styles.tile}
                  data-world-tile={w.world}
                  title={`World ${w.world} · ${w.title}`}
                  style={{ "--accent": w.accent } as React.CSSProperties}
                >
                  <span className={styles.num} aria-hidden="true">
                    {w.world}
                  </span>
                  <span className={styles.tileTitle}>{w.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.controls}>
          {isConfigured(links.resume) && (
            <a href={links.resume.href} className="btn btn-sm" target="_blank" rel="noopener noreferrer">
              Resume
            </a>
          )}
          <button
            type="button"
            className={`btn btn-sm ${styles.iconBtn}`}
            aria-pressed={sound}
            aria-label="Sound"
            title={sound ? "Sound on" : "Sound off"}
            onClick={() => {
              setSound(!sound);
              if (!sound) play("coin");
            }}
          >
            <span aria-hidden="true" className={styles.speaker} data-on={sound} />
          </button>
          <button
            type="button"
            className={`btn btn-sm ${styles.iconBtn}`}
            onClick={replay}
            aria-label="Replay from the start"
            title="Replay from the start (resets score)"
          >
            <span aria-hidden="true">↺</span>
          </button>
          <button type="button" className={`btn btn-sm ${styles.mapBtn}`} onClick={openMap} aria-haspopup="dialog" title="World map (M)">
            <span aria-hidden="true" className={styles.mapIcon} />
            <span className={styles.mapLabel}>Map</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${styles.iconBtn}`}
            onClick={() => openTerminal()}
            aria-label="Open terminal"
            title="Open terminal ( ` )"
          >
            <span aria-hidden="true">&gt;_</span>
          </button>
        </div>
      </div>

      <dialog
        ref={mapRef}
        className={styles.mapDialog}
        aria-labelledby="world-map-title"
        onClick={(e) => {
          if (e.target === mapRef.current) closeMap();
        }}
      >
        <div className={styles.mapWindow}>
          <div className={styles.mapHead}>
            <h2 id="world-map-title" className={styles.mapTitle}>
              World map <span className={styles.paused}>· Paused</span>
            </h2>
            <button type="button" className={styles.close} onClick={closeMap} aria-label="Close world map">
              ✕
            </button>
          </div>
          <WorldMap variant="overlay" onNavigate={closeMap} />
          <p className={styles.mapHint}>Pick a world to warp there. Press M or Esc to close.</p>
        </div>
      </dialog>
    </header>
  );
}
