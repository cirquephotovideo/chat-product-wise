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
        'Authorization': OLLAMA_API_KEY,
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

      const stream = new ReadableStream({
        start(controller) {
          function pump(): Promise<void> {
            return reader!.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              return pump();
            });
          }
          return pump();
        }
      });

      return new Response(stream, {
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