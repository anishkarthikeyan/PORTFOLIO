/**
 * ============================================================================
 *  ANISH.EXE — SCROLL JOURNEY CONFIGURATION
 * ============================================================================
 *
 *  Each "world band" is a decorative strip rendered directly before a page
 *  section. The character emerges from the band's exit pipe (left), crosses
 *  the platforms, and dives into the entry pipe (right), which warps it to
 *  the next band. Bands contain no text or controls, so the character never
 *  covers content.
 *
 *  Coordinates are in art pixels. `y` values are the TOP surface of a
 *  platform or pipe rim; the character's position is its feet (bottom-center).
 *  Two layouts per band: `wide` (≥ 640px) and a simplified vertical `compact`.
 *
 *  Route geometry is validated by src/lib/journey.test.ts (landings must be on
 *  surfaces; jumps must clear platforms; the sprite must stay inside the band).
 * ============================================================================
 */

export type Point = [x: number, y: number];

export interface PlatformSpec {
  x: number;
  y: number;
  w: number;
  /** Thickness. Omit for ground that extends to the bottom of the band. */
  h?: number;
  kind: "ground" | "wood" | "block" | "island" | "branch" | "metal";
}

/** Pipe rim top-left at (x, y); the body extends to the band floor. */
export interface PipeSpec {
  x: number;
  y: number;
  w: number;
}

/**
 * `cue` names a prop that reacts while this step plays (a spring squashes, a
 * cannon fires…). The band sets data-cue-state="on" / "after" on it.
 */
export type RouteStep = (
  | { kind: "emerge"; weight?: number; /** Named hole instead of the exit pipe. */ from?: string }
  | { kind: "walk" | "run"; to: number; weight?: number }
  /**
   * `bump` names a block hit from below at the top of the arc; `stomp` an
   * enemy landed on; `over` something jumped over (a barrel).
   */
  | { kind: "jump"; to: Point; apex?: number; weight?: number; bump?: string; stomp?: string; over?: string }
  /**
   * Jetpack flight: an arc of height `lift` with `waves` wobbles, or with
   * `ease` a thrust/gravity curve between two heights (lab dodging).
   */
  | { kind: "fly"; to: Point; lift: number; wave?: number; waves?: number; ease?: boolean; weight?: number }
  /** Top-down movement in "mini" size (maze worlds): straight line, any axis. */
  | { kind: "move"; to: Point; weight?: number }
  /** `event` names a block triggered mid-pause (talk to an NPC, shoot, open a door…). */
  | { kind: "idle"; weight?: number; pose?: "idle" | "wave"; event?: string }
  | { kind: "enter"; weight?: number; /** Named hole instead of the entry pipe. */ into?: string }
  | { kind: "celebrate"; weight?: number }
  /** Vertical movement on a vine/ladder (climb) or pole (slide). */
  | { kind: "climb" | "slide"; toY: number; weight?: number }
  /**
   * Carried by something (elevator, conveyor). With `vehicle` the band draws
   * it and moves it with the character: a mine cart (legs hidden inside) or a
   * zipline trolley (hanging from the cable above the head).
   */
  | { kind: "ride"; to: Point; weight?: number; vehicle?: "cart" | "zip" }
  /** Travel hidden inside the world (e.g. through a hollow trunk). */
  | { kind: "hide"; to: Point; weight?: number }
  /** Touch a collectible at the current position (e.g. the star). */
  | { kind: "grab"; item: string; weight?: number }
) & { cue?: string };

