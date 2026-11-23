# Portfolio 2026

Personal portfolio site: SvelteKit presentation layer backed by WordPress (WPGraphQL). Content lives in WordPress; this app owns routing, design, and motion.

## How it works

```text
Visitor
  ↓
SvelteKit route (+page.server.ts)
  ↓
Apollo Client (server-only)
  ↓
WPGraphQL
  ↓
WordPress (work, posts, about, experiences, policies, …)
  ↓
Server mappers → application types
  ↓
Svelte components (presentation-ready props only)
```

1. A route’s `+page.server.ts` loader reads `WORDPRESS_GRAPHQL_URL` and creates a short-lived Apollo client.
2. It runs a typed GraphQL document from `src/lib/graphql/generated/`.
3. Server mappers in `src/lib/server/` normalize CMS shapes into app types (`WorkItem`, `PostItem`, etc.).
4. Components receive serializable data — they never query WordPress directly.

`/contact` does not query WordPress: its form action validates the message and emails it through Resend (honeypot plus a best-effort in-memory rate limit).

Upstream GraphQL shapes stay behind the server boundary. Missing optional fields are omitted; bad slugs return `404`; CMS failures return `5xx`.

## Stack

| Layer           | Choice                                                    |
| --------------- | --------------------------------------------------------- |
| UI              | Svelte 5 (runes), SvelteKit 2, TypeScript                 |
| CMS             | WordPress + WPGraphQL                                     |
| Data            | Apollo Client (server-only), GraphQL Code Generator       |
| Motion          | GSAP, Lenis, Threlte / Three.js (hero), Embla (carousels) |
| Audio           | uisfx                                                     |
| Styles          | Component-scoped CSS + global PostCSS tokens              |
| Package manager | pnpm                                                      |

## Routes

| Path                                   | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `/`                                    | Hero, manifesto, latest work, latest posts, personal intro |
| `/work`                                | Filterable work index (list / grid)                        |
| `/work/[slug]`                         | Case study                                                 |
| `/write`                               | Filterable writing index                                   |
| `/write/[slug]`                        | Post                                                       |
| `/about`                               | Bio, experience, photo stack                               |
| `/contact`                             | Inquiry form (emailed via Resend) + socials                |
| `/privacy-policy`, `/terms-of-service` | Legal pages from CMS                                       |
| `/rss.xml`, `/sitemap.xml`, `/og/*`    | Feeds, sitemap, generated share images                     |

Nav, social, and policy links live in `src/utils/links.ts`.

## Project structure

```text
src/
  routes/                 # File-based pages + server loaders
  lib/
    components/
      layout/             # Header, Footer
      shared/
        hero-components/  # Home hero + Threlte scene
        work-components/  # Work index, cards, latest work
        post-components/  # Writing cards, hero, carousel
        experiences-components/
        ui/               # Lenis, loader, transitions, sound
        misc/             # SEO, about, personal intro
    css/                  # Global tokens, typography, media queries
    graphql/
      api/documents/      # Hand-written .gql queries & fragments
      generated/          # Codegen output (do not edit)
    server/               # Apollo factory + CMS → app mappers
    sfx.ts                # uisfx init, unlock, play, mute
  utils/                  # Shared types, links, helpers
static/                   # Public files (robots, CV)
specs/                    # Product, architecture, and feature specs
```

### Caching

Page loaders set `PAGE_CACHE_CONTROL` (`src/lib/server/cache.ts`) after a successful WordPress fetch,
so a CDN serves pages without waiting on the CMS. They also carry a cache tag, and a WordPress
webhook to `POST /api/revalidate` purges it so edits appear on the next visit (see below). Without
the webhook, edits can take up to ~5 minutes. See ADR-009 and ADR-013 in `specs/05_project_memory/decision-log.md`.

### Data contract

For each content type, keep these in sync:

- GraphQL fragment / query under `src/lib/graphql/api/documents/`
- Generated types in `src/lib/graphql/generated/`
- Mapper in `src/lib/server/` (e.g. `toWorkItem`)
- Application type in `src/utils/types.ts`

| Content    | Mapper               | Type             |
| ---------- | -------------------- | ---------------- |
| Work       | `toWorkItem()`       | `WorkItem`       |
| Post       | `toPostItem()`       | `PostItem`       |
| Experience | `toExperienceItem()` | `ExperienceItem` |
| Home       | `toHomePage()`       | `HomePage`       |
| About      | `toAboutPage()`      | `AboutPage`      |

