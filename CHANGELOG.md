# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

# Changelog

## [0.4.0] - 2025-05-07

### Added
- Output channel for improved logging and debugging
- Test command (`reprompt.test`) to verify extension functionality
- Time tracking for API requests showing how long operations take
- Detailed progress notifications with step-by-step updates
- Themed progress messages with random selection for variety
- Enhanced system prompt for better prompt transformations

### Improved
- Enhanced error handling with better error messages and logging
- More responsive UI during API operations with progress updates
- Webview message handling for regeneration requests
- Code organization and readability
- Renamed "optimize" to "transform" for clarity of purpose

### Fixed
- Proper handling of regeneration requests from the webview
- Improved HTML escaping in rendered content
- Better context passing to ensure extension state is maintained

## [0.3.0] - 2025-05-07

### Added
- Output channel for improved logging and debugging
- Test command (`reprompt.test`) to verify extension functionality
- Time tracking for API requests showing how long operations take
- Detailed progress notifications with step-by-step updates

### Improved
- Enhanced error handling with better error messages and logging
- More responsive UI during API operations with progress updates
- Webview message handling for regeneration requests
- Code organization and readability

### Fixed
- Proper handling of regeneration requests from the webview
- Improved HTML escaping in rendered content
- Better context passing to ensure extension state is maintained

## [0.3.0] - 2025-05-04

### Added
- Rich markdown-like rendering for Sonar responses in the webview, including:
  - Headings, lists, code blocks, inline code, and clickable links.
  - Copy-to-clipboard button for code blocks.
  - Collapsible sources panel and stats footer.
  - Action buttons for refreshing and toggling sources.
- Improved webview layout and styling for better readability and usability.
- Unique message IDs for each response panel.
- TypeScript interfaces for code block handling in the extension.

### Changed
- Refactored `renderSonarWebview` for clarity and maintainability.
- Enhanced error handling and edge case support in markdown rendering.

---

## [0.2.0] - 2025-05-04

### Added
- Structured output support: request JSON (via JSON Schema) or Regex-matched responses from Sonar.
- Utility functions to extract JSON from reasoning model outputs.
- Advanced API: `SonarApiService` exposes methods for chat completions, structured outputs, and flexible options.
- Example wrappers: `runWithSonarJsonSchema`, `runWithSonarRegex`.
- Documentation for structured outputs and advanced usage.

### Changed
- Refactored Sonar integration to use a generic, extensible API service.

---

## [0.1.1] - 2024-05-04

### Added
- Inline decorations to highlight injected XML tags (`<context>`, `<instruction>`, `<examples>`, `<format>`) after optimization.
- Webview panel for displaying Sonar responses with syntax highlighting.
- Keybindings for commands: `Ctrl+Shift+O` (Optimize), `Ctrl+Shift+R` (Run).
- Command Palette and context menu integration for `.md` and `.reprompt` files.

### Changed
- Improved error handling and user feedback for missing API key or selection.

---

## [0.1.0] - 2025-05-04

### Added
- Initial VS Code extension scaffold with TypeScript, ESLint, Prettier.
- Configuration for Perplexity Sonar API key.
- Command: **Reprompt: Optimize Prompt** — optimize selected text using Sonar API.
- Command: **Reprompt: Run with Sonar** — run prompt and show response.
- Basic Sonar API integration for prompt optimization and execution.
- Packaging scripts for `vsce`.
