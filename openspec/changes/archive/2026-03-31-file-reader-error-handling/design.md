## Context

`readFileWeb()` in `src/components/file-input.js` uses the FileReader API with only an `onload` handler. The `onerror` path is unhandled. The component currently only imports `emit` from the events module — it has no direct access to a toast/notification utility.

The app has `showToast()` functions defined locally in `main.js` and `editor.js`, but these are not shared exports.

## Goals / Non-Goals

**Goals:**
- Show the user a visible error message when file reading fails
- Keep the drop zone usable after a failure

**Non-Goals:**
- Creating a shared toast utility (out of scope for this change)
- Handling Electron-side file read errors (already handled via IPC)

## Decisions

### Decision 1: Use the event system to surface errors

Rather than importing or duplicating a `showToast()` function, we'll emit a custom event (e.g., `'error'`) and handle it in `main.js` where the toast function already lives. This follows the existing decoupled pattern — components communicate via events, not direct DOM manipulation.

**Alternative considered:** Duplicating `showToast()` inside `file-input.js`. Rejected because it adds a second inline toast implementation and couples the component to DOM structure.

**Alternative considered:** Creating a shared toast module. Rejected as over-scoped for a single error handler addition.
