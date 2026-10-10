# ANISH.EXE

Pixel-art portfolio for **Anish Karthikeyan** — B.E. Computer Science and Engineering, Chennai Institute of Technology (expected 2028). Positioned for SDE, backend, and AI/ML engineering roles.

Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules · hand-built SVG pixel art. No backend, database, or API keys.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm run lint       # ESLint
npm run typecheck  # route types + tsc --noEmit
npm test           # Vitest: content-integrity + terminal tests
```

## Editing content

**Almost everything lives in [`src/data/portfolio.ts`](src/data/portfolio.ts)** (types in [`src/data/types.ts`](src/data/types.ts)). Components only render this data.

| What | Where in `portfolio.ts` |
| --- | --- |
| Name, tagline, summaries (SDE + AI/ML), interests, philosophy | `profile` |
| Resume, GitHub, LinkedIn, email | `links` (+ `extraLinks` for coding profiles) |
| Education (confirmed) + optional coursework | `education` |
| Project case studies (SDE + AI/ML) | `projects` |
| Skill tree | `skillCategories` |
| Coding profiles, DSA topic map, sample problems | `codingProfiles`, `dsaTopics`, `problemExamples` |
| System design write-ups | `systemDesigns` |
| Experience timeline | `experience` |
| Achievements / certifications | `achievements` |
| Site title, description, domain, section toggles | `site` |

### Content status rules

Every non-confirmed record has a `status`:

- `"sample"` — placeholder. Rendered with a visible **SAMPLE** label and a dashed outline.
- `"draft"` — real, still being checked. Rendered with a **DRAFT** label.
- `"verified"` — real and checked. No label.

Only the name and education details are currently real. Everything else ships as `sample`.

- **Metrics and counts:** keep `value: null` until you have a real, reproducible number. `null` renders as `REPLACE ME`. Tests fail if a sample project gains a value.
- **Links:** keep `href: null` until the URL exists. Unset links are **hidden in production**. In `npm run dev` they appear as dashed `DEV ·` reminders.
- **Resume:** put `resume.pdf` in `/public` and set `links.resume.href = "/resume.pdf"`. The resume buttons then appear in the header, hero, contact section, and footer.
- **Remove all samples at once:** set `site.hideSampleContent = true`. Sample records are filtered out and empty sections disappear.
- **Hide a section:** use `site.sections.{dsa, systemDesign, experience, achievements}`.
- **Domain:** set `site.url` for canonical and Open Graph URLs.

### Replacing a sample project

1. Edit the project object: title, `problem`, `contribution`, `stack`, `tags` (3–5), `diagram`, and the case-study fields.
2. For a feature the project doesn't have, use `{ notApplicable: "reason" }` (for example `auth`, `api`, `training`). It renders as "Not applicable".
3. Diagrams are data: `stages` (columns of nodes) plus `flows` (plain-language connections). Set `diagram.basis` to `"implemented"` only for systems you actually built.
4. Add measured `results` with `conditions` and an `evidenceUrl`.
5. Set `status: "verified"` and update the related tests in `src/data/portfolio.test.ts` if needed.

## Structure

```
src/
  app/
    layout.tsx               fonts, metadata, header/footer/terminal shell
    page.tsx                 home: hero → world select → sections
    projects/[slug]/page.tsx statically generated case studies
    opengraph-image.tsx      generated OG image (character + name)
    icon.svg, not-found.tsx
  data/
    portfolio.ts             ← all editable content
    types.ts                 content model
  lib/
    content.ts               selectors, sample filtering, nav items
    terminal.ts              pure terminal command engine (no shell)
  components/
    hero/                    cinematic hero (desktop + recomposed mobile)
    scene/DeskScene.tsx      SVG room; desk objects are real links
    pixel/                   sprite data + renderer (character, plants, icons)
    world/                   world selector (arrow-key navigation)
    projects/                archive, filter, cards
    case-study/              SDE and AI/ML case-study layouts
    diagram/                 reusable architecture diagram
    sections/                profile, skills, DSA, system design, experience, education, achievements, contact
    terminal/                <dialog> terminal + open-event bridge
    layout/                  header (mobile menu) + footer
    ui/                      status badges, REPLACE ME, section header
