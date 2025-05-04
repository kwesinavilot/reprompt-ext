# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.2.0] - 2024-06-09

### Added
- Structured output support: request JSON (via JSON Schema) or Regex-matched responses from Sonar.
- Utility functions to extract JSON from reasoning model outputs.
- Advanced API: `SonarApiService` exposes methods for chat completions, structured outputs, and flexible options.
- Example wrappers: `runWithSonarJsonSchema`, `runWithSonarRegex`.
- Documentation for structured outputs and advanced usage.

### Changed
- Refactored Sonar integration to use a generic, extensible API service.

---

## [0.1.1] - 2024-06-08

### Added
- Inline decorations to highlight injected XML tags (`<context>`, `<instruction>`, `<examples>`, `<format>`) after optimization.
- Webview panel for displaying Sonar responses with syntax highlighting.
- Keybindings for commands: `Ctrl+Shift+O` (Optimize), `Ctrl+Shift+R` (Run).
- Command Palette and context menu integration for `.md` and `.reprompt` files.

### Changed
- Improved error handling and user feedback for missing API key or selection.

---

## [0.1.0] - 2024-06-07

### Added
- Initial VS Code extension scaffold with TypeScript, ESLint, Prettier.
- Configuration for Perplexity Sonar API key.
- Command: **Reprompt: Optimize Prompt** — optimize selected text using Sonar API.
- Command: **Reprompt: Run with Sonar** — run prompt and show response.
- Basic Sonar API integration for prompt optimization and execution.
- Packaging scripts for `vsce`.
