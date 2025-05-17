"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonarApiService = void 0;
exports.extractContentFromResponse = extractContentFromResponse;
exports.extractJsonFromContent = extractJsonFromContent;
exports.optimizeWithSonar = optimizeWithSonar;
exports.runWithSonarApi = runWithSonarApi;
exports.runWithSonarJsonSchema = runWithSonarJsonSchema;
exports.runWithSonarRegex = runWithSonarRegex;
exports.generateExamplesWithSonar = generateExamplesWithSonar;
const optimizeSystemPrompt = `
You are an senior prompt engineer and code architect specializing in transforming vague developer requirements into comprehensive, structured prompts that are ready to be used with general-purpose and code-specific Large Language Models.
Your goal is to create prompts that are highly instructive and tailored to the developer's specific project context, focusing on generating prompts for specific development tasks, and sometimes full apps.

When given a simple or unclear request, transform it into a detailed, well-structured and instructive prompt that is designed to elicit a specific and helpful response from the LLM for a focused development task.
 
You must generate the FINAL prompt that a developer will feed to their LLM of choice. 

THINK STEP-BY-STEP AND RETURN THE FINAL PROMPT ONLY - WITHOUT EXPLANATIONS, REASONING, OR META-COMMENTARY. 

YOUR OUTPUT MUST BE THE PROPMT ITSELF, NOT AN EXPLANATION AND MUST BE A WELL-STRUCTURED PROMPT THAT IS READY TO BE USED.

### Instructions:
1. Define the specific app, feature or component to build (e.g., sidebar navigation, REST endpoint, form validation).  
2. Clarify its purpose and context within the larger project (e.g., user profile page, inventory microservice).
3. Specify relevant business logic or domain rules that apply to the task (e.g., user login should use JWT for authentication, email validation should adhere to RFC 5322, unit tests should cover all edge cases of the data processing function).
4. Incorporate any cultural or regional context if it's relevant to the specific task (e.g., if building a date input for a Ghanaian application, the prompt might mention date formats commonly used in Ghana). 
5. Add precise technical specs (framework, language, libraries, data schemas, performance constraints).  
6. Anticipate edge cases, error handling, and UX considerations (e.g., loading states, validation messages).  
7. Embed clear acceptance criteria (e.g., “Return HTTP 400 on invalid input”, “Support mobile layout”).  
8. Structure the output strictly using these XML tags, in this order:
   <context>, <instruction>, <examples>, <constraints>, <format>  
9. If you see “[Project Stack Detected]”, ensure the generated prompt effectively leverages this context by:
  a. Explicitly mentioning the detected technologies, frameworks, and libraries relevant to the task in the prompt.
  b. Suggesting implementation approaches, patterns, or best practices commonly used within the detected stack for this type of task.
  c. Instruct the LLM to use relevant APIs or library functions from the detected technologies.
  d. Ensuring the generated output is compatible and integrates well with the developer's existing codebase and toolchain.
  e. Adapting any requests for code examples to be in the detected programming languages and to use the conventions of the detected frameworks.
  f. If the detected stack is not relevant to the task, adapt the generated prompt to be more generic and applicable to any programming language or framework.


### Response Structure and Definitions (use XML tags in this order):
<context>       Instructive description of the app/feature/component and its context.  
<instruction>   Step-by-step tasks to implement the feature.  
<examples>      OPTIONAL - Code snippets or sample inputs/outputs 
<constraints>   Performance, security, or style boundaries.   
<format>        Structure of expected deliverables (e.g., schema, API docs, component tree). 

BE CONCISE YET COMPREHENSIVE - INCLUDE EVERYTHING NEEDED FOR QUALITY RESULTS.
`;
const examplesPrompt = (numExamples, instruction) => `
As a senior prompt engineer, generate ${numExamples} diverse, high-quality examples that demonstrate the practical application of the provided instruction, context or prompt. 

Your examples should:
1. Be comprehensive and illustrative of different use cases or scenarios
2. Demonstrate different aspects, edge cases, and variations of the instruction
3. Be concrete and specific, not abstract or generic
4. Include relevant context, constraints, and expected outcomes
5. Follow best practices for the domain or technology involved
6. Be formatted clearly with bullet points for readability

Each example should be structured to show:
- The specific scenario or context
- The precise implementation approach
- Any relevant technical details or considerations
- Expected outcomes or success criteria

IMPORTANT: Make each example distinct and valuable, covering a range of complexity levels and use cases. Ensure the examples are directly applicable to the instruction and would help the developer understand how to implement it effectively.

Format your response as ${numExamples} separate bullet points, with clear numbering and concise yet comprehensive descriptions.

Here are INSTRUCTION: "${instruction}"
`;
// Utility: Promise with timeout
async function withTimeout(promise, ms, onTimeout) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            if (onTimeout)
                onTimeout();
            reject(new Error('timeout'));
        }, ms);
    });
    return Promise.race([
        promise.then((result) => {
            clearTimeout(timeoutId);
            return result;
        }),
        timeoutPromise
    ]);
}
class SonarApiService {
    constructor(apiKey) {
        this.baseUrl = 'https://api.perplexity.ai';
        this.apiKey = apiKey;
    }
    async fetchApi(path, body) {
        // Use require instead of dynamic import
        const fetch = require('node-fetch');
        // Add a 60s timeout with a fun message
        let timeoutHandled = false;
        const timeoutMs = 60000;
        const funTimeoutMsg = "🦄 Oops! The AI is taking a magical nap (request timed out after 60 seconds). " +
            "Check your network connection, try again, or give the unicorns a little break! 🦄";
        try {
            return await withTimeout(fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(body)
            }).then(async (response) => {
                if (!response.ok)
                    throw new Error(await response.text());
                return await response.json();
            }), timeoutMs, () => {
                timeoutHandled = true;
            });
        }
        catch (err) {
            if (timeoutHandled) {
                // If in VS Code extension context, show a fun message
                // if (typeof vscode !== 'undefined' && vscode.window && vscode.window.showErrorMessage) {
                //   vscode.window.showErrorMessage(funTimeoutMsg);
                // }
                throw new Error(funTimeoutMsg);
            }
            throw err;
        }
    }
    /**
     * Generic chat completions endpoint.
     */
    async chatCompletions(params) {
        const model = params.model || 'sonar';
        const body = {
            model,
            messages: params.messages,
            ...(params.web_search_options && { web_search_options: params.web_search_options }),
            ...(params.search_domain_filter && { search_domain_filter: params.search_domain_filter }),
            ...(params.response_format && { response_format: params.response_format })
        };
        return this.fetchApi('/chat/completions', body);
    }
    /**
     * Run a prompt and extract a plain text answer.
     */
    async runPrompt(prompt, options) {
        const messages = [{ role: 'user', content: prompt }];
        const response = await this.chatCompletions({
            messages,
            ...(options?.model && { model: options.model }),
            ...(options?.web_search_options && { web_search_options: options.web_search_options }),
            ...(options?.search_domain_filter && { search_domain_filter: options.search_domain_filter }),
        });
        return extractContentFromResponse(response);
    }
    /**
     * Run a prompt and extract a JSON object using a JSON schema.
     */
    async runPromptWithJsonSchema(prompt, schema, options) {
        const messages = [{ role: 'user', content: prompt }];
        const response = await this.chatCompletions({
            messages,
            ...(options?.model && { model: options.model }),
            ...(options?.web_search_options && { web_search_options: options.web_search_options }),
            ...(options?.search_domain_filter && { search_domain_filter: options.search_domain_filter }),
            response_format: { type: 'json_schema', json_schema: { schema } }
        });
        const raw = extractContentFromResponse(response);
        return extractJsonFromContent(raw);
    }
    /**
     * Run a prompt and extract a string matching a regex.
     */
    async runPromptWithRegex(prompt, regex, options) {
        const messages = [{ role: 'user', content: prompt }];
        const response = await this.chatCompletions({
            messages,
            ...(options?.model && { model: options.model }),
            ...(options?.web_search_options && { web_search_options: options.web_search_options }),
            ...(options?.search_domain_filter && { search_domain_filter: options.search_domain_filter }),
            response_format: { type: 'regex', regex: { regex } }
        });
        const raw = extractContentFromResponse(response);
        // Try to extract the first match of the regex from the response
        const match = new RegExp(regex).exec(raw);
        return match ? match[0] : null;
    }
    /**
     * Optimize a prompt using a system message.
     */
    async optimizePrompt(raw) {
        const systemPrompt = optimizeSystemPrompt;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: raw }
        ];
        const response = await this.chatCompletions({
            messages,
            web_search_options: { search_context_size: 'low' }
        });
        return extractContentFromResponse(response);
    }
}
exports.SonarApiService = SonarApiService;
/**
 * Extracts the main content string from a Sonar API response.
 */
