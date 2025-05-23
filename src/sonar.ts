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

const optimizeSystemPrompt = (userRules: string) => `
You are an senior prompt engineer and code architect specializing in transforming vague developer requirements into comprehensive, structured prompts that are ready to be used with general-purpose and code-specific Large Language Models.
Your goal is to create prompts that are highly instructive and tailored to the developer's specific project context, focusing on generating prompts for specific development tasks, and sometimes full apps.

When given a simple or unclear request, transform it into a detailed, well-structured and instructive prompt that is designed to elicit a specific and helpful response from the LLM for a focused development task.
 
You must generate the FINAL prompt that a developer will feed to their LLM of choice. 

THINK STEP-BY-STEP AND RETURN THE FINAL PROMPT ONLY - WITHOUT EXPLANATIONS, REASONING, OR META-COMMENTARY. 

YOUR OUTPUT MUST BE THE PROPMT ITSELF, NOT AN EXPLANATION AND MUST BE A WELL-STRUCTURED PROMPT THAT IS READY TO BE USED.

### Team/Project Specific Rules:
${userRules}

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

const examplesPrompt = (numExamples: number, instruction: string) => `
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
async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (onTimeout) onTimeout();
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

export class SonarApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
 * Sends a POST request to the specified path on the Sonar API with the provided body.
 * Utilizes a 60-second timeout to handle potential delays gracefully.
 *
 * @param path - The API endpoint path to which the request is sent.
 * @param body - The request payload to be sent in the POST request.
 * @returns A promise that resolves to the JSON response from the API.
 * @throws An error with a fun timeout message if the request exceeds 60 seconds.
 *         Throws the original error if the request fails for any other reason.
 */
  private async fetchApi(path: string, body: any): Promise<any> {
    // Use require instead of dynamic import
    const fetch = require('node-fetch');
    // Add a 60s timeout with a fun message
    let timeoutHandled = false;
    const timeoutMs = 60000;
    const funTimeoutMsg =
      "🦄 Oops! The AI is taking a magical nap (request timed out after 60 seconds). " +
      "Check your network connection, try again, or give the unicorns a little break! 🦄";

    try {
      return await withTimeout(
        fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(body)
        }).then(async (response: any) => {
          if (!response.ok) throw new Error(await response.text());
          return await response.json();
        }),
        timeoutMs,
        () => {
          timeoutHandled = true;
        }
      );
    } catch (err: any) {
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
  async chatCompletions(params: ChatCompletionsParams): Promise<SonarApiResponse> {
    const model = params.model || 'sonar';
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
  async optimizePrompt(raw: string, userPromptRules: string): Promise<string> {
    const systemPrompt = optimizeSystemPrompt(userPromptRules);

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

/**
 * Optimize a prompt using a system message, optionally providing user-defined
 * prompt rules to apply to the input context.
 *
 * @param context - The prompt to optimize.
 * @param apiKey - The Sonar API key.
 * @param [model] - The Sonar model to use (default is 'sonar').
 * @param [searchContextSize] - The search context size to use (default is 'medium').
 * @param [userPromptRules] - The user-defined prompt rules to apply to the input context
 *  (default is '').
 * @returns The optimized prompt.
 */
export async function optimizeWithSonar(
  context: string,
  apiKey: string,
  model?: string,
  searchContextSize?: 'low' | 'medium' | 'high',
  userPromptRules?: string | null,
): Promise<string> {
  const service = new SonarApiService(apiKey);

  const systemPrompt = optimizeSystemPrompt(userPromptRules ?? '');

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: context }
  ];

  const response = await service.chatCompletions({
    model: model || 'sonar',
    messages,
    web_search_options: { search_context_size: searchContextSize || 'medium' }
  });

  return extractContentFromResponse(response);
}

export async function runWithSonarApi(
  prompt: string,
  apiKey: string,
  model?: string,
  searchContextSize?: 'low' | 'medium' | 'high'
): Promise<SonarApiResponse> {
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

/**
 * Generate illustrative examples for a given instruction using Sonar.
 */
export async function generateExamplesWithSonar(
  instruction: string,
  numExamples: number,
  apiKey: string,
  model?: string,
  searchContextSize?: 'low' | 'medium' | 'high'
): Promise<string> {
  const prompt = examplesPrompt(numExamples, instruction);
  const result = await runWithSonarApi(prompt, apiKey, model, searchContextSize);
  return result?.choices?.[0]?.message?.content?.trim() || '';
}