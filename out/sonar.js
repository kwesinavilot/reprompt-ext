"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonarApiService = void 0;
exports.extractContentFromResponse = extractContentFromResponse;
exports.extractJsonFromContent = extractJsonFromContent;
exports.optimizeWithSonar = optimizeWithSonar;
exports.runWithSonarApi = runWithSonarApi;
exports.runWithSonarJsonSchema = runWithSonarJsonSchema;
exports.runWithSonarRegex = runWithSonarRegex;
class SonarApiService {
    constructor(apiKey) {
        this.baseUrl = 'https://api.perplexity.ai';
        this.apiKey = apiKey;
    }
    async fetchApi(path, body) {
        // Use require instead of dynamic import
        const fetch = require('node-fetch');
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok)
            throw new Error(await response.text());
        return await response.json();
    }
    /**
     * Generic chat completions endpoint.
     */
    async chatCompletions(params) {
        const model = params.model || 'sonar-pro';
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
        const systemPrompt = 'Optimize the following prompt for clarity, specificity, and effectiveness. Return only the improved prompt.';
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
// --- Utility functions ---
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
async function optimizeWithSonar(raw, apiKey) {
    const service = new SonarApiService(apiKey);
    return service.optimizePrompt(raw);
}
async function runWithSonarApi(prompt, apiKey) {
    const service = new SonarApiService(apiKey);
    return service.chatCompletions({
        messages: [{ role: 'user', content: prompt }],
        web_search_options: { search_context_size: 'medium' }
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
//# sourceMappingURL=sonar.js.map