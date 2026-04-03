# inkMD — Project CLAUDE.md

## Objective

Build **inkMD**, a beautiful, editorial-inspired markdown reader available as both a **desktop app (Electron)** and a **Progressive Web App (PWA)**. The goal is to provide a distraction-free reading experience for markdown files with warm typography, dark mode, and offline support — prioritizing design quality and user experience over feature bloat.

## Tech Stack

- **Build:** Vite 7.3
- **Frontend:** Vanilla JavaScript (ES6 modules, no framework)
- **Markdown:** markdown-it + highlight.js + DOMPurify
- **Desktop:** Electron 41 + electron-builder
- **PWA:** vite-plugin-pwa + Workbox
- **Styling:** Custom CSS with variables, no CSS framework
- **Fonts:** Playfair Display, Libre Baskerville, Inter, JetBrains Mono (Google Fonts)

## Project Structure

```
src/
  main.js              — App entry, view navigation, lifecycle
  sw.js                — Service worker (Workbox routing)
  styles/              — CSS split by concern (variables, typography, layout, reader, components, code, dark, landing)
  components/          — UI components (file-input, text-input, url-input, path-input, recent-files, top-bar, toc, search, theme-toggle, code-block)
  core/                — Parser (markdown-it config + plain-text format detection), storage (localStorage), events (custom emitter)
  views/               — Landing page + reader view
electron/
  main.js              — Electron main process (window, IPC, menus, file associations)
  preload.cjs          — Context isolation bridge
public/                — PWA icons, favicon, robots.txt
build/                 — Windows app icon (.ico)
scripts/               — Icon generation utilities
```

## Progress

### v1.0.0 — Initial Release (2026-03-21)

**Commit 1 (930b436):** Full initial implementation — 42 files, ~13,400 lines.

Features shipped:
- **Three input methods:** file drag-and-drop, paste text, fetch from URL
- **Recent files** list (last 10, stored in localStorage)
- **Reader view** with sanitized markdown rendering and auto-generated heading IDs
- **Table of contents** with scroll-spy highlighting and mobile toggle
- **In-document search** (Ctrl+F) with match navigation and highlighting
- **Code highlighting** for 20+ languages with copy button
- **Dark mode** toggle (respects system preference, persists choice)
- **Font theme** toggle (Modern: Inter / Classic: Libre Baskerville)
- **Electron desktop app** with file associations (.md, .markdown), native file dialog, single-instance lock, system menu
- **PWA** with offline caching (app shell + fonts + fetched markdown URLs)
- **GitHub Actions** CI/CD deploying to GitHub Pages

**Commit 2 (9007312):** PWA and mobile polish.

- Regenerated PWA icon assets (192x192, 512x512, apple-touch-icon)
- Added mobile responsive layout (600px breakpoint)
- Fixed code block overflow on narrow screens
- Improved padding/margins for mobile

### v1.1.0 — Editor Mode (2026-03-21)

**Commit (a7d7af7):** Added editor mode with live preview.

- **Editor mode** — split-pane edit/preview with live markdown rendering
- **Send to Claude** — sends current document to Claude for AI assistance
- **Save** — Ctrl+S saves edited file (Electron: writes to disk; PWA: download)
- **FileReader error handling** — visible toast feedback when a file cannot be read (48cd9a7)

### v1.2.0 — Plain-Text File Support + Local Path Input (2026-04-03)

**Commit (6abda81):** Expanded format support and new input method.

- **Plain-text file support** — accepts `.json`, `.yaml`, `.yml`, `.toml`, `.csv`, `.txt`, `.spec`, `.log`, `.ini`, `.env`, `.xml` in addition to markdown; non-markdown files render as syntax-highlighted code blocks
- **Format detection** — `parseFile(content, filename)` in `src/core/parser.js` maps extension → hljs language; `SUPPORTED_EXTENSIONS` array is the single source of truth used by all components and Electron dialog filters
- **Local Path input card** — new landing page card; in Electron, user can type/paste an absolute path to load a file; in PWA the card is hidden entirely
- **Electron updates** — `MD_REGEX`, file dialog filters, and menu label all updated to reflect broader format support

### v1.2.1 — Landing UI Refresh (2026-04-04)

**Commit (95d158b):** Redesigned landing page layout.

- **Asymmetric grid** — utility cards (Open File, From URL, Local Path) stack compactly in a narrow left column (`minmax(200px, 280px)`); Paste Markdown occupies the full-height right column
- **Compact card variant** — `.input-card--compact` CSS modifier reduces padding and tightens drop zone to a single-row strip
- **Taller paste area** — textarea `min-height` raised from 100px to 240px
- **Local Path hidden in PWA** — `path-input.js` returns empty string in browser context (no fallback message card)
- **Responsive** — grid collapses to single column at ≤680px

### Current State

**v1.2.1.** Both desktop (Windows ARM64) and web (PWA) platforms are live. App deployed to GitHub Pages; installer at `release/inkMD Setup 1.2.0.exe`.

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (dist/) |
| `npm run preview` | Preview production build |
| `npm run electron:dev` | Build + launch Electron |
| `npm run electron:build` | Package Windows ARM64 installer |
| `npm run electron:build:x64` | Package Windows x64 installer |

## Design Notes

- Color palette inspired by airmail.news — warm cream (#faf6f0), red accent (#c5232a), dark charcoal text (#262635)
- Editorial aesthetic: serif headings, generous whitespace, 720px max content width
- Sidebar TOC at 260px, collapses to modal on mobile
- All transitions 150ms–300ms for smooth feel
