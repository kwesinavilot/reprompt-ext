"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const sonar_1 = require("./sonar");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const util = __importStar(require("util"));
const yaml = __importStar(require("js-yaml"));
const readFileAsync = util.promisify(fs.readFile);
const outputChannel = vscode.window.createOutputChannel('Reprompt');
// Store the message handlers for each panel
const panelMessageHandlers = new Map();
let promptScoreStatusBar;
let userPromptRules = null;
/**
 * Called when the extension is activated.
 *
 * Performs the following tasks:
 * - Register commands for optimizing prompts, running with Sonar, generating examples, and a test command.
 * - Registers a status bar item for displaying the prompt score.
 * - Listens for changes to the active text editor, text editor selection, or text document to update the status bar.
 * - Loads the user prompt rules file (if present) and logs success or failure.
 * - Updates the prompt score status bar item initially.
 */
function activate(context) {
    outputChannel.appendLine('Reprompt extension activated');
    context.subscriptions.push(vscode.commands.registerCommand('reprompt.optimize', () => transformPrompt(context)), vscode.commands.registerCommand('reprompt.runSonar', () => runWithSonar(context)), vscode.commands.registerCommand('reprompt.generateExamples', () => generateExamples(context)), vscode.commands.registerCommand('reprompt.test', () => {
        outputChannel.show();
        outputChannel.appendLine('Test command executed successfully');
        vscode.window.showInformationMessage('Reprompt test command works!');
    }), 
    // Prompt Score details command
    vscode.commands.registerCommand('reprompt.showPromptScoreDetails', showPromptScoreDetails));
    // Status bar for prompt score
    promptScoreStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    promptScoreStatusBar.command = 'reprompt.showPromptScoreDetails';
    context.subscriptions.push(promptScoreStatusBar);
    // Update score on editor/selection change
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updatePromptScoreStatusBar), vscode.window.onDidChangeTextEditorSelection(updatePromptScoreStatusBar), vscode.workspace.onDidChangeTextDocument(updatePromptScoreStatusBar));
    // Initial update
    loadUserPromptRules();
    updatePromptScoreStatusBar();
}
// Define the themes at the top of your file or in a separate themes.ts file
const progressThemes = [
    // Magical Theme
    {
        preparing: 'Summoning the prompt wizards...',
        sending: 'Casting transformation spells...',
        processing: 'Deciphering magical runes...',
        applying: 'Infusing document with enchantments...',
        highlighting: 'Adding magical highlights...',
        completed: 'The spell is complete!'
    },
    // Tech/AI Theme
    {
        preparing: 'Initializing neural networks...',
        sending: 'Transmitting to AI headquarters...',
        processing: 'Parsing quantum algorithms...',
        applying: 'Integrating enhanced data structures...',
        highlighting: 'Applying semantic highlighting...',
        completed: 'Transformation protocol complete!'
    },
    // Cooking/Recipe Theme
    {
        preparing: 'Gathering prompt ingredients...',
        sending: 'Mixing in the secret sauce...',
        processing: 'Letting flavors develop...',
        applying: 'Plating your gourmet prompt...',
        highlighting: 'Adding the final garnish...',
        completed: 'Your prompt is served!'
    }
];
/**
 * Returns a random theme from the progressThemes array.
 * Each theme is an object with keys for the different progress messages
 * that are displayed during the transformation process.
 * The keys and their corresponding messages are:
 *   - preparing: The initial message displayed while the transformation
 *     process is starting.
 *   - sending: The message displayed while the prompt is being sent to the
 *     Sonar API.
 *   - processing: The message displayed while the response is being processed
 *     by the Sonar API.
 *   - applying: The message displayed while the response is being applied to
 *     the document.
 *   - highlighting: The message displayed while the response is being formatted
 *     and highlighted.
 *   - completed: The final message displayed after the transformation process
 *     has completed.
 * @returns {Object} A random theme object.
 */
function getRandomTheme() {
    const randomIndex = Math.floor(Math.random() * progressThemes.length);
    return progressThemes[randomIndex];
}
/**
 * Tries to detect the project stack by searching for known project files.
 * Currently detects Node.js/TypeScript/JavaScript, Python, PHP, Ruby, Java, .NET, Go and Rust.
 * @returns A string with the inferred project stack, or an empty string if no project stack could be detected.
 */
async function inferProjectStack() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0)
        return '';
    const rootPath = workspaceFolders[0].uri.fsPath;
    const stackHints = [];
    // Helper to check and read a file if it exists
    async function tryReadFile(filename) {
        const filePath = path.join(rootPath, filename);
        try {
            if (fs.existsSync(filePath)) {
                return await readFileAsync(filePath, 'utf8');
            }
        }
        catch { }
        return null;
    }
    // Node.js/TypeScript/JavaScript
    const pkgJson = await tryReadFile('package.json');
    if (pkgJson) {
        try {
            const pkg = JSON.parse(pkgJson);
            stackHints.push('Detected Node.js project.');
            if (pkg.dependencies)
                stackHints.push('Dependencies: ' + Object.keys(pkg.dependencies).join(', '));
            if (pkg.devDependencies)
                stackHints.push('DevDependencies: ' + Object.keys(pkg.devDependencies).join(', '));
            if (pkg.scripts)
                stackHints.push('NPM Scripts: ' + Object.keys(pkg.scripts).join(', '));
        }
        catch { }
    }
    // Python
    const requirements = await tryReadFile('requirements.txt');
    if (requirements) {
        stackHints.push('Detected Python project.');
        stackHints.push('Requirements: ' + requirements.split('\n').filter(Boolean).join(', '));
    }
    const pyproject = await tryReadFile('pyproject.toml');
    if (pyproject) {
        stackHints.push('Detected pyproject.toml (Python, Poetry or PEP 517/518).');
    }
    // PHP
    const composer = await tryReadFile('composer.json');
    if (composer) {
        try {
            const comp = JSON.parse(composer);
            stackHints.push('Detected PHP project (Composer).');
            if (comp.require)
                stackHints.push('Composer require: ' + Object.keys(comp.require).join(', '));
        }
        catch { }
    }
    // Ruby
    const gemfile = await tryReadFile('Gemfile');
    if (gemfile) {
        stackHints.push('Detected Ruby project (Gemfile present).');
    }
    // Java
    const pom = await tryReadFile('pom.xml');
    if (pom) {
        stackHints.push('Detected Java project (Maven pom.xml present).');
    }
    const gradle = await tryReadFile('build.gradle');
    if (gradle) {
        stackHints.push('Detected Java project (Gradle build.gradle present).');
    }
    // .NET
    const csproj = (await fs.promises.readdir(rootPath)).find(f => f.endsWith('.csproj'));
    if (csproj) {
        stackHints.push('Detected .NET project (.csproj present).');
    }
    // Go
    const goMod = await tryReadFile('go.mod');
    if (goMod) {
        stackHints.push('Detected Go project (go.mod present).');
    }
    // Rust
    const cargo = await tryReadFile('Cargo.toml');
    if (cargo) {
        stackHints.push('Detected Rust project (Cargo.toml present).');
    }
    return stackHints.length > 0
        ? `\n\n[Project Stack Detected]\n${stackHints.join('\n')}\n`
        : '';
}
/**
 * Retrieves the preferred Sonar model from settings.
 *
 * The Sonar model determines which AI model is used for the transformation.
 * The default value is 'sonar' if not set. If the setting is not set or
 * an invalid value is provided, the function returns 'sonar'.
 *
 * @returns The preferred Sonar model ('sonar-pro', 'sonar', 'sonar-deep-research',
 * 'sonar-reasoning-pro', 'sonar-reasoning', or 'r1-1776').
 */
