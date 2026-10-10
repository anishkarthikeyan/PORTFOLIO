/**
 * Original pixel-art sprites for ANISH.EXE.
 * Each string is one row; each character is one pixel ("." = transparent).
 * Palettes map characters to colors. Edit freely — rows must stay equal width.
 */

export type Palette = Record<string, string>;

/* Canonical character (44 × 46). Eyes live in a separate layer so they can blink. */
export const CHARACTER_PALETTE: Palette = {
  K: "#0d0e11", // hair
  H: "#2c3139", // hair highlight
  h: "#1d2026", // hair mid
  r: "#323a48", // steel rim light
  P: "#15171b", // headphones
  p: "#4a505b", // headphone highlight
  Q: "#08090b", // headphone inner
  S: "#8d5b3b", // skin (warm medium brown)
  s: "#704530", // skin shadow
  W: "#eef1f5", // eye white
  E: "#14161a", // pupil
  B: "#17191e", // hoodie
  b: "#0e0f12", // hoodie shadow
  c: "#262a32", // hoodie highlight
  C: "#232831", // chair
  D: "#e3e6ea", // drawstring
  d: "#a7adb8", // aglet
};

export const CHARACTER = [
  "............rr.rrrrrrrrrrrrrr...............",
  "........r..rKKrKKKKKKKKKKKKKKrrrr...........",
  "........rrrKKKKKKKKHHKKKKKHKKKKKKrrr........",
  ".......rKKKKKKKKKKKKHKKKKKKKKKKKKKKKr.......",
  ".....rrKKKKKHHKKKKKKKhKKKKKHHKKKKKKKKrr.....",
  ".....rKKKKKKKHHKKKKKKKKKKKKKHKKKKKKKKKr.....",
  "...rrKKKKKKKKKhKKHKKKKKKKKKKKKKKKKKKKKKr....",
  "....rKHKKKKKKKKKKKhKKKKHHKKKKhKKKKKHHKKr....",
  "..r.rKKhKHHKKKKKKKKKKKKKHKKKKKKKKKKKKKKKr...",
  ".....rKKKKHhKKKKKKKKKKKKKKKKKKKHHKKKKKr.....",
  ".r...rKKKKKKKKKKKKKKKKKKKhKKKKKKKhKKKKr..r..",
  "..r....rKKKKKKKKHHKKKKKKKKhKKKKKKKKKr.......",
  "........rKKKKhKKKKKKKKKKKKKKKHHKKKKr.....r..",
  "......PPPPPKKKKKKKKKKHKKKKKKKKKKKPPPPP......",
  "......PpPPQKKKKKKKSKKKSSKKKSKSKKKQpPPP......",
  "......PpPPQKKKSKKSSSKSSSSKSSSSKSKQpPPP......",
  "......PpPPQKSSKKKKKSSSSSSKKKKKSSKQpPPP......",
  "......PpPPQKSSSSSSSSSSSSSSSSSSSSKQpPPP......",
  "......PpPPQKSSSSSSSSSSSSSSSSSSSSKQPPPP......",
  "......PpPPQKSSSSSSSSSSSSSSSSSSSSKQPPPP......",
  "......PPPPQSSSSSSSSSSSSSSSSSSSSSsQPPPP......",
  "......PPPPQSSSSSSSSSSssSSSSSSSSSsQPPPP......",
  "......PPPPPSSSSSSSSSSSSSSSSSSSSSsPPPPP......",
  "............SSSSSSSSssssSSSSSSSs............",
  "......CCCCCCCCSssssssssssssssSCCCCCCCC......",
  ".....CcCCCCCCBbbbssssssssssbbbBCCCCCCCC.....",
  ".....CcCCCBBBBbbbssssssssssbbbBBBBCCCCC.....",
  ".....CcCBBBBBBbbbbbbbbbbbbbbbbBBBBBBCCC.....",
  ".....CcBBccccBBBBBDBBBBBBDBBBBBBBBBBBCC.....",
  ".....CcBcBBBBBBBBBDBBBBBBDBBBBBBBBBBBCC.....",
  ".....CcBcBBBBBBBBBDBBBBBBDBBBBBBBBBBBCC.....",
  ".....CcBcBBBBbBBBBDBBBBBBDBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBDBBBBBBDBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBDBBBBBBdBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBdBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
  ".....CcBcBBBBbBBBBBBBBBBBBBBBBbBBBBBBCC.....",
];

export const CHARACTER_EYES = [
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "..............WWEEW......WEEWW..............",
  "..............WWEEW......WEEWW..............",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
];

