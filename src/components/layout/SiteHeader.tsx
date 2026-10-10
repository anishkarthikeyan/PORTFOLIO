"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { links } from "@/data/portfolio";
import { isConfigured, NAV_ITEMS } from "@/lib/content";
import { openTerminal } from "@/components/terminal/events";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu on Escape and return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Highlight the section currently in view (home page only).
  useEffect(() => {
    const ids = NAV_ITEMS.map((n) => n.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/#home" className={styles.brand} aria-label="ANISH.EXE — home">
          <span className={styles.logo} aria-hidden="true">
            A
          </span>
          <span className="pixel">ANISH.EXE</span>
        </Link>

        <nav aria-label="Primary" className={styles.nav}>
          <button
            ref={toggleRef}
            type="button"
            className={`btn btn-ghost btn-sm ${styles.toggle}`}
            aria-expanded={open}
            aria-controls="primary-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className={styles.burger} data-open={open} />
            Menu
          </button>
          <ul id="primary-menu" className={styles.menu} data-open={open}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={styles.link}
                  aria-current={active === item.id ? "location" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isConfigured(links.resume) && (
              <li>
                <a href={links.resume.href} className="btn btn-sm" target="_blank" rel="noopener noreferrer">
                  Resume
                </a>
              </li>
            )}
          </ul>
        </nav>

        <button
          type="button"
          className={`btn btn-sm ${styles.term}`}
          onClick={() => {
            setOpen(false);
            openTerminal();
          }}
          aria-label="Open terminal"
          title="Open terminal ( ` )"
        >
          <span aria-hidden="true">&gt;_</span>
          <span className={styles.termLabel}>Terminal</span>
        </button>
      </div>
    </header>
  );
}
