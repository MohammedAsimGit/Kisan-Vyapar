# Kisan Vyapar — UI/UX Principles

Sprint 0 is not the UI sprint. This document sets the principles later UI sprints
must follow. The product must feel **premium on the outside and extremely simple on
the inside** — because many users will interact with it on affordable phones, in
rural connectivity, and with limited digital experience.

## Design principles

1. **Mobile-first.** Every screen is designed for a phone first, then widened.
2. **Large touch targets.** Buttons and tap areas are comfortably sized (≥ 44px
   equivalent); nobody should mis-tap.
3. **Clear icons + labels.** Icons always travel with text labels, never alone.
4. **Simple language.** Short words, short sentences; no jargon. Use the words a
   farmer and a kirana/vendor already use.
5. **Minimal typing.** Prefer chips, visual crop pickers, sliders, and recent
   selections over free text.
6. **Visual crop selection.** Crops are chosen from clear visuals/lists, not typed
   from memory of spelling.
7. **Clear confirmations.** Every important action shows an obvious, honest
   confirmation and result. No silent state changes.
8. **One obvious primary action per screen.**
9. **Accessible contrast.** Text meets contrast needs in light and dark themes.
10. **Voice interaction (future).** Interfaces should be structured so voice input
    can be layered on later (announceable labels, logical reading order).
11. **Multilingual (future).** English, Hindi, Kannada, Marathi planned. Text
    strings must be externalized rather than hardcoded in UI components so i18n can
    be added cleanly.
12. **Trust cues.** Verified identity, clear order/price summaries, and ratings are
    surfaced, not buried.

## Net-earnings framing

Wherever a farmer sees a price or a selling opportunity, the UI frames it around
**net earning potential**, not the highest headline number. This mirrors the core
product principle:

> “We don't tell farmers where the price is highest. We tell them where they can
> potentially earn the most.”

## Visual language (foundation)

A minimal semantic token set is defined in `src/app/globals.css`
(Tailwind v4 `@theme`):

- `background` / `foreground`
- `primary` / `primary-foreground`
- `muted` / `muted-foreground`
- `border` / `ring`

Light and dark palettes are wired to `prefers-color-scheme`. The palette is
deliberately restrained; visual identity refinement belongs to a UI sprint.

## Homepage (implemented)

The current homepage (`src/app/page.tsx`) is a static, honest landing that states
the problem, the solution, the planned journey, the roles, and the Sprint 0
foundation status. It links to nothing that does not exist yet.

## Planned information architecture

```text
/                      marketing / landing
/(auth)/sign-in        sign in (role-aware)                [planned]
/(auth)/sign-up        registration                        [planned]
/farmer/...            farmer dashboard, listings, deals   [planned]
/vendor/...            vendor dashboard, requirements      [planned]
/admin/...             administration                      [planned]
```

Design tokens, component inventory, and i18n wiring will be built in the UI sprints
that implement these routes.