/** A bumpable block or collectible. Hitting it awards points and can unlock an item. */
export interface BlockSpec {
  id: string;
  /** Top-left in art px. Blocks are 8 × 8. */
  x: number;
  y: number;
  /**
   * question/brick/acorn: bumped from below. star: grabbed. bug: stomped (an
   * enemy). coin/pellet: collected by passing through. power: a "?" block that
   * releases a power-up.
   */
  kind:
    | "question"
    | "brick"
    | "acorn"
    | "star"
    | "bug"
    | "boss"
    | "coin"
    | "pellet"
    | "power"
    | "npc"
    | "key"
    | "chest"
    | "door"
    | "ghost"
    | "barrel"
    | "invader"
    | "gate";
  /** Power-up released by a `power` block. */
  power?: "coffee" | "jetpack" | "star";
  points: number;
  /** `data-unlock-id` of a content element to highlight when hit. */
  unlock?: string;
  /** Short text shown in the pop-up when hit. */
  label?: string;
  /** What the character says (speech bubble) when it hits this. */
  say?: string;
}

export type PropKind =
  | "flag"
  | "desk"
  | "lamp"
  | "server"
  | "nodes"
  | "card"
  | "plant"
  | "trunk"
  | "leaves"
  | "books"
  | "cabinet"
  | "cap"
  | "portal"
  | "signpost"
  | "ladder"
  | "pole"
  | "vine"
  | "spring"
  | "zipline"
  | "cannon"
  | "rails"
  | "hollowtree";

export interface PropSpec {
  kind: PropKind;
  /** Base (bottom-left) position. Ladders, poles and vines: top-center. */
  x: number;
  y: number;
  label?: string;
  /** Length downward from y (ladder, pole, vine). */
  h?: number;
  /** Far end (zipline cable at feet height, rails). */
  to?: Point;
  /** Reacts to the route step with the same cue name. */
  cue?: string;
}

export interface BandLayout {
  width: number;
  height: number;
  platforms: PlatformSpec[];
  exitPipe?: PipeSpec;
  entryPipe?: PipeSpec;
  /** Start position when the band has no exit pipe (spawn world). */
  spawn?: Point;
  route: RouteStep[];
  /** The section heading is revealed once this many route steps are complete. */
  revealAfter: number;
  props: PropSpec[];
  blocks?: BlockSpec[];
  /** Extra openings the character can enter/emerge from (tree knot holes). */
  holes?: Record<string, PipeSpec>;
  /** Draw the character at half size (top-down maze worlds). */
  mini?: boolean;
  /** Game-specific geometry for renderers and tests (maze walls, zappers…). */
  meta?: Record<string, unknown>;
}

/** Any track the character can travel along (bands, corridors, tree, …). */
export type TrackLayout = BandLayout;

export interface WorldBand {
  id: string;
  /** DOM id of the section this band introduces. */
  sectionId: string;
  world: number;
  title: string;
  /** Label on the entry pipe (where it leads). */
  next?: string;
  /** Accent used by the band's scenery. */
  accent: string;
  wide: BandLayout;
  compact: BandLayout;
}

/* ---------------------------- shared geometry ---------------------------- */

const W = 360; // wide band width (art px)
const WH = 64; // wide band height
const C = 160; // compact band width
const CH = 88; // compact band height

const EXIT_W: PipeSpec = { x: 14, y: 36, w: 22 };
const ENTRY_W: PipeSpec = { x: 322, y: 36, w: 22 };
/** Compact (phone) entry pipe, standing on the floor at the right. */
const ENTRY_C: PipeSpec = { x: 134, y: 64, w: 22 };

/*
 * Every world travels differently, so the journey never repeats itself:
 *   1 spawn    – climb a ladder onto the rooftop
 *   2 projects – climb a tower and ride the zipline across
 *   3 profile  – springboard onto the stage, wave, slide down the pole
 *   4 skills   – climb a vine, drop into the hollow tree, pop out by its roots
 *   5 archive  – hop in a mine cart, get flung out at the buffer stop
 *   6 contact  – load into a cannon and get fired over the gap
 * Ladders, poles and vines sit exactly on a platform edge so the character
 * passes alongside the platform rather than through it.
 */

/* --------------------------------- worlds -------------------------------- */

