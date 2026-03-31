## Why

The `readFileWeb()` function in the file input component has no error handler on its `FileReader`. If a file read fails (corrupted file, encoding issue, aborted read), the user gets zero feedback — the UI just silently does nothing. This is a bad experience for a reader app where file loading is a core interaction.

## What Changes

- Add a `reader.onerror` handler to `readFileWeb()` in `src/components/file-input.js`
- Show user-visible feedback when a file fails to load

## Capabilities

### Modified Capabilities
- `file-input`: Surfaces read errors to the user instead of silently failing

## Impact

- `src/components/file-input.js`: Add error handler and user feedback
