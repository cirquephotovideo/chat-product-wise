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

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  private static async callProxy(method: string, endpoint: string, body?: any): Promise<Response> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const response = await supabase.functions.invoke('ollama-proxy', {
      body: {
        method,
        endpoint,
        body
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    // Create a mock Response object for consistency
    return {
      ok: true,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
      body: null
    } as Response;
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing API key with Ollama proxy');
      // Store the key temporarily for testing
      const oldKey = this.getApiKey();
      this.saveApiKey(apiKey);
      
      const response = await this.callProxy('GET', '/tags');
      
      // Restore old key if test fails
      if (!response.ok && oldKey) {
        this.saveApiKey(oldKey);
      } else if (!response.ok && !oldKey) {
        localStorage.removeItem(this.API_KEY_STORAGE_KEY);
      }
      
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

    const response = await this.callProxy('POST', '/web_search', {
      query,
      max_results: maxResults
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

    const { supabase } = await import('@/integrations/supabase/client');
    
    const response = await supabase.functions.invoke('ollama-proxy', {
      body: {
        method: 'POST',
        endpoint: '/chat',
        body: {
          model,
          messages,
          stream: true
        }
      }
    });

    if (response.error) {
      throw new Error(`Chat request failed: ${response.error.message}`);
    }

    // For streaming responses, we need to handle the data differently
    // Since the proxy returns the full response, we'll simulate streaming
    const fullResponse = response.data || '';
    
    if (onChunk && fullResponse) {
      // Simulate streaming by chunking the response
      const words = fullResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        onChunk(chunk);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return fullResponse;
  }
}