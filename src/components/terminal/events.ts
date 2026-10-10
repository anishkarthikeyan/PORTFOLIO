/** Tiny event bridge so any component can open the terminal without shared state. */
export const TERMINAL_OPEN_EVENT = "anish:terminal-open";

export function openTerminal(command?: string) {
  window.dispatchEvent(new CustomEvent(TERMINAL_OPEN_EVENT, { detail: { command } }));
}
