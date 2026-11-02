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

`/contact` is client-only: the form opens a `mailto:` draft and does not query WordPress.

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
| `/contact`                             | Mailto inquiry form + socials                              |
| `/privacy-policy`, `/terms-of-service` | Legal pages from CMS                                       |
| `/styleguide`                          | Internal visual reference                                  |

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

Set the private env var:

```env
WORDPRESS_GRAPHQL_URL=https://your-wordpress-site.com/graphql
```

This value is server-only (`$env/dynamic/private`). Never expose it to the client.

```sh
pnpm codegen   # generate GraphQL types from the live schema
pnpm dev       # http://localhost:5173
```

## Scripts

| Command              | What it does                             |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Vite / SvelteKit dev server              |
| `pnpm build`         | Production build                         |
| `pnpm preview`       | Preview the production build             |
| `pnpm codegen`       | Regenerate GraphQL types + introspection |
| `pnpm codegen:watch` | Codegen in watch mode                    |
| `pnpm check`         | `svelte-check` + type sync               |
| `pnpm lint`          | Prettier check + ESLint                  |
| `pnpm format`        | Prettier write                           |

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
