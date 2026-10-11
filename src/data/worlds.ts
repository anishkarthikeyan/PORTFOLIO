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

export type RouteStep =
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
  /** Standing still on a moving platform (elevator, conveyor). */
  | { kind: "ride"; to: Point; weight?: number }
  /** Travel hidden inside the world (e.g. through a hollow trunk). */
  | { kind: "hide"; to: Point; weight?: number }
  /** Touch a collectible at the current position (e.g. the star). */
  | { kind: "grab"; item: string; weight?: number };

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
    | "invader";
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
  | "signpost";

export interface PropSpec {
  kind: PropKind;
  /** Base (bottom-left) position. */
  x: number;
  y: number;
  label?: string;
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

/** Simplified vertical route for phones: ledge → step → floor → pipe. */
function compact(opts: {
  start: "pipe" | "spawn" ;
  end: "pipe" | "portal";
  kinds?: [PlatformSpec["kind"], PlatformSpec["kind"], PlatformSpec["kind"]];
  props?: PropSpec[];
}): BandLayout {
  const [k1, k2, k3] = opts.kinds ?? ["ground", "block", "ground"];
  const route: RouteStep[] = [];
  if (opts.start === "pipe") route.push({ kind: "emerge" }, { kind: "jump", to: [40, 40], apex: 6 });
  else route.push({ kind: "idle" });
  route.push(
    { kind: "walk", to: 44 },
    { kind: "jump", to: [80, 58], apex: 6 },
    { kind: "walk", to: 100 },
    { kind: "jump", to: [120, 76], apex: 8 },
  );
  if (opts.end === "pipe") {
    route.push({ kind: "jump", to: [139, 62], apex: 10 }, { kind: "enter" });
  } else {
    route.push({ kind: "celebrate" });
  }
  return {
    width: C,
    height: CH,
    platforms: [
      { x: 0, y: 40, w: 52, h: 10, kind: k1 },
      { x: 62, y: 58, w: 44, h: 8, kind: k2 },
      { x: 100, y: 76, w: 60, kind: k3 },
    ],
    exitPipe: opts.start === "pipe" ? { x: 8, y: 28, w: 22 } : undefined,
    entryPipe: opts.end === "pipe" ? { x: 128, y: 62, w: 22 } : undefined,
    spawn: opts.start === "spawn" ? [24, 40] : undefined,
    route,
    revealAfter: 2,
    props: opts.props ?? [],
  };
}

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
        { x: 0, y: 52, w: 150, kind: "wood" },
        { x: 170, y: 44, w: 36, h: 8, kind: "block" },
        { x: 222, y: 36, w: 36, h: 8, kind: "block" },
        { x: 276, y: 52, w: 84, kind: "ground" },
      ],
      entryPipe: { x: 320, y: 36, w: 22 },
      spawn: [40, 52],
      route: [
        { kind: "idle", weight: 1.4 },
        { kind: "walk", to: 120 },
        { kind: "run", to: 146 },
        { kind: "jump", to: [186, 44], apex: 10 },
        { kind: "jump", to: [238, 36], apex: 10 },
        { kind: "jump", to: [292, 52], apex: 6 },
        { kind: "walk", to: 300 },
        { kind: "jump", to: [331, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 1,
      props: [
        { kind: "desk", x: 58, y: 52 },
        { kind: "lamp", x: 112, y: 52 },
        { kind: "flag", x: 14, y: 52, label: "START" },
      ],
    },
    compact: compact({
      start: "spawn",
      end: "pipe",
      kinds: ["wood", "block", "ground"],
      props: [{ kind: "flag", x: 4, y: 40, label: "START" }],
    }),
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
        { x: 0, y: 52, w: 110, kind: "ground" },
        { x: 132, y: 40, w: 62, h: 8, kind: "island" },
        { x: 214, y: 44, w: 62, h: 8, kind: "island" },
        { x: 296, y: 52, w: 64, kind: "ground" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [60, 52], apex: 10 },
        { kind: "walk", to: 100 },
        { kind: "jump", to: [150, 40], apex: 14 },
        { kind: "walk", to: 180 },
        { kind: "jump", to: [230, 44], apex: 10 },
        { kind: "run", to: 262 },
        { kind: "jump", to: [310, 52], apex: 8 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "server", x: 140, y: 40, label: "SDE" },
        { kind: "nodes", x: 240, y: 44, label: "AI/ML" },
      ],
    },
    compact: compact({
      start: "pipe",
      end: "pipe",
      kinds: ["ground", "island", "ground"],
      props: [{ kind: "server", x: 66, y: 58, label: "SDE" }],
    }),
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
        { x: 0, y: 52, w: 96, kind: "ground" },
        { x: 118, y: 42, w: 80, h: 8, kind: "wood" },
        { x: 218, y: 34, w: 24, h: 8, kind: "block" },
        { x: 262, y: 52, w: 98, kind: "ground" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [62, 52], apex: 10 },
        { kind: "walk", to: 86 },
        { kind: "jump", to: [134, 42], apex: 10 },
        { kind: "walk", to: 186 },
        { kind: "jump", to: [230, 34], apex: 8 },
        { kind: "jump", to: [290, 52], apex: 6 },
        { kind: "walk", to: 304 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "card", x: 150, y: 42, label: "PLAYER 1" },
        { kind: "plant", x: 74, y: 52 },
      ],
    },
    compact: compact({
      start: "pipe",
      end: "pipe",
      kinds: ["ground", "wood", "ground"],
      props: [{ kind: "card", x: 64, y: 58, label: "P1" }],
    }),
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
        { x: 0, y: 52, w: 70, kind: "ground" },
        { x: 88, y: 44, w: 40, h: 4, kind: "branch" },
        { x: 146, y: 34, w: 44, h: 4, kind: "branch" },
        { x: 208, y: 42, w: 44, h: 4, kind: "branch" },
        { x: 270, y: 52, w: 90, kind: "ground" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [50, 52], apex: 10 },
        { kind: "jump", to: [104, 44], apex: 10 },
        { kind: "jump", to: [162, 34], apex: 10 },
        { kind: "walk", to: 180 },
        { kind: "jump", to: [226, 42], apex: 8 },
        { kind: "jump", to: [288, 52], apex: 6 },
        { kind: "walk", to: 304 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "trunk", x: 160, y: 64 },
        { kind: "leaves", x: 140, y: 18 },
      ],
    },
    compact: compact({
      start: "pipe",
      end: "pipe",
      kinds: ["ground", "branch", "ground"],
      props: [{ kind: "trunk", x: 78, y: 88 }],
    }),
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
      platforms: [
        { x: 0, y: 52, w: 100, kind: "metal" },
        { x: 120, y: 40, w: 30, h: 8, kind: "block" },
        { x: 166, y: 32, w: 30, h: 8, kind: "block" },
        { x: 212, y: 40, w: 30, h: 8, kind: "block" },
        { x: 262, y: 52, w: 98, kind: "metal" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [64, 52], apex: 10 },
        { kind: "walk", to: 92 },
        { kind: "jump", to: [135, 40], apex: 8 },
        { kind: "jump", to: [181, 32], apex: 8 },
        { kind: "jump", to: [227, 40], apex: 6 },
        { kind: "jump", to: [282, 52], apex: 6 },
        { kind: "walk", to: 304 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "cabinet", x: 70, y: 52 },
        { kind: "books", x: 170, y: 32 },
        { kind: "cap", x: 276, y: 52 },
      ],
    },
    compact: compact({
      start: "pipe",
      end: "pipe",
      kinds: ["metal", "block", "metal"],
      props: [{ kind: "books", x: 66, y: 58 }],
    }),
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
        { x: 150, y: 44, w: 40, h: 8, kind: "block" },
        { x: 210, y: 52, w: 150, kind: "ground" },
      ],
      exitPipe: EXIT_W,
      entryPipe: ENTRY_W,
      route: [
        { kind: "emerge" },
        { kind: "jump", to: [70, 52], apex: 10 },
        { kind: "run", to: 118 },
        { kind: "jump", to: [168, 44], apex: 8 },
        { kind: "jump", to: [236, 52], apex: 6 },
        { kind: "walk", to: 304 },
        { kind: "jump", to: [333, 36], apex: 10 },
        { kind: "enter" },
      ],
      revealAfter: 2,
      props: [
        { kind: "signpost", x: 270, y: 52, label: "FINALE" },
        { kind: "lamp", x: 96, y: 52 },
      ],
    },
    compact: compact({
      start: "pipe",
      end: "pipe",
      props: [{ kind: "signpost", x: 60, y: 58, label: "FINALE" }],
    }),
  },
];

export function getBand(id: string): WorldBand | undefined {
  return WORLD_BANDS.find((b) => b.id === id);
}