export const WORLD_BANDS: WorldBand[] = [
  {
    id: "spawn",
    sectionId: "world",
    world: 1,
    title: "Spawn point",
    next: "Projects",
    accent: "#75442f",
    wide: {
      width: W,
      height: WH,
      platforms: [
        { x: 0, y: 52, w: 170, kind: "wood" },
        { x: 170, y: 30, w: 70, h: 8, kind: "block" },
        { x: 270, y: 52, w: 90, kind: "ground" },
      ],
      entryPipe: ENTRY_W,
      spawn: [40, 52],
      route: [
        { kind: "idle", weight: 1.4 },
        { kind: "walk", to: 150 },
        { kind: "walk", to: 170, weight: 0.5 },
        { kind: "climb", toY: 30 },
        { kind: "run", to: 236 },
        { kind: "jump", to: [290, 52], apex: 8 },
        { kind: "walk", to: 302 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 1,
      props: [
        { kind: "desk", x: 58, y: 52 },
        { kind: "lamp", x: 112, y: 52 },
        { kind: "flag", x: 14, y: 52, label: "START" },
        { kind: "ladder", x: 170, y: 30, h: 22 },
      ],
    },
    compact: {
      width: C,
      height: CH,
      platforms: [
        { x: 0, y: 64, w: 70, kind: "wood" },
        { x: 70, y: 40, w: 50, h: 6, kind: "block" },
        { x: 118, y: 76, w: 42, kind: "ground" },
      ],
      entryPipe: ENTRY_C,
      spawn: [26, 64],
      route: [
        { kind: "idle", weight: 1.2 },
        { kind: "walk", to: 70 },
        { kind: "climb", toY: 40 },
        { kind: "run", to: 112 },
        { kind: "jump", to: [145, 64], apex: 8 },
        { kind: "enter" },
      ],
      revealAfter: 1,
      props: [
        { kind: "flag", x: 4, y: 64, label: "START" },
        { kind: "ladder", x: 70, y: 40, h: 24 },
      ],
    },
  },
  {
    id: "projects",
    sectionId: "projects",
    world: 2,
    title: "Project worlds",
    next: "Profile",
    accent: "#849bb8",
    wide: {
      width: W,
      height: WH,
      platforms: [
        { x: 0, y: 52, w: 100, kind: "ground" },
        { x: 100, y: 32, w: 22, h: 6, kind: "metal" },
        { x: 246, y: 46, w: 54, h: 8, kind: "island" },
        { x: 300, y: 52, w: 60, kind: "ground" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [60, 52], apex: 10 },
        { kind: "walk", to: 100 },
        { kind: "climb", toY: 32 },
        { kind: "walk", to: 122, weight: 0.5 },
        { kind: "ride", to: [266, 46], vehicle: "zip" },
        { kind: "jump", to: [308, 52], apex: 10 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "server", x: 54, y: 52, label: "SDE" },
        { kind: "ladder", x: 100, y: 32, h: 20 },
        { kind: "zipline", x: 122, y: 32, to: [266, 46] },
        { kind: "nodes", x: 276, y: 46, label: "AI/ML" },
      ],
    },
    compact: {
      width: C,
      height: CH,
      platforms: [
        { x: 0, y: 58, w: 44, kind: "ground" },
        { x: 44, y: 30, w: 18, h: 4, kind: "metal" },
        { x: 96, y: 70, w: 64, kind: "ground" },
      ],
      exitPipe: { x: 6, y: 46, w: 22 },
      entryPipe: { x: 134, y: 58, w: 22 },
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [36, 58], apex: 8 },
        { kind: "walk", to: 44, weight: 0.4 },
        { kind: "climb", toY: 30 },
        { kind: "walk", to: 62, weight: 0.5 },
        { kind: "ride", to: [112, 70], vehicle: "zip" },
        { kind: "jump", to: [145, 58], apex: 8 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "ladder", x: 44, y: 30, h: 28 },
        { kind: "zipline", x: 62, y: 30, to: [112, 70] },
      ],
    },
  },
  {
    id: "profile",
    sectionId: "about",
    world: 3,
    title: "Player profile",
    next: "Skills",
    accent: "#a7adb8",
    wide: {
      width: W,
      height: WH,
      platforms: [
        { x: 0, y: 52, w: 124, kind: "ground" },
        { x: 150, y: 36, w: 70, h: 6, kind: "wood" },
        { x: 210, y: 52, w: 150, kind: "ground" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [60, 52], apex: 10 },
        { kind: "walk", to: 104 },
        { kind: "jump", to: [172, 36], apex: 14, weight: 1.5, cue: "spring" },
        { kind: "idle", pose: "wave", weight: 0.8 },
        { kind: "walk", to: 220 },
        { kind: "slide", toY: 52 },
        { kind: "walk", to: 302 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "plant", x: 70, y: 52 },
        { kind: "spring", x: 98, y: 52, cue: "spring" },
        { kind: "card", x: 186, y: 36, label: "PLAYER 1" },
        { kind: "pole", x: 220, y: 30, h: 22 },
      ],
    },
    compact: {
      width: C,
      height: CH,
      platforms: [
        { x: 0, y: 64, w: 60, kind: "ground" },
        { x: 70, y: 40, w: 44, h: 5, kind: "wood" },
        { x: 100, y: 76, w: 60, kind: "ground" },
      ],
      exitPipe: { x: 6, y: 52, w: 22 },
      entryPipe: ENTRY_C,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [36, 64], apex: 8 },
        { kind: "walk", to: 44 },
        { kind: "jump", to: [84, 40], apex: 12, weight: 1.4, cue: "spring" },
        { kind: "idle", pose: "wave", weight: 0.7 },
        { kind: "walk", to: 114 },
        { kind: "slide", toY: 76 },
        { kind: "walk", to: 118, weight: 0.3 },
        { kind: "jump", to: [145, 64], apex: 8 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "spring", x: 38, y: 64, cue: "spring" },
        { kind: "card", x: 96, y: 40, label: "P1" },
        { kind: "pole", x: 114, y: 34, h: 42 },
      ],
    },
  },
  {
    id: "skills",
    sectionId: "skills",
    world: 4,
    title: "Skill tree",
    next: "Archive",
    accent: "#4f9a5a",
    wide: {
      width: W,
      height: WH,
      platforms: [
        { x: 0, y: 52, w: 360, kind: "ground" },
        { x: 74, y: 30, w: 50, h: 4, kind: "branch" },
        { x: 188, y: 28, w: 30, h: 4, kind: "branch" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      holes: {
        knot: { x: 196, y: 28, w: 14 },
        root: { x: 226, y: 52, w: 14 },
      },
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [52, 52], apex: 10 },
        { kind: "walk", to: 74 },
        { kind: "climb", toY: 30 },
        { kind: "walk", to: 116 },
        { kind: "jump", to: [203, 28], apex: 4 },
        { kind: "enter", into: "knot", weight: 0.9 },
        { kind: "emerge", from: "root", weight: 1.3 },
        { kind: "walk", to: 302 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "hollowtree", x: 188, y: 52, to: [226, 52] },
        { kind: "vine", x: 74, y: 22, h: 30 },
        { kind: "leaves", x: 66, y: 22 },
      ],
    },
    compact: {
      width: C,
      height: CH,
      platforms: [
        { x: 0, y: 76, w: 160, kind: "ground" },
        { x: 40, y: 46, w: 36, h: 4, kind: "branch" },
        { x: 88, y: 40, w: 24, h: 4, kind: "branch" },
      ],
      exitPipe: { x: 6, y: 64, w: 22 },
      entryPipe: ENTRY_C,
      holes: {
        knot: { x: 93, y: 40, w: 14 },
        root: { x: 114, y: 76, w: 12 },
      },
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [40, 76], apex: 8 },
        { kind: "climb", toY: 46 },
        { kind: "walk", to: 72 },
        { kind: "jump", to: [100, 40], apex: 8 },
        { kind: "enter", into: "knot", weight: 0.9 },
        { kind: "emerge", from: "root", weight: 1.2 },
        { kind: "walk", to: 124, weight: 0.3 },
        { kind: "jump", to: [145, 64], apex: 8 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "hollowtree", x: 88, y: 76, to: [114, 76] },
        { kind: "vine", x: 40, y: 38, h: 38 },
      ],
    },
  },
  {
    id: "archive",
    sectionId: "experience",
    world: 5,
    title: "Experience archive",
    next: "Contact",
    accent: "#8c5439",
    wide: {
      width: W,
      height: WH,
      platforms: [{ x: 0, y: 52, w: 360, kind: "metal" }],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [66, 52], apex: 10 },
        { kind: "ride", to: [252, 52], vehicle: "cart", cue: "rails" },
        { kind: "jump", to: [294, 52], apex: 14, weight: 1.1 },
        { kind: "walk", to: 302, weight: 0.3 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "rails", x: 52, y: 52, to: [268, 52], cue: "rails" },
        { kind: "cabinet", x: 110, y: 52 },
        { kind: "books", x: 160, y: 52 },
        { kind: "cap", x: 214, y: 52 },
      ],
    },
    compact: {
      width: C,
      height: CH,
      platforms: [{ x: 0, y: 76, w: 160, kind: "metal" }],
      exitPipe: { x: 6, y: 64, w: 22 },
      entryPipe: ENTRY_C,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [42, 76], apex: 8 },
        { kind: "ride", to: [100, 76], vehicle: "cart", cue: "rails" },
        { kind: "jump", to: [122, 76], apex: 12 },
        { kind: "jump", to: [145, 64], apex: 8 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "rails", x: 30, y: 76, to: [112, 76], cue: "rails" },
        { kind: "books", x: 66, y: 76 },
      ],
    },
  },
  {
    id: "contact",
    sectionId: "contact",
    world: 6,
    title: "Contact portal",
    next: "Finale",
    accent: "#a9bdd6",
    wide: {
      width: W,
      height: WH,
      platforms: [
        { x: 0, y: 52, w: 130, kind: "ground" },
        { x: 220, y: 52, w: 140, kind: "ground" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [60, 52], apex: 10 },
        { kind: "walk", to: 92 },
        { kind: "hide", to: [92, 52], weight: 0.8, cue: "load" },
        { kind: "fly", to: [256, 52], lift: 26, weight: 2, cue: "fire" },
        { kind: "celebrate", weight: 0.6 },
        { kind: "walk", to: 302 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "lamp", x: 50, y: 52 },
        { kind: "cannon", x: 92, y: 52, cue: "fire" },
        { kind: "signpost", x: 276, y: 52, label: "FINALE" },
      ],
    },
    compact: {
      width: C,
      height: CH,
      platforms: [
        { x: 0, y: 76, w: 60, kind: "ground" },
        { x: 100, y: 76, w: 60, kind: "ground" },
      ],
      exitPipe: { x: 6, y: 64, w: 22 },
      entryPipe: ENTRY_C,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [36, 76], apex: 8 },
        { kind: "walk", to: 44, weight: 0.4 },
        { kind: "hide", to: [44, 76], weight: 0.7, cue: "load" },
        { kind: "fly", to: [116, 76], lift: 30, weight: 1.8, cue: "fire" },
        { kind: "walk", to: 122, weight: 0.3 },
        { kind: "jump", to: [145, 64], apex: 8 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [{ kind: "cannon", x: 44, y: 76, cue: "fire" }],
    },
  },
];

export function getBand(id: string): WorldBand | undefined {
  return WORLD_BANDS.find((b) => b.id === id);
}