function getSonarModel() {
    // Default to "sonar" if not set
    return vscode.workspace.getConfiguration().get('reprompt.sonarModel') || 'sonar';
}
/**
 * Retrieves the preferred Sonar search context size from settings.
 *
 * The Sonar search context size determines how much web context is retrieved
 * for each prompt. The default value is 'medium'. If the setting is not set or
 * an invalid value is provided, the function returns 'medium'.
 *
 * @returns The preferred search context size ('low', 'medium', or 'high').
 */
function getSonarSearchContextSize() {
    const val = vscode.workspace.getConfiguration().get('reprompt.sonarSearchContextSize');
    if (val === 'low' || val === 'medium' || val === 'high')
        return val;
    return 'medium';
}
/**
 * Transforms a simple idea into a comprehensive, structured prompt with context-aware AI assistance.
 *
 * The function performs the following actions:
 * - Verifies the presence of an active text editor and a valid prompt.
 * - Retrieves the API key and validates the file type.
 * - Chooses a random theme for the progress messages.
 * - Retrieves the project stack (if enabled) and appends it to the prompt.
 * - Sends the prompt to the Sonar API and processes the response.
 * - Measures and logs the elapsed time for the API call.
 * - Creates a webview panel to display the response, and sets up message handling.
 * - Handles network errors and timeouts with user-friendly messages.
 *
 * @param context - The VS Code extension context.
 */
async function transformPrompt(context) {
    outputChannel.appendLine('Transform prompt command triggered');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        outputChannel.appendLine('No active editor found');
        return;
    }
    if (!isPromptFile(editor.document)) {
        vscode.window.showErrorMessage('Reprompt only works on .md, .prompt.md, .reprompt, .reprompt.md, .cursor.md, or copilot-instructions.md files.');
        return;
    }
    const selection = editor.selection;
    const raw = editor.document.getText(selection);
    if (!raw) {
        vscode.window.showErrorMessage('No text selected.');
        return;
    }
    const apiKey = vscode.workspace.getConfiguration().get('reprompt.sonarApiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.');
        return;
    }
    const showStats = vscode.workspace.getConfiguration().get('reprompt.showTransformationStats');
    const inferStack = vscode.workspace.getConfiguration().get('reprompt.inferProjectStack');
    const startTime = Date.now();
    let originalLength = 0;
    let originalWords = 0;
    if (showStats) {
        originalLength = raw.length;
        originalWords = raw.split(/\s+/).filter(word => word.length > 0).length;
    }
    const theme = getRandomTheme();
    outputChannel.appendLine(`[Reprompt] Using theme with first message: ${theme.preparing}`);
    let stackContext = '';
    if (inferStack) {
        try {
            stackContext = await inferProjectStack();
            if (stackContext) {
                outputChannel.appendLine('Project stack detected and appended to prompt transformation.');
            }
        }
        catch (err) {
            outputChannel.appendLine('Error inferring project stack: ' + err);
        }
    }
    const sonarModel = getSonarModel();
    const searchContextSize = getSonarSearchContextSize();
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Transforming prompt with Sonar...',
            cancellable: false
        }, async (progress) => {
            await showProgressSteps(progress, theme, async () => {
                // If optimizeWithSonar is extended to accept model and searchContextSize and user prompt file, pass them here
                const transformed = await (0, sonar_1.optimizeWithSonar)(raw + stackContext, apiKey, sonarModel, searchContextSize, userPromptRules);
                await applyTransformedPrompt(editor, selection, transformed);
                highlightXmlTags(editor, selection.start, transformed);
                if (showStats) {
                    showTransformationStatsPanel(context, {
                        originalLength,
                        originalWords,
                        transformed,
                        startTime
                    });
                }
                const expansionPercent = Math.round(((transformed.length / raw.length) - 1) * 100);
                vscode.window.showInformationMessage(`Prompt transformed successfully! Expanded by ${expansionPercent}%.`);
            });
        });
    }
    catch (err) {
        outputChannel.appendLine(`[Reprompt] Transformation error: ${err.message}`);
        vscode.window.showErrorMessage('Sonar transformation failed: ' + err.message);
    }
}
/**
 * Shows progress steps for an operation with a themed progress bar.
 * @param {vscode.Progress<{ message?: string }>} progress - The progress bar to update.
 * @param {any} theme - An object with themed message strings for the different steps.
 * @param {() => Promise<void>} mainTask - The main operation to perform.
 */
async function showProgressSteps(progress, theme, mainTask) {
    progress.report({ message: theme.preparing });
    await new Promise(resolve => setTimeout(resolve, 300));
    progress.report({ message: theme.sending });
    await mainTask();
    progress.report({ message: theme.processing });
    await new Promise(resolve => setTimeout(resolve, 300));
    progress.report({ message: theme.applying });
    await new Promise(resolve => setTimeout(resolve, 100));
    progress.report({ message: theme.highlighting });
    await new Promise(resolve => setTimeout(resolve, 100));
    progress.report({ message: theme.completed });
}
/**
 * Applies the transformed prompt to the VS Code editor.
 *
 * @param {vscode.TextEditor} editor - The VS Code editor to modify.
 * @param {vscode.Selection} selection - The selection to replace with the transformed prompt.
 * @param {string} transformed - The transformed prompt to apply.
 */
async function applyTransformedPrompt(editor, selection, transformed) {
    await editor.edit(editBuilder => editBuilder.replace(selection, transformed));
}
/**
 * Shows a webview panel with transformation statistics.
 *
 * @param {vscode.ExtensionContext} context
 * @param {{ originalLength: number; originalWords: number; transformed: string; startTime: number }} opts
 */
