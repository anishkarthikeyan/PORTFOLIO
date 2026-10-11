/** Level enter/exit transitions (decorative; plain links work without them). */
export const LEVEL_EVENT = "anish:level";

export interface LevelDetail {
  mode: "enter" | "exit";
  href: string;
  level?: string;
  title?: string;
}
