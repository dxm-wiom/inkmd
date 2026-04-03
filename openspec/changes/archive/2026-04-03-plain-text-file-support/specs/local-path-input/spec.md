## ADDED Requirements

### Requirement: User can load a file by typing its local path (Electron)

In the Electron desktop app, the system SHALL provide a "Local Path" input card on the landing page where the user can type or paste an absolute filesystem path and load the file.

#### Scenario: Valid path entered in Electron

- **WHEN** the user enters a valid absolute file path into the local-path input and submits
- **THEN** the system SHALL read the file via the Electron IPC bridge
- **AND** the system SHALL emit a `file:loaded` event with the file name and content
- **AND** the reader view SHALL open displaying the file

#### Scenario: Invalid or non-existent path entered in Electron

- **WHEN** the user enters a path that does not exist or cannot be read
- **THEN** the system SHALL display an inline error message within the path-input card
- **AND** the landing page SHALL remain visible so the user can correct the input

#### Scenario: Empty path submitted in Electron

- **WHEN** the user submits the path-input form with an empty field
- **THEN** the system SHALL NOT attempt a file read
- **AND** no error or navigation SHALL occur

### Requirement: Local path input shows a browser fallback in the PWA

In the browser (non-Electron) context, the local-path input card SHALL display a static message informing the user that local path access is unavailable and directing them to use the file picker instead.

#### Scenario: Path input card rendered in browser

- **WHEN** the landing page is loaded in a browser (no `window.electronAPI`)
- **THEN** the path-input card SHALL render a message explaining that local path input requires the desktop app
- **AND** the text input and submit button SHALL NOT be shown
