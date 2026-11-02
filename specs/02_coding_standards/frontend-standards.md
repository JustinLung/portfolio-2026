# Frontend standards

## Svelte and TypeScript

- Use Svelte 5 runes: `$props`, `$state`, `$derived`, and `$effect`.
- Type component props and domain data explicitly; avoid `any`.
- Derive values instead of synchronizing duplicate state.
- Use effects only for external systems such as DOM APIs, GSAP, Lenis, or subscriptions.
- Return cleanup functions from effects that create listeners, observers, timelines, or triggers.
- Keep server-only code under `src/lib/server/` and out of client import graphs.
- Prefer semantic HTML and native controls before custom interaction abstractions.

## Component design

- A component should have one clear responsibility and a small, intentional public API.
- Use SvelteDoc to provide documentation for Svelte Components
- Route components compose; shared components encapsulate behavior that is reused or complex.
- Prefer slots/snippets and composition over boolean-heavy components.
- Forward useful native attributes when wrapping an interactive element.
- Expose events as callbacks using current Svelte 5 patterns.
- Do not hide essential content behind hover, pointer precision, JavaScript, or animation completion.

## CSS and responsive design

- Global styles are loaded once from `src/routes/+layout.svelte`; components inherit normalization,
  design tokens, typography, and shared primitives.
- Use existing tokens from `src/lib/css/`; do not hard-code a value when a semantic token exists.
- Use logical properties when they make writing mode or flow clearer.
- Keep selectors shallow and component-local.
- Follow the existing nested PostCSS and BEM-influenced conventions.
- Start with the smallest viable layout and enhance through project custom media queries.
- Test layout behavior at content-driven breakpoints, not only common device presets.
- Hover enhancements must use the project's `@hover` pattern and retain keyboard equivalents.
- Interactive targets should be at least 44 by 44 CSS pixels where the visual design permits.

### Typography

- General Sans is the body family and supports weights `200` through `700`, including italics.
- Fragment Mono is the heading family and supports regular and italic styles at weight `400`.
- Headings and body copy inherit the correct families by default.
- Use `.font-heading`, `.font-body`, `.font-medium`, `.font-italic`, `.font-bold`, `.font-small`,
  and `.font-heading-1` through `.font-heading-6` only when an element needs an explicit override.
- In component CSS, use `var(--font-family-heading)` and `var(--font-family-body)` rather than
  repeating font-family values.

### Colors and global styles

- Use the semantic custom properties from `src/lib/css/colors.css`, such as
  `var(--color-primary)`, `var(--color-quaternary)`, `var(--color-white)`, and the
  availability greens/reds. Do not introduce a one-off hex when a token exists.
- Add a stylesheet to `src/lib/css/` only when it defines a reusable project-wide token or
  primitive, then import it once from `src/routes/+layout.svelte`.
- Keep feature- and component-specific styles inside the component's `<style>` block.

### PostCSS conventions

PostCSS provides nesting and globally available custom media queries:

```css
.card {
	color: var(--color-white);

	&:focus-visible {
		outline: 2px solid var(--color-primary);
	}

	@media (--viewport-md-up) {
		display: grid;
	}

	@media (--motion-reduce) {
		transition: none;
	}
}
```

Viewport suffixes are `sm`, `md`, `lg`, `xl`, and `2xl`. Use `-up` for minimum-width queries and
`-down` for maximum-width queries. Use `--motion-reduce` and `--motion-allow` for motion
preferences.

## Audio

- Interface audio uses `uisfx` through `src/lib/sfx.ts`. Initialize once from the root layout.
- Add `data-uisfx` and `data-uisfx-hover` on interactive elements (links, buttons, cards).
- Call `playSfx()` only when a cue cannot be declared on the element (submit, filter, toggle).
- Use `playSfxIfUnlocked()` when a cue might fire before the visitor has unlocked audio.
- Keep the footer `SoundToggle` as the visitor control; do not add a second mute path.
- Every action must remain complete with sound off, reduced motion, or a blocked audio context.

## Design principles

- Establish hierarchy with scale, spacing, contrast, and alignment before adding decoration.
- Repetition creates rhythm; intentional contrast creates emphasis.
- Align elements to a visible system. Avoid accidental near-alignments.
- Keep line length readable and let typography respond without abrupt jumps.
- Preserve whitespace around primary content and actions.
- Design edge cases with real content: long words, missing images, multiple categories, and rich text.
- Visual novelty must not reduce comprehension, discoverability, or perceived performance.

## Motion principles

Before implementing motion, document its purpose:

- **Orient:** explain where an element came from or went.
- **Relate:** show continuity between two states.
- **Acknowledge:** confirm an interaction.
- **Focus:** direct attention to the next relevant element.

Standards:

- Animate `transform` and `opacity` when practical.
- Use the existing easing tokens for CSS transitions.
- Prefer short feedback and deliberate page-level sequences; avoid motion on every element.
- Do not animate layout continuously when a FLIP transition can preserve spatial continuity.
- Scroll-linked animation must not trap scrolling or delay access to content.
- Pointer-follow effects must deactivate for touch/coarse pointers and tolerate pointer exit.
- WebGL (Threlte) and View Transition page curtains are progressive enhancement; they must not
  block content or navigation when unsupported.
- Check `prefers-reduced-motion` before creating animation and provide an equivalent static state.
- Reduced motion means removing nonessential travel, parallax, scrub, and smooth scrolling—not merely
  shortening every duration.

## Accessibility

- Maintain one logical heading hierarchy per page.
- Every interaction must work with keyboard alone and show a visible focus state.
- Use buttons for actions and links for navigation.
- Provide useful alternative text; decorative images use empty alt text.
- Announce asynchronous status changes when they are not otherwise apparent.
- Menus, dialogs, and overlays manage focus, escape behavior, and page scroll intentionally.
- Never rely on color, position, or motion as the only carrier of meaning.
- Verify text and UI contrast in every state.

## Performance

- Set image dimensions or aspect ratios to prevent layout shift.
- Request media at an appropriate size and lazy-load below-the-fold assets.
- Keep above-the-fold motion initialization small and non-blocking.
- Avoid shipping CMS fields that the route does not render.
- Do not add a dependency for behavior that is small, stable, and expressible with the platform.

## Required checks

Before a feature can be marked Verified:

```sh
pnpm check
pnpm lint
pnpm build
```

Also run `pnpm codegen` when GraphQL documents or the WordPress schema contract change.
