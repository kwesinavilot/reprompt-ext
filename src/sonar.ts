// Types for Sonar API
export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type WebSearchOptions = {
  search_context_size?: 'low' | 'medium' | 'high';
};

export type ResponseFormat =
  | { type: 'json_schema'; json_schema: { schema: object } }
  | { type: 'regex'; regex: { regex: string } };

export interface ChatCompletionsParams {
  model?: string;
  messages: Message[];
  web_search_options?: WebSearchOptions;
  search_domain_filter?: string[];
  response_format?: ResponseFormat;
  // Add any other future params here
}

export interface SonarApiResponse {
  choices?: Array<{
    message?: {
      content?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  [key: string]: any;
}

export class SonarApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchApi(path: string, body: any): Promise<any> {
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
    
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
  }

  /**
   * Generic chat completions endpoint.
   */
  async chatCompletions(params: ChatCompletionsParams): Promise<SonarApiResponse> {
    const model = params.model || 'sonar-pro';
    const body: any = {
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
  async runPrompt(prompt: string, options?: {
    model?: string;
    web_search_options?: WebSearchOptions;
    search_domain_filter?: string[];
  }): Promise<string> {
    const messages: Message[] = [{ role: 'user', content: prompt }];
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
  async runPromptWithJsonSchema<T = any>(prompt: string, schema: object, options?: {
    model?: string;
    web_search_options?: WebSearchOptions;
    search_domain_filter?: string[];
  }): Promise<T | null> {
    const messages: Message[] = [{ role: 'user', content: prompt }];
    const response = await this.chatCompletions({
      messages,
      ...(options?.model && { model: options.model }),
      ...(options?.web_search_options && { web_search_options: options.web_search_options }),
      ...(options?.search_domain_filter && { search_domain_filter: options.search_domain_filter }),
      response_format: { type: 'json_schema', json_schema: { schema } }
    });
    const raw = extractContentFromResponse(response);
    return extractJsonFromContent<T>(raw);
  }

  /**
   * Run a prompt and extract a string matching a regex.
   */
  async runPromptWithRegex(prompt: string, regex: string, options?: {
    model?: string;
    web_search_options?: WebSearchOptions;
    search_domain_filter?: string[];
  }): Promise<string | null> {
    const messages: Message[] = [{ role: 'user', content: prompt }];
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
  async optimizePrompt(raw: string): Promise<string> {
    const systemPrompt = 'Optimize the following prompt for clarity, specificity, and effectiveness. Return only the improved prompt.';
    const messages: Message[] = [
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

// --- Utility functions ---

/**
 * Extracts the main content string from a Sonar API response.
 */
export function extractContentFromResponse(response: SonarApiResponse): string {
  return response?.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Extracts JSON object from a string, handling reasoning model outputs with <think>...</think>{json}.
 */
export function extractJsonFromContent<T = any>(content: string): T | null {
  if (!content) return null;
  // Remove <think>...</think> if present
  const jsonStart = content.lastIndexOf('{');
  if (jsonStart === -1) return null;
  const jsonStr = content.slice(jsonStart);
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

// --- Legacy wrappers for extension code ---

export async function optimizeWithSonar(raw: string, apiKey: string): Promise<string> {
  const service = new SonarApiService(apiKey);
  return service.optimizePrompt(raw);
}

export async function runWithSonarApi(prompt: string, apiKey: string): Promise<SonarApiResponse> {
  const service = new SonarApiService(apiKey);
  return service.chatCompletions({
    messages: [{ role: 'user', content: prompt }],
    web_search_options: { search_context_size: 'medium' }
  });
}

/**
 * Run with JSON schema and extract the object.
 */
export async function runWithSonarJsonSchema<T = any>(
  prompt: string,
  apiKey: string,
  schema: object,
  options?: { model?: string; web_search_options?: WebSearchOptions; search_domain_filter?: string[] }
): Promise<T | null> {
  const service = new SonarApiService(apiKey);
  return service.runPromptWithJsonSchema<T>(prompt, schema, options);
}

/**
 * Run with regex and extract the first match.
 */
export async function runWithSonarRegex(
  prompt: string,
  apiKey: string,
  regex: string,
  options?: { model?: string; web_search_options?: WebSearchOptions; search_domain_filter?: string[] }
): Promise<string | null> {
  const service = new SonarApiService(apiKey);
  return service.runPromptWithRegex(prompt, regex, options);
}