function showTransformationStatsPanel(context, opts) {
    try {
        const transformedLength = opts.transformed.length;
        const transformedWords = opts.transformed.split(/\s+/).filter(word => word.length > 0).length;
        const expansionRatio = parseFloat((transformedLength / opts.originalLength).toFixed(2));
        const elapsedTime = Date.now() - opts.startTime;
        let formattedTime = '';
        if (elapsedTime < 1000) {
            formattedTime = `${elapsedTime}ms`;
        }
        else if (elapsedTime < 60000) {
            formattedTime = `${(elapsedTime / 1000).toFixed(2)}s`;
        }
        else {
            const minutes = Math.floor(elapsedTime / 60000);
            const seconds = ((elapsedTime % 60000) / 1000).toFixed(1);
            formattedTime = `${minutes}m ${seconds}s`;
        }
        const panel = vscode.window.createWebviewPanel('transformStats', 'Prompt Transformation Stats', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'images', 'icon.png'));
        panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Transformation Statistics</title>
        <meta name="color-scheme" content="dark light">
        <style>
          body {
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif);
            background: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #d4d4d4);
            margin: 0;
            padding: 2em 2.5em 5em;
            line-height: 1.5;
            font-size: 14px;
          }
          .stats-container {
            background: var(--vscode-editorWidget-background, #252526);
            border-radius: 8px;
            padding: 1.5em;
            margin-bottom: 1em;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .stats-header {
            font-size: 1.5em;
            margin-bottom: 15px;
            color: var(--vscode-editor-foreground, #e6e6e6);
            border-bottom: 1px solid var(--vscode-editorWidget-border, #444);
            padding-bottom: 10px;
          }
          .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-editorWidget-border, #333);
          }
          .stat-label {
            font-weight: bold;
            color: var(--vscode-textLink-foreground, #9cdcfe);
          }
          .stat-value {
            color: var(--vscode-charts-orange, #ce9178);
          }
          .improvement {
            color: var(--vscode-charts-green, #6A9955);
          }
          .summary {
            margin-top: 20px;
            padding: 15px;
            background: var(--vscode-editor-selectionBackground, #2d2d2d);
            border-radius: 6px;
            border-left: 4px solid var(--vscode-textLink-foreground, #9cdcfe);
          }
        </style>
      </head>
      <body>
        <div class="stats-container">
          <div class="stats-header">Prompt Transformation Statistics</div>
          <div class="stat-row">
            <span class="stat-label">Original Length:</span>
            <span class="stat-value">${opts.originalLength} characters</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Transformed Length:</span>
            <span class="stat-value">${transformedLength} characters</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Original Word Count:</span>
            <span class="stat-value">${opts.originalWords} words</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Transformed Word Count:</span>
            <span class="stat-value">${transformedWords} words</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Expansion Ratio:</span>
            <span class="stat-value">${expansionRatio}x</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Processing Time:</span>
            <span class="stat-value">${formattedTime}</span>
          </div>
          <div class="summary">
            Your prompt was expanded by ${Math.round((expansionRatio - 1) * 100)}% with structured tags and detailed instructions.
          </div>
        </div>
      </body>
      </html>
    `;
    }
    catch (err) {
        outputChannel.appendLine(`[Reprompt] Error showing stats: ${err}`);
    }
}
/**
 * Executes the "Run with Sonar" command, which processes the selected text or
 * entire document in the active editor using the Sonar API. Displays progress
 * notifications and handles errors gracefully with themed messages.
 *
 * The function performs the following actions:
 * - Verifies the presence of an active text editor and a valid prompt.
 * - Retrieves the API key and validates the file type.
 * - Chooses a random theme for the progress messages.
 * - Sends the prompt to the Sonar API and processes the response.
 * - Measures and logs the elapsed time for the API call.
 * - Creates a webview panel to display the response, and sets up message handling.
 * - Handles network errors and timeouts with user-friendly messages.
 *
 * @param context - The VS Code extension context.
 */
async function runWithSonar(context) {
    outputChannel.appendLine('Run with Sonar command triggered');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        outputChannel.appendLine('No active editor found');
        return;
    }
    if (!isPromptFile(editor.document)) {
        vscode.window.showErrorMessage('Reprompt only works on .md, .prompt.md, .reprompt, .reprompt.md, .cursor.md, or copilot-instructions.md files.');
        return;
    }
    const selection = editor.selection;
    const prompt = editor.document.getText(selection) || editor.document.getText();
    if (!prompt) {
        vscode.window.showErrorMessage('No prompt found.');
        return;
    }
    const apiKey = vscode.workspace.getConfiguration().get('reprompt.sonarApiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.');
        return;
    }
    const sonarModel = getSonarModel();
    const searchContextSize = getSonarSearchContextSize();
    // Start timing the process
    const startTime = Date.now();
    // Select a random theme for this operation
    const theme = getRandomTheme();
    outputChannel.appendLine(`[Reprompt] Using theme with first message: ${theme.preparing}`);
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Running prompt with Sonar...',
            cancellable: false
        }, async (progress) => {
            // Initial progress
            progress.report({ message: theme.preparing });
            await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
            // Sending request
            progress.report({ message: theme.sending });
            outputChannel.appendLine('Sending request to Sonar API...');
            let result;
            try {
                // Pass model and searchContextSize to runWithSonarApi
                result = await (0, sonar_1.runWithSonarApi)(prompt, apiKey, sonarModel, searchContextSize);
            }
            catch (err) {
                // Handle network errors and timeouts with a fun message
                let msg = String(err && err.message ? err.message : err);
                if (msg.includes('ENOTFOUND') ||
                    msg.includes('getaddrinfo') ||
                    msg.includes('Failed to fetch') ||
                    msg.includes('network') ||
                    msg.includes('timeout') ||
                    msg.includes('magical nap')) {
                    msg =
                        "🦄 Oops! The AI couldn't reach the cloud (network error or timeout). " +
                            "Check your internet connection, try again, or give the unicorns a little break! 🦄";
                }
                outputChannel.appendLine(`[Reprompt] Network/Timeout error: ${msg}`);
                vscode.window.showErrorMessage(msg);
                throw new Error(msg);
            }
            outputChannel.appendLine('Received response from Sonar API.');
            // Calculate elapsed time
            const elapsedTime = Date.now() - startTime;
            // Add elapsed time to the result object
            result.elapsedTime = elapsedTime;
            // Processing response
            progress.report({ message: theme.processing });
            await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
            // Creating webview
            progress.report({ message: theme.applying });
            outputChannel.appendLine('Creating webview panel...');
            const panel = vscode.window.createWebviewPanel('sonarResponse', 'Sonar Response', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'images', 'icon.png'));
            // Set initial HTML and attach message handler
            setupSonarWebview(panel, prompt, apiKey, context, result, theme);
            // Debug: Log when webview is created
            outputChannel.appendLine('Webview panel created and HTML set.');
            // Done
            progress.report({ message: theme.highlighting });
            progress.report({ message: theme.completed });
        });
    }
    catch (err) {
        // Only show a fun message if not already shown
        let msg = String(err && err.message ? err.message : err);
        if (msg.includes('ENOTFOUND') ||
            msg.includes('getaddrinfo') ||
            msg.includes('Failed to fetch') ||
            msg.includes('network') ||
            msg.includes('timeout') ||
            msg.includes('magical nap')) {
            msg =
                "🦄 Oops! The AI couldn't reach the cloud (network error or timeout). " +
                    "Check your internet connection, try again, or give the unicorns a little break! 🦄";
        }
        outputChannel.appendLine(`[Reprompt] Run with Sonar error: ${msg}`);
        vscode.window.showErrorMessage(msg);
    }
}
/**
 * Sets up a webview panel with an HTML string rendered from a Sonar response
 * and a message handler that listens for regenerate commands from the webview.
 * @param {vscode.WebviewPanel} panel - The webview panel to set up.
 * @param {string} prompt - The original prompt used to generate the response.
 * @param {string} apiKey - The Sonar API key to use for regeneration.
 * @param {vscode.ExtensionContext} context - The extension context.
 * @param {any} [result] - The Sonar response object to render in the webview.
 * @param {any} [theme] - An object with themed message strings for the regeneration process.
 */
function setupSonarWebview(panel, prompt, apiKey, context, result, theme) {
    // Clean up any existing handler for this panel
    if (panelMessageHandlers.has(panel)) {
        panelMessageHandlers.delete(panel);
    }
    // Create a new message handler for this panel
    const messageHandler = async (message) => {
        console.log('Webview message received:', message);
        outputChannel.appendLine(`[Reprompt] [Webview] Received message: ${JSON.stringify(message)}`);
        // outputChannel.show(true);
        if (message.command === 'regenerate') {
            // vscode.window.showInformationMessage('Regenerating response...');
            outputChannel.appendLine(`[Reprompt] [Webview] Regenerate command received for messageId: ${message.messageId}`);
            // Show progress notification for regeneration
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Regenerating response...',
                cancellable: false
            }, async (regProgress) => {
                // Use themed progress messages if available
                if (theme)
                    regProgress.report({ message: theme.preparing || 'Preparing...' });
                await new Promise(resolve => setTimeout(resolve, 200));
                if (theme)
                    regProgress.report({ message: theme.sending || 'Sending...' });
                await new Promise(resolve => setTimeout(resolve, 200));
                try {
                    outputChannel.appendLine('[Regenerate] Sending request to Sonar API...');
                    const regenStartTime = Date.now();
                    const newResult = await (0, sonar_1.runWithSonarApi)(prompt, apiKey);
                    const regenElapsedTime = Date.now() - regenStartTime;
                    newResult.elapsedTime = regenElapsedTime;
                    outputChannel.appendLine('[Regenerate] Received response from Sonar API.');
                    if (theme)
                        regProgress.report({ message: theme.processing || 'Processing...' });
                    await new Promise(resolve => setTimeout(resolve, 200));
                    regProgress.report({ message: 'Updating view...' });
                    // Update the webview with new content
                    panel.webview.html = renderSonarWebview(newResult);
                    outputChannel.appendLine('[Regenerate] Webview updated with new content.');
                    if (theme)
                        regProgress.report({ message: theme.completed || 'Done!' });
                    // Show success message
                    vscode.window.showInformationMessage('Response regenerated successfully!');
                    outputChannel.appendLine('[Regenerate] Regeneration completed successfully.');
                }
                catch (err) {
                    vscode.window.showErrorMessage('Regeneration failed: ' + err.message);
                    outputChannel.appendLine(`[Reprompt] [Regenerate] Error: ${err.message}`);
                }
            });
        }
    };
    // Set the HTML content for the webview
    if (result) {
        outputChannel.appendLine('[Webview] Setting HTML for panel');
        panel.webview.html = renderSonarWebview(result);
    }
    // Store the message handler reference
    panelMessageHandlers.set(panel, messageHandler);
    // Register the message handler
    outputChannel.appendLine('[Webview] Registering onDidReceiveMessage handler');
    panel.webview.onDidReceiveMessage(messageHandler, null, context.subscriptions);
    // Clean up when the panel is disposed
    panel.onDidDispose(() => {
        outputChannel.appendLine('[Webview] Panel disposed, cleaning up message handler');
        panelMessageHandlers.delete(panel);
    }, null, context.subscriptions);
}
/**
 * Highlights XML tags in a given text within a VSCode editor.
 *
 * This function searches for specific XML tags such as <context>, <instruction>,
 * <examples>, and <format> within the provided text and visually highlights them
 * by applying a temporary background and border decoration in the editor.
 * The highlighting lasts for 3 seconds before being automatically removed.
 *
 * @param editor - The VSCode text editor instance where the decorations will be applied.
 * @param start - The starting position in the editor from where the text is being analyzed.
 * @param text - The text content in which the XML tags are searched and highlighted.
 */
function highlightXmlTags(editor, start, text) {
    const tagRegex = /<(context|instruction|examples|format)>.*?<\/\1>/gs;
    const decorations = [];
    let match;
    let offset = 0;
    while ((match = tagRegex.exec(text))) {
        const tagStart = match.index;
        const tagEnd = tagStart + match[0].length;
        const range = new vscode.Range(start.translate(0, tagStart), start.translate(0, tagEnd));
        decorations.push({ range });
        offset = tagEnd;
    }
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,255,0,0.2)',
        border: '1px solid orange'
    });
    editor.setDecorations(decorationType, decorations);
    setTimeout(() => decorationType.dispose(), 3000);
}
/**
 * Escapes HTML special characters in a given string, replacing them with
 * their corresponding HTML entities:
 * - `&` becomes `&amp;`
 * - `<` becomes `&lt;`
 * - `>` becomes `&gt;`
 *
 * @param {string} text - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
/**
 * Syntax-highlights a given JSON string by wrapping each value in a `<span>`
 * element with an appropriate class. The classes are:
 *
 * - `number`: for numbers
 * - `string`: for strings
 * - `key`: for object keys
 * - `boolean`: for booleans
 * - `null`: for null values
 *
 * @param {string} json - The JSON string to syntax-highlight.
 * @returns {string} The syntax-highlighted string.
 */
function syntaxHighlight(json) {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'number';
        if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'key' : 'string';
        }
        else if (/true|false/.test(match)) {
            cls = 'boolean';
        }
        else if (/null/.test(match)) {
            cls = 'null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}
/**
 * Renders an HTML string for a Sonar response webview.
 * @param {any} result - The Sonar response to render.
 * @returns {string} The rendered HTML string.
 */
function renderSonarWebview(result) {
    // Extract the main message content
    const content = result?.choices?.[0]?.message?.content || '(No response)';
    const model = result?.model || '';
    const usage = result?.usage || {};
    const citations = Array.isArray(result?.citations) ? result.citations : [];
    const sourcesCount = citations.length;
    const sourcesText = sourcesCount ? `${sourcesCount} Sources` : 'No Sources';
    const messageId = 'msg-' + Date.now();
    // Get elapsed time from result object
    const elapsedTime = result?.elapsedTime || 0;
    // Format elapsed time
    let formattedTime = '';
    if (elapsedTime < 1000) {
        formattedTime = `${elapsedTime}ms`;
    }
    else if (elapsedTime < 60000) {
        formattedTime = `${(elapsedTime / 1000).toFixed(2)}s`;
    }
    else {
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = ((elapsedTime % 60000) / 1000).toFixed(1);
        formattedTime = `${minutes}m ${seconds}s`;
    }
    // Process content to handle markdown-like formatting
    let processedContent = content;
    // Convert markdown code blocks to HTML
    processedContent = processedContent.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const codeId = `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return `<div class="code-block">
        <div class="code-header">
          <span class="lang-label">${lang || ''}</span>
          <div class="code-actions">
            <button class="copy-btn" onclick="copyCode('${codeId}')">Copy</button>
          </div>
        </div>
        <pre id="${codeId}"><code>${escapeHtml(code.trim())}</code></pre>
      </div>`;
    });
    // Convert inline code
    processedContent = processedContent.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Convert headers
    processedContent = processedContent.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    processedContent = processedContent.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    processedContent = processedContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    // Convert bullet points
    processedContent = processedContent.replace(/^- (.*$)/gm, '<li>$1</li>');
    processedContent = processedContent.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
    // Convert numbered lists
    processedContent = processedContent.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    processedContent = processedContent.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ol>${match}</ol>`);
    // Convert paragraphs (lines separated by two newlines)
    processedContent = processedContent.replace(/\n\n([^<].*?)\n\n/g, '<p>$1</p>\n\n');
    // Make links clickable
    processedContent = processedContent.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    // Explanation block
    const explanationBlock = `<div class="explanation-block">
    ${processedContent}
  </div>`;
    // Action buttons
    const actionButtons = `<div class="action-buttons">
    <button class="action-button refresh-btn" onclick="regenerateResponse('${messageId}')">
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M13.5 2.5a.5.5 0 0 0-.5.5v1.6A6.5 6.5 0 1 0 12.84 12a.75.75 0 1 0-1.08-1.04A5 5 0 1 1 11 4.6V6a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-2z"/>
      </svg>
      Regenerate
    </button>
    <button class="action-button sources-btn" onclick="toggleSources()">
      <span class="sources-count">${sourcesText}</span>
    </button>
  </div>`;
    // Sources section
    const sourcesSection = citations.length ? `<div class="sources-panel" id="sources-panel" style="display: none;">
    <h3>Sources</h3>
    <ul class="sources-list">
      ${citations.map((source) => `<li><a href="${source}" target="_blank">${source}</a></li>`).join('')}
    </ul>
  </div>` : '';
    // Stats for the footer
    const statsFooter = [
        model ? `<span class="stat-item"><b>Model:</b> ${model}</span>` : '',
        usage.prompt_tokens !== undefined ? `<span class="stat-item"><b>Prompt:</b> ${usage.prompt_tokens} tokens</span>` : '',
        usage.completion_tokens !== undefined ? `<span class="stat-item"><b>Completion:</b> ${usage.completion_tokens} tokens</span>` : '',
        usage.total_tokens !== undefined ? `<span class="stat-item"><b>Total:</b> ${usage.total_tokens} tokens</span>` : '',
        `<span class="stat-item"><b>Time:</b> ${formattedTime}</span>` // Add the elapsed time
    ].filter(Boolean).join('');
    // Complete HTML for the webview
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sonar Response</title>
    <style>
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-editor-foreground);
        background-color: var(--vscode-editor-background);
        padding: 15px;
        line-height: 1.5;
        margin: 0;
        font-size: 14px;
      }
      h1, h2, h3 {
        color: var(--vscode-editorWidget-foreground);
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
      }
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      p {
        margin-top: 0;
        margin-bottom: 16px;
      }
      code {
        font-family: var(--vscode-editor-font-family);
        background-color: transparent;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 85%;
      }
      .code-block {
        background-color: var(--vscode-editor-inactiveSelectionBackground);
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 6px;
        margin: 16px 0;
        overflow: hidden;
      }
      .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: var(--vscode-editorWidget-background);
        border-bottom: 1px solid var(--vscode-editorWidget-border);
      }
      .lang-label {
        font-family: var(--vscode-font-family);
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
      }
      .code-actions {
        display: flex;
        gap: 8px;
      }
      .code-block pre {
        margin: 0;
        padding: 12px;
        overflow: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
      }
      .copy-btn {
        padding: 2px 8px;
        font-size: 12px;
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .copy-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
      ul, ol {
        margin-top: 0;
        margin-bottom: 16px;
        padding-left: 2em;
      }
      li {
        margin-bottom: 4px;
      }
      a {
        color: var(--vscode-textLink-foreground);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .response-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .explanation-block {
        background-color: var(--vscode-editor-background);
        margin-bottom: 0;
        padding: 0.6em 0.3em 0em 1.2em;
        overflow-wrap: break-word;
      }
      .controls {
        margin: 1em 0 6em;
        padding: 0.5em 0.3em 0em 1.2em;
        background-color: transparent;
        border-top: 1.5px solid var(--vscode-editorWidget-border);
      }
      .action-buttons {
        display: flex;
        gap: 8px;
        margin-top: 1em;
        background-color: transparent;
      }
      .action-button {
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background-color 0.2s;
      }
      .refresh-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }
      .refresh-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
      .sources-btn:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
      }
      .sources-panel {
        background-color: var(--vscode-editorWidget-background);
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }
      .sources-panel h3 {
        margin-top: 0;
        margin-bottom: 10px;
      }
      .sources-list {
        max-height: 275px;
        overflow-y: auto;
      }
      .sources-count {
        font-size: 13px;
      }
      .stats {
        background: var(--vscode-editorWidget-background, #252526);
        color: var(--vscode-editorWidget-foreground, #d4d4d4);
        padding: 0.7em 2em;
        border-top: 1px solid var(--vscode-editorWidget-border, #3e3e3e);
        font-size: 0.9em;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .stat-item {
        margin-right: 1.5em;
      }
    </style>
  </head>
  <body>
    <div class="response-container" id="${messageId}">
      ${explanationBlock}
    </div>

    <div class="controls">
      ${actionButtons}
      ${sourcesSection}
    </div>

    <div class="stats">
      <div class="stats-items">
        ${statsFooter}
      </div>
    </div>

    <script>
      // initialize the VS Code API
      const vscode = acquireVsCodeApi();

      // Function to trigger regeneration via VS Code API
      function regenerateResponse(messageId) {
        // Notify VS Code extension that we want to regenerate
        vscode.postMessage({
          command: 'regenerate',
          messageId: messageId
        });
        console.log('Posted message: regenerate', messageId);
        
        // Show loading state
        // const button = document.querySelector('.refresh-btn');
        // if (button) {
        //   const originalText = button.innerHTML;
        //   button.innerHTML = '<span>Regenerating...</span>';
        //   button.disabled = true;
          
        //   // Reset button state after timeout (in case we don't get a response)
        //   setTimeout(() => {
        //     if (button.disabled) {
        //       button.innerHTML = originalText;
        //       button.disabled = false;
        //     }
        //   }, 30000); // 30 second timeout
        // }
      }

      // Function to copy code to clipboard
      function copyCode(id) {
        const codeElement = document.getElementById(id);
        const codeText = codeElement.textContent;
        
        navigator.clipboard.writeText(codeText).then(() => {
          const button = codeElement.parentElement.querySelector('.copy-btn');
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy code: ', err);
        });
      }

      // Function to toggle sources panel visibility
      function toggleSources() {
        const sourcesPanel = document.getElementById('sources-panel');
        if (sourcesPanel) {
          const isVisible = sourcesPanel.style.display !== 'none';
          sourcesPanel.style.display = isVisible ? 'none' : 'block';
        }
      }
    </script>
  </body>
  </html>`;
}
/**
 * Returns true if the given document is a prompt file, false otherwise.
 *
 * Currently, prompt files are any of the following:
 * - Files with the extension `.md`
 * - Files with the extension `.prompt.md`
 * - Files with the extension `.reprompt`
 * - Files with the extension `.reprompt.md`
 * - Files with the extension `.cursor.md`
 * - Files named `copilot-instructions.md`
 * - Files named `.rpmt.md`
 */
function isPromptFile(document) {
    const name = document.fileName.toLowerCase();
    return (name.endsWith('.md') ||
        name.endsWith('.prompt.md') ||
        name.endsWith('.reprompt') ||
        name.endsWith('.reprompt.md') ||
        name.endsWith('.cursor.md') ||
        name.endsWith('copilot-instructions.md') ||
        name.endsWith('.rpmt.md'));
}
/**
 * Generates examples for the current instruction (or selection if no instruction
 * is present) using Sonar.
 *
 * This function is called when the user triggers the "Generate Examples" command.
 *
 * It will ask the user how many examples to generate if the
 * `reprompt.examplesAskEachTime` configuration is set to `true`. Otherwise, it
 * will use the value set in `reprompt.examplesDefaultCount` (defaulting to 3 if
 * not set).
 *
 * The instruction can be specified in three ways (in order of precedence):
 * - The user can select some text in the editor, which will be used as the
 *   instruction.
 * - The instruction can be specified inside `<instruction>...</instruction>` tags
 *   in the selection or document.
 * - If neither of the above is present, the whole document will be used as the
 *   instruction.
 *
 * The function will then call the `generateExamplesWithSonar` function to
 * generate the examples using Sonar.
 *
 * If Sonar returns an error, the function will show an error message to the user.
 *
 * If Sonar returns successfully, the function will insert the generated examples
 * into the document inside `<examples>...</examples>` tags, either replacing an
 * existing block or inserting a new one.
 *
 * @param context - The VS Code extension context.
 */
async function generateExamples(context) {
    // Always show the output channel for debugging
    outputChannel.show(true);
    outputChannel.appendLine('Generate Examples command triggered');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        outputChannel.appendLine('No active editor found');
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    if (!isPromptFile(editor.document)) {
        outputChannel.appendLine('File is not a supported prompt file.');
        vscode.window.showErrorMessage('Reprompt only works on .md, .prompt.md, .reprompt, .reprompt.md, .cursor.md, or copilot-instructions.md files.');
        return;
    }
    const askEachTime = vscode.workspace.getConfiguration().get('reprompt.examplesAskEachTime');
    let numExamples = vscode.workspace.getConfiguration().get('reprompt.examplesDefaultCount') || 3;
    outputChannel.appendLine(`[Reprompt] askEachTime: ${askEachTime}, numExamples: ${numExamples}`);
    if (askEachTime) {
        const input = await vscode.window.showInputBox({
            prompt: 'How many examples do you want to generate?',
            value: numExamples.toString(),
            validateInput: (val) => {
                const n = Number(val);
                if (!Number.isInteger(n) || n < 1 || n > 10)
                    return 'Enter a number between 1 and 10';
                return null;
            }
        });
        if (!input) {
            outputChannel.appendLine('User cancelled example count input.');
            return;
        }
        numExamples = Number(input);
        outputChannel.appendLine(`[Reprompt] User entered numExamples: ${numExamples}`);
    }
    // Try to extract <instruction> content if present, else use selection or whole document
    let instruction = '';
    if (!editor.selection.isEmpty) {
        instruction = editor.document.getText(editor.selection).trim();
        outputChannel.appendLine('Using selection as instruction.');
    }
    if (!instruction) {
        // Try to extract from <instruction> tag in selection or document
        const selectionText = editor.document.getText(editor.selection);
        const docText = editor.document.getText();
        let match = selectionText.match(/<instruction>([\s\S]*?)<\/instruction>/i);
        if (!match)
            match = docText.match(/<instruction>([\s\S]*?)<\/instruction>/i);
        if (match) {
            instruction = match[1].trim();
            outputChannel.appendLine('Extracted instruction from <instruction> tag.');
        }
        else {
            // fallback: use whole document
            instruction = docText.trim();
            outputChannel.appendLine('Using whole document as instruction.');
        }
    }
    if (!instruction) {
        vscode.window.showErrorMessage('No instruction found to generate examples for.');
        outputChannel.appendLine('No instruction found to generate examples for.');
        return;
    }
    const apiKey = vscode.workspace.getConfiguration().get('reprompt.sonarApiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.');
        outputChannel.appendLine('No API key set.');
        return;
    }
    const sonarModel = getSonarModel();
    const searchContextSize = getSonarSearchContextSize();
    outputChannel.appendLine(`[Reprompt] About to call Sonar for examples: numExamples=${numExamples}, model=${sonarModel}, contextSize=${searchContextSize}`);
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating examples with Sonar...',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Contacting Sonar...' });
            outputChannel.appendLine(`[Reprompt] Requesting ${numExamples} examples from Sonar...`);
            let content = undefined;
            try {
                content = await (0, sonar_1.generateExamplesWithSonar)(instruction, numExamples, apiKey, sonarModel, searchContextSize);
            }
            catch (err) {
                outputChannel.appendLine('Sonar API error: ' + (err?.message || err));
                vscode.window.showErrorMessage('Failed to contact Sonar API: ' + (err?.message || err));
                return;
            }
            outputChannel.appendLine('Sonar response: ' + (content || '[empty]'));
            if (!content) {
                vscode.window.showErrorMessage('No examples generated.');
                outputChannel.appendLine('No examples generated.');
                return;
            }
            // Format as <examples>...</examples>
            let examplesBlock = content;
            // If not already in <examples> tags, wrap it
            if (!/^<examples>[\s\S]*<\/examples>$/i.test(content)) {
                examplesBlock = `<examples>\n${content}\n</examples>`;
            }
            // Insert or replace <examples> in the document
            await editor.edit(editBuilder => {
                const doc = editor.document;
                const text = doc.getText();
                const examplesRegex = /<examples>[\s\S]*?<\/examples>/i;
                if (examplesRegex.test(text)) {
                    // Replace existing <examples> block
                    const match = examplesRegex.exec(text);
                    const start = doc.positionAt(match.index);
                    const end = doc.positionAt(match.index + match[0].length);
                    editBuilder.replace(new vscode.Range(start, end), examplesBlock);
                    outputChannel.appendLine('Replaced existing <examples> block.');
                }
                else {
                    // Insert after </instruction> if present, else at end
                    const instructionClose = text.match(/<\/instruction>/i);
                    if (instructionClose) {
                        const insertPos = doc.positionAt(instructionClose.index + instructionClose[0].length);
                        editBuilder.insert(insertPos, '\n' + examplesBlock + '\n');
                        outputChannel.appendLine('Inserted <examples> block after </instruction>.');
                    }
                    else {
                        // Insert at end
                        editBuilder.insert(doc.lineAt(doc.lineCount - 1).range.end, '\n' + examplesBlock + '\n');
                        outputChannel.appendLine('Inserted <examples> block at end of document.');
                    }
                }
            });
            vscode.window.showInformationMessage(`Inserted ${numExamples} example(s) into <examples> block.`);
            outputChannel.appendLine(`[Reprompt] Inserted ${numExamples} example(s) into <examples> block.`);
        });
    }
    catch (err) {
        outputChannel.appendLine(`[Reprompt] Generate Examples error: ${err?.message || err}`);
        vscode.window.showErrorMessage('Failed to generate examples: ' + (err?.message || err));
    }
}
/**
 * Evaluate the quality of a prompt and return a score and suggestions.
 * @param text The prompt text to evaluate.
 * @returns An object with the following properties:
 *   - score: A number from 0 to 5 indicating the prompt's quality.
 *   - max: The maximum possible score (5).
 *   - details: An array of strings explaining why the prompt received its score.
 *   - suggestions: An array of strings suggesting how to improve the prompt.
 */
