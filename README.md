# Reprompt 2.0

Transform simple ideas into powerful, structured prompts with context-aware AI assistance. Reprompt 2.0 is a VS Code extension that enhances your prompt engineering workflow by automatically detecting your project's technology stack and incorporating it into comprehensive, well-structured prompts using Perplexity's Sonar API.

Whether you're crafting prompts for code generation, documentation, or technical problem-solving, Reprompt 2.0 helps you create prompts that yield more accurate, relevant, and useful AI responses—all within your familiar VS Code environment.

## Features

- **Prompt Transformation:** Turn simple ideas into comprehensive, structured prompts with a single command.
- **Project Context Awareness:** Automatically detects your project's technology stack and incorporates it into transformed prompts.
- **Prompt Execution:** Run prompts with Sonar and view responses in a formatted webview.
- **Rich Markdown Rendering:** Sonar responses are displayed with headings, lists, code blocks (with copy button), and clickable links for a beautiful, readable experience.
- **Structured Outputs:** Get responses as JSON or in custom formats (advanced).
- **Inline Decorations:** Highlights XML tags (`<context>`, `<instruction>`, `<examples>`, `<constraints>`, `<format>`) after transformation.
- **Progress Themes:** Enjoy fun, themed progress notifications while waiting for responses.
- **Performance Stats:** Track response times and see detailed transformation statistics (optional).
- **Easy Access:** Use via Command Palette, context menu, or keyboard shortcuts.
- **No Local AI:** All processing is done via Perplexity Sonar API.

## Installation

### Option 1: Install from VS Code Extensions Panel
1. Open VS Code
2. Click on the Extensions icon in the Activity Bar (or press `Ctrl+Shift+X`)
3. Search for `kwesinavilot.reprompt`
4. Click the Install button

### Option 2: Install from VS Code Marketplace Website
1. Visit [Reprompt 2.0 on the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=kwesinavilot.reprompt)
2. Click the "Install" button
3. When prompted, allow VS Code to launch and complete the installation

### Option 3: Install via Command Line
Open a terminal and run:
```bash
code --install-extension kwesinavilot.reprompt
```

## Configuration

1. Open Command Palette (`Ctrl+Shift+P`).
2. Type `Preferences: Open Settings (UI)` and press Enter.
3. Search for `reprompt` to see all available settings:
   - `reprompt.sonarApiKey`: Your Perplexity Sonar API key (required)
   - `reprompt.showTransformationStats`: Enable/disable detailed transformation statistics (default: false)

## Usage

### Transform a Prompt

Transform a simple idea into a comprehensive, structured prompt:

1. Create a new `.md` or `.reprompt` file.
2. Write a simple prompt idea (e.g., "build a crud for a ghanaian ecommerce shoe store").
3. Select your text.
4. Press `Ctrl+Shift+O` or right-click and choose **Reprompt: Transform Prompt**.
5. Watch as your simple idea is transformed into a detailed, structured prompt with XML tags.
6. The extension automatically detects your project's technology stack and incorporates it into the transformed prompt.

### Run a Prompt

Execute a prompt and see the AI's response:

1. Select a prompt or leave the cursor in a prompt file.
2. Press `Ctrl+Shift+R` or right-click and choose **Reprompt: Run with Sonar**.
3. The response appears in a webview with rich formatting, code blocks, and a stats footer.
4. Use the refresh button to regenerate the response if needed.

### View Transformation Statistics

If you've enabled transformation statistics in settings:

1. After transforming a prompt, a statistics panel will open showing:
   - Original vs. transformed length and word count
   - Expansion ratio
   - Processing time
   - Summary of changes

### Developer Guide: Creating Effective Prompts

#### Basic Workflow

1. **Start Simple**: Begin with a clear, concise description of what you need.
2. **Transform**: Use the Transform command to expand your idea into a structured prompt.
3. **Refine**: Adjust the transformed prompt if needed to add specific details.
4. **Execute**: Run the prompt to get your response.
5. **Iterate**: Based on the response, refine your prompt further if needed.

#### Prompt Structure

The transformation process adds structure using XML-style tags:

- `<context>`: Background information and constraints
- `<instruction>`: The main task or request
- `<examples>`: Sample inputs/outputs (if applicable)
- `<constraints>`: Performance, security, or style boundaries
- `<format>`: How the response should be structured

#### Example Workflow

1. **Simple idea**: "create a voice assistant for elderly people"
2. **After transformation**: A comprehensive prompt with context about elderly users, specific features needed, accessibility considerations, and format requirements.
3. **Run the prompt**: Get a detailed response that follows your structured requirements.

## Commands & Shortcuts

- **Reprompt: Transform Prompt** — `Ctrl+Shift+O`
- **Reprompt: Run with Sonar** — `Ctrl+Shift+R`
- **Reprompt: Test** — (No default shortcut, accessible via Command Palette)

## FAQ

**Q: Is my data sent to Perplexity?**  
A: Yes, all prompts are sent securely to the Perplexity Sonar API. No data is processed locally.

**Q: Where do I get a Sonar API key?**  
A: Visit [perplexity.ai](https://www.perplexity.ai/) and sign up for API access.

**Q: Can I use this with other file types?**  
A: The extension is optimized for `.md` and `.reprompt` files, but commands can be run from the Command Palette in any text editor.

**Q: Why do I see different progress messages each time?**  
A: The extension randomly selects from themed message sets to make waiting more enjoyable.

**Q: How can I see detailed statistics about my transformations?**  
A: Enable the `reprompt.showTransformationStats` setting in your VS Code preferences.

**Q: How does the project stack detection work?**  
A: The extension analyzes your workspace files (like package.json, requirements.txt, etc.) to identify technologies and frameworks, then incorporates this context into prompt transformations.

## Troubleshooting

- **Command not working?** Make sure you've set your Sonar API key in settings.
- **Transformation taking too long?** Check your internet connection and Sonar API status.
- **Need more information?** Open the Output panel and select "Reprompt" from the dropdown to see detailed logs.

## Support

If you have any questions, suggestions, or feedback, please [open an issue](https://github.com/kwesinavilot/reprompt-ext/issues/new).

## Contributing
Contributions are welcome! Please read the [Contributing Guidelines](https://github.com/kwesinavilot/reprompt-ext/blob/main/CONTRIBUTING.md) for details on how to contribute.

## License
This project is licensed under the MIT License. See the [LICENSE](https://github.com/kwesinavilot/reprompt-ext/blob/main/LICENSE) file for details.