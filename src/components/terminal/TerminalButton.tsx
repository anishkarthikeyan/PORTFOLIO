"use client";

import { openTerminal } from "./events";

export function TerminalButton({
  className,
  command,
  children,
}: {
  className?: string;
  command?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openTerminal(command)}>
      {children}
    </button>
  );
}
