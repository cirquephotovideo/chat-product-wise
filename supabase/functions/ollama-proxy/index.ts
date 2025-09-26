import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OLLAMA_API_KEY = Deno.env.get('OLLAMA_CLOUD_API_KEY');
    if (!OLLAMA_API_KEY) {
      throw new Error('OLLAMA_CLOUD_API_KEY is not configured');
    }

    const { method, endpoint, body: requestBody } = await req.json();
    
    console.log(`Proxying ${method} request to: ${endpoint}`);

    const ollamaResponse = await fetch(`https://ollama.com/api${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(requestBody) : undefined,
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('Ollama API error:', errorText);
      throw new Error(`Ollama API error: ${ollamaResponse.status} ${errorText}`);
    }

    // Handle streaming responses
    if (requestBody?.stream) {
      const reader = ollamaResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body for streaming');
      }

      let fullContent = '';
      const decoder = new TextDecoder();

      // Read the entire stream first
      const chunks: string[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          chunks.push(chunk);
        }
      }

      // Process all chunks to extract the final content
      const fullText = chunks.join('');
      const lines = fullText.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message && parsed.message.content && parsed.message.content.trim()) {
            fullContent += parsed.message.content;
          }
          
          // If we hit the final message, break
          if (parsed.done) {
            break;
          }
        } catch (e) {
          // Skip malformed JSON lines
          continue;
        }
      }

      // Return the accumulated content as a simple string
      return new Response(fullContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
        }
      });
    }

    // Handle non-streaming responses
    const responseData = await ollamaResponse.json();
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }
});