# Kisan Vyapar — UI/UX Design System

Status of every item is explicit. **Implemented** = shipped in the codebase;
**Planned/Future** = designed but not built. Nothing is documented as working
unless it is.

> Premium on the outside. Extremely simple on the inside.

## Design direction

A premium agricultural marketplace built by a modern technology company — natural
greens and warm, earth-inspired neutrals paired with clean typography, refined
spacing, subtle elevation and calm micro-interactions. Not a generic SaaS
template; not an old government portal.

## Visual identity tokens (Implemented)

Semantic tokens are defined once in `src/app/globals.css` and mapped into Tailwind
v4 (`@theme inline`). Components use token classes — raw colors are not scattered
through pages.

| Token family | Light mode direction | Dark mode direction |
| --- | --- | --- |
| Background | Warm ivory | Deep forest charcoal |
| Surface / Surface muted | Soft white / warm grey | Dark green-black layers |
| Foreground / Muted text | Deep green-charcoal / sage | Warm white / sage-grey |
| Primary (agricultural green) | Rich deep green | Brighter leaf green (dark text) |
| Primary soft | Pale mint | Dark green wash |
| Accent | Warm sand/amber | Muted gold |
| Feedback (success/warning/info/danger) | Soft pastel surfaces | Deep translucent surfaces |

Both modes are tuned independently (never a simple invert). `color-scheme` is set
so native controls match.

## Typography (Implemented)

- Geist Sans (variable) is the single typeface, loaded via `next/font`.
- Hierarchy: landing display → H1 page titles → H2 sections → H3 cards → body →
  small supporting text. Large display sizes are reserved for the landing hero.
- Body copy stays readable; metadata is never tiny (< 12px where used).

## Spacing & layout

- Fluid, mobile-first spacing with a consistent rhythm; `max-w-5xl/7xl` containers
  keep line lengths readable on large and ultrawide displays.
- Cards/forms use intentional internal padding (`p-6`, `sm:p-8`).
- No JS viewport detection anywhere.

## Radius

- Inputs/buttons: `rounded-lg`.
- Cards: `rounded-2xl`.
- Hero/feature panels: `rounded-3xl` → `rounded-[2rem]`.
- Status tags: pills.

## Depth

- Subtle layered shadows via tokens `shadow-card`, `shadow-raised`, `shadow-inset`
  (theme-aware, never heavy black).
- No floating-everything aesthetic.

## Component system (Implemented)

Reusable primitives live in `src/components/ui`:

`Button` (primary/secondary/outline/ghost/danger + sizes/loading) · `Input` ·
`Select` · `Textarea` · `Field` (label + hint + error) · `Label` · `Card` ·
`Badge` (semantic tones) · `Alert` (semantic tones) · `Spinner`/`LoadingText` ·
`EmptyState` (icon + title + description + action) · `Avatar` · `PageContainer` ·
`PageHeader` (eyebrow + title + description + actions).

Supporting components: `Brand`, `AuthLayout` (split-screen auth), `DashboardShell`
(role-aware nav, user chip, sign out).

Icons: **lucide-react** (consistent single icon set). Planned/unavailable features
are shown as disabled controls + `Soon`/`Planned` badges — never fake working UI.

## Screens (Implemented)

- `/` — premium landing: nav, hero, how-it-works, farmer/buyer sections, planned
  features, CTA, footer. Hero visuals are explicitly illustrative — no invented
  prices or market numbers.
- `/auth/login` & `/auth/register` — split-screen auth (agricultural visual panel
  on desktop, focused single column on mobile). Register shows a 01 Account →
  02 Role → 03 Profile stepper and premium role cards (Farmer / Buyer).
- `/onboarding` — farmer and vendor profile completion ("last step").
- `/farmer`, `/vendor`, `/admin` — role dashboards with honest empty/planned
  states, setup checklists and quick actions. Admin shows **real** system status
  (database reachability + what is actually live).
- `/farmer/produce` — "My Produce" management list with real data + premium empty
  state.
- `/farmer/produce/new` — guided multi-step crop entry: **Crop → Details →
  Review** with progress indicator, visual crop cards, forgiving search, "view
  all" categories, large numeric quantity + quick chips, unit cards, quality
  cards, optional variety, location prefilled from profile, harvest date, and an
  honest review ("we'll help you understand the market price" — no fake prices).
- `/farmer/produce/[id]` (+ `/edit`) — listing detail, edit (prefilled multi-step),
  deactivate/reactivate, and delete with inline confirmation.

Farmer dashboards now show real produce data from MongoDB; the "Add Crop" action
and the **My Produce** nav tab are live (other farmer tabs remain `Soon`).

## Navigation

- Desktop: brand + user chip + sign out in the header; role area tabs below
  (only real routes navigate; future routes show `Soon`).
- Mobile: compact header with icon sign-out and horizontally scrollable tabs.
- Landing footer links only to real routes.

## Empty / loading / error states (Implemented)

- **Empty:** purposeful copy that explains the future feature and its CTA, e.g.
  "Your market opportunity will appear here once you add produce."
- **Loading:** spinner in buttons (`loading`), accessible `role="status"`.
- **Error:** semantic `Alert`s; client fetch errors surface the exact server
  validation message with the field name. No raw stack traces reach users.

## Motion (Implemented)

Fast, subtle, purposeful transitions on hover/press/focus. `prefers-reduced-motion`
is respected globally (CSS). Motion never carries meaning on its own.

## Accessibility (Implemented basics)

- Semantic HTML, labelled inputs (`Field`), visible focus rings on all
  interactive elements, `aria-current`/`aria-pressed`/`role` usage where needed.
- Contrast tuned per theme; color is never the only signal (icons + labels).
- Minimum comfortable touch targets (44px+ primary controls).

## Responsive behaviour (Implemented)

Mobile-first with fluid grids; verified across 320 → 414 (phones), 768/1024
(tablets), 1280–1920 (desktop), and large/ultrawide (max-width containers).
No horizontal overflow, no clipped controls, stacked cards on small screens,
multi-column on tablet/desktop.

## Data honesty (Implemented as a rule)

The UI never fabricates prices, market data, buyer counts, match percentages,
orders or ratings. Planned capability is always labelled (`Planned` / `Soon` /
`Next update`), and dashboards state clearly that nothing is shown that does not
really exist.

## Roadmap for the design system

- **Planned:** full modal/sheet + toast layer, skeleton loaders, bottom mobile
  navigation once produce/orders exist, structured tabs.
- **Future:** illustrated crop imagery, refined dark-mode illustrations,
  multilingual text wrapping/layouts, end-to-end visual regression tests.
