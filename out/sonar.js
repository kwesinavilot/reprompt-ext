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
        const systemPrompt = `You are an expert prompt engineer specializing in transforming vague developer requirements into comprehensive, structured prompts. 

When given a simple or unclear prompt, transform it into a detailed, well-structured prompt that:

1. Identifies the core functionality needed (e.g., CRUD operations, authentication, UI components)
2. Specifies relevant business domain details (e.g., ecommerce, healthcare, education)
3. Includes cultural or regional context when mentioned (e.g., Ghanaian market, European regulations)
4. Structures information using <context>, <instruction>, <examples>, and <format> tags
5. Adds necessary technical specifications (frameworks, languages, database requirements)
6. Anticipates edge cases and user experience considerations
7. Provides clear acceptance criteria

Return ONLY the improved prompt with appropriate structure and detail - NO explanations or meta-commentary.

Example transformation:
Input: "build a crud for a ghanaian ecommerce shoe store"
Output: 
<context>
Creating a CRUD application for a Ghanaian e-commerce shoe store. The application should respect local business practices, currency (Ghana Cedi - GHS), and shipping options within Ghana. Consider cultural preferences in UI design and product categorization.
</context>

<instruction>
Develop a complete CRUD application for a Ghanaian shoe e-commerce platform with the following features:

1. Product management:
   - Create, read, update, delete shoe products
   - Fields: name, description, price (in GHS), sizes, colors, material, brand, category, images, stock quantity
   - Support for local shoe styles and categories

2. User management:
   - Customer registration and authentication
   - Admin/staff roles with appropriate permissions
   - User profiles with shipping addresses

3. Order processing:
   - Shopping cart functionality
   - Checkout process with Ghanaian payment options (Mobile Money, bank transfers)
   - Order tracking and history
   - Support for local delivery services

4. Search and filtering:
   - Product search by name, category, size, price range
   - Sorting options (newest, price, popularity)

5. Localization:
   - Ghana Cedi (GHS) as primary currency
   - Support for local phone number formats
   - Ghanaian regions and cities for shipping
</instruction>

<format>
Provide a complete solution including:
1. Database schema design
2. API endpoints documentation
3. Frontend component structure
4. Authentication flow
5. Key implementation considerations
</format>`;
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