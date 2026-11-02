# System architecture

## Context

Portfolio 2026 is a SvelteKit presentation layer backed by WordPress through WPGraphQL.

```text
Visitor
  ↓
SvelteKit route and server loader
  ↓
Apollo Client (server-only)
  ↓
WPGraphQL
  ↓
WordPress portfolio content
  ↓
Server mappers → application types
  ↓
Svelte components (presentation-ready props only)
```

`/contact` is the exception: it is a static client route with a `mailto:` form and does not query WordPress.

## Boundaries

### Routes

| Path                | Purpose                                                    | Data                     |
| ------------------- | ---------------------------------------------------------- | ------------------------ |
| `/`                 | Hero, manifesto, latest work, latest posts, personal intro | Home page, works, posts  |
| `/work`             | Filterable work index with list/grid views                 | Works                    |
| `/work/[slug]`      | Case study                                                 | One work                 |
| `/write`            | Filterable writing index                                   | Posts                    |
| `/write/[slug]`     | Post, plus related posts                                   | One post + other posts   |
| `/about`            | Biography, experience, photo stack                         | About page + experiences |
| `/contact`          | Inquiry form and social links                              | None (client-only)       |
| `/privacy-policy`   | Legal page from CMS                                        | Privacy policy page      |
| `/terms-of-service` | Legal page from CMS                                        | Terms of service page    |
| `/styleguide`       | Internal visual reference                                  | None                     |

Unknown public slugs return `404`. CMS or mapping failures return `5xx`. Use SvelteKit file-based routing and `resolve()` from `$app/paths` for internal route links.

Nav, social, and policy links live in `src/utils/links.ts`.

### UI components

- `src/lib/components/layout/` owns the site shell (Header, Footer).
- `src/lib/components/shared/` owns reusable portfolio UI, grouped by concern:
  - `hero-components/` — home hero and Threlte scene
  - `work-components/` — latest work, index list/card/row
  - `post-components/` — writing hero, cards, related carousel
  - `experiences-components/` — about-page experience list
  - `ui/` — Lenis, page transition, site loader, sound toggle, skip link
  - `misc/` — SEO, about copy, personal intro
- Route files compose features and own route-specific presentation.
- Components receive serializable, presentation-ready data; they do not query WordPress directly.

### Data layer

- GraphQL operations live in `src/lib/graphql/api/documents/`.
- Generated GraphQL types live in `src/lib/graphql/generated/` and are not hand-edited.
- Apollo setup and WordPress mapping remain server-only in `src/lib/server/`.
- Route `+page.server.ts` loaders orchestrate requests and map results into application types.
- Each content type is one contract that must evolve together:

| Content     | Fragment / query   | Mapper               | Application type |
| ----------- | ------------------ | -------------------- | ---------------- |
| Work        | `WorkFields`       | `toWorkItem()`       | `WorkItem`       |
| Post        | `PostFields`       | `toPostItem()`       | `PostItem`       |
| Experience  | `ExperienceFields` | `toExperienceItem()` | `ExperienceItem` |
| Home        | `HomePageFields`   | `toHomePage()`       | `HomePage`       |
| About       | `GetAboutPage`     | `toAboutPage()`      | `AboutPage`      |
| Legal pages | page queries       | none today           | CMS page fields  |

Legal pages currently pass CMS title/content through without a dedicated application type. New content types should follow the work/post mapper pattern rather than expanding that exception.

## Data-state contract

Every data-backed feature specification must define:

1. Successful data with typical content.
2. Missing optional media or metadata.
3. Empty collections.
4. Long titles, category names, and rich content.
5. Upstream errors and unavailable content.
6. Unknown slugs and the appropriate HTTP status.

Do not leak upstream GraphQL shapes into components. Normalize nullable CMS fields at the server
boundary and make absence intentional in component props.

## Rendering and security

- Fetch WordPress data on the server unless a feature spec demonstrates a user-facing need for
  client fetching.
- Keep `WORDPRESS_GRAPHQL_URL` server-only (`$env/dynamic/private`).
- Treat `{@html}` as trusted-CMS rendering. Any future user-authored or third-party HTML must be
  sanitized before rendering.
- The contact form must not collect or store messages on this origin; it opens the visitor's mail
  client via `mailto:`.
- Use SvelteKit errors with meaningful status codes: `404` for absent public resources and `5xx`
  for upstream or mapping failures.

## Styling architecture

- Global tokens and primitives live in `src/lib/css/`.
- Import global styles once from the root layout.
- Component-specific styling stays in the component `<style>` block.
- Follow the custom-property, typography, PostCSS, and media-query conventions in
  [`../02_coding_standards/frontend-standards.md`](../02_coding_standards/frontend-standards.md).
- Add a global token only when it represents a reusable design decision, not a one-off measurement.

## Motion architecture

- CSS transitions handle small state changes such as hover, focus, opacity, and color.
- GSAP handles sequencing, FLIP layout changes (work and writing filters), pointer-follow
  behavior, the site loader, and scroll orchestration.
- The home hero uses Threlte / Three.js as progressive enhancement; content and navigation must
  remain usable if the canvas does not initialize.
- `PageTransition` uses the View Transitions API plus a GSAP curtain. Unsupported browsers and
  reduced-motion visitors keep SvelteKit's default instant navigation.
- Lenis is a progressive enhancement for scroll feel, not a dependency for content access.
- Embla powers the related-posts carousel.
- Any browser-only animation setup belongs in an effect and must clean up timelines, listeners,
  contexts, and ScrollTriggers.
- Every motion spec includes reduced-motion behavior.

## Audio architecture

- Interface sounds use `uisfx`, initialized once from the root layout in `src/lib/sfx.ts`.
- Prefer declarative `data-uisfx` / `data-uisfx-hover` attributes on interactive elements.
- Call `playSfx()` only when a cue is not expressible as a data attribute (forms, filters, toggles).
- Audio unlocks on the first pointer or keyboard interaction and can be disabled from the footer
  `SoundToggle`. Preference persists via the uisfx `portfolio:sound` key.
- Sound is enhancement: every action must work with sound off or blocked by autoplay policy.

## Architectural constraints

- Use Svelte 5 runes; do not introduce legacy reactive syntax into new components.
- Preserve SSR safety: browser globals are accessed only in browser lifecycle code.
- Keep the site usable before animation, WebGL, Lenis, or audio initialization.
- Avoid new global state unless two independent route branches must coordinate persistent state.
- Prefer platform and SvelteKit capabilities before adding dependencies.
- Choose an explicit SvelteKit adapter before production requirements depend on platform behavior.
  The project currently uses `@sveltejs/adapter-auto` via `vite.config.ts`.
