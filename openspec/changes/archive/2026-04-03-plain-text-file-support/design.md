## Context

inkMD currently treats every loaded file as markdown and pipes it through markdown-it. The `file-input` component already accepts `.txt` in its `accept` attribute but the descriptor text still says "Drop a .md file", and no other extensions are permitted. There is no path-based input; the landing page offers file picker, paste text, and URL fetch only.

The Electron layer already has a generic `read-file` IPC handler (`ipcMain.handle('read-file', ...)`) that reads any file by absolute path and returns `{ name, content }`. The preload bridge exposes this as `window.electronAPI.readFile(filePath)`, so a new path-input component can reuse it without any new IPC plumbing.

## Goals / Non-Goals

**Goals:**
- Accept `.txt`, `.json`, `.yaml`, `.yml`, `.toml`, `.csv`, `.spec`, `.log`, `.ini`, `.env`, `.xml` alongside existing markdown extensions
- Render non-markdown files as syntax-highlighted code blocks using the existing highlight.js pipeline
- Add a "Local path" input card on the landing page (functional in Electron; graceful fallback in PWA)
- Update the Electron native file dialog and file-association regex to include all supported extensions

**Non-Goals:**
- Binary or rich-text formats (PDF, DOCX, XLSX)
- Markdown preview for `.txt` files (`.txt` is always rendered as plain text, not parsed as markdown)
- Auto-detecting content type from file contents (extension is sufficient)

## Decisions

### 1. Format detection via extension map in parser.js

Add a `PLAIN_TEXT_FORMATS` map in `src/core/parser.js` mapping extensions → hljs language names (e.g., `json → json`, `yaml/yml → yaml`, `txt/spec/log → plaintext`). Add a `parseFile(content, filename)` export that checks the extension: if it's markdown, calls the existing `parse()`; otherwise wraps `content` in a fenced code block with the correct language hint before passing to `parse()`.

**Alternative considered:** A separate rendering pipeline for non-markdown files. Rejected — wrapping in a fenced code block reuses the entire existing highlighting + DOMPurify + code-copy-button infrastructure for free.

**Alternative considered:** Content-sniffing (detect JSON by trying `JSON.parse`). Rejected — extension is reliable enough and avoids false positives on ambiguous plain text.

### 2. Callers pass filename to parseFile

`src/views/reader.js` (or wherever `parse()` is called today) switches to `parseFile(content, filename)`. The filename is already available from `file:loaded` events (`{ name, content }`).

### 3. path-input as a new component (not extending url-input)

`src/components/path-input.js` follows the same render/mount/destroy pattern as `url-input.js`. It renders conditionally: in Electron (`window.electronAPI`) it shows a text field + button that calls `window.electronAPI.readFile(path)` and emits `file:loaded`; in the browser it shows a static message directing the user to the file picker instead.

**Alternative considered:** Extending url-input with a toggle. Rejected — conflates two different input mechanisms; a separate card keeps concerns isolated and matches the existing 3-card pattern.

### 4. Landing page grows to 4 cards

`src/views/landing.js` adds the path-input card to the input grid. The CSS grid already uses `auto-fill` / `minmax` so a 4th card reflows naturally on wide viewports and stacks on mobile — no layout changes needed.

### 5. Supported extension set defined once

A `SUPPORTED_EXTENSIONS` array is defined in `src/core/parser.js` (since that module already owns format knowledge) and imported wherever needed (file-input accept attribute, Electron regex and dialog filters). This prevents the three places from drifting out of sync.

## Risks / Trade-offs

- **Very large plain-text files** — wrapping in a code block means the whole file is one `<pre>` element; syntax highlighting runs synchronously. Highlight.js has a built-in size limit (`maxHighlightLength`) that prevents hangs, so this is acceptable.
- **`.env` files may contain secrets** — the app already loads arbitrary files the user selects, so no new exposure is introduced. No network transmission occurs.
- **TOC generation for non-markdown files** — `extractHeadings()` will return an empty array for code-wrapped content, so the TOC panel will just be empty/hidden. This is correct behavior.

## Migration Plan

No data migration needed. The change is purely additive at the UX layer. Existing behavior for `.md` / `.markdown` files is unchanged — `parseFile` delegates to `parse` for those extensions.