function scorePrompt(text) {
    let score = 0;
    let max = 5;
    const details = [];
    const suggestions = [];
    // 1. <context> tag present
    if (/<context>[\s\S]*?<\/context>/i.test(text)) {
        score++;
        details.push('Has <context> section.');
    }
    else {
        suggestions.push('Add a <context> section.');
    }
    // 2. <instruction> tag present
    if (/<instruction>[\s\S]*?<\/instruction>/i.test(text)) {
        score++;
        details.push('Has <instruction> section.');
    }
    else {
        suggestions.push('Add an <instruction> section.');
    }
    // 3. <examples> tag present
    if (/<examples>[\s\S]*?<\/examples>/i.test(text)) {
        score++;
        details.push('Has <examples> section.');
    }
    else {
        suggestions.push('Add an <examples> section.');
    }
    // 4. Length within 200–2000 chars
    if (text.length >= 200 && text.length <= 2000) {
        score++;
        details.push('Length is within recommended bounds.');
    }
    else {
        suggestions.push('Keep prompt length between 200 and 2000 characters.');
    }
    // 5. Uses action verbs (simple heuristic)
    if (/\b(create|build|implement|add|remove|update|validate|test|generate|refactor|design|write)\b/i.test(text)) {
        score++;
        details.push('Uses action verbs.');
    }
    else {
        suggestions.push('Use action verbs in your instructions.');
    }
    return { score, max, details, suggestions };
}
/**
 * Returns the text of the prompt currently in the active editor. If no text is
 * selected, the entire document text is returned. If no editor is active, an
 * empty string is returned.
 * @returns {string}
 */
