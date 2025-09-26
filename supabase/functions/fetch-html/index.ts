import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whitelist of allowed domains for security
const ALLOWED_DOMAINS = [
  'eandata.com',
  'barcodelookup.com', 
  'upcitemdb.com',
  'openfoodfacts.org',
  'world.openfoodfacts.org',
  'gs1.org',
  'gepir.gs1.org'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Security: Check if domain is in whitelist
    const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => 
      domain === allowedDomain || domain.endsWith('.' + allowedDomain)
    );
    
    if (!isAllowed) {
      throw new Error(`Domain ${domain} is not in the allowed list`);
    }

    console.log(`Fetching HTML from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      throw new Error('Response is not HTML content');
    }

    const html = await response.text();
    
    // Security: Limit response size (max 2MB)
    if (html.length > 2 * 1024 * 1024) {
      throw new Error('HTML response too large');
    }

    console.log(`Successfully fetched HTML (${html.length} chars) from ${response.url}`);

    return new Response(JSON.stringify({
      html,
      finalUrl: response.url,
      domain: new URL(response.url).hostname,
      status: response.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-html function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});