function extractContentFromResponse(response) {
    return response?.choices?.[0]?.message?.content?.trim() || '';
}
/**
 * Extracts JSON object from a string, handling reasoning model outputs with <think>...</think>{json}.
 */
function extractJsonFromContent(content) {
    if (!content)
        return null;
    // Remove <think>...</think> if present
    const jsonStart = content.lastIndexOf('{');
    if (jsonStart === -1)
        return null;
    const jsonStr = content.slice(jsonStart);
    try {
        return JSON.parse(jsonStr);
    }
    catch {
        return null;
    }
}
// --- Legacy wrappers for extension code ---
async function optimizeWithSonar(context, apiKey, model, searchContextSize) {
    const service = new SonarApiService(apiKey);
    const systemPrompt = optimizeSystemPrompt;
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
    ];
    const response = await service.chatCompletions({
        model: model || 'sonar',
        messages,
        web_search_options: { search_context_size: searchContextSize || 'medium' }
    });
    return extractContentFromResponse(response);
    // return service.optimizePrompt(context);
}
async function runWithSonarApi(prompt, apiKey, model, searchContextSize) {
    const service = new SonarApiService(apiKey);
    return service.chatCompletions({
        model: model || 'sonar',
        messages: [{ role: 'user', content: prompt }],
        web_search_options: { search_context_size: searchContextSize || 'medium' }
    });
}
/**
 * Run with JSON schema and extract the object.
 */