function getCurrentPromptText() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return '';
    const sel = editor.selection;
    return !sel.isEmpty ? editor.document.getText(sel) : editor.document.getText();
}
/**
 * Updates the status bar with the prompt quality score for the currently
 * active editor. If no editor is active or the current document is not a
 * prompt file, the status bar is hidden. The score is calculated based on
 * the prompt text, and the status bar is updated with the score and a
 * tooltip providing more details. If the score is below a certain threshold,
 * the status bar background changes color to indicate a low score, and a
 * quick-fix suggestion message is displayed.
 */
function updatePromptScoreStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isPromptFile(editor.document)) {
        promptScoreStatusBar.hide();
        return;
    }
    const text = getCurrentPromptText();
    if (!text.trim()) {
        promptScoreStatusBar.hide();
        return;
    }
    const { score, max } = scorePrompt(text);
    promptScoreStatusBar.text = `$(star) Prompt Score: ${score}/${max}`;
    promptScoreStatusBar.tooltip = 'Click for prompt quality details and suggestions';
    promptScoreStatusBar.show();
    // Quick-fix suggestion if score is low
    if (score < 3) {
        promptScoreStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        vscode.window.setStatusBarMessage('Prompt quality is low. Click the score for suggestions.', 3000);
    }
    else {
        promptScoreStatusBar.backgroundColor = undefined;
    }
}
/**
 * Shows a modal information message with the prompt quality score details and suggestions
 * for the currently selected or edited prompt.
 *
 * @returns A promise that resolves when the information message is closed.
 */
