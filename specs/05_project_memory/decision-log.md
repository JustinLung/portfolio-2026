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
