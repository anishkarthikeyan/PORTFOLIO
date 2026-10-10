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

As you scroll the home page, one pixel character travels through six worlds. It emerges from a green warp pipe, crosses platforms, and dives into the next pipe.

| World | Band placed before |
| --- | --- |
| 1 · Spawn point | World select (right after the hero) |
| 2 · Project worlds (SDE + AI/ML islands) | Projects |
| 3 · Player profile | About |
| 4 · Skill tree (also covers DSA + system design) | Skills |
| 5 · Experience archive (experience, education, achievements) | Experience |
| 6 · Contact portal (final celebrate pose) | Contact |

- **Config:** `src/data/worlds.ts` holds platforms, pipes, props and the route for each band, with `wide` and `compact` (phone) layouts.
- **Math:** `src/lib/journey.ts` is pure. It maps scroll position to band progress, then route progress, then character state.
- **Rendering:** `src/components/journey/` contains `WorldBand`, `WarpPipe`, `PixelPlatform`, `WorldProps`, `heroSprite`, and `JourneyController`. The controller is the only thing that moves the character.
- **How it behaves:**
  - The character's state is a pure function of scroll position. Reverse scrolling replays the states backwards, with the character turning to face its direction of travel. Fast scrolls jump to the correct state.
  - Work happens only in a `requestAnimationFrame` scheduled by scroll or resize. Nothing runs while idle.
- **World zones (content inside the world):** each world is a `<WorldZone>` (`src/components/journey/WorldZone.tsx`). It holds the band and the sections of that world, set inside the same scenery: a starfield with vertical parallax, accent light, distant silhouettes and a pixel ground. Panels and headings "power on" with a stepped reveal as they enter the viewport, and reverse when scrolled back below it.
- **Lane (desktops ≥ 1100px):** the content column leaves at least 188px of right margin for a ledge tower (`src/lib/lane.ts`, pure and tested).
  - The character comes out of the band's pipe into the lane, then descends ledges bolted to the headings and right-hand cards. It reaches each one as it crosses mid-screen, then pipes into the next world.
  - A single "target line" halfway down the viewport drives bands and lanes alike, so the journey is continuous.
  - Smaller screens keep the band-only journey.
- **Safety:**
  - Bands are `aria-hidden` and contain no text content or controls, so the character never covers content.
  - Navigation, anchors and keyboard use are unchanged.
- **Reduced motion:** the character stands still in the nearest band, with no travel, parallax or puffs. All headings stay fully visible.
- **Without JavaScript:** the bands are static scenery and every section is fully visible.
- **Editing routes:** after changing a route, run `npm test`. The tests check that every landing is on a surface, that no jump passes through a platform, and that the sprite stays inside its band.

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
