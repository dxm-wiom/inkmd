## 1. CSS — Compact Card Modifier

- [x] 1.1 In `src/styles/components.css`, add `.input-card--compact` rule that reduces padding to `var(--space-md)`, tightens `.input-card-icon` bottom margin, and removes `.input-card-desc` bottom margin
- [x] 1.2 In `src/styles/components.css`, add `.input-card--compact .drop-zone` rule that reduces the drop zone padding to `var(--space-sm) var(--space-md)` (single-row strip instead of tall zone)
- [x] 1.3 In `src/styles/components.css`, increase `.text-input-area` `min-height` from `100px` to `240px`

## 2. CSS — Asymmetric Grid Layout

- [x] 2.1 In `src/styles/landing.css`, update `.input-grid` from `repeat(auto-fit, minmax(240px, 1fr))` to a 2-column explicit grid: `minmax(200px, 280px) 1fr`, and change `align-items` to `start`
- [x] 2.2 In `src/styles/landing.css`, add `.input-grid-utilities` rule: `display: flex; flex-direction: column; gap: var(--space-md)`
- [x] 2.3 In `src/styles/landing.css`, add a responsive breakpoint at `680px` that collapses `.input-grid` to `grid-template-columns: 1fr`

## 3. Utility Card Components — Compact Variant

- [x] 3.1 In `src/components/file-input.js`, add `input-card--compact` to the card's class list in `render()`
- [x] 3.2 In `src/components/url-input.js`, add `input-card--compact` to the card's class list in `render()`
- [x] 3.3 In `src/components/path-input.js`, add `input-card--compact` to the card's class list in the Electron branch of `render()`
- [x] 3.4 In `src/components/path-input.js`, change `render()` to return `''` (empty string) when `!window.electronAPI`

## 4. Landing Layout — Asymmetric Structure

- [x] 4.1 In `src/views/landing.js`, wrap the three utility card renders (`fileInput`, `urlInput`, `pathInput`) in a `<div class="input-grid-utilities">` element
- [x] 4.2 In `src/views/landing.js`, place the utilities wrapper and `textInput.render()` as the two direct children of `.input-grid` (no other wrappers needed for the paste card)