async function showPromptScoreDetails() {
    const text = getCurrentPromptText();
    if (!text.trim()) {
        vscode.window.showInformationMessage('No prompt found to score.');
        return;
    }
    const { score, max, details, suggestions } = scorePrompt(text);
    const msg = [
        `Prompt Score: ${score}/${max}`,
        '',
        ...details.map(d => `• ${d}`),
        ...(suggestions.length ? ['', 'Suggestions:', ...suggestions.map(s => `- ${s}`)] : [])
    ].join('\n');
    vscode.window.showInformationMessage(msg, { modal: true });
}
/**
 * Loads user-defined prompt rules from the workspace's root directory.
 *
 * This function searches for files with specific extensions (.rprmt.md, .rprmt.json, .rprmt.yaml, .rprmt.yml)
 * in the root of the current workspace. If a matching file is found, it reads and parses the content
 * based on the file type:
 * - Markdown files (.md) are read as plain text.
 * - JSON files (.json) are parsed into key-value pairs.
 * - YAML files (.yaml, .yml) are parsed into key-value pairs.
 *
 * The parsed content is stored in `userPromptRules`. If no rule file is found or parsing fails,
 * `userPromptRules` is set to null. The function logs the loading status to the output channel.
 *
 * @returns A promise that resolves when the loading process is complete.
 */
