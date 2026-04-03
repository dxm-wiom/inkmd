## MODIFIED Requirements

### Requirement: Local path input shows a browser fallback in the PWA

In the browser (non-Electron) context, the local-path input card SHALL NOT be rendered — the component's `render()` function SHALL return an empty string, producing no DOM output.

#### Scenario: Path input card rendered in browser

- **WHEN** the landing page is loaded in a browser (no `window.electronAPI`)
- **THEN** the path-input component SHALL produce no visible card or message
- **AND** the landing input grid SHALL reflow as if the path-input slot does not exist
