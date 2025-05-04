# Reprompt 2.0

A VS Code extension to optimize, run, and structure prompts using Perplexity Sonar API.

## Features

- **Prompt Optimization:** Instantly improve your prompts for clarity and effectiveness.
- **Prompt Execution:** Run prompts with Sonar and view responses in a formatted webview.
- **Rich Markdown Rendering:** Sonar responses are displayed with headings, lists, code blocks (with copy button), and clickable links for a beautiful, readable experience.
- **Structured Outputs:** Get responses as JSON or in custom formats (advanced).
- **Inline Decorations:** Highlights XML tags (`<context>`, `<instruction>`, `<examples>`, `<format>`) after optimization.
- **Easy Access:** Use via Command Palette, context menu, or keyboard shortcuts.
- **No Local AI:** All processing is done via Perplexity Sonar API.

## Installation

1. Open VS Code.
2. Go to Extensions (`Ctrl+Shift+X`).
3. Search for `kwesinavilot.reprompt` and install, or run:
   ```
   ext install kwesinavilot.reprompt
   ```

## Configuration

1. Open Command Palette (`Ctrl+Shift+P`).
2. Type `Preferences: Open Settings (UI)` and press Enter.
3. Search for `reprompt.sonarApiKey`.
4. Enter your Perplexity Sonar API key.

## Usage

### Optimize a Prompt

- Select text in a `.md` or `.reprompt` file.
- Press `Ctrl+Shift+O` or right-click and choose **Reprompt: Optimize Prompt**.
- The selection is replaced with an optimized version and XML tags are highlighted.

### Run a Prompt

- Select a prompt or leave the cursor in a prompt file.
- Press `Ctrl+Shift+R` or right-click and choose **Reprompt: Run with Sonar**.
- The response appears in a webview with rich formatting, code blocks, and a stats footer.

### Tips

- Works best with `.md` and `.reprompt` files.
- You can also access commands from the Command Palette (`Ctrl+Shift+P`).

## Commands & Shortcuts

- **Reprompt: Optimize Prompt** — `Ctrl+Shift+O`
- **Reprompt: Run with Sonar** — `Ctrl+Shift+R`

## FAQ

**Q: Is my data sent to Perplexity?**  
A: Yes, all prompts are sent securely to the Perplexity Sonar API. No data is processed locally.

**Q: Where do I get a Sonar API key?**  
A: Visit [perplexity.ai](https://www.perplexity.ai/) and sign up for API access.

**Q: Can I use this with other file types?**  
A: The extension is optimized for `.md` and `.reprompt` files, but commands can be run from the Command Palette in any text editor.

## License

MIT
