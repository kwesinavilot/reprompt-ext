import * as vscode from 'vscode';
import { optimizeWithSonar, runWithSonarApi } from './sonar';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('reprompt.optimize', optimizePrompt),
    vscode.commands.registerCommand('reprompt.runSonar', runWithSonar)
  );
}

async function optimizePrompt() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }
  const selection = editor.selection;
  const raw = editor.document.getText(selection);
  if (!raw) { vscode.window.showErrorMessage('No text selected.'); return; }

  const apiKey = vscode.workspace.getConfiguration().get<string>('reprompt.sonarApiKey');
  if (!apiKey) { vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.'); return; }

  try {
    const optimized = await optimizeWithSonar(raw, apiKey);
    await editor.edit(editBuilder => editBuilder.replace(selection, optimized));
    highlightXmlTags(editor, selection.start, optimized);
  } catch (err: any) {
    vscode.window.showErrorMessage('Sonar optimization failed: ' + err.message);
  }
}

async function runWithSonar() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }
  const selection = editor.selection;
  const prompt = editor.document.getText(selection) || editor.document.getText();
  if (!prompt) { vscode.window.showErrorMessage('No prompt found.'); return; }

  const apiKey = vscode.workspace.getConfiguration().get<string>('reprompt.sonarApiKey');
  if (!apiKey) { vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.'); return; }

  try {
    const result = await runWithSonarApi(prompt, apiKey);
    const panel = vscode.window.createWebviewPanel(
      'sonarResponse',
      'Sonar Response',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );
    panel.webview.html = renderJsonWebview(result);
  } catch (err: any) {
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
      <h2>Sonar Response</h2>
      <pre>${syntaxHighlight(pretty)}</pre>
    </body>
    </html>
  `;
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