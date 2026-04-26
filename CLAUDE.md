# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Objective

**inkMD** is a beautiful, editorial-inspired markdown reader shipped as both an **Electron desktop app** (Windows ARM64/x64) and a **Progressive Web App**. Priority is design quality and a distraction-free reading experience over feature breadth.

## Tech Stack

- **Build:** Vite 7.3
- **Frontend:** Vanilla JavaScript (ES6 modules) — no framework, no TypeScript
- **Markdown:** markdown-it + highlight.js + DOMPurify
- **Desktop:** Electron 41 + electron-builder
- **PWA:** vite-plugin-pwa (`injectManifest` strategy) + Workbox
- **Styling:** Hand-rolled CSS with custom properties; no CSS framework
- **Fonts:** Playfair Display, Libre Baskerville, Inter, JetBrains Mono (Google Fonts)

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (PWA disabled in dev) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run electron:dev` | Build then launch Electron |
| `npm run electron:build` | Package Windows ARM64 NSIS installer → `release/` |
| `npm run electron:build:x64` | Package Windows x64 NSIS installer |

There is **no test suite, no linter, and no type-checker** wired up. Don't suggest `npm test` / `npm run lint` — they don't exist.

## Architecture

The pieces below cross-cut multiple files; reading any one in isolation can mislead.

### View lifecycle + event bus

`src/main.js` is the single orchestrator. Views (`src/views/{landing,reader,editor}.js`) each export `render(data) → htmlString`, `mount(data)`, and optionally `destroy()`. `navigateTo(view, data)` calls the previous view's `destroy()`, replaces `#app`'s innerHTML, then calls the new view's `mount()`. Components attach listeners inside `mount`, and `destroy` is the only safe place to remove them — nothing else clears `#app`.

Cross-component communication goes through a tiny pub/sub in `src/core/events.js` (`on`/`off`/`emit`). Key events: `file:loaded`, `file:error`, `navigate:landing`, `navigate:reader`, `navigate:editor`. Components emit; `main.js` listens and navigates. Don't import view modules from components — emit instead.

### Document model + dirty check

`src/core/document.js` holds the single mutable open document (name, content, filePath, dirty flag). The editor view calls `updateContent` on input, which sets dirty. Before `navigateTo` unmounts the editor, it checks `isDirty()` and shows the unsaved-changes modal — leaving the editor by any path (toolbar, back button, navigate event) goes through this check. New navigation flows must keep going through `navigateTo` so this guard runs.

### Single source of truth for supported file formats

`SUPPORTED_EXTENSIONS` in `src/core/parser.js` defines which file types the app accepts and how non-markdown files are mapped to highlight.js languages. `parseFile(content, filename)` either renders markdown or wraps the content in a `<pre><code class="language-X">` block.

This list **must stay in sync** with three other places, or file associations / dialogs silently break:
- `MD_REGEX` in `electron/main.js:9`
- The `filters` array passed to `dialog.showOpenDialog` in `electron/main.js`
- The "Open File" menu label in the Electron menu

When adding a format, update all four.

### Electron ↔ renderer bridge

`electron/preload.cjs` is the **only** surface where the renderer talks to the main process. It exposes `window.electronAPI` with `onFileOpened`, `signalReady`, `openFileDialog`, `readFile`, `saveFile`, `onMenuSave`, and a literal `isElectron: true`. Components branch on `window.electronAPI` to pick desktop-only paths (e.g. `src/components/path-input.js` returns empty string in PWA so the Local Path card hides).

The `signalReady` IPC matters: file associations launch the app with a path in `argv`, but the renderer may not be ready yet. Main process buffers in `pendingFile` and flushes on `renderer-ready`. Single-instance lock (`app.requestSingleInstanceLock`) routes second-launch file opens into the existing window.

### PWA service worker

`vite.config.js` uses `strategies: 'injectManifest'`, so `src/sw.js` is **hand-written Workbox routing**, not auto-generated. Edit it directly to change cache behaviour. `devOptions.enabled: false` means the SW does not run under `npm run dev` — test offline behaviour with `npm run build && npm run preview`.

### Styling

CSS is split by concern under `src/styles/` and imported once via `src/style.css`. `variables.css` defines tokens (light theme); `dark.css` overrides them under `[data-theme="dark"]` on `<html>`. The font theme toggle similarly flips a `data-font` attribute. Adding a new color/spacing value? Put it in `variables.css` first.

## Design Notes

- Color palette inspired by airmail.news: warm cream `#faf6f0`, red accent `#c5232a`, dark charcoal text `#262635`.
- Editorial aesthetic: serif headings, generous whitespace, 720px content max-width.
- Sidebar TOC at 260px, collapses to modal at ≤600px.
- Transitions 150–300ms.

## Current State

**v1.2.2.** Desktop (macOS arm64 DMG + Windows ARM64 installer) and PWA are live. App deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`. v1.2.2 added macOS file associations for all 16 supported extensions, a macOS `open-file` event handler, and editing capability across every supported format (preview, save, and toolbar adapt to the file's extension). Use `git log` for per-commit history.
