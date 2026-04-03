# plain-text-rendering Specification

## Purpose
TBD - created by syncing change plain-text-file-support. Update Purpose after implementation.

## Requirements

### Requirement: Non-markdown files are rendered as syntax-highlighted code

The system SHALL detect the file extension of any loaded file and render non-markdown files as a syntax-highlighted code block rather than as parsed markdown.

Supported plain-text extensions and their highlight language: `.json` → `json`, `.yaml` / `.yml` → `yaml`, `.toml` → `toml`, `.csv` → `plaintext`, `.txt` → `plaintext`, `.spec` → `plaintext`, `.log` → `plaintext`, `.ini` → `ini`, `.env` → `plaintext`, `.xml` → `xml`.

#### Scenario: JSON file is loaded

- **WHEN** a user loads a file with a `.json` extension
- **THEN** the system SHALL render the file content inside a syntax-highlighted code block using the `json` language
- **AND** the rendered output SHALL NOT be parsed as markdown

#### Scenario: YAML file is loaded

- **WHEN** a user loads a file with a `.yaml` or `.yml` extension
- **THEN** the system SHALL render the file content inside a syntax-highlighted code block using the `yaml` language

#### Scenario: Plain text file is loaded

- **WHEN** a user loads a file with a `.txt`, `.spec`, `.log`, or `.env` extension
- **THEN** the system SHALL render the file content inside a code block with no language-specific highlighting applied

#### Scenario: Markdown file is loaded (unchanged behavior)

- **WHEN** a user loads a file with a `.md` or `.markdown` extension
- **THEN** the system SHALL render the file content using the existing markdown parser
- **AND** the behavior SHALL be identical to the pre-change behavior

### Requirement: TOC is suppressed for non-markdown files

The system SHALL display an empty or hidden table-of-contents panel when a non-markdown file is loaded, since code-block content contains no headings.

#### Scenario: Non-markdown file loaded, TOC requested

- **WHEN** a non-markdown file is loaded and the user opens the TOC panel
- **THEN** the system SHALL display the TOC in an empty state (no entries)
- **AND** no error SHALL be shown
