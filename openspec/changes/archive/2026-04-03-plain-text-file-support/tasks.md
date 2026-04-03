## 1. Shared Extension Registry

- [x] 1.1 In `src/core/parser.js`, define and export a `SUPPORTED_EXTENSIONS` array covering all accepted extensions (`.md`, `.markdown`, `.txt`, `.json`, `.yaml`, `.yml`, `.toml`, `.csv`, `.spec`, `.log`, `.ini`, `.env`, `.xml`)
- [x] 1.2 In `src/core/parser.js`, define a `PLAIN_TEXT_FORMATS` map from extension → hljs language name (e.g., `json → json`, `yaml/yml → yaml`, `xml → xml`, everything else → `plaintext`)

## 2. Format-Aware Parser

- [x] 2.1 In `src/core/parser.js`, add a `parseFile(content, filename)` export that derives the extension from `filename`, looks it up in `PLAIN_TEXT_FORMATS`, wraps content in a fenced code block for non-markdown files, then calls the existing `parse()` function
- [x] 2.2 Update the call-site(s) in `src/views/reader.js` (or wherever `parse()` is invoked with file content) to call `parseFile(content, filename)` instead, passing the file name from the `file:loaded` event

## 3. File Input — Accept All Supported Extensions

- [x] 3.1 Update the `accept` attribute on the `<input type="file">` in `src/components/file-input.js` to include all extensions from `SUPPORTED_EXTENSIONS`
- [x] 3.2 Update the drop zone descriptor text from "Drop a .md file or click to browse" to "Drop a file or click to browse"
- [x] 3.3 Update the input-card description from "Drop a .md file or click to browse" to "Markdown, JSON, YAML, and more"

## 4. Electron — Expand File Associations and Dialog Filters

- [x] 4.1 In `electron/main.js`, update `MD_REGEX` to match all supported extensions (not just markdown + txt)
- [x] 4.2 In `electron/main.js`, update the `filters` array in `openFileDialog()` to include a "Plain Text Files" group listing all supported extensions, and rename the existing "Markdown" group label if appropriate
- [x] 4.3 In `electron/main.js`, update the menu item label from "Open Markdown File..." to "Open File..." to reflect the broader support

## 5. Local Path Input Component

- [x] 5.1 Create `src/components/path-input.js` with `render()`, `mount()`, and `destroy()` exports following the same pattern as `url-input.js`
- [x] 5.2 In `render()`: if `window.electronAPI` is available, output a text field + submit button; otherwise output a static fallback message ("Local path input is only available in the desktop app")
- [x] 5.3 In `mount()`: attach submit handler that calls `window.electronAPI.readFile(path)`, emits `file:loaded` on success, and shows an inline error message on failure (null return from IPC)
- [x] 5.4 Add keyboard submission support (Enter key in the text field triggers the same handler)

## 6. Wire Path Input into Landing Page

- [x] 6.1 Import `path-input` in `src/views/landing.js` and add `pathInput.render()` to the input grid
- [x] 6.2 Call `pathInput.mount()` in the landing `mount()` function and `pathInput.destroy()` in `destroy()`