async function runWithSonarJsonSchema(prompt, apiKey, schema, options) {
    const service = new SonarApiService(apiKey);
    return service.runPromptWithJsonSchema(prompt, schema, options);
}
/**
 * Run with regex and extract the first match.
 */
async function runWithSonarRegex(prompt, apiKey, regex, options) {
    const service = new SonarApiService(apiKey);
    return service.runPromptWithRegex(prompt, regex, options);
}
/**
 * Generate illustrative examples for a given instruction using Sonar.
 */
async function generateExamplesWithSonar(instruction, numExamples, apiKey, model, searchContextSize) {
    const prompt = examplesPrompt(numExamples, instruction);
    const result = await runWithSonarApi(prompt, apiKey, model, searchContextSize);
    return result?.choices?.[0]?.message?.content?.trim() || '';
}
// async function runWithSonar(context: vscode.ExtensionContext) {
//   outputChannel.appendLine('Run with Sonar command triggered');
//   const editor = vscode.window.activeTextEditor;
//   if (!editor) {
//     outputChannel.appendLine('No active editor found');
//     return;
//   }
//   const selection = editor.selection;
//   const prompt = editor.document.getText(selection) || editor.document.getText();
//   if (!prompt) { vscode.window.showErrorMessage('No prompt found.'); return; }
//   const apiKey = vscode.workspace.getConfiguration().get<string>('reprompt.sonarApiKey');
//   if (!apiKey) { vscode.window.showErrorMessage('Set reprompt.sonarApiKey in settings.'); return; }
//   // Start timing the process
//   const startTime = Date.now();
//   // Select a random theme for this operation
//   const theme = getRandomTheme();
//   outputChannel.appendLine(`Using theme with first message: ${theme.preparing}`);
//   try {
//     await vscode.window.withProgress(
//       {
//         location: vscode.ProgressLocation.Notification,
//         title: 'Running prompt with Sonar...',
//         cancellable: false
//       },
//       async (progress) => {
//         // Initial progress
//         progress.report({ message: theme.preparing });
//         await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
//         // Sending request
//         progress.report({ message: theme.sending });
//         const result = await runWithSonarApi(prompt, apiKey);
//         // Calculate elapsed time
//         const elapsedTime = Date.now() - startTime;
//         // Add elapsed time to the result object
//         result.elapsedTime = elapsedTime;
//         // Processing response
//         progress.report({ message: theme.processing });
//         await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI update
//         // Creating webview
//         progress.report({ message: theme.applying });
//         const panel = vscode.window.createWebviewPanel(
//           'sonarResponse',
//           'Sonar Response',
//           vscode.ViewColumn.Beside,
//           { enableScripts: true, retainContextWhenHidden: true }
//         );
//         panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'images', 'icon.png'));
//         // Set up message handler FIRST, before setting HTML content
//         panel.webview.onDidReceiveMessage(
//           async (message) => {
//             outputChannel.appendLine(`Message received: ${JSON.stringify(message)}`);
//             if (message.command === 'regenerate') {
//               outputChannel.appendLine(`Regenerate request received for message: ${message.messageId}`);
//               await vscode.window.withProgress(
//                 {
//                   location: vscode.ProgressLocation.Notification,
//                   title: 'Regenerating response...',
//                   cancellable: false
//                 },
//                 async (regProgress) => {
//                   regProgress.report({ message: theme.preparing });
//                   await new Promise(resolve => setTimeout(resolve, 200));
//                   regProgress.report({ message: theme.sending });
//                   try {
//                     const regenStartTime = Date.now();
//                     const newResult = await runWithSonarApi(prompt, apiKey);
//                     const regenElapsedTime = Date.now() - regenStartTime;
//                     newResult.elapsedTime = regenElapsedTime;
//                     regProgress.report({ message: theme.processing });
//                     await new Promise(resolve => setTimeout(resolve, 200));
//                     regProgress.report({ message: 'Updating view...' });
//                     panel.webview.html = renderSonarWebview(newResult);
//                     regProgress.report({ message: theme.completed });
//                     vscode.window.showInformationMessage('Response regenerated successfully!');
//                   } catch (err: any) {
//                     vscode.window.showErrorMessage('Regeneration failed: ' + err.message);
//                     outputChannel.appendLine(`Regeneration error: ${err.message}`);
//                   }
//                 }
//               );
//             }
//           },
//           undefined,
//           context.subscriptions
//         );
//         // THEN set the HTML content
//         panel.webview.html = renderSonarWebview(result);
//         // Done
//         progress.report({ message: theme.highlighting });
//         progress.report({ message: theme.completed });
//       }
//     );
//   } catch (err: any) {
//     outputChannel.appendLine(`Run with Sonar error: ${err.message}`);
//     vscode.window.showErrorMessage('Sonar run failed: ' + err.message);
//   }
// }
// function regenerateResponse(messageId) {
//   // Send message to extension host through vscode API
//   const vscode = acquireVsCodeApi();
//   vscode.postMessage({
//     command: 'regenerate',
//     messageId: messageId
//   });
// }
//# sourceMappingURL=sonar.js.map