## Context

The landing page currently renders four equal-weight input cards in a uniform `repeat(auto-fit, minmax(240px, 1fr))` grid. Three of those cards (file, URL, path) are one-shot action surfaces — they need a label, an icon, and a single interactive element. The paste card is a mini editor that needs vertical space. Equal treatment wastes space on both sides: the utility cards feel padded, the paste card's 100px textarea is too small to be useful.

## Goals / Non-Goals

**Goals:**
- Asymmetric layout: utility cards stacked compactly in one column, paste card tall in the other
- `input-card--compact` CSS modifier to reduce visual weight on utility cards without touching shared base styles
- Textarea min-height raised to 240px
- `path-input.js` renders an empty string (no DOM nodes) in the browser; grid reflows naturally

**Non-Goals:**
- Redesigning the card visual style (colors, borders, hover effects stay the same)
- Changing any functional behavior of file/URL/path inputs
- Responsive breakpoints below 600px (existing mobile stack is sufficient)

## Decisions

### 1. CSS modifier class for compact cards (`input-card--compact`)

Add `.input-card--compact` to `components.css` that reduces padding (`--space-md` instead of `--space-lg`), tightens the icon margin, removes the desc margin-bottom, and shrinks the drop zone padding. Each utility card component adds this class alongside `input-card` in its `render()`.

**Alternative considered:** Separate set of HTML elements per compact card variant. Rejected — too much duplication; the modifier approach keeps base styles intact and is easier to maintain.

### 2. Asymmetric grid via two wrapper divs in landing.js

Replace the flat `input-grid` of four sibling cards with a two-column structure:
- `.input-grid` becomes a 2-column CSS grid: `minmax(200px, 280px)` left + `1fr` right
- `.input-grid-utilities` div on the left wraps file, URL, and path (Electron) cards, stacked with `flex-direction: column` and a smaller gap
- Paste card sits directly in the right column, stretching to fill height

**Alternative considered:** CSS `grid-column: span N` on the paste card within the existing flat grid. Rejected — `auto-fit` with minmax doesn't play well with spanning items at all viewport widths; explicit two-column is predictable.

### 3. Empty render for path-input in browser

`path-input.js` `render()` returns `''` when `!window.electronAPI`. The parent grid column then holds only the file and URL compact cards. `mount()` and `destroy()` remain no-ops when not in Electron (already guarded).

**Alternative considered:** Keep the fallback message but hide it with CSS. Rejected — adds a DOM node with no purpose; cleaner to emit nothing.

### 4. Responsive collapse at 680px

Below 680px the two-column grid collapses to a single column (`.input-grid` switches to `grid-template-columns: 1fr`) and the utility wrapper stacks naturally. The paste card then appears below the utility cards.

## Risks / Trade-offs

- **Path card absent in browser shifts column balance** — when Local Path is hidden the utility column only has 2 cards; the paste card still fills the right column at full height, which looks intentional. Acceptable.
- **Taller textarea on small screens** — 240px textarea inside a single-column mobile layout adds scroll; mitigated by keeping `resize: vertical` so users can shrink it.

## Migration Plan

Pure CSS/HTML change; no data migration. No breaking behavior change for any input method.
