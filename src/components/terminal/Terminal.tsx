"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BOOT_SEQUENCE, complete, runCommand, type TerminalLine } from "@/lib/terminal";
import { TERMINAL_OPEN_EVENT } from "./events";
import styles from "./Terminal.module.css";

type Entry = { id: number; prompt?: string; line?: TerminalLine };

const BOOT_STEP_MS = 140;

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function Terminal() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const bootTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [booting, setBooting] = useState(false);
  const [booted, setBooted] = useState(false);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);

  const push = useCallback((items: Omit<Entry, "id">[]) => {
    setEntries((prev) => [...prev, ...items.map((i) => ({ ...i, id: ++idRef.current }))]);
  }, []);

  const finishBoot = useCallback(() => {
    if (bootTimer.current) clearInterval(bootTimer.current);
    bootTimer.current = null;
    setEntries(BOOT_SEQUENCE.map((t, i) => ({ id: ++idRef.current, line: { kind: "text", text: t, tone: i === BOOT_SEQUENCE.length - 1 ? "accent" : "muted" } })));
    setBooting(false);
    setBooted(true);
  }, []);

  const startBoot = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return finishBoot();
    setBooting(true);
    setEntries([]);
    let i = 0;
    bootTimer.current = setInterval(() => {
      i += 1;
      if (i >= BOOT_SEQUENCE.length) return finishBoot();
      setEntries(BOOT_SEQUENCE.slice(0, i).map((t) => ({ id: ++idRef.current, line: { kind: "text", text: t, tone: "muted" } })));
    }, BOOT_STEP_MS);
  }, [finishBoot]);

  const close = useCallback(() => dialogRef.current?.close(), []);

  const execute = useCallback(
    (raw: string) => {
      const result = runCommand(raw);
      if (result.clear) {
        setEntries([]);
        return;
      }
      push([{ prompt: raw }, ...result.lines.map((line) => ({ line }))]);
      if (raw.trim()) setHistory((h) => [...h, raw.trim()].slice(-50));
      if (result.navigate) {
        const href = result.navigate;
        setTimeout(() => {
          close();
          router.push(href);
        }, 250);
      }
    },
    [close, push, router],
  );

  const open = useCallback(
    (command?: string) => {
      const dlg = dialogRef.current;
      if (!dlg) return;
      if (!dlg.open) dlg.showModal();
      if (!booted && !booting) startBoot();
      if (command) {
        if (!booted) finishBoot();
        execute(command);
      }
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [booted, booting, execute, finishBoot, startBoot],
  );

  // Open via custom event and the backtick shortcut.
  useEffect(() => {
    const onOpen = (e: Event) => open((e as CustomEvent<{ command?: string }>).detail?.command);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    };
    window.addEventListener(TERMINAL_OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(TERMINAL_OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => () => {
    if (bootTimer.current) clearInterval(bootTimer.current);
  }, []);

  // Keep the newest output in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (booting) {
      finishBoot();
      if (e.key !== "Enter") return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      execute(value);
      setValue("");
      setCursor(null);
    } else if (e.key === "ArrowUp") {
      if (!history.length) return;
      e.preventDefault();
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === "ArrowDown") {
      if (cursor === null) return;
      e.preventDefault();
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(null);
        setValue("");
      } else {
        setCursor(next);
        setValue(history[next]);
      }
    } else if (e.key === "Tab" && value.trim()) {
      const hit = complete(value);
      if (hit) {
        e.preventDefault();
        setValue(hit);
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="terminal-title"
      onClick={(e) => {
        // Click on the backdrop closes the dialog.
        if (e.target === dialogRef.current) close();
      }}
    >
      <div className={styles.window}>
        <div className={styles.titlebar}>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2 id="terminal-title" className={styles.title}>
            anish.exe — terminal
          </h2>
          <button type="button" className={styles.close} onClick={close} aria-label="Close terminal">
            ✕
          </button>
        </div>

        <div ref={scrollRef} className={styles.output} role="log" aria-live="polite" aria-label="Terminal output">
          {entries.map((e) =>
            e.prompt !== undefined ? (
              <p key={e.id} className={styles.promptLine}>
                <span className={styles.ps1} aria-hidden="true">
                  guest@anish.exe:~$
                </span>{" "}
                {e.prompt}
              </p>
            ) : e.line?.kind === "link" ? (
              <p key={e.id}>
                <a
                  href={e.line.href}
                  className={styles.link}
                  {...(e.line.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={(ev) => {
                    if (e.line?.kind !== "link" || e.line.external) return;
                    ev.preventDefault();
                    const href = e.line.href;
                    close();
                    router.push(href);
                  }}
                >
                  {e.line.text}
                </a>
              </p>
            ) : (
              <p key={e.id} className={e.line?.tone ? styles[e.line.tone] : undefined}>
                {e.line?.text}
              </p>
            ),
          )}
          {booting && (
            <button type="button" className={styles.skip} onClick={finishBoot}>
              Skip ▸
            </button>
          )}
        </div>

        <form
          className={styles.inputRow}
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <span className={styles.ps1} aria-hidden="true">
            guest@anish.exe:~$
          </span>
          <input
            ref={inputRef}
            id="terminal-input"
            className={styles.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onInputKey}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="type 'help'"
            aria-label="Terminal command"
            aria-describedby="terminal-hint"
          />
        </form>
        <p id="terminal-hint" className={styles.hint}>
          Frontend-only command palette — no shell access. Try: <code>projects</code>, <code>sde</code>,{" "}
          <code>aiml</code>, <code>open project-atlas</code>.
        </p>
      </div>
    </dialog>
  );
}
