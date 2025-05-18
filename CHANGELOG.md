# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

# Changelog

## [0.11.0] - 2025-05-18

### Added
- **Custom Prompt Rules:** Added support for team/project-specific prompt rules through `.rpmt.*` files in the workspace root. Supports Markdown, JSON, and YAML formats.
- **Flexible Rule File Naming:** Any file containing `.rpmt.` in its name (e.g., `team-rules.rpmt.md`, `company.rpmt.json`) will be detected and used.
- **Enhanced System Prompt:** Updated the system prompt to incorporate user-defined rules while maintaining the core transformation capabilities.

## [0.10.0] - 2025-06-17

### Added
- **Context Menu Separator:** Added a horizontal rule after Reprompt commands in the editor context menu for better visual separation.
- **Improved File Type Support:** The context menu commands now appear for all supported file types, including `.prompt.md`, `.reprompt.md`, `.cursor.md`, and `copilot-instructions.md`.
- **Robust Logging:** The extension now always shows the Output panel and logs detailed information when running the "Generate Examples" command, making debugging easier.

### Changed
- **Examples Prompt Quality:** The prompt sent to Sonar for generating examples is now more instructive, resulting in higher-quality, more diverse examples.
- **Menu Separator Implementation:** Replaced the deprecated `"-"` command with the correct `"separator": true` property in the context menu configuration.

### Fixed
- **Context Menu Command Activation:** Fixed an issue where "Reprompt: Generate Examples" and other commands would not appear or work from the context menu for certain file types.
- **VS Code Warning:** Resolved the warning about an undefined `-` command in the menu configuration.

## [0.8.0] - 2025-05-14

### Added
- **Sonar Model Selection:** Users can now choose from multiple Sonar models (`sonar`, `sonar-pro`, `sonar-deep-research`, `sonar-reasoning`, `sonar-reasoning-pro`, `r1-1776`) in settings for both transformation and execution.
- **Search Context Size Setting:** Added `reprompt.sonarSearchContextSize` setting (`low`, `medium`, `high`) to control the amount of web context retrieved for each request, balancing cost and comprehensiveness.
- **File Type Support:** Commands now support `.prompt.md`, `.reprompt`, `.reprompt.md`, `.cursor.md`, and `copilot-instructions.md` files.
- **Improved Command Palette Integration:** All commands (`Transform Prompt`, `Run with Sonar`, `Test`) are available in the Command Palette.
- **Better Error Handling:** More user-friendly and fun error messages for network issues and timeouts.
- **Settings Documentation:** Settings for model and context size are now documented and available in the VS Code settings UI.

### Changed
- **API Calls:** All Sonar API calls now respect the selected model and search context size.
- **Webview Regeneration:** Regeneration and progress notifications now use the selected model and context size.
- **Settings:** Default model is `sonar`, default search context size is `medium`.

### Fixed
- Ensured all supported file types are recognized for context menu and command palette actions.
- Improved robustness of error handling for network failures and timeouts.

## [0.7.0] - 2025-05-13

### Changed
- Improved the 'Run With Sonar' regeneration process to ensure proper functionality
- Updated the webviews to better match the user's selected VS Code theme.
- Added a timeout fallback for Sonar API calls to prevent hangs
- Improved error handling and user feedback for missing API key or selection.

## [0.6.0] - 2025-05-10

### Added
- Project stack detection: Automatically identifies the technology stack of the current project (Node.js, Python, PHP, Ruby, Java, .NET, Go, Rust) and includes this context in prompt transformations
- Enhanced system prompt: Completely redesigned prompt engineering system that creates highly instructive, structured prompts with XML tags (<context>, <instruction>, <examples>, <constraints>, <format>)
- Random themed progress notifications: Fun, contextual progress messages in magical, tech, or cooking themes

### Improved
- Transformation statistics: Added detailed stats panel showing length, word count, expansion ratio, and processing time
- Better error handling and logging through dedicated output channel
- More responsive UI with step-by-step progress notifications
- Code organization with clearer separation of concerns
- Webview UI: Enhanced theme-aware styling that better adapts to VS Code's color scheme

### Fixed
- Code block rendering in webview responses
- HTML escaping in rendered content
- Proper handling of regeneration requests from webviews

## [0.5.1] - 2025-05-8

### Added
- Added the License and logo files
- Added logo to webview panels for consistent branding
- Updated package description for better marketplace visibility

### Improved
- Enhanced button hover styling to better adapt to user's VS Code theme
- Improved webview UI elements to respect VS Code's color variables

## [0.5.0] - 2025-05-8

### Added
- Themed progress notifications: Fun, randomly selected progress messages (magical, tech, or cooking themes) for transforming and running prompts.
- Transformation statistics: Optional detailed stats panel after transforming a prompt, including length, word count, expansion ratio, and processing time (`reprompt.showTransformationStats` setting).
- Enhanced system prompt: Transforms now produce even more comprehensive, structured prompts with business, technical, and contextual details.
- Output channel logging: All actions and errors are logged for easier troubleshooting.
- Command renaming: "Optimize Prompt" is now "Transform Prompt" everywhere for clarity.

### Improved
- UI responsiveness: Progress notifications update step-by-step for a smoother experience.
- Error handling: More robust error messages and logging.
- Webview rendering: More robust and theme-aware, adapts to VS Code color themes.

### Fixed
- Non-blocking UI for stats calculation.
- Improved code block rendering and markdown formatting in webview.
- Various bug fixes for edge cases and user experience.

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

## [0.1.1] - 2025-05-04

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