async function loadUserPromptRules1() {
    outputChannel.appendLine('Looking for and loading user prompt rules...');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        outputChannel.appendLine('No workspace folder found.');
        userPromptRules = null;
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const ruleFiles = [
        '.rprmt.md',
        '.rprmt.json',
        '.rprmt.yaml',
        '.rprmt.yml'
    ];
    for (const file of ruleFiles) {
        const filePath = path.join(rootPath, file);
        outputChannel.appendLine(`Checking for rule file: ${file}`);
        if (fs.existsSync(filePath)) {
            try {
                outputChannel.appendLine(`Found rule file: ${file}`);
                const content = await readFileAsync(filePath, 'utf8');
                if (file.endsWith('.md')) {
                    userPromptRules = content.trim();
                    outputChannel.appendLine(`[Reprompt] Loaded user prompt rules from Markdown file: ${file}`);
                }
                else if (file.endsWith('.json')) {
                    const obj = JSON.parse(content);
                    userPromptRules = Object.entries(obj)
                        .map(([k, v]) => `• ${k}: ${v}`)
                        .join('\n');
                    outputChannel.appendLine(`[Reprompt] Loaded user prompt rules from JSON file: ${file}`);
                }
                else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const obj = yaml.load(content);
                    if (typeof obj === 'object' && obj !== null) {
                        userPromptRules = Object.entries(obj)
                            .map(([k, v]) => `• ${k}: ${v}`)
                            .join('\n');
                        outputChannel.appendLine(`[Reprompt] Loaded user prompt rules from YAML file: ${file}`);
                    }
                    else {
                        userPromptRules = content.trim();
                    }
                }
                outputChannel.appendLine(`[Reprompt] Loaded user prompt rules from successfully`);
                return;
            }
            catch (err) {
                outputChannel.appendLine(`[Reprompt] Failed to parse ${file}: ${err}`);
                vscode.window.showWarningMessage(`Reprompt: Failed to parse ${file}: ${err}`);
            }
        }
    }
    userPromptRules = null;
}
async function loadUserPromptRules() {
    outputChannel.appendLine('Looking for and loading user prompt rules...');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        outputChannel.appendLine('No workspace folder found.');
        userPromptRules = null;
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    // Get all files in the workspace root
    try {
        const files = await fs.promises.readdir(rootPath);
        // Filter for files containing .rprmt. in their name
        const ruleFiles = files.filter(file => file.includes('.rpmt.'));
        outputChannel.appendLine(`Found ${ruleFiles.length} potential rule files: ${ruleFiles.join(', ')}`);
        for (const file of ruleFiles) {
            const filePath = path.join(rootPath, file);
            outputChannel.appendLine(`Checking rule file: ${file}`);
            if (!file.endsWith('.rpmt.md') && !file.endsWith('.rpmt.json') && !file.endsWith('.rpmt.yaml') && !file.endsWith('.rpmt.yml')) {
                outputChannel.appendLine(`Skipping unsupported file type: ${file}`);
                continue;
            }
            try {
                const stats = await fs.promises.stat(filePath);
                if (!stats.isFile()) {
                    outputChannel.appendLine(`Skipping non-file: ${file}`);
                    continue;
                }
                outputChannel.appendLine(`Found rule file: ${file}`);
                const content = await fs.promises.readFile(filePath, 'utf8');
                if (file.endsWith('.md')) {
                    userPromptRules = content.trim();
                    outputChannel.appendLine(`[Reprompt] Loaded user prompt rules from Markdown file: ${file}`);
                }
                else if (file.endsWith('.json')) {
                    const obj = JSON.parse(content);
                    userPromptRules = Object.entries(obj)
                        .map(([k, v]) => `• ${k}: ${v}`)
                        .join('\n');
                    outputChannel.appendLine(`[Reprompt] Loaded user prompt rules from JSON file: ${file}`);
                }
                else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const obj = yaml.load(content);
                    if (typeof obj === 'object' && obj !== null) {
                        userPromptRules = Object.entries(obj)
                            .map(([k, v]) => `• ${k}: ${v}`)
                            .join('\n');
                        outputChannel.appendLine(`[Reprompt] Loaded user prompt rules from YAML file: ${file}`);
                    }
                    else {
                        userPromptRules = content.trim();
                    }
                }
                else {
                    outputChannel.appendLine(`[Reprompt] Skipping unsupported file type: ${file}`);
                    continue;
                }
                outputChannel.appendLine(`[Reprompt] Loaded user prompt rules successfully`);
                return;
            }
            catch (err) {
                outputChannel.appendLine(`[Reprompt] Failed to parse ${file}: ${err}`);
                vscode.window.showWarningMessage(`Reprompt: Failed to parse ${file}: ${err}`);
            }
        }
        outputChannel.appendLine('No valid rule files found.');
        userPromptRules = null;
    }
    catch (err) {
        outputChannel.appendLine(`Error reading workspace directory: ${err}`);
        userPromptRules = null;
    }
}
//# sourceMappingURL=extension.js.map