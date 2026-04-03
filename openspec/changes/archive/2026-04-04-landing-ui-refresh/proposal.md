## Why

The current landing page treats all four input cards as equal weight, but they're not — file pick, URL fetch, and local path are quick one-action utilities, while paste markdown is an editing surface that needs room to breathe. The equal grid makes the paste card feel cramped and the utility cards feel padded out. Additionally, showing a "desktop only" fallback card for local path in the PWA adds noise for web users.

## What Changes

- **Minimalist utility cards** — Open File, From URL, and Local Path (Electron) cards become compact: reduced padding, smaller icon, no description line, tighter internal spacing. The drop zone on the file card shrinks to a single-line strip.
- **Expanded paste card** — Paste Markdown card gets a significantly taller textarea (min-height raised from 100px to ~240px) so it's genuinely usable as a composition surface without constant scrolling.
- **New landing layout** — The grid shifts from a uniform 4-equal-column layout to an asymmetric layout: a narrow column of stacked utility cards on the left, and the paste card occupying the right column (or spanning wider).
- **Local path hidden in PWA** — `path-input.js` renders nothing (empty string) in non-Electron contexts instead of a fallback message card. The `local-path-input` spec requirement for web behavior is updated accordingly.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `local-path-input`: Web behavior changes from "show fallback message card" to "render nothing" — the card is not present in the DOM at all when running in a browser.

## Impact

- `src/styles/landing.css` — grid layout changes for the asymmetric card arrangement
- `src/styles/components.css` — new compact card variant styles; taller textarea
- `src/components/file-input.js` — compact render variant (strip drop zone, no desc)
- `src/components/url-input.js` — compact render variant (no desc line)
- `src/components/path-input.js` — return empty string in render() when not Electron
- `src/components/text-input.js` — taller textarea
- `src/views/landing.js` — updated grid markup to reflect asymmetric layout (utility column + paste column)