export const PLANT_PALETTE: Palette = {
  G: "#3f8a4b",
  g: "#62b06a",
  w: "#eef1f5",
  W: "#d3d8df",
  s: "#a7adb8",
  p: "#3a414d",
  P: "#4a5260",
};

export const DESK_PLANT = [
  "....g..G...",
  "..G.gG.GG..",
  ".GG..GGG...",
  "..GGgGG..g.",
  "g..GGG..GG.",
  ".GG.GG.GG..",
  "..GGGGGG...",
  "....GG.....",
  "..wwwwwww..",
  "..WWWWWWs..",
  "..WWWWWWs..",
  "..WWWWWWs..",
  "...WWWWs...",
];

export const TRAILING_PLANT = [
  "..g...G..g....",
  ".GgG.GGg.GG.g.",
  "GGGGgGGGGGgGG.",
  ".ppppppppppp..",
  ".pPPPPPPPPPp..",
  ".pPPPPPPPPPp..",
  "..pppppppppG..",
  "G.G..G.g..GG..",
  "Gg.G.GG...G...",
  ".G..g.G..gG...",
  ".GG.G..G..G...",
  "..G.G..G.G....",
  "..g.GG..GG....",
  "..G..G...G....",
  "..G..g...g....",
  "..GG.G...G....",
  "...G.....G....",
  "...g.....G....",
  "...G..........",
  "...G..........",
];

export const ICON_PALETTE: Palette = {
  B: "#5c6f88",
  S: "#a7adb8",
  d: "#1d232c",
  L: "#d3d8df",
  A: "#5c6f88",
  G: "#3f8a4b",
  g: "#62b06a",
  n: "#a9bdd6",
  W: "#75442f",
  r: "#a7adb8",
  p: "#5c6f88",
  P: "#849bb8",
  l: "#c9d7e8",
};

export const ICON_ARCHIVE = [
  "................",
  ".BBBBBBBBBBBBB..",
  ".BBSSSSSSSSBBBB.",
  ".BBSSSSSSSSBBdB.",
  ".BBSSSSSSSSBBdB.",
  ".BBSSSSSSSSBBBB.",
  ".BBBBBBBBBBBBBB.",
  ".BBBBBBBBBBBBBB.",
  ".BBLLLLLLLLLLBB.",
  ".BBLAAAAAAAALBB.",
  ".BBLLLLLLLLLLBB.",
  ".BBLAAAAAALLLBB.",
  ".BBLLLLLLLLLLBB.",
  ".BBLLLLLLLLLLBB.",
  ".BBBBBBBBBBBBBB.",
  "................",
];

export const ICON_TREE = [
  "................",
  "......GGGG......",
  "....GGGnGGGG....",
  "...GGgGGGGgGG...",
  "..GGGGGGGGGnGG..",
  "..GnGGGGGgGGGG..",
  "..GGGGGGGGGGGG..",
  "...GGGGgGGnGG...",
  "....GGGGGGGG....",
  "......WWWW......",
  ".......WW.......",
  ".......WW.......",
  ".......WW.......",
  ".....WWWWWW.....",
  "....WWWWWWWW....",
  "................",
];

export const ICON_LOG = [
  "................",
  "...BBBBBBBBBBB..",
  "..rWWWWWWWWWWWB.",
  "..BWAAAAAAAAWWB.",
  "..rWWWWWWWWWWWB.",
  "..BWAAAAAAWWWWB.",
  "..rWWWWWWWWWWWB.",
  "..BWAAAAAAAAWWB.",
  "..rWWWWWWWWWWWB.",
  "..BWAAAAAWWWWWB.",
  "..rWWWWWWWWWWWB.",
  "..BWAAAAAAAWWWB.",
  "..rWWWWWWWWWWWB.",
  "...BBBBBBBBBBB..",
  "................",
  "................",
];

export const ICON_PORTAL = [
  "................",
  ".....SSSSSS.....",
  "....SSppppSS....",
  "...SSpPPPPpSS...",
  "...SpPPllPPpS...",
  "...SpPllllPpS...",
  "...SpPllllPpS...",
  "...SpPllllPpS...",
  "...SpPllllPpS...",
  "...SpPllllPpS...",
  "...SpPllllPpS...",
  "...SpPllllPpS...",
  "...SSSSSSSSSS...",
  "..SSSSSSSSSSSS..",
  "................",
  "................",
];

/** Per-icon palette overrides. */
export const ICON_LOG_PALETTE: Palette = { ...ICON_PALETTE, W: "#d3d8df", A: "#5c6f88", B: "#3a4452" };
export const ICON_PORTAL_PALETTE: Palette = { ...ICON_PALETTE, S: "#3a4250" };
