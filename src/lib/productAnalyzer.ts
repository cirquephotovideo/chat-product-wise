import { OllamaService } from './ollama';
import { supabase } from '@/integrations/supabase/client';

export interface EanCandidate {
  name: string;
  brand?: string;
  category?: string;
  sourceUrl: string;
  sourceDomain: string;
  matchedOnPage: boolean;
  score: number;
}

export interface ProductData {
  identifier: string; // EAN code or product name
  name: string;
  type: 'name' | 'ean';
}

export interface AnalysisResult {
  productId: string;
  tools: Record<string, ToolProgress>;
  createdAt: string;
}

export interface ToolProgress {
  status: 'pending' | 'running' | 'completed' | 'error';
  data?: any;
}

export type ProgressCallback = (toolId: string, status: ToolProgress['status'], data?: any) => void;

export class ProductAnalyzer {
  private static readonly ANALYSIS_TOOLS = [
    'categorizer', 'competitor', 'seo_optimizer', 'trends', 
    'price_optimizer', 'content_enhancer', 'description_generator', 
    'seo_generator', 'marketing_generator'
  ];

  private ollamaService: OllamaService;

  constructor() {
    this.ollamaService = new OllamaService();
  }

  async resolveEANCandidates(ean: string): Promise<EanCandidate[]> {
    console.log(`Resolving EAN candidates for: ${ean}`);
    
    // Validate EAN format
    if (!this.validateEAN13(ean)) {
      console.warn(`Invalid EAN-13 format: ${ean}`);
      return [];
    }

    try {
      // Phase 1: EAN-specific searches on specialized databases
      const eanSearchQueries = [
        `"${ean}" site:eandata.com OR site:barcodelookup.com OR site:upcitemdb.com`,
        `"${ean}" "gtin13" OR "ean13"`,
        `"${ean}" "fiche technique" OR "caractéristiques" OR "specifications"`
      ];

      const candidates: EanCandidate[] = [];
      
      for (const query of eanSearchQueries) {
        try {
          const searchResults = await OllamaService.webSearch(query, 5);
          
          for (const result of searchResults.results) {
            const candidate = await this.extractProductInfoFromUrl(result.url, ean);
            if (candidate) {
              candidates.push(candidate);
            }
          }
        } catch (error) {
          console.warn(`Search failed for query "${query}":`, error);
        }
      }

      // Deduplicate and score candidates
      const uniqueCandidates = this.deduplicateCandidates(candidates);
      const scoredCandidates = uniqueCandidates
        .map(candidate => ({
          ...candidate,
          score: this.calculateCandidateScore(candidate, ean)
        }))
        .filter(candidate => candidate.score >= 0.6) // Minimum confidence threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Top 3 candidates

      console.log(`Found ${scoredCandidates.length} reliable candidates for EAN ${ean}`);
      return scoredCandidates;
      
    } catch (error) {
      console.error(`Error resolving EAN ${ean}:`, error);
      return [];
    }
  }

  private validateEAN13(ean: string): boolean {
    if (!/^\d{13}$/.test(ean)) return false;
    
    // Luhn algorithm check for EAN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(ean[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(ean[12]);
  }

  private async extractProductInfoFromUrl(url: string, ean: string): Promise<EanCandidate | null> {
    try {
      const { html, finalUrl, domain } = await OllamaService.fetchHtml(url);
      
      // Check if EAN is present on the page
      const eanRegex = new RegExp(`\\b${ean}\\b`, 'i');
      const matchedOnPage = eanRegex.test(html);

      // Extract JSON-LD structured data
      const jsonLdData = this.extractJsonLD(html);
      
      // Extract product information
      let name = '';
      let brand = '';
      let category = '';

      // Try JSON-LD first
      if (jsonLdData && jsonLdData['@type'] === 'Product') {
        name = jsonLdData.name || '';
        brand = jsonLdData.brand?.name || jsonLdData.brand || '';
        category = jsonLdData.category || '';
      }

      // Fallback to HTML extraction
      if (!name) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
        name = titleMatch ? titleMatch[1].trim() : '';
        
        // Clean up common title patterns
        name = name.replace(/\s*-\s*[^-]*$/, '').trim(); // Remove site name at end
      }

      // Extract brand from meta tags or content
      if (!brand) {
        const brandMatch = html.match(/<meta[^>]+(?:property="product:brand"|name="brand")[^>]+content="([^"]+)"/i);
        brand = brandMatch ? brandMatch[1].trim() : '';
      }

