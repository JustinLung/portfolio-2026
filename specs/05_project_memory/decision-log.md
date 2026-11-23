# Decision log

Record decisions that should survive individual features and conversations. Append new entries; do
not rewrite past reasoning to make it appear inevitable. If a decision changes, mark the old entry
Superseded and link the replacement.

## Decision template

```md
## ADR-NNN: Short decision title

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded
- **Related spec:** `specs/features/...`

### Context

What forces, constraints, or problems require a decision?

### Decision

What was chosen?

### Consequences

What becomes easier, harder, required, or intentionally unsupported?

### Alternatives considered

What credible alternatives were rejected, and why?
```

## ADR-001: WordPress is the portfolio content source

- **Date:** 2026-08-04
- **Status:** Accepted
- **Related spec:** Existing architecture

### Context

Portfolio works require maintainable editorial content and media. The repository already integrates
WPGraphQL, Apollo Client, generated operation types, and a server-side mapper.

### Decision

WordPress remains the source of truth for portfolio work. SvelteKit fetches it on the server through
WPGraphQL and maps upstream responses into application-facing types.

### Consequences

- Data-backed builds and code generation require `WORDPRESS_GRAPHQL_URL`.
- Components stay independent of Apollo and raw GraphQL response shapes.
- Schema, query, generated types, mapper, and application types must evolve together.
- Upstream failures are explicit errors, not empty portfolio states.

## ADR-002: Motion is progressive enhancement

- **Date:** 2026-08-04
- **Status:** Accepted
- **Related spec:** Existing architecture

### Context

The visual identity uses GSAP, ScrollTrigger, Flip, CSS transitions, and Lenis. These techniques can
improve continuity and expression but can also reduce access, performance, and input responsiveness.

### Decision

Essential content, navigation, and actions work without motion. CSS handles simple state transitions;
GSAP handles orchestrated motion; Lenis enhances scroll feel. Every motion feature defines cleanup,
interruption, coarse-pointer behavior where relevant, and a reduced-motion equivalent.

### Consequences

- Motion cannot be the only carrier of state or meaning.
- Reduced motion removes nonessential travel and scroll effects.
- Feature verification includes motion disabled and interrupted interactions.

## ADR-003: Use project tokens and component-scoped CSS

- **Date:** 2026-08-04
- **Status:** Accepted
- **Related spec:** Existing architecture

### Context

The project has global color, typography, layout, easing, and media-query definitions plus
component-scoped styles.

### Decision

Reusable design decisions are expressed as global custom properties and primitives in `src/lib/css/`.
Feature styling remains in component `<style>` blocks and consumes those shared tokens.

### Consequences

- One-off values do not automatically become global tokens.
- Hard-coded values require a feature-specific reason when a semantic token exists.
- New global styles must be imported once through the root layout.

## ADR-004: Writing is a first-class content type

- **Date:** 2026-08-14
- **Status:** Accepted
- **Related spec:** Existing architecture

### Context

The CMS already publishes posts. Visitors need a path to scan writing without mixing it into work.

### Decision

Writing lives at `/write` and `/write/[slug]`, mapped through `PostFields` → `toPostItem()` →
`PostItem`. Home shows a related-posts carousel. Category filters apply on the writing index.

### Consequences

- Posts follow the same published-only, 404, and 5xx contracts as work.
- GraphQL documents, generated types, mapper, and `PostItem` must evolve together.
- Work and writing stay separate routes and entities.

## ADR-005: Contact uses mailto, not a stored form

- **Date:** 2026-08-14
- **Status:** Superseded by ADR-008
- **Related spec:** Existing architecture

### Context

The site needs a low-friction inquiry path without operating an inbox, spam filter, or message store.

### Decision

`/contact` is a client-only route. Submitting the form opens the visitor's mail client via `mailto:`
with name, reply-to, subject, and message. Email and social links are also listed on the page.

### Consequences

- No WordPress or server action is required for contact.
- Success depends on a working mail client; there is no delivery confirmation in the app.
- The published address and social links must stay current.

## ADR-006: Interface audio is progressive enhancement

- **Date:** 2026-08-14
- **Status:** Accepted
- **Related spec:** Existing architecture

### Context

Hover and click cues support the site's tactile identity, but autoplay policies, preference, and
accessibility mean audio cannot be required.

### Decision

`uisfx` is initialized once in the root layout. Interactive elements declare cues with `data-uisfx`
attributes. A footer toggle persists mute preference. Audio unlocks on first pointer or keyboard
interaction.

### Consequences

- Every action works with sound off or blocked.
- New interactions should add a cue unless there is a reason not to.
- Do not introduce a second audio stack or mute control.

## ADR-007: Home hero WebGL is progressive enhancement

- **Date:** 2026-08-14
- **Status:** Accepted
- **Related spec:** Existing architecture

### Context

The home identity uses a Threlte / Three.js scene. WebGL, reduced motion, and load cost can fail
independently of the rest of the page.

### Decision

Hero copy and navigation render without the canvas. The 3D scene enhances the hero when the
browser can run it. Reduced motion must not leave the visitor without the same content.

### Consequences

- Hero copy is CMS content, not baked into the shader.
- New 3D work stays isolated under `hero-components/` and must clean up on unmount.
- Performance budgets for the home route include the scene without making it blocking.

## ADR-008: Contact sends email through a server action

- **Date:** 2026-11-16
- **Status:** Accepted
- **Related spec:** Supersedes ADR-005

### Context

`mailto:` depends on the visitor having a configured mail client and gives no delivery confirmation.
The shipped `/contact` route already uses a server action instead.

### Decision

`/contact` validates the form on the server and sends a notification email through Resend. Spam is
handled with a honeypot field and a best-effort in-memory rate limit. Email and social links remain
listed on the page as a fallback.

### Consequences

- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` are required at runtime.
- The rate limiter is per server instance and resets on cold starts; use a shared store if abuse
  becomes real.
- Failures return an explicit error that points the visitor to direct email.

### Alternatives considered

Keeping `mailto:` (rejected: unreliable for visitors without a mail client). Storing messages in
WordPress (rejected: adds an inbox and spam surface to operate).

## ADR-009: Cache rendered pages at the CDN

- **Date:** 2026-11-16
- **Status:** Accepted
- **Related spec:** ADR-001

### Context

Every page query hit WordPress with `no-cache` and responses set no `cache-control`, so each visit
waited on the CMS. Only feeds, the sitemap, OG images, and the search index were cached.

### Decision

Page loaders set `PAGE_CACHE_CONTROL` only after a successful fetch. Browsers revalidate; the CDN
serves for 5 minutes and then serves stale for up to a day while refreshing.

### Consequences

- Most visits no longer wait on WordPress, and short CMS outages are masked by stale copies.
- CMS edits can take up to ~5 minutes to appear.
- Requires a CDN that honors `s-maxage` and `stale-while-revalidate`.

### Alternatives considered

Prerendering with a WordPress webhook to rebuild (rejected for now: needs webhook and deploy
plumbing); ISR (rejected: adapter-auto doesn't configure it, and headers are simpler).

## ADR-010: The loader and hero scene must not gate content on the network

- **Date:** 2026-11-16
- **Status:** Accepted
- **Related spec:** ADR-002, ADR-007

### Context

Measured on a throttled mobile profile (412px, 2.6 DPR, 4x CPU, 1.6 Mbps, 150 ms RTT, cold cache), the
home page took about 26 s to reach LCP and the loader stayed up for about 39 s. The loader waited
for the window `load` event, every non-lazy image (including all six below-the-fold work cards),
and Three.js, which was in the main route bundle.

### Decision

- The loader waits only for fonts and images near the first screen, and gives up after 2.5 s.
- Below-the-fold work cards use `loading="lazy"`; on `/work` only the first two are eager.
- Three.js and the hero scene are imported dynamically after hydration.

### Consequences

- Same profile after the change: home LCP about 9.5 s and loader about 8 s; `/work` loader about 6 s.
  The remaining time is mostly the loader animation (about 3 s) and route JavaScript.
- The hero rose appears shortly after the title and content instead of with them.
- New eager images near the top of a page now delay the loader; mark below-the-fold ones lazy.
- The measurement was synthetic and local; confirm with field data (Vercel Speed Insights or CrUX).

### Alternatives considered

Skipping the loader on repeat visits in a session (not done: needs an inline script to avoid a flash
of the overlay). Removing the loader (a design decision, not made here).

## ADR-011: Themes are hue families with a light and a dark mode

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related spec:** ADR-003

### Context

The five themes were all dark. A single extra "light theme" would have had one accent and no way to
combine light with the visitor's favourite theme.

### Decision

Theme (`data-theme`: ember, midnight, forest, dusk, graphite) and mode (`data-mode`: light or dark)
are independent. The Appearance control offers Light, Dark, and System; System follows the device
and updates live. `data-mode` always holds the resolved value, and the stored choice is in
`portfolio:mode`. The default is Dark. In `colors.css`, token names describe roles: in light mode
`--color-white` is the ink and `--color-black` sits on ink fills. Each theme supplies a light block
with its own surfaces and accent, and `quaternary` muted text keeps at least 4.5:1.

### Consequences

- A new theme needs both a dark block and a `[data-theme][data-mode='light']` block.
- Anything blended with `mix-blend-mode: difference` (header bar, cursor) sets `--color-white: #fff`
  locally, because the blend only inverts the page with true white.
- Light mode has an automated axe check for every theme (including contrast); the dark themes do not
  pass contrast yet.
- New visitors get Dark even if their device prefers light, to keep the site's identity.

### Alternatives considered

A single "Daylight" theme (rejected: one accent, no choice). Defaulting to System (not done: it would
change the first impression for every visitor on a light device; it is a one-line change in
`theme.svelte.ts` and `app.html`).

## ADR-012: Code blocks are highlighted on the server with Shiki

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related spec:** ADR-001, ADR-011

### Context

Post code blocks had a copy button but no syntax colors. WordPress's default Code block emits
`<pre class="wp-block-code"><code>` with no language, and every existing post block was like that.

### Decision

`highlightCodeBlocks` (`src/lib/server/highlight.ts`) replaces each code block in the post HTML with
Shiki output during the `/write/[slug]` load, so there is no client JavaScript and no flash. Colors are
the CSS variables `--shiki-light` and `--shiki-dark`, and the post page picks one from `data-mode`, so
one render serves every theme in both modes. The JavaScript regex engine and a fixed language list
(html, css, scss, js, ts, json, liquid, bash, yaml) keep the bundle small.

The language comes from a `language-x` or `lang-x` class on the `<pre>` or `<code>` when an author sets
one (the Code block's "Additional CSS class" field). Otherwise `guessLanguage`
(`src/utils/code-language.ts`) infers it, and anything it can't place, such as file trees or prose,
stays plain text. A declared language we don't bundle is also plain text, never guessed.

The palettes are `github-light-high-contrast` and `github-dark-high-contrast`. The standard GitHub
palettes failed 4.5:1 contrast on the tinted code background (red, green, orange, and grey were
2.8-3.9:1 in light mode).

### Consequences

- Adding a language means adding its import in `highlight.ts` and an alias in `code-language.ts`.
- The guesser is a heuristic. A block it misreads is fixed by giving it a `language-x` class in WordPress.
- A highlighter failure falls back to the plain block rather than failing the page.
- `tests/e2e/code-highlighting.spec.ts` checks contrast for all five themes in both modes, and needs at
  least one published post with a code block.

### Alternatives considered

Highlighting in the browser (rejected: ships the grammar and flashes unstyled code). Bundling every
Shiki language (rejected: server size for languages the blog doesn't use). Requiring an explicit
language on every block (rejected: it would leave all current posts unhighlighted until edited).

## ADR-013: Purge the CDN cache when WordPress content changes

- **Date:** 2026-11-23
- **Status:** Accepted
- **Related spec:** ADR-009

### Context

ADR-009 left CMS edits taking up to ~5 minutes to appear. An edit should show on the next visit.

### Decision

Every CDN-cached response built from WordPress content carries the `Vercel-Cache-Tag: wordpress`
header (`PAGE_CACHE_HEADERS` in `src/lib/server/cache.ts`; RSS and the sitemap set it too). A
WordPress webhook calls `POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET`, which
runs `dangerouslyDeleteByTag('wordpress')` from `@vercel/functions`. It deletes rather than
invalidates so the next request renders fresh instead of serving one more stale copy.

### Consequences

- Edits appear on the next visit once the webhook fires. The 5 minute `s-maxage` remains the fallback
  if a webhook is missed or fails.
- One tag purges the whole site, which is fine at this size. Per-page tags can be added later.
- Purging needs Vercel. Elsewhere (including local dev) the endpoint answers 200 but purges nothing, and pages fall back to the 5 minute cache.
- `REVALIDATE_SECRET` must be set in the deployment environment, and the WordPress webhook must send
  it as a bearer token with a JSON body.

### Alternatives considered

Invalidate instead of delete (rejected: the first visit after an edit still sees the old page).
Prerendering with rebuilds on webhook (rejected: deploy plumbing, see ADR-009). A shorter
`s-maxage` (rejected: still not immediate and more CMS load).
