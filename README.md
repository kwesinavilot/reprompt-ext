# Reprompt 2.0

Transform simple ideas into powerful, structured prompts with context-aware AI assistance. Reprompt 2.0 is a VS Code extension that enhances your prompt engineering workflow by automatically detecting your project's technology stack and incorporating it into comprehensive, well-structured prompts using Perplexity's Sonar API.

Whether you're crafting prompts for code generation, documentation, or technical problem-solving, Reprompt 2.0 helps you create prompts that yield more accurate, relevant, and useful AI responses—all within your familiar VS Code environment.

## The Problem Reprompt Solves
Crafting effective AI prompts for code generation, documentation, or technical problem-solving can be challenging and time-consuming. Developers often struggle to:

- Clearly articulate their ideas in a way that AI models understand and respond to accurately.
- Incorporate relevant project context, such as technology stacks and coding conventions, into prompts.
- Maintain consistency and quality across team or project-specific prompt requirements.
- Efficiently transform simple, vague ideas into detailed, structured prompts that yield useful AI responses.
- Manage prompt execution and view AI responses seamlessly within their development environment.

Reprompt addresses these challenges by automating prompt transformation with context awareness, applying custom rules, and integrating directly into VS Code. This streamlines the prompt engineering workflow, improves AI response relevance, and saves developers valuable time.


## Features

- **Prompt Transformation:** Turn simple ideas into comprehensive, structured prompts with a single command.
- **Project Context Awareness:** Automatically detects your project's technology stack and incorporates it into transformed prompts.
- **Custom Prompt Rules:** Define team/project-specific prompt rules through `.rpmt.*` or `.rprmt.*` files in your workspace.
- **Prompt Execution:** Run prompts with Sonar and view responses in a formatted webview.
- **Generate Examples:** Generate examples for your prompts to improve accuracy.
- **Prompt Statistics:** View transformation statistics for original vs. transformed length, expansion ratio, processing time, and summary of changes.
- **Prompt Scoring:** Reprompt assigns a dynamic Prompt Quality Score, giving you real-time feedback on how strong your prompt is across multiple dimensions; clarity, specificity, context fit and output targeting. This helps you iterate fast, write with intent, and debug vague or bloated prompts before running them.
- **Sonar Model Selection:** Choose from multiple Sonar models (`sonar`, `sonar-pro`, `sonar-deep-research`, `sonar-reasoning`, `sonar-reasoning-pro`, `r1-1776`) to match your use case.
- **Search Context Size Control:** Select how much web context is retrieved (`low`, `medium`, `high`) to balance cost and answer depth.
- **Rich Markdown Rendering:** Sonar responses are displayed with headings, lists, code blocks (with copy button), and clickable links for a beautiful, readable experience.
- **Structured Outputs:** Get responses as JSON or in custom formats (advanced).
- **Inline Decorations:** Highlights XML tags (`<context>`, `<instruction>`, `<examples>`, `<constraints>`, `<format>`) after transformation.
- **Progress Themes:** Enjoy fun, themed progress notifications while waiting for responses.
- **Performance Stats:** Track response times and see detailed transformation statistics (optional).
- **Easy Access:** Use via Command Palette, context menu, or keyboard shortcuts.
- **No Local AI:** All processing is done via Perplexity Sonar API.
- **Timeout Protection:** Added fallback for Sonar API calls to prevent hangs.
- **Improved Theme Matching:** Webviews better match your selected VS Code theme.
- **Expanded File Support:** Works with `.md`, `.prompt.md`, `.reprompt`, `.reprompt.md`, `.cursor.md`, and `copilot-instructions.md` files.

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
   - `reprompt.sonarModel`: Choose the Sonar model to use for prompt execution and transformation
   - `reprompt.sonarSearchContextSize`: Control how much search context is retrieved from the web (`low`, `medium`, `high`)
   - `reprompt.showTransformationStats`: Enable/disable detailed transformation statistics (default: false)
   - `reprompt.inferProjectStack`: Enable/disable automatic project stack detection (default: true)

## Usage

### Transform a Prompt
Transform a simple idea into a comprehensive, structured prompt:

1. Create a new `.md` or `.reprompt` file.
2. Write a simple prompt idea (e.g., "build a crud for a ghanaian ecommerce shoe store").
3. Select your text.
4. Press `Ctrl+Shift+O` or right-click and choose **Reprompt: Transform Prompt**.
5. Watch as your simple idea is transformed into a detailed, structured prompt with XML tags.
6. The extension automatically detects your project's technology stack and incorporates it into the transformed prompt.

### Define Custom Prompt Rules
Create team or project-specific prompt rules:

1. Create a file in your workspace root with `.rpmt.` or `.rprmt.` in its name (e.g., `team-rules.rpmt.md`, `company.rprmt.json`).
2. For Markdown files: Write your rules in plain text.
3. For JSON files: Create key-value pairs of rule names and descriptions.
4. For YAML files: Create key-value pairs similar to JSON.
5. The extension will automatically detect and apply these rules during prompt transformation.

Example `team-rules.rpmt.md`:
```markdown
Always use TypeScript instead of JavaScript.
Follow the company's API naming convention: /api/v1/resource.
Include unit tests for all new functions.
Use Material UI components for all UI elements.
```

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

### Supported File Types
Reprompt commands work with the following file types:
- `.md`
- `.prompt.md`
- `.reprompt`
- `.reprompt.md`
- `.cursor.md`
- `copilot-instructions.md`

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
A: The extension randomly selects from themed message sets (magical, tech, or cooking) to make waiting more enjoyable.

**Q: How can I see detailed statistics about my transformations?**  
A: Enable the `reprompt.showTransformationStats` setting in your VS Code preferences.

**Q: How does the project stack detection work?**  
A: The extension analyzes your workspace files (like package.json, requirements.txt, etc.) to identify technologies and frameworks, then incorporates this context into prompt transformations.

**Q: What happens if the Sonar API doesn't respond?**  
A: The extension now includes timeout protection to prevent hanging if the API doesn't respond in a reasonable time.

**Q: Can I choose which Sonar model to use?**  
A: Yes! Use the `reprompt.sonarModel` setting to select from all available Sonar models.

**Q: How do I control the amount of web context retrieved?**  
A: Use the `reprompt.sonarSearchContextSize` setting (`low`, `medium`, `high`) to balance cost and answer depth.

**Q: What file types are supported?**  
A: Reprompt works with `.md`, `.prompt.md`, `.reprompt`, `.reprompt.md`, `.cursor.md`, and `copilot-instructions.md` files.

## Troubleshooting
- **Command not working?** Make sure you've set your Sonar API key in settings.
- **Transformation taking too long?** Check your internet connection, Sonar API status, or try lowering the search context size.
- **Need more information?** Open the Output panel and select "Reprompt" from the dropdown to see detailed logs.

## Support
If you have any questions, suggestions, or feedback, please [open an issue](https://github.com/kwesinavilot/reprompt-ext/issues/new).

## Contributing
Contributions are welcome! Please read the [Contributing Guidelines](https://github.com/kwesinavilot/reprompt-ext/blob/main/CONTRIBUTING.md) for details on how to contribute.

## License
This project is licensed under the MIT License. See the [LICENSE](https://github.com/kwesinavilot/reprompt-ext/blob/main/LICENSE) file for details.