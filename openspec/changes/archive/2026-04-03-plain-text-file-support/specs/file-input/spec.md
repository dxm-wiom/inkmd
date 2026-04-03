## MODIFIED Requirements

### Requirement: File read errors are surfaced to the user

The system SHALL display a visible error message when a FileReader operation fails, instead of silently discarding the error.

#### Scenario: File read fails due to encoding or corruption

- **WHEN** a user selects or drops a file that the FileReader cannot read
- **THEN** the system SHALL display an error message indicating the file could not be read
- **AND** the drop zone SHALL return to its default state, ready for another attempt

#### Scenario: File read succeeds

- **WHEN** a user selects or drops a supported plain-text file
- **THEN** the system SHALL emit a `file:loaded` event with the file name and content
- **AND** no error message SHALL be displayed

## ADDED Requirements

### Requirement: File picker and drag-and-drop accept all supported plain-text extensions

The system SHALL accept `.md`, `.markdown`, `.txt`, `.json`, `.yaml`, `.yml`, `.toml`, `.csv`, `.spec`, `.log`, `.ini`, `.env`, and `.xml` files via the file picker and drag-and-drop, in addition to the previously supported markdown-only extensions.

#### Scenario: Supported non-markdown file dropped onto the drop zone

- **WHEN** the user drops a file with a supported plain-text extension (e.g., `.json`, `.yaml`) onto the drop zone
- **THEN** the system SHALL read and load the file
- **AND** the system SHALL emit a `file:loaded` event with the file name and content

#### Scenario: Unsupported binary file dropped

- **WHEN** the user drops a file with an unsupported extension (e.g., `.pdf`, `.docx`)
- **THEN** the system SHALL ignore the file or show a brief error
- **AND** no `file:loaded` event SHALL be emitted

### Requirement: File input descriptor text reflects supported formats

The drop zone descriptor text SHALL accurately describe the supported file types (not just `.md` files).

#### Scenario: Drop zone rendered

- **WHEN** the file-input card is displayed on the landing page
- **THEN** the descriptor text SHALL mention plain-text files broadly (e.g., "Drop a file or click to browse") rather than referencing `.md` only