```

## Interactions

- **ENTER WORLD** goes to the world selector. **VIEW PROJECTS** goes to the archive.
- **Desk objects** (laptop, poster, bookshelf, mug, plant, phone) link to sections. A visible text legend lists them, so nothing depends on hover.
- **Terminal:** press <kbd>`</kbd> or use the header button. The boot sequence is short and skippable. Commands: `help about projects sde aiml skills dsa experience contact open <slug> goto <section> clear`, with history (↑/↓), Tab completion, and Esc to close. Frontend only; nothing executes.
- **Deep links:** `/#projects-sde` or `/#projects-aiml` preselect a project filter. Each case study has its own URL.
- **Reduced motion:** idle animations (blink, typing, steam) and the boot sequence are disabled when `prefers-reduced-motion` is set.

## Scroll journey (pixel platformer)

One pixel character travels through the whole home page. Every section is part of a world with its own scenery and its own way of moving through it.

| World | What happens |
| --- | --- |
| 1 · Spawn + world select | Overworld map: walks node to node under the five rooms |
| 2 · Projects | SDE and AI/ML **islands**, with a "?" block above each card that pops out its highlight. Cards are "LEVEL 2-x" doors, and the button reads "Enter level". |
| 3 · Player profile | Zig-zag ledge lane beside the profile (desktop), an arcade "player select" frame, "?" blocks that reveal each interest, and a waving pedestal |
| 4 · Skill tree | A real pixel **tree**: canopy → branches → roots (fundamentals). The character climbs down vines and in and out of knot holes; acorns unlock categories. Also the dungeon (DSA topic rooms light up as visited, puzzle-room blocks) and the conveyor through the system-design machine room. |
| 5 · Experience archive | Mine-shaft **elevator** that stops at each entry's floor, castle battlements with the EXPECTED 2028 banner, and the trophy room |
| 6 · Contact | **Finale**: three stair bricks → star (opens the "Your journey" summary) → flagpole slide → portal. Configured links also appear as labelled warp pipes. |

**How movement works**
- **Engine:** everything is in `src/lib/`, and all of it is pure and tested.
  - `journey.ts`: routes and poses, measured in beats.
  - `tracks.ts`: builders for each world.
  - `lane.ts`: the zig-zag ledge lane.
  - `chase.ts`: the global timeline and catch-up logic.
- **Scroll position** sets a target point on one global timeline. The character chases it at game speed and stays within about a second, sprinting when behind.
- **Big jumps** (a nav click, a fast flick, or more than about 18 beats behind) are crossed by warping through a pipe.
- **Scrolling up** chases backwards.
- **Work only happens while the character is moving.** Nothing runs while idle.
- **Each track measures itself** from the real layout (`useTrack`) and registers with the single `JourneyController`. "?" blocks line up with the cards they unlock.

**Game score is separate from portfolio content**
- The HUD strip under the header shows POINTS, blocks, DISTANCE and the current WORLD.
- Values last for the session only.
- Nothing is ever locked: unlocked items are always visible in place, and a block hit just makes them sparkle.

**Accessibility**
- The game layer is `aria-hidden`.
- Reduced motion shows a still character and hides the HUD.
- Without JavaScript all content is visible.

**Editing:** after changing any route or builder, run `npm test`. The geometry tests check:
- landings are on a surface
- no move passes through solid geometry
- the sprite stays inside its track
- every block is actually hit by the character's head
- the chase timing

## Accessibility and responsiveness

- Semantic landmarks, one `h1` per page, skip link, and visible focus rings.
- Native `<dialog>` for the terminal (focus trap and Esc). The mobile menu closes on Esc and returns focus.
- Color is never the only signal. Status uses text badges, diagram node kinds are printed, and selected controls get a `▸` marker.
- Text tokens meet WCAG AA contrast on every background (lowest ratio ≈ 5.5:1).
- Verified to have no horizontal page overflow at 320, 375, 390, 430, 768, 1280, 1440, and 1920 px.

## Known limitations

- **All projects, skills, experience, achievements, DSA numbers, and system designs are sample content** and must be replaced before applying anywhere.
- Contact, resume, and profile links are unset, so they are hidden on the production site until configured.
- No domain is configured. Without `site.url`, Open Graph URLs resolve to `localhost` (Next prints a `metadataBase` warning at build).
- Audio is not implemented (by design: optional, off by default).
- No automated browser/E2E test suite is included. Visual, overflow, and interaction checks were run manually with headless Chrome during development.
- `npm run dev` re-adds a managed block to `AGENTS.md`. This is expected Next.js 16 behavior.
