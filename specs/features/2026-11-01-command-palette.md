---
title: Command palette
status: Implemented, pending manual verification
owner: ''
created: 2026-11-01
updated: 2026-11-01
---

# Command palette

## Summary

A keyboard-first palette (Cmd+K / Ctrl+K) to jump to pages, switch themes, and toggle interface sound
without leaving the keyboard. It is also a visible demonstration of the site's accessibility work.

## Goals

- Reach any page, any theme, and the sound toggle in a few keystrokes.
- Fully operable with keyboard alone, a screen reader, 200% zoom, forced colors, and reduced motion.

## Non-goals

- External links, and searching page body text (only titles, categories, and years are searched).
- Live theme preview while arrowing through results.

## Experience specification

### Interaction

- **Open:** Cmd+K / Ctrl+K from anywhere, or the "Open command palette" button in the header (md and
  up). The shortcut toggles. `aria-keyshortcuts` is set on the button.
- **Search:** every word must match a label or hidden keyword; word-start matches rank first.
- **Keys:** Up/Down move (wrapping), Enter runs, Escape closes. Home/End stay with the text field.
- **Pointer:** hover sets the active option, click runs it. Clicking the backdrop closes.
- **Running a command closes the palette** and focus returns to where it was before opening.
- **Sound:** `open`/`close` cues on open and dismiss; commands play their own cue (`forward`,
  `select`, `toggle-on`/`toggle-off`). Sound off is equivalent.

### Motion

- **Purpose:** Orient. GSAP, `expo.out`. The panel rises 8px and fades in over 0.6s, and the backdrop fades via a `--backdrop-opacity` custom property.
- **Exit:** the reverse, `expo.out` over 0.35s. Esc, backdrop, close button, the shortcut, and running a command all
  play it. Input is ignored while it plays.
- **Reduced motion:** no animation, using the app's Motion setting (not just the OS query).

### Accessibility

- Native modal `<dialog>` named "Command palette": top layer, background inert, Tab trapped, Escape
  and focus restoration handled by the browser.
- Input follows the ARIA combobox pattern with a listbox popup (`aria-activedescendant`,
  `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`). Options never take DOM focus.
- Options are grouped (`role="group"` labelled by a heading). Labels are self-sufficient ("Switch to
  Midnight theme") so they read correctly without the group name.
- Current page / theme / sound state is text ("Current page", "Currently on"), never color alone.
  The selected option has a tint plus an enter glyph; forced colors get a `Highlight` outline.
- A polite live region reports the result count as the query changes, and another, outside the
  dialog, announces the outcome after a command runs ("Midnight theme applied", "Sound off").
- Instructions are exposed through `aria-describedby`. Text is white-on-surface at >= 4.5:1 in
  every theme. Options and the close button are at least 44px tall.
- Page scroll (native and Lenis) is locked while open via the shared `lockScroll` counter, which the
  header sheet now also uses so overlapping overlays cannot unlock each other.

## States

- Empty query: all commands, grouped. No matches: "No commands match ..." and the listbox is removed
  (`aria-expanded="false"`).

## Technical approach

- `src/lib/components/shared/ui/CommandPalette.svelte` (new), mounted by `Header.svelte`.
- `src/routes/search-index.json/+server.ts` (new; types live in `src/utils/types.ts`) returns project and post titles, slugs, categories,
  and years, cached for 5 minutes. The palette fetches it on first open, not on every page load. If
  one CMS query fails the other list still returns; if the request fails, pages, themes, and sound
  keep working and the fetch is retried on the next open.
- With an empty query, Projects and Writing show only the latest 5 each.
- `src/lib/scroll-lock.ts` (new); `Header.svelte` sheet lock moved onto it.
- `toggleSfx()` added to `src/lib/sfx.svelte.ts` and used by both `SoundToggle` and the palette, so
  there is one code path and one piece of state for sound (see ADR-006).

## Acceptance criteria

- [ ] Given focus anywhere, when Cmd+K / Ctrl+K is pressed, then the palette opens with focus in the
      search field and the browser's own Ctrl+K action does not run.
- [ ] Given the palette is open, when Escape is pressed, then it closes and focus returns to the
      previously focused element.
- [ ] Given a screen reader, when arrowing through results, then each option is announced with its
      state and position, and typing announces the result count.
- [ ] Given a command runs, then its outcome is announced and the visible state matches.
- [ ] Given reduced motion (OS or in-app), then there is no open animation.
- [ ] Given the sheet or palette closes while the other is open, then page scroll stays locked until
      both are closed.
- [ ] No new console errors, hydration warnings, type errors, lint errors, or build failures.

## Verification evidence

- Automated: `pnpm check` (0 errors), `pnpm build` (passes), eslint and prettier clean on changed files.
- Not yet done: manual keyboard walk-through, VoiceOver/NVDA, forced colors, 200% zoom, all five themes.

## Open questions

- [ ] Should a visible trigger also exist below `md`? Currently the shortcut is the only entry there.