Legal pages currently pass CMS title/content through without a dedicated mapper.

## Getting started

Requirements: Node.js and pnpm.

```sh
pnpm install
cp .env.example .env
```

Set the private env vars (see `.env.example`):

```env
WORDPRESS_GRAPHQL_URL=https://your-wordpress-site.com/graphql
RESEND_API_KEY=re_your_api_key
CONTACT_TO_EMAIL=you@example.com
CONTACT_FROM_EMAIL=contact@your-domain.com
REVALIDATE_SECRET=long-random-string
```

These values are server-only (`$env/dynamic/private`). Never expose them to the client.

```sh
pnpm codegen   # generate GraphQL types from the live schema
pnpm dev       # http://localhost:5173
```

## Scripts

| Command              | What it does                                 |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Vite / SvelteKit dev server                  |
| `pnpm build`         | Production build                             |
| `pnpm preview`       | Preview the production build                 |
| `pnpm codegen`       | Regenerate GraphQL types + introspection     |
| `pnpm codegen:watch` | Codegen in watch mode                        |
| `pnpm check`         | `svelte-check` + type sync                   |
| `pnpm lint`          | Prettier check + ESLint                      |
| `pnpm format`        | Prettier write                               |
| `pnpm test:e2e`      | Playwright smoke + axe tests (needs a build) |

Quality gate before shipping: `pnpm check`, `pnpm lint`, and `pnpm build`. Re-run `pnpm codegen` whenever queries or the WordPress schema change.

## GraphQL workflow

1. Add or edit `.gql` files under `src/lib/graphql/api/documents/`.
2. Run `pnpm codegen` (needs a reachable `WORDPRESS_GRAPHQL_URL`).
3. Use the generated `*Document` and fragment types in server loaders.
4. Map results with the matching helper in `src/lib/server/` before returning from `load`.

## Styling, motion, and audio

- Global design tokens and primitives: `src/lib/css/` (imported once from the root layout).
- Component styles stay in each component’s `<style>` block.
- PostCSS enables nesting, custom media queries, and shared breakpoints from `media.css`.
- CSS handles small state changes; GSAP handles sequenced / scroll motion; Lenis is progressive enhancement for scroll feel.
- The home hero canvas (Threlte) and page-transition curtain are progressive enhancement.
- Interface sounds use `uisfx` via `data-uisfx` attributes and `$lib/sfx`. Visitors can mute from the footer.
- Respect `prefers-reduced-motion`; keep content usable before animation, WebGL, or audio init.

## Specs

Product intent, architecture, coding standards, and the feature workflow live in [`specs/`](specs/README.md). Prefer an approved feature spec before larger implementation work; record lasting decisions in `specs/05_project_memory/decision-log.md`.

## Deploy

The project uses `@sveltejs/adapter-auto` from `vite.config.ts`. Pick an explicit [SvelteKit adapter](https://svelte.dev/docs/kit/adapters) when you lock a host. Ensure `WORDPRESS_GRAPHQL_URL` is set in the deployment environment.

### Tests and CI

`pnpm test:e2e` runs Playwright smoke tests and axe WCAG A/AA checks against `vite preview`, so run
`pnpm build` first and have `WORDPRESS_GRAPHQL_URL` set. Install a browser once with
`pnpm exec playwright install chromium`, or set `PW_CHANNEL=chrome` to use installed Chrome.
The color-contrast rule is tracked by a `fixme` test in `tests/e2e/a11y.spec.ts`.

GitHub Actions (`.github/workflows/ci.yml`) runs check, lint, and build on every PR and push to
`main`. The Playwright job runs only when the repository variable `WORDPRESS_GRAPHQL_URL` is set.

### Instant CMS updates

`POST /api/revalidate` purges the CDN cache for all WordPress content. In WordPress, add a webhook
(for example with the WP Webhooks plugin) on post/page create, update and delete:

- URL: `https://your-domain.com/api/revalidate`, method `POST`
- Header: `Authorization: Bearer <REVALIDATE_SECRET>`
- Body: JSON (`Content-Type: application/json`)

Set the same `REVALIDATE_SECRET` in Vercel. Purging only works on Vercel; elsewhere (including `pnpm dev`) the endpoint
answers 200 but purges nothing, and pages refresh within the 5 minute cache.
