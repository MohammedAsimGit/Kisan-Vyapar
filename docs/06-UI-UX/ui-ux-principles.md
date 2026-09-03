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

The homepage (`src/app/page.tsx`) is a static, honest landing that states the
problem, solution, planned journey, roles, and current platform status. It links
to the real sign-in and registration pages.

## Implemented screens (Sprint 1)

- `/` — landing with account actions.
- `/auth/register` — progressive two-step registration (details → choose role).
- `/auth/login` — simple sign-in (phone/email + password, show/hide password).
- `/onboarding` — role-specific profile completion (farmer or vendor).
- `/farmer` — protected farmer dashboard shell with honest empty states.
- `/vendor` — protected vendor dashboard shell with honest empty states.
- `/admin` — protected admin foundation.

All dashboards use a shared responsive shell (brand header, role-aware scrollable
nav, avatar + sign out). Planned future items are shown as disabled "Soon" entries —
never as fake working pages or fabricated numbers.

## Information architecture

```text
/                      marketing / landing
/auth/register         registration + role selection      [implemented]
/auth/login            sign in                            [implemented]
/onboarding            profile completion                 [implemented]
/farmer/...            farmer dashboard                   [implemented: /farmer]
/vendor/...            vendor dashboard                   [implemented: /vendor]
/admin/...             administration foundation          [implemented: /admin]
```

Design tokens, component inventory, and i18n wiring continue to be refined in
later UI work.

## Responsive requirement

Sprint 1 UI is built mobile-first with fluid Tailwind layouts (`grid`, `flex`,
responsive prefixes, max-width containers). No JS viewport detection is used.
Target range: 320px phones → 768/1024 tablets → 1280+ laptops/desktops → large and
ultrawide displays (max-width containers preserve readable line lengths).
Horizontal overflow, clipped text, and broken cards are treated as defects.