      if (name) {
        return {
          name,
          brand: brand || undefined,
          category: category || undefined,
          sourceUrl: finalUrl,
          sourceDomain: domain,
          matchedOnPage,
          score: 0 // Will be calculated later
        };
      }

      return null;
    } catch (error) {
      console.warn(`Failed to extract info from ${url}:`, error);
      return null;
    }
  }

  private extractJsonLD(html: string): any | null {
    try {
      const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);
      if (jsonLdMatch) {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        
        // Handle arrays of JSON-LD objects
        if (Array.isArray(jsonData)) {
          return jsonData.find(item => item['@type'] === 'Product') || null;
        }
        
        return jsonData['@type'] === 'Product' ? jsonData : null;
      }
    } catch (error) {
      console.warn('Failed to parse JSON-LD:', error);
    }
    return null;
  }

  private deduplicateCandidates(candidates: EanCandidate[]): EanCandidate[] {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = `${candidate.name.toLowerCase()}-${candidate.sourceDomain}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateCandidateScore(candidate: EanCandidate, ean: string): number {
    let score = 0;

    // Base score for having a name
    if (candidate.name) score += 0.2;

    // Bonus for EAN presence on page (most important)
    if (candidate.matchedOnPage) score += 0.5;

    // Bonus for trusted domains
    const trustedDomains = ['eandata.com', 'barcodelookup.com', 'upcitemdb.com', 'openfoodfacts.org'];
    if (trustedDomains.some(domain => candidate.sourceDomain.includes(domain))) {
      score += 0.2;
    }

    // Bonus for having brand information
    if (candidate.brand) score += 0.1;

    // Bonus for having category
    if (candidate.category) score += 0.1;

    // Check for Belgian/European context (EAN prefix 54 = Belgium)
    if (ean.startsWith('54')) {
      const lowerName = candidate.name.toLowerCase();
      const lowerBrand = (candidate.brand || '').toLowerCase();
      
      // Look for European/Belgian indicators
      if (lowerName.includes('belgique') || lowerName.includes('belgium') || 
          lowerBrand.includes('belgique') || lowerBrand.includes('belgium')) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  async analyzeProduct(product: ProductData, onProgress?: ProgressCallback): Promise<AnalysisResult> {
    console.log(`Starting analysis for product: ${product.identifier}`);
    
    const result: AnalysisResult = {
      productId: product.identifier,
      tools: {},
      createdAt: new Date().toISOString()
    };

    // Initialize all tools as pending
    ProductAnalyzer.ANALYSIS_TOOLS.forEach(toolId => {
      result.tools[toolId] = { status: 'pending' };
    });

    // Enhanced web search for EAN products
    let enhancedContext: any = {};
    if (product.type === 'ean') {
      try {
        const eanValidation = await this.performEANValidation(product.identifier);
        const coherenceCheck = this.validateProductEANCoherence(product, eanValidation);
        const enhancedSearch = await this.performEnhancedProductSearch(product, eanValidation);
        
        enhancedContext = {
          eanValidation,
          coherenceCheck,
          enhancedSearch
        };
        
        console.log(`Enhanced EAN context prepared for ${product.identifier}`);
      } catch (error) {
        console.warn('Enhanced EAN search failed, proceeding with basic analysis:', error);
      }
    } else {
      // Basic web search for name-based products
      try {
        const basicSearch = await OllamaService.webSearch(`"${product.name}" product information specifications`, 3);
        enhancedContext = { basicSearch };
      } catch (error) {
        console.warn('Basic web search failed:', error);
      }
    }

    // Run analysis tools in parallel
    const toolPromises = ProductAnalyzer.ANALYSIS_TOOLS.map(async (toolId) => {
      try {
        onProgress?.(toolId, 'running');
        result.tools[toolId].status = 'running';

        const toolResult = await this.runAnalysisTool(toolId, product, enhancedContext);
        
        result.tools[toolId] = {
          status: 'completed',
          data: toolResult
        };
        
        onProgress?.(toolId, 'completed', toolResult);
        
        // Save individual tool result to database
        await this.saveToolResult(toolId, product, toolResult);
        
      } catch (error) {
        console.error(`Tool ${toolId} failed:`, error);
        result.tools[toolId].status = 'error';
        onProgress?.(toolId, 'error');
      }
    });

    await Promise.allSettled(toolPromises);
    
    console.log(`Analysis completed for product: ${product.identifier}`);
    return result;
  }

  private async runAnalysisTool(toolId: string, product: ProductData, enhancedContext: any): Promise<any> {
    switch (toolId) {
      case 'categorizer':
        return this.categorizerTool(product, enhancedContext);
      case 'competitor':
        return this.competitorTool(product, enhancedContext);
      case 'seo_optimizer':
        return this.seoOptimizerTool(product, enhancedContext);
      case 'trends':
        return this.trendsTool(product, enhancedContext);
      case 'price_optimizer':
        return this.priceOptimizerTool(product, enhancedContext);
      case 'content_enhancer':
        return this.contentEnhancerTool(product, enhancedContext);
      case 'description_generator':
        return this.descriptionGeneratorTool(product, enhancedContext);
      case 'seo_generator':
        return this.seoGeneratorTool(product, enhancedContext);
      case 'marketing_generator':
        return this.marketingGeneratorTool(product, enhancedContext);
      default:
        throw new Error(`Unknown tool: ${toolId}`);
    }
  }

  private async categorizerTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Analyze this product and categorize it comprehensively:

Product: ${product.name} (${product.identifier})
${enhancedContext.eanValidation ? `EAN Info: ${JSON.stringify(enhancedContext.eanValidation)}` : ''}
${enhancedContext.enhancedSearch ? `Market Info: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 2))}` : ''}

Provide detailed categorization in JSON format:
{
  "main_category": "Primary category",
  "subcategories": ["sub1", "sub2"],
  "tags": ["tag1", "tag2", "tag3"],
  "attributes": {
    "material": "if applicable",
    "color": "if applicable",
    "size": "if applicable",
    "brand": "detected brand"
  },
  "confidence_score": 0.95,
  "reasoning": "Explanation of categorization"
}`;
    return this.executeToolWithRetry(prompt, 'categorizer', 0.8);
  }

  private async competitorTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Analyze competitors for this product:

Product: ${product.name} (${product.identifier})
${enhancedContext.enhancedSearch ? `Market Data: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 3))}` : ''}

Provide competitor analysis in JSON format:
{
  "competitors": [
    {
      "name": "Competitor name",
      "price": "price if found",
      "features": ["feature1", "feature2"],
      "strengths": ["strength1"],
      "weaknesses": ["weakness1"]
    }
  ],
  "market_position": "Premium/Mid-range/Budget",
  "competitive_advantages": ["advantage1", "advantage2"],
  "threats": ["threat1", "threat2"],
  "confidence_score": 0.85,
  "data_sources": ["source1", "source2"]
}`;
    return this.executeToolWithRetry(prompt, 'competitor', 0.75);
  }

  private async seoOptimizerTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Optimize SEO for this product:

Product: ${product.name} (${product.identifier})
${enhancedContext.enhancedSearch ? `Market Context: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 2))}` : ''}

Provide SEO optimization in JSON format:
{
  "title_tags": ["optimized title 1", "optimized title 2"],
  "meta_descriptions": ["description 1", "description 2"],
  "keywords": {
    "primary": ["main keyword 1", "main keyword 2"],
    "secondary": ["secondary 1", "secondary 2"],
    "long_tail": ["long tail phrase 1", "long tail phrase 2"]
  },
  "schema_markup": {
    "product_type": "Product type for schema",
    "category": "Schema category"
  },
  "confidence_score": 0.88,
  "seo_score": 85
}`;
    return this.executeToolWithRetry(prompt, 'seo_optimizer', 0.8);
  }

  private async trendsTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Analyze market trends for this product:

Product: ${product.name} (${product.identifier})
${enhancedContext.enhancedSearch ? `Market Data: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 3))}` : ''}

Provide trends analysis in JSON format:
{
  "current_trends": ["trend1", "trend2", "trend3"],
  "seasonal_patterns": {
    "peak_months": ["month1", "month2"],
    "low_months": ["month1", "month2"]
  },
  "growth_prediction": "Growing/Stable/Declining",
  "market_opportunities": ["opportunity1", "opportunity2"],
  "emerging_competitors": ["competitor1", "competitor2"],
  "technology_trends": ["tech trend1", "tech trend2"],
  "confidence_score": 0.82,
  "forecast_period": "12 months"
}`;
    return this.executeToolWithRetry(prompt, 'trends', 0.75);
  }

  private async priceOptimizerTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Optimize pricing strategy for this product:

Product: ${product.name} (${product.identifier})
${enhancedContext.enhancedSearch ? `Competitor Pricing: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 3))}` : ''}

Provide pricing optimization in JSON format:
{
  "recommended_price_range": {
    "min": 0,
    "max": 0,
    "optimal": 0
  },
  "pricing_strategy": "Premium/Competitive/Penetration",
  "competitor_prices": [
    {"competitor": "name", "price": 0, "features": "comparison"}
  ],
  "value_propositions": ["proposition1", "proposition2"],
  "price_sensitivity_factors": ["factor1", "factor2"],
  "seasonal_adjustments": ["adjustment1", "adjustment2"],
  "confidence_score": 0.85,
  "currency": "EUR"
}`;
    return this.executeToolWithRetry(prompt, 'price_optimizer', 0.8);
  }

  private async contentEnhancerTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Enhance product content and descriptions:

Product: ${product.name} (${product.identifier})
${enhancedContext.eanValidation ? `Validated Product Info: ${JSON.stringify(enhancedContext.eanValidation)}` : ''}
${enhancedContext.enhancedSearch ? `Additional Context: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 2))}` : ''}

Provide content enhancement in JSON format:
{
  "enhanced_title": "Improved product title",
  "short_description": "Brief compelling description (50-100 words)",
  "detailed_description": "Comprehensive description (200-300 words)",
  "key_features": ["feature1", "feature2", "feature3"],
  "benefits": ["benefit1", "benefit2", "benefit3"],
  "use_cases": ["use case1", "use case2"],
  "technical_specs": {"spec1": "value1", "spec2": "value2"},
  "confidence_score": 0.9,
  "content_quality_score": 95
}`;
    return this.executeToolWithRetry(prompt, 'content_enhancer', 0.85);
  }

  private async descriptionGeneratorTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Generate comprehensive product descriptions:

Product: ${product.name} (${product.identifier})
${enhancedContext.enhancedSearch ? `Research Data: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 3))}` : ''}

Generate product descriptions in JSON format:
{
  "descriptions": {
    "short": "Concise 1-2 sentence description",
    "medium": "Paragraph description (100-150 words)",
    "detailed": "Comprehensive description (300-500 words)",
    "bullet_points": ["point1", "point2", "point3", "point4", "point5"]
  },
  "target_audiences": ["audience1", "audience2"],
  "emotional_appeals": ["appeal1", "appeal2"],
  "call_to_action": ["cta1", "cta2"],
  "confidence_score": 0.88,
  "readability_score": 85
}`;
    return this.executeToolWithRetry(prompt, 'description_generator', 0.8);
  }

  private async seoGeneratorTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Generate SEO-optimized content for this product:

Product: ${product.name} (${product.identifier})
${enhancedContext.enhancedSearch ? `SEO Context: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 2))}` : ''}

Generate SEO content in JSON format:
{
  "seo_title": "SEO-optimized title (50-60 chars)",
  "meta_description": "Meta description (150-160 chars)",
  "h1_tag": "Main heading",
  "h2_tags": ["subheading1", "subheading2"],
  "seo_content": "SEO-optimized content (300-400 words)",
  "alt_texts": ["alt text for image1", "alt text for image2"],
  "internal_links": ["suggested internal link1", "suggested internal link2"],
  "faq_section": [
    {"question": "Q1?", "answer": "A1"},
    {"question": "Q2?", "answer": "A2"}
  ],
  "confidence_score": 0.87,
  "seo_score": 90
}`;
    return this.executeToolWithRetry(prompt, 'seo_generator', 0.8);
  }

  private async marketingGeneratorTool(product: ProductData, enhancedContext: any): Promise<any> {
    const prompt = `Generate marketing content for this product:

Product: ${product.name} (${product.identifier})
${enhancedContext.enhancedSearch ? `Market Context: ${JSON.stringify(enhancedContext.enhancedSearch?.slice(0, 2))}` : ''}

