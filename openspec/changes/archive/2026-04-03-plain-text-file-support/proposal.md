## Why

inkMD currently only accepts `.md` / `.markdown` files, limiting its usefulness for developers and writers who routinely work with other plain-text formats (JSON configs, YAML manifests, plain `.txt` notes, spec files, etc.). Extending format support removes this friction without compromising the editorial reading experience.

## What Changes

- **Accept additional file types** when dropping, picking, or pasting: `.txt`, `.json`, `.yaml`, `.yml`, `.toml`, `.csv`, `.spec`, `.log`, and similar plain-text extensions.
- **Render non-markdown files** appropriately — wrap content in a fenced code block with the correct language hint so highlight.js applies syntax coloring (e.g., JSON → `json`, YAML → `yaml`, plain text → no language).
- **Add a local file path input method** — a new input option on the landing page that lets the user type or paste an absolute local path (e.g., `C:\Users\...\notes.txt` or `/home/.../config.yaml`); the Electron main process resolves and reads the file via IPC, while the PWA shows a helpful "use file picker" fallback since browsers cannot read arbitrary paths.
- **Update accepted file filters** in the Electron native file-open dialog to include all supported extensions.
- **Update file-input component** to relax the `accept` attribute so drag-and-drop and the file picker allow the new extensions.

## Capabilities

### New Capabilities

- `plain-text-rendering`: Detect file extension of loaded content and render non-markdown files as syntax-highlighted code blocks rather than parsed markdown.
- `local-path-input`: New landing-page input method that accepts a typed local filesystem path and loads the file (Electron via IPC; PWA surfaces a graceful fallback).

### Modified Capabilities

- `file-input`: Accept attribute and drag-and-drop validation must allow all supported plain-text extensions, not just `.md` / `.markdown`.

## Impact

- `src/components/file-input.js` — relax `accept` attribute and MIME/extension validation
- `src/components/url-input.js` — may serve as reference; a new `path-input` component will be added alongside it
- `src/views/landing.js` — wire up new local-path input tab/option
- `src/core/parser.js` — add format-detection logic; wrap non-markdown content before passing to markdown-it
- `electron/main.js` — add `read-local-file` IPC handler; update `filters` in `showOpenDialog`
- `electron/preload.cjs` — expose `readLocalFile` bridge method
- No new npm dependencies required (highlight.js already bundled; Node `fs` available in Electron main)
