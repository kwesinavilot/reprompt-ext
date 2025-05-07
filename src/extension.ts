import * as vscode from 'vscode';
import { optimizeWithSonar, runWithSonarApi } from './sonar';

interface CodeBlockMatch {
  _: string;
  lang: string;
  code: string;
}

interface CodeBlockHtml {
  codeId: string;
  html: string;
}

const outputChannel = vscode.window.createOutputChannel('Reprompt');

export function activate(context: vscode.ExtensionContext) {
  outputChannel.appendLine('Reprompt extension activated');

  context.subscriptions.push(
    vscode.commands.registerCommand('reprompt.optimize', transformPrompt),
    vscode.commands.registerCommand('reprompt.runSonar', () => runWithSonar(context)),
    outputChannel,
    vscode.commands.registerCommand('reprompt.test', () => {
      outputChannel.show();
      outputChannel.appendLine('Test command executed successfully');
      vscode.window.showInformationMessage('Reprompt test command works!');
    })
  );
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

// Function to get a random theme
function getRandomTheme() {
  const randomIndex = Math.floor(Math.random() * progressThemes.length);
  return progressThemes[randomIndex];
}

async function transformPrompt() {
  outputChannel.appendLine('Transform prompt command triggered');
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    outputChannel.appendLine('No active editor found');
    return;
  }
  const selection = editor.selection;
  const raw = editor.document.getText(selection);
  if (!raw) { vscode.window.showErrorMessage('No text selected.'); return; }

  const apiKey = vscode.workspace.getConfiguration().get<string>('reprompt.sonarApiKey');
  if (!apiKey) { vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.'); return; }

  // Select a random theme for this operation
  const theme = getRandomTheme();
  outputChannel.appendLine(`Using theme with first message: ${theme.preparing}`);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Transforming prompt with Sonar...',
        cancellable: false
      },
      async (progress) => {
        // Initial progress
        progress.report({ message: theme.preparing });
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
        
        // Sending request
        progress.report({ message: theme.sending });
        const transformed = await optimizeWithSonar(raw, apiKey);
        
        // Processing response
        progress.report({ message: theme.processing });
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
        
        // Applying changes
        progress.report({ message: theme.applying });
        await editor.edit(editBuilder => editBuilder.replace(selection, transformed));
        
        // Highlighting
        progress.report({ message: theme.highlighting });
        highlightXmlTags(editor, selection.start, transformed);
        
        // Done
        progress.report({ message: theme.completed });
      }
    );
    
    // Show success message after completion
    vscode.window.showInformationMessage('Prompt transformed successfully!');
  } catch (err: any) {
    outputChannel.appendLine(`Transformation error: ${err.message}`);
    vscode.window.showErrorMessage('Sonar transformation failed: ' + err.message);
  }
}

async function runWithSonar(context: vscode.ExtensionContext) {
  outputChannel.appendLine('Run with Sonar command triggered');
  const editor = vscode.window.activeTextEditor;
  if (!editor) { 
    outputChannel.appendLine('No active editor found');
    return; 
  }
  const selection = editor.selection;
  const prompt = editor.document.getText(selection) || editor.document.getText();
  if (!prompt) { vscode.window.showErrorMessage('No prompt found.'); return; }

  const apiKey = vscode.workspace.getConfiguration().get<string>('reprompt.sonarApiKey');
  if (!apiKey) { vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.'); return; }

  // Start timing the process
  const startTime = Date.now();

  // Select a random theme for this operation
  const theme = getRandomTheme();
  outputChannel.appendLine(`Using theme with first message: ${theme.preparing}`);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Running prompt with Sonar...',
        cancellable: false
      },
      async (progress) => {
        // Initial progress
        progress.report({ message: theme.preparing });
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
        
        // Sending request
        progress.report({ message: theme.sending });
        const result = await runWithSonarApi(prompt, apiKey);
        
        // Calculate elapsed time
        const elapsedTime = Date.now() - startTime;
        // Add elapsed time to the result object
        result.elapsedTime = elapsedTime;
        
        // Processing response
        progress.report({ message: theme.processing });
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
        
        // Creating webview
        progress.report({ message: theme.applying });
        const panel = vscode.window.createWebviewPanel(
          'sonarResponse',
          'Sonar Response',
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );
        
        // Setting up message handling
        panel.webview.onDidReceiveMessage(
          message => {
            switch (message.command) {
              case 'regenerate':
                outputChannel.appendLine(`Regenerate request received for message: ${message.messageId}`);
                // Start timing for regeneration
                const regenStartTime = Date.now();
                
                // Handle regeneration with progress notification
                vscode.window.withProgress(
                  {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Regenerating response...',
                    cancellable: false
                  },
                  async (regProgress) => {
                    regProgress.report({ message: 'Sending request to Sonar API...' });
                    try {
                      const newResult = await runWithSonarApi(prompt, apiKey);
                      // Calculate elapsed time for regeneration
                      const regenElapsedTime = Date.now() - regenStartTime;
                      // Add elapsed time to the result object
                      newResult.elapsedTime = regenElapsedTime;
                      
                      regProgress.report({ message: 'Updating view...' });
                      panel.webview.html = renderSonarWebview(newResult);
                      regProgress.report({ message: 'Regeneration complete!' });
                    } catch (err: any) {
                      vscode.window.showErrorMessage('Regeneration failed: ' + err.message);
                      outputChannel.appendLine(`Regeneration error: ${err.message}`);
                    }
                  }
                );
                return;
            }
          },
          undefined,
          context.subscriptions
        );
        
        // Rendering response
        progress.report({ message: theme.highlighting });
        panel.webview.html = renderSonarWebview(result);
        
        // Done
        progress.report({ message: theme.completed });
      }
    );
  } catch (err: any) {
    outputChannel.appendLine(`Run with Sonar error: ${err.message}`);
    vscode.window.showErrorMessage('Sonar run failed: ' + err.message);
  }
}