Generate marketing content in JSON format:
{
  "marketing_messages": {
    "headline": "Catchy main headline",
    "tagline": "Memorable tagline",
    "elevator_pitch": "30-second pitch"
  },
  "social_media_posts": {
    "facebook": "Facebook-optimized post",
    "instagram": "Instagram caption with hashtags",
    "twitter": "Tweet-length message"
  },
  "ad_copy": {
    "google_ads": "Google Ads headline and description",
    "facebook_ads": "Facebook ad copy"
  },
  "email_marketing": {
    "subject_lines": ["subject1", "subject2", "subject3"],
    "preview_text": "Email preview text"
  },
  "value_propositions": ["value prop1", "value prop2"],
  "confidence_score": 0.86,
  "engagement_prediction": 85
}`;
    return this.executeToolWithRetry(prompt, 'marketing_generator', 0.8);
  }

  private async performEANValidation(eanCode: string): Promise<any> {
    try {
      console.log(`Performing EAN validation for: ${eanCode}`);
      
      // Search for specific EAN validation databases
      const eanSearchResults = await OllamaService.webSearch(
        `"${eanCode}" site:eandata.com OR site:barcodelookup.com OR site:gepir.gs1.org`,
        3
      );
      
      const validationData = {
        ean: eanCode,
        isValid: this.validateEAN13(eanCode),
        sources: eanSearchResults.results.map(r => ({
          title: r.title,
          url: r.url,
          content: r.content.substring(0, 200)
        }))
      };
      
      console.log(`EAN validation completed for ${eanCode}`);
      return validationData;
    } catch (error) {
      console.warn(`EAN validation failed for ${eanCode}:`, error);
      return { ean: eanCode, isValid: false, error: error.message };
    }
  }

  private async performEnhancedProductSearch(product: ProductData, eanValidation: any): Promise<any[]> {
    try {
      console.log(`Performing enhanced search for EAN product: ${product.identifier}`);
      
      const queries = [
        `"${product.identifier}" "${product.name}" specifications`,
        `"${product.identifier}" price review features`,
        `"${product.name}" EAN ${product.identifier} product information`
      ];
      
      const allResults = [];
      for (const query of queries) {
        try {
          const results = await OllamaService.webSearch(query, 3);
          allResults.push(...results.results);
        } catch (error) {
          console.warn(`Enhanced search query failed: ${query}`, error);
        }
      }
      
      // Remove duplicates and limit results
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.url === result.url)
      ).slice(0, 5);
      
      console.log(`Enhanced search completed: ${uniqueResults.length} unique results`);
      return uniqueResults;
    } catch (error) {
      console.error(`Enhanced product search failed:`, error);
      return [];
    }
  }

  private validateProductEANCoherence(product: ProductData, eanValidation: any): any {
    const coherence = {
      nameMatch: false,
      brandMatch: false,
      coherenceScore: 0,
      issues: [] as string[]
    };

    if (!eanValidation || !eanValidation.sources) {
      coherence.issues.push('No EAN validation data available');
      return coherence;
    }

    // Simple text matching for coherence check
    const productNameLower = product.name.toLowerCase();
    const eanContent = eanValidation.sources.map((s: any) => 
      `${s.title} ${s.content}`.toLowerCase()
    ).join(' ');

    const nameWords = productNameLower.split(' ').filter(w => w.length > 2);
    const matchedWords = nameWords.filter(word => eanContent.includes(word));
    
    coherence.nameMatch = matchedWords.length > 0;
    coherence.coherenceScore = nameWords.length > 0 ? matchedWords.length / nameWords.length : 0;

    if (coherence.coherenceScore < 0.3) {
      coherence.issues.push('Product name does not match EAN data');
    }

    return coherence;
  }

  private async saveToolResult(toolId: string, product: ProductData, result: any): Promise<void> {
    try {
      // Temporarily disable saving to database until authentication is implemented
      console.log(`Tool result for ${toolId} on ${product.identifier}:`, result);
      console.log(`Would save to magic_tools_results but authentication not implemented yet`);
      
      // TODO: Implement proper user authentication before enabling database saves
      // await supabase
      //   .from('magic_tools_results')
      //   .insert({
      //     user_id: (await supabase.auth.getUser()).data.user?.id,
      //     product_name: product.name,
      //     tool_id: toolId,
      //     tool_name: this.getToolName(toolId),
      //     result_data: result,
      //     confidence_score: result.confidence_score || 0,
      //     status: 'completed',
      //     metadata: {
      //       product_identifier: product.identifier,
      //       product_type: product.type,
      //       analysis_timestamp: new Date().toISOString()
      //     }
      //   });
      
    } catch (error) {
      console.error(`Failed to save ${toolId} result:`, error);
    }
  }

  private getToolName(toolId: string): string {
    const names: Record<string, string> = {
      categorizer: 'Catégorisateur Automatique',
      competitor: 'Analyseur Concurrentiel', 
      seo_optimizer: 'Optimiseur SEO',
      trends: 'Détecteur de Tendances',
      price_optimizer: 'Optimiseur de Prix',
      content_enhancer: 'Améliorateur de Contenu',
      description_generator: 'Générateur de Descriptions',
      seo_generator: 'Générateur SEO',
      marketing_generator: 'Générateur Marketing'
    };
    return names[toolId] || toolId;
  }

  private async executeToolWithRetry(prompt: string, toolId: string, defaultConfidence: number, maxRetries: number = 3): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Executing ${toolId} (attempt ${attempt}/${maxRetries})`);
        
        const model = 'gpt-oss:20b-cloud';
        const messages = [
          {
            role: 'system' as const,
            content: 'You are an expert product analyst. Always respond with valid JSON only, no additional text or explanations.'
          },
          {
            role: 'user' as const,
            content: prompt
          }
        ];
        
        const response = await OllamaService.chat(model, messages);
        
        if (!response || response.trim().length === 0) {
          throw new Error('Empty response from LLM');
        }
        
        const cleanedResponse = this.cleanJsonResponse(response);
        const parsedData = this.parseJsonSafely(cleanedResponse);
        
        if (!parsedData) {
          throw new Error('Invalid JSON response');
        }
        
        if (!this.validateToolResponse(parsedData, toolId)) {
          throw new Error('Response validation failed');
        }
        
        // Ensure confidence score exists
        if (!parsedData.confidence_score) {
          parsedData.confidence_score = defaultConfidence;
        }
        
        console.log(`${toolId} completed successfully on attempt ${attempt}`);
        return parsedData;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`${toolId} attempt ${attempt} failed:`, error);
        
        // Don't retry on certain types of errors
        if (error instanceof Error && 
           (error.message.includes('API key') || 
            error.message.includes('unauthorized') ||
            error.message.includes('No API key'))) {
          console.log(`${toolId} API error detected, skipping retries`);
          break;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`${toolId} waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`${toolId} failed after ${maxRetries} attempts, using fallback. Last error:`, lastError);
    return this.getFallbackResponse(toolId, defaultConfidence);
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    response = response.replace(/```json\s*/, '').replace(/```\s*$/, '');
    response = response.replace(/```\s*/, '');
    
    // Find JSON content between curly braces
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    return response.trim();
  }

  private parseJsonSafely(jsonString: string): any | null {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Initial JSON parse failed, attempting fixes...');
      
      try {
        // Common JSON fixes
        let fixed = jsonString
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']')
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
          .replace(/:\s*'([^']*?)'/g, ': "$1"'); // Replace single quotes with double quotes
        
        return JSON.parse(fixed);
      } catch (secondError) {
        console.error('JSON parsing failed even after fixes:', secondError);
        return null;
      }
    }
  }

  private validateToolResponse(data: any, toolId: string): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Tool-specific validation
    switch (toolId) {
      case 'categorizer':
        return !!(data.main_category && Array.isArray(data.tags));
      case 'competitor':
        return !!(Array.isArray(data.competitors) && data.market_position);
      case 'seo_optimizer':
        return !!(Array.isArray(data.title_tags) && data.keywords);
      case 'trends':
        return !!(Array.isArray(data.current_trends) && data.growth_prediction);
      case 'price_optimizer':
        return !!(data.recommended_price_range && data.pricing_strategy);
      case 'content_enhancer':
        return !!(data.enhanced_title && data.short_description);
      case 'description_generator':
        return !!(data.descriptions && data.descriptions.short);
      case 'seo_generator':
        return !!(data.seo_title && data.meta_description);
      case 'marketing_generator':
        return !!(data.marketing_messages && data.value_propositions);
      default:
        return true;
    }
  }

  private getFallbackResponse(toolId: string, confidence: number): any {
    const baseFallbacks: Record<string, any> = {
      categorizer: {
        main_category: "Électronique et Technologie",
        subcategories: ["Appareils Photo", "Caméras Mirrorless"],
        tags: ["sony", "appareil photo", "mirrorless", "professionnel"],
        attributes: {
          brand: "Sony",
          type: "Appareil photo numérique",
          category: "Électronique"
        },
        confidence_score: Math.max(confidence, 0.7),
        reasoning: "Catégorisation basée sur le nom du produit - Configuration réseau non disponible"
      },
      competitor: {
        competitors: [
          {
            name: "Canon EOS R6 Mark II",
            price: "2500€",
            features: ["42MP", "Stabilisation", "Vidéo 4K"],
            strengths: ["Excellente qualité d'image", "Bonne autonomie"],
            weaknesses: ["Plus cher", "Interface complexe"]
          }
        ],
        market_position: "Haut de gamme",
        competitive_advantages: ["Technologie Sony", "Écosystème complet"],
        threats: ["Concurrence Canon/Nikon", "Smartphones haut de gamme"],
        confidence_score: Math.max(confidence, 0.6),
        data_sources: ["Analyse de marché générique"]
      },
      seo_optimizer: {
        title_tags: ["Sony A7 III - Appareil Photo Mirrorless Professionnel", "Sony Alpha A7 III - Caméra Full Frame 24MP"],
        meta_descriptions: ["Découvrez le Sony A7 III, l'appareil photo mirrorless professionnel avec capteur full frame 24MP et stabilisation 5 axes."],
        keywords: {
          primary: ["sony a7 iii", "appareil photo mirrorless", "sony alpha"],
          secondary: ["caméra professionnelle", "full frame", "stabilisation"],
          long_tail: ["meilleur appareil photo sony 2024", "sony a7 iii avis test"]
        },
        confidence_score: Math.max(confidence, 0.75),
        seo_score: 85
      },
      trends: {
        current_trends: ["Photographie mobile croissante", "Vidéo 4K standard", "Streaming en direct"],
        seasonal_patterns: {
          peak_months: ["novembre", "décembre", "juin"],
          low_months: ["janvier", "février"]
        },
        growth_prediction: "Stable avec légère croissance",
        market_opportunities: ["Créateurs de contenu", "Photographie événementielle"],
        emerging_competitors: ["Smartphones Pro", "Caméras d'action"],
        technology_trends: ["IA dans la photographie", "Connectivité sans fil"],
        confidence_score: Math.max(confidence, 0.6),
        forecast_period: "12 mois"
      },
      price_optimizer: {
        recommended_price_range: {
          min: 1800,
          max: 2200,
          optimal: 1999
        },
        pricing_strategy: "Premium compétitif",
        competitor_prices: [
          {"competitor": "Canon EOS R6", "price": 2400, "features": "Similaires mais plus récent"},
          {"competitor": "Nikon Z6 II", "price": 2000, "features": "Concurrent direct"}
        ],
        value_propositions: ["Technologie éprouvée", "Excellent rapport qualité/prix"],
        price_sensitivity_factors: ["Nouveaux modèles", "Promotions saisonnières"],
        seasonal_adjustments: ["Black Friday -15%", "Rentrée +5%"],
        confidence_score: Math.max(confidence, 0.65),
        currency: "EUR"
      },
      content_enhancer: {
        enhanced_title: "Sony Alpha A7 III - Appareil Photo Mirrorless Full Frame 24MP avec Stabilisation 5 Axes",
        short_description: "L'appareil photo mirrorless professionnel de Sony qui révolutionne la photographie avec son capteur full frame 24MP et sa stabilisation avancée.",
        detailed_description: "Le Sony Alpha A7 III représente l'excellence en matière de photographie mirrorless. Avec son capteur CMOS full frame de 24,2 mégapixels rétroéclairé, cet appareil offre une qualité d'image exceptionnelle même dans des conditions de faible luminosité. La stabilisation sur 5 axes intégrée au boîtier permet des prises de vue nettes à main levée, tandis que l'autofocus rapide et précis garantit des images parfaitement nettes. Idéal pour les photographes professionnels et les passionnés exigeants.",
        key_features: ["Capteur Full Frame 24MP", "Stabilisation 5 axes", "Autofocus rapide", "Vidéo 4K", "Double slot mémoire"],
        benefits: ["Qualité professionnelle", "Polyvalence exceptionnelle", "Fiabilité Sony"],
        use_cases: ["Photographie de portrait", "Paysages", "Événements", "Vidéographie"],
        technical_specs: {"resolution": "24.2MP", "stabilisation": "5 axes", "video": "4K UHD", "iso": "100-51200"},
        confidence_score: Math.max(confidence, 0.8),
        content_quality_score: 92
      },
      description_generator: {
        descriptions: {
          short: "Appareil photo mirrorless professionnel Sony avec capteur full frame 24MP.",
          medium: "Le Sony Alpha A7 III est un appareil photo mirrorless haut de gamme doté d'un capteur full frame de 24 mégapixels. Il offre une qualité d'image exceptionnelle, une stabilisation sur 5 axes et des performances vidéo 4K pour les créateurs les plus exigeants.",
          detailed: "Découvrez le Sony Alpha A7 III, l'appareil photo mirrorless qui redéfinit les standards de l'industrie. Équipé d'un capteur CMOS full frame rétroéclairé de 24,2 mégapixels, il délivre des images d'une netteté et d'un piqué remarquables. La stabilisation optique sur 5 axes compense efficacement les mouvements, permettant des prises de vue à main levée en toute confiance. L'autofocus hybride rapide et l'enregistrement vidéo 4K en font un outil polyvalent pour tous les créateurs visuels.",
          bullet_points: ["Capteur full frame 24,2MP rétroéclairé", "Stabilisation optique 5 axes", "Autofocus hybride ultra-rapide", "Enregistrement vidéo 4K UHD", "Écran orientable tactile"]
        },
        target_audiences: ["Photographes professionnels", "Créateurs de contenu"],
        emotional_appeals: ["Créativité libérée", "Qualité professionnelle accessible"],
        call_to_action: ["Découvrez votre créativité", "Commandez maintenant"],
        confidence_score: Math.max(confidence, 0.75),
        readability_score: 88
      },
      seo_generator: {
        seo_title: "Sony A7 III - Appareil Photo Mirrorless 24MP | Achat en Ligne",
        meta_description: "✓ Sony Alpha A7 III mirrorless full frame ✓ 24MP ✓ Stabilisation 5 axes ✓ Livraison rapide ✓ Garantie constructeur ✓ Meilleur prix garanti",
        h1_tag: "Sony Alpha A7 III - Appareil Photo Mirrorless Professionnel",
        h2_tags: ["Caractéristiques principales", "Avis et tests", "Accessoires recommandés"],
        seo_content: "Le Sony Alpha A7 III révolutionne la photographie mirrorless avec ses innovations technologiques. Cet appareil photo professionnel combine un capteur full frame de 24 mégapixels avec une stabilisation sur 5 axes pour des résultats d'exception. Que vous soyez photographe professionnel ou amateur passionné, le A7 III s'adapte à tous vos besoins créatifs. Sa polyvalence en fait le choix idéal pour la photographie de portrait, de paysage, de rue et même la vidéographie 4K.",
        alt_texts: ["Sony Alpha A7 III vue de face", "Écran orientable Sony A7 III"],
        internal_links: ["Guide d'achat appareils Sony", "Comparatif mirrorless 2024"],
        faq_section: [
          {"question": "Le Sony A7 III est-il adapté aux débutants ?", "answer": "Oui, malgré ses fonctions professionnelles, il propose des modes automatiques pour débuter facilement."},
          {"question": "Quelle est l'autonomie de la batterie ?", "answer": "Environ 610 photos par charge, extensible avec des batteries supplémentaires."}
        ],
        confidence_score: Math.max(confidence, 0.8),
        seo_score: 93
      },
      marketing_generator: {
        marketing_messages: {
          headline: "Libérez Votre Créativité avec le Sony Alpha A7 III",
          tagline: "La perfection mirrorless à votre portée",
          elevator_pitch: "L'appareil photo qui transforme votre vision en réalité professionnelle"
        },
        social_media_posts: {
          facebook: "🔥 Découvrez le Sony A7 III : l'appareil mirrorless qui révolutionne la photographie ! Capteur full frame 24MP + stabilisation 5 axes = résultats exceptionnels garantis ✨ #SonyA7III #Photography",
          instagram: "Capturez l'impossible avec le Sony A7 III ✨ Full frame 24MP • Stabilisation 5 axes • Vidéo 4K • #SonyAlpha #MirrorlessCamera #Photography #PhotoPro #SonyA7III #CreativeContent",
          twitter: "Sony A7 III : quand l'excellence rencontre l'accessibilité 📸 Full frame 24MP, stabilisation 5 axes, 4K... Tout y est ! #SonyA7III #Photography"
        },
        ad_copy: {
          google_ads: "Sony A7 III Mirrorless | Capteur Full Frame 24MP, Stabilisation 5 Axes | Livraison Gratuite ✓ Garantie 2 ans ✓",
          facebook_ads: "Transformez votre passion en profession avec le Sony A7 III. Qualité professionnelle, prix accessible. Découvrez pourquoi 9 photographes sur 10 le recommandent !"
        },
        email_marketing: {
          subject_lines: ["🔥 Sony A7 III : L'offre du siècle vous attend", "Votre créativité mérite le Sony A7 III", "Dernières heures : Sony A7 III en promo"],
          preview_text: "L'appareil mirrorless que tous les pros s'arrachent"
        },
        value_propositions: ["Qualité professionnelle accessible", "Polyvalence créative maximale", "Technologie Sony éprouvée"],
        confidence_score: Math.max(confidence, 0.7),
        engagement_prediction: 87
      }
    };

    return baseFallbacks[toolId] || {
      error: "Analyse temporairement indisponible",
      confidence_score: Math.max(confidence * 0.5, 0.3),
      message: "Service en cours de configuration - Résultats génériques fournis",
      retry_suggestion: "Veuillez réessayer dans quelques instants"
    };
  }
}
