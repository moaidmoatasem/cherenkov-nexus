# UI & UX Design System

Cherenkov Nexus is a dense, technical control plane. The design system exists to
keep that density legible: one accent colour carries interaction, four status
colours carry meaning, and everything else is depth and type.

---

## 1. Tokens

Every colour, radius and shadow in the product resolves through a semantic token
declared in `src/index.css`. Components never name a raw palette colour — no
`bg-[#0c101a]`, no `text-slate-400`, no `border-white/[0.08]`.

### Depth

Surfaces are separated by luminance, back to front:

| Token | Utility | Used for |
|---|---|---|
| `--color-canvas` | `bg-canvas` | The application background |
| `--color-sunken` | `bg-sunken` | Recessed wells — inputs, code output, empty drop zones |
| `--color-surface` | `bg-surface` | Content panels and cards |
| `--color-surface-hover` | `bg-surface-hover` | Hover state for interactive cards |
| `--color-elevated` | `bg-elevated` | Popovers, dialogs, drag previews |
| `--color-scrim` | `bg-scrim` | Modal backdrops |

### Edges and fills

| Token | Utility | Used for |
|---|---|---|
| `--color-line` | `border-line` | Default hairline |
| `--color-line-strong` | `border-line-strong` | Emphasised edge, popover outline |
| `--color-fill` | `bg-fill` | Quiet translucent fill — chips, ghost buttons |
| `--color-fill-strong` | `bg-fill-strong` | Its hover/active partner |

### Text

`text-ink` → primary · `text-ink-muted` → secondary · `text-ink-faint` →
labels and metadata · `text-ink-inverse` → text on a bright fill.

### Accent and status

`accent` is the single interactive colour and changes per theme. There is no
second accent: a solid fill on a control is always the accent, and the four
status tones — `positive`, `caution`, `critical`, `info` — carry meaning and are
**never** used for decoration.

A solid fill takes `text-accent-contrast`, not `text-ink`. `text-ink` is the page
foreground and inverts with the theme, so on a filled control it goes unreadable
in light mode.

Charts resolve through `ui/chart.ts`: `chartSeries` is the categorical ramp,
`chartStatus` maps pass/fail meaning, and `chartAxis` covers axes, gridlines and
tooltip chrome. Recharts takes `var()` in `fill`/`stroke` like CSS does, so a
chart is correct in all eight themes for free.

Each of these exposes four utilities, so a chip is always built the same way:

```tsx
// fill              border                ink                 solid
bg-positive-soft   border-positive-line   text-positive-ink   bg-positive
```

The `-ink` variant is the one to use for text on a surface: it is a light tint in
the dark themes and a dark shade in the light themes, so contrast holds either
way.

### Geometry and elevation

`rounded-chip` (6px) · `rounded-control` (8px) · `rounded-card` (10px) ·
`rounded-panel` (12px).

Surfaces are flat. Depth comes from the luminance ramp and a hairline border, not
from gradients or glow — there are no `bg-gradient-to-*` utilities and no blurred
colour orbs in the product. Elevation is reserved for things that genuinely float:
`shadow-pop` on overlays, `shadow-card` for a hairline lift. Buttons and inline
cards carry neither.

---

## 2. Themes

Eight themes ship: five dark (`cyber`, `synthwave`, `emerald`, `solar`, `slate`)
and three light (`light-executive`, `light-frost`, `light-ceramic`). `App.tsx`
sets `body.theme-<id>`.

**The surface ramp is shared.** A theme swaps the accent triplet and nothing else,
so the eight themes read as one product rather than eight skins. The three light
themes additionally invert the ramp once, in a single grouped block, rather than
restating it three times.

Because custom properties inherit, redefining a token on `body` changes it for
every descendant. **This is why the stylesheet contains no `!important` and no
per-theme component overrides.** A component styled with tokens is correct in all
eight themes with no extra work.

Adding a theme means adding one block that sets five accent tokens and one entry
in the `Header` theme list — no component changes.

> The theme picker's swatches are the one deliberate exception: they use literal
> hex values, because a swatch previews the accent it switches *to* and must not
> follow the accent currently in force. Themes differ by accent alone, so one dot
> tells the whole truth.

---

## 3. Primitives

`src/components/ui` holds the shared building blocks. Reach for these before
writing a new bespoke element.

| Primitive | Purpose |
|---|---|
| `Button` | `primary` / `secondary` / `ghost` / `outline` / `danger`, four sizes |
| `Badge` | Tinted pill; `mono` for machine values, optional status dot |
| `Card` | Panel container: `flat`, `raised`, `sunken` |
| `IconTile` | Square icon holder, quiet or solid-tone |
| `PanelHeader` | The masthead every workspace opens with — owns the title type ramp |
| `Segmented` | Two-to-four mutually exclusive views |
| `StatTile` | A single number with its label, tabular-aligned |
| `Modal` | Every overlay: dialog role, focus trap, Escape, backdrop dismissal, scroll lock, focus restore |
| `fieldClass` | Shared input geometry and focus treatment |
| `chart` | `chartSeries` / `chartStatus` / `chartAxis` / `stageColor` |
| `tones` | `toneChip` / `toneText` / `toneTile` / `toneRail` maps |

`Button` renders its children directly rather than wrapping them, so a caller can
hide the label with a responsive utility and collapse the control to its icon.

### Responsive display on a primitive

Primitives set their own `display`, so putting `hidden lg:inline-flex` on one is
a coin toss on stylesheet order. Wrap it instead — `display: contents` makes the
wrapper invisible to layout:

```tsx
<span className="hidden lg:contents">
  <Button …>Agentic Onboard</Button>
</span>
```

---

## 4. Navigation registry

`src/navigation.tsx` is the single source of truth for workspaces: id, full name,
short name, subtitle, icon, tone and group. The sidebar, the mobile drawer, the
mobile tab strip and the command palette all read from it, so a new module appears
everywhere at once and cannot drift between surfaces.

Below `md` the sidebar rail is hidden and the same component renders inside an
off-canvas drawer (`variant="drawer"`), opened from the header.

---

## 5. Type

`Plus Jakarta Sans` for prose, `JetBrains Mono` for machine values — counts,
versions, endpoints, ids. Mono marks data, never a control: buttons and menu items
read in the UI face. Numeric readouts carry the `tabular` utility so a row of
figures lines up.

The scale is declared in `@theme`; there are **no arbitrary `text-[Npx]` values**
and nothing in the product is smaller than 12px.

| Utility | Size | For |
|---|---|---|
| `text-2xs` | 12px | Badge text, table meta, micro-labels |
| `text-xs` | 13px | Eyebrows, dense chrome, secondary labels |
| `text-sm` | 14px | Secondary prose |
| `text-base` | 15px | **Body default** |
| `text-lg` → `text-3xl` | 17–30px | Headings |

The rule: anything that is a sentence is `text-sm` at minimum. `xs` and `2xs` are
label sizes, not body sizes. The `eyebrow` utility is the standard mono caps label
above a dense panel.

---

## 6. Motion and focus

One focus treatment covers the product: a 2px accent `:focus-visible` outline
declared once in the base layer. Never add `focus:outline-none` — there are zero
in the codebase and it should stay that way.

Four entrance gestures are declared as utilities and nothing else animates in:
`animate-fade-in`, `animate-pop-in`, `animate-slide-down`, `animate-slide-up`,
plus `animate-slide-right` for the drawer. (`animate-in` / `fade-in` /
`zoom-in-*` / `slide-in-from-*` are `tailwindcss-animate` syntax; that package is
not a dependency, so those class names emit nothing.) The whole stylesheet honours
`prefers-reduced-motion: reduce`.

Overlays go through `ui/Modal`, which supplies `role="dialog"`, `aria-modal`, a
Tab focus trap, Escape, backdrop dismissal, body scroll lock and focus
restoration. Do not hand-roll a `fixed inset-0` backdrop.

---

## 7. The Sponsorship Oracle

The Oracle workbench keeps a deliberately separate identity — Spectral headings,
hairline rules, a print-dossier layout — expressed in a scoped `.oracle`
stylesheet. Its local variables (`--ink`, `--paper`, `--rule`,
`--pass`/`--fail`/`--cond`) are bound to the app's theme tokens, so it inverts
correctly in the light themes while keeping its own voice. Its `--mono`/`--sans`
follow the product faces; only the serif is its own.

---

## 8. Product patterns

### The Command Palette (⌘ + K)

All navigation is keyboard-reachable. A global listener captures `Cmd/Ctrl + K`
and opens a fuzzy-searchable palette over workspaces, archetypes, themes and
actions.

### Split-Screen Generative UI

* **Reality Layer (left)** — the un-editable employer constraints and ATS
  questions extracted by the Scout agent.
* **Generative Layer (right)** — the AST produced by the Synthesizer.
* Text sits in copy blocks: one click copies, so an answer can be pasted into a
  Greenhouse or Lever portal without leaving the keyboard.

### Real-Time Diff Engine

The tailored resume summary renders as a diff against the baseline
`masterProfile`: removals in faint `critical`, additions in faint `positive`.
This gives immediate visual observability into the AI's reasoning.