function highlightXmlTags(editor: vscode.TextEditor, start: vscode.Position, text: string) {
  const tagRegex = /<(context|instruction|examples|format)>.*?<\/\1>/gs;
  const decorations: vscode.DecorationOptions[] = [];
  let match: RegExpExecArray | null;
  let offset = 0;
  while ((match = tagRegex.exec(text))) {
    const tagStart = match.index;
    const tagEnd = tagStart + match[0].length;
    const range = new vscode.Range(
      start.translate(0, tagStart),
      start.translate(0, tagEnd)
    );
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

function renderJsonWebview(json: any): string {
  const pretty = JSON.stringify(json, null, 2);
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Sonar Response</title>
      <style>
        body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; }
        pre { background: #23272e; padding: 1em; border-radius: 6px; }
        .key { color: #9cdcfe; }
        .string { color: #ce9178; }
        .number { color: #b5cea8; }
        .boolean { color: #569cd6; }
        .null { color: #b5cea8; }
      </style>
    </head>
    <body>
      <pre>${syntaxHighlight(pretty)}</pre>
    </body>
    </html>
  `;
}

function renderSonarWebview(result: any): string {
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
  } else if (elapsedTime < 60000) {
    formattedTime = `${(elapsedTime / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = ((elapsedTime % 60000) / 1000).toFixed(1);
    formattedTime = `${minutes}m ${seconds}s`;
  }

  // Process content to handle markdown-like formatting
  let processedContent = content;

  // Convert markdown code blocks to HTML
  processedContent = processedContent.replace(
    /(\w*)([\s\S]*?)/g,
    (_: string, lang: string, code: string): string => {
      const codeId: string = `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const html: string = `<div class="code-block">
        <div class="code-header">
          <span class="lang-label">${lang || ''}</span>
          <div class="code-actions">
            <button class="copy-btn" onclick="copyCode('${codeId}')">Copy</button>
          </div>
        </div>
        <pre id="${codeId}"><code>${escapeHtml(code.trim())}</code></pre>
      </div>`;
      return html;
    }
  );

  // Convert inline code
  processedContent = processedContent.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert headers
  processedContent = processedContent.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  processedContent = processedContent.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  processedContent = processedContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');

  // Convert bullet points
  processedContent = processedContent.replace(/^- (.*$)/gm, '<li>$1</li>');
  processedContent = processedContent.replace(/(<li>.*<\/li>\n?)+/g, (match: string): string => `<ul>${match}</ul>`);

  // Convert numbered lists
  processedContent = processedContent.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  processedContent = processedContent.replace(/(<li>.*<\/li>\n?)+/g, (match: string) => `<ol>${match}</ol>`);

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
    </button>
    <button class="action-button sources-btn" onclick="toggleSources()">
      <span class="sources-count">${sourcesText}</span>
    </button>
  </div>`;

  // Sources section
  const sourcesSection = citations.length ? `<div class="sources-panel" id="sources-panel" style="display: none;">
    <h3>Sources</h3>
    <ul class="sources-list">
      ${citations.map((source: string) =>
    `<li><a href="${source}" target="_blank">${source}</a></li>`
  ).join('')}
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

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Sonar Response</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          background: #1e1e1e; 
          color: #d4d4d4; 
          margin: 0;
          line-height: 1.5;
          font-size: 14px;
        }
        .content { 
          padding: 1em 2em 6em 2em;
          overflow-wrap: break-word;
        }
        .explanation-block {
          background: #252526;
          border-radius: 8px;
          padding: 1em;
          margin-bottom: 1em;
          border-left: 4px solid #444;
          line-height: 1.6;
        }
        .stats { 
          background: #252526; 
          color: #d4d4d4; 
          padding: 0.7em 2em; 
          border-top: 1px solid #3e3e3e; 
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
        .action-buttons {
          display: flex;
          margin-top: 0.5em;
          gap: 0.5em;
        }
        .action-button {
          background: transparent;
          border: 1px solid #444;
          border-radius: 4px;
          color: #9cdcfe;
          padding: 4px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 12px;
        }
        .action-button:hover {
          background: #2a2a2a;
        }
        .refresh-btn {
          padding: 4px 6px;
        }
        .sources-btn {
          display: flex;
          align-items: center;
        }
        .sources-count {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sources-count::before {
          content: '';
          display: inline-block;
          width: 16px;
          height: 16px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239cdcfe' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
        }
        .sources-panel {
          background: #252526;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 1em;
          margin-top: 1em;
        }
        .sources-list {
          margin: 0;
          padding-left: 1.5em;
        }
        .sources-list li {
          margin-bottom: 0.5em;
        }
        a { 
          color: #9cdcfe; 
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        h1, h2, h3, h4 { 
          margin-top: 1em; 
          margin-bottom: 0.5em; 
          color: #e6e6e6; 
        }
        h1 { font-size: 1.8em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.3em; }
        pre { 
          background: #1e1e2e; 
          padding: 1em; 
          border-radius: 0 0 6px 6px; 
          overflow-x: auto;
          margin: 0;
        }
        code {
          font-family: 'SF Mono', Monaco, Menlo, Consolas, 'Courier New', monospace;
          font-size: 0.9em;
          background: #2d2d2d;
          padding: 0.2em 0.4em;
          border-radius: 3px;
        }
        pre code {
          background: transparent;
          padding: 0;
          white-space: pre;
        }
        ul, ol {
          padding-left: 2em;
          margin: 0.5em 0;
        }
        li {
          margin: 0.3em 0;
        }
        p {
          margin: 0.7em 0;
        }
        .code-block {
          margin: 1em 0;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #333;
        }
        .code-header {
          background: #333;
          padding: 0.5em 1em;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #444;
        }
        .lang-label {
          font-family: monospace;
          color: #ccc;
          font-size: 0.9em;
        }
        .code-actions {
          display: flex;
          gap: 0.5em;
        }
        .copy-btn {
          background: transparent;
          border: 1px solid #555;
          border-radius: 4px;
          color: #ccc;
          padding: 2px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        .copy-btn:hover {
          background: #444;
        }
      </style>
      <script>
        function copyCode(elementId) {
          const codeElement = document.getElementById(elementId);
          const text = codeElement.textContent;
          navigator.clipboard.writeText(text)
            .then(() => {
              const btn = codeElement.parentElement.querySelector('.copy-btn');
              const originalText = btn.textContent;
              btn.textContent = 'Copied!';
              setTimeout(() => {
                btn.textContent = originalText;
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy: ', err);
            });
        }
        
        function toggleSources() {
          const sourcesPanel = document.getElementById('sources-panel');
          if (sourcesPanel) {
            sourcesPanel.style.display = sourcesPanel.style.display === 'none' ? 'block' : 'none';
          }
        }
        
        function regenerateResponse(messageId) {
          // Send message to extension host through vscode API
          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'regenerate',
            messageId: messageId
          });
        }
        
        // Initialize vscode API
        const vscode = acquireVsCodeApi();
      </script>
    </head>
    <body>
      <div class="content" id="${messageId}">
        ${explanationBlock}
        ${actionButtons}
        ${sourcesSection}
      </div>
      <div class="stats">
        <div class="stats-items">
          ${statsFooter}
        </div>
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

function syntaxHighlight(json: string) {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'key' : 'string';
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}