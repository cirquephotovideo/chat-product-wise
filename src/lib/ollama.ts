export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

export interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  model: string;
  done: boolean;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
}

export const OLLAMA_MODELS = [
  'gpt-oss:20b-cloud',
  'gpt-oss:120b-cloud', 
  'deepseek-v3.1:671b-cloud',
  'qwen3-coder:480b-cloud'
] as const;

export type OllamaModel = typeof OLLAMA_MODELS[number];

export class OllamaService {
  private static API_KEY_STORAGE_KEY = 'ollama_api_key';
  private static BASE_URL = 'https://ollama.com/api';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-oss:20b-cloud',
          messages: [{ role: 'user', content: 'test' }],
          stream: false
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async webSearch(query: string, maxResults: number = 5): Promise<WebSearchResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const response = await fetch(`${this.BASE_URL}/web_search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: maxResults
      }),
    });

    if (!response.ok) {
      throw new Error(`Web search failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async chat(
    model: OllamaModel,
    messages: OllamaMessage[],
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const response = await fetch(`${this.BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data: OllamaResponse = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              onChunk?.(data.message.content);
            }
          } catch (e) {
            // Ignore invalid JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }
}