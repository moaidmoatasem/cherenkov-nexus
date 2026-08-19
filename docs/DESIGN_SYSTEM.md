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

`accent` is the single interactive colour and changes per theme. `accent2` is a
supporting hue for gradients and charts. The four status tones —
`positive`, `caution`, `critical`, `info` — carry meaning and are **never** used
for decoration.

Each of these exposes four utilities, so a chip is always built the same way:

```tsx
// fill              border                ink                 solid
bg-positive-soft   border-positive-line   text-positive-ink   bg-positive
```

The `-ink` variant is the one to use for text on a surface: it is a light tint in
the dark themes and a dark shade in the light themes, so contrast holds either
way.

### Geometry and elevation

`rounded-chip` (6px) · `rounded-control` (10px) · `rounded-card` (14px) ·
`rounded-panel` (18px). Shadows are `shadow-card` and `shadow-pop` only.

---

## 2. Themes

Eight themes ship: five dark (`cyber`, `synthwave`, `emerald`, `solar`, `slate`)
and three light (`light-executive`, `light-frost`, `light-ceramic`). `App.tsx`
sets `body.theme-<id>`, and each theme block in `src/index.css` restates the same
token contract.

Because custom properties inherit, redefining a token on `body` changes it for
every descendant. **This is why the stylesheet contains no `!important` and no
per-theme component overrides.** A component styled with tokens is correct in all
eight themes with no extra work.

Adding a theme means adding one block that restates the token contract and one
entry in the `Header` theme list — no component changes.

> The theme picker's swatches are the one deliberate exception: they use literal
> hex values, because a swatch previews the palette it switches *to* and must not
> follow the palette currently in force.

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
| `fieldClass` | Shared input geometry and focus treatment |
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
short name, subtitle, icon, tone and group. The sidebar, the mobile tab strip and
the command palette all read from it, so a new module appears everywhere at once
and cannot drift between surfaces.

---

## 5. Type

`Plus Jakarta Sans` for prose, `JetBrains Mono` for machine values — counts,
versions, endpoints, ids. Numeric readouts carry the `tabular` utility so a row
of figures lines up.

Body copy starts at 13px. The `eyebrow` utility is the standard mono caps label
above a dense panel. Sub-11px type is reserved for badges and metadata that a
reader scans rather than reads.

---

## 6. Motion and focus

One focus treatment covers the product: a 2px accent `:focus-visible` outline
declared once in the base layer. Never remove it without replacing it.

Ambient motion — the aurora orbs behind the canvas — runs on a 20-second-plus
cycle, and the whole stylesheet honours `prefers-reduced-motion: reduce`.

---

## 7. The Sponsorship Oracle

The Oracle workbench keeps a deliberately separate typographic identity — Spectral
headings, IBM Plex body, hairline rules, a print-dossier layout — expressed in a
scoped `.oracle` stylesheet. Its local variables (`--ink`, `--paper`, `--rule`,
`--pass`/`--fail`/`--cond`) are bound to the app's theme tokens, so it inverts
correctly in the light themes while keeping its own voice.

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
