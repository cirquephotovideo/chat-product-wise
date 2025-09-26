import { supabase } from '@/integrations/supabase/client';
import { OllamaService } from './ollama';

export interface ProductData {
  identifier: string; // EAN code or product name
  name: string;
  type: 'ean' | 'name';
}

export interface AnalysisResult {
  productId: string;
  tools: {
    [toolId: string]: {
      status: 'completed' | 'error';
      data?: any;
      error?: string;
      confidence_score?: number;
    };
  };
  createdAt: Date;
}

export interface ToolProgress {
  toolId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

export type ProgressCallback = (toolId: string, status: ToolProgress['status'], result?: any) => void;

export class ProductAnalyzer {
  private readonly ANALYSIS_TOOLS = [
    'categorizer',
    'competitor',
    'seo_optimizer', 
    'trends',
    'price_optimizer',
    'content_enhancer',
    'description_generator',
    'seo_generator',
    'marketing_generator'
  ];

  async analyzeProduct(product: ProductData, onProgress?: ProgressCallback): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      productId: product.identifier,
      tools: {},
      createdAt: new Date()
    };

    // First, perform web search to get product context
    let webSearchResults: any[] = [];
    try {
      const searchQuery = `${product.name} ${product.type === 'ean' ? 'EAN ' + product.identifier : ''} prix caractéristiques`;
      const searchResponse = await OllamaService.webSearch(searchQuery, 5);
      webSearchResults = searchResponse.results || [];
    } catch (error) {
      console.error('Web search failed:', error);
    }

    // Run all analysis tools in parallel
    const toolPromises = this.ANALYSIS_TOOLS.map(async (toolId) => {
      if (onProgress) onProgress(toolId, 'running');
      
      try {
        const toolResult = await this.runAnalysisTool(toolId, product, webSearchResults);
        
        result.tools[toolId] = {
          status: 'completed',
          data: toolResult.data,
          confidence_score: toolResult.confidence_score || 0.8
        };
        
        // Save to Supabase
        await this.saveToolResult(toolId, product, toolResult);
        
        if (onProgress) onProgress(toolId, 'completed', toolResult);
        
      } catch (error) {
        console.error(`Tool ${toolId} failed:`, error);
        result.tools[toolId] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        if (onProgress) onProgress(toolId, 'error');
      }
    });

    await Promise.all(toolPromises);
    return result;
  }

  private async runAnalysisTool(toolId: string, product: ProductData, webContext: any[]): Promise<any> {
    const contextString = webContext.map(r => `${r.title}: ${r.content}`).join('\n\n');
    
    switch (toolId) {
      case 'categorizer':
        return this.categorizerTool(product, contextString);
      
      case 'competitor':
        return this.competitorTool(product, contextString);
      
      case 'seo_optimizer':
        return this.seoOptimizerTool(product, contextString);
      
      case 'trends':
        return this.trendsTool(product, contextString);
      
      case 'price_optimizer':
        return this.priceOptimizerTool(product, contextString);
      
      case 'content_enhancer':
        return this.contentEnhancerTool(product, contextString);
      
      case 'description_generator':
        return this.descriptionGeneratorTool(product, contextString);
      
      case 'seo_generator':
        return this.seoGeneratorTool(product, contextString);
      
      case 'marketing_generator':
        return this.marketingGeneratorTool(product, contextString);
      
      default:
        throw new Error(`Unknown tool: ${toolId}`);
    }
  }

  private async categorizerTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Analysez ce produit et déterminez sa catégorie précise, ses tags pertinents et ses caractéristiques principales.

Produit: ${product.name}
${product.type === 'ean' ? `Code EAN: ${product.identifier}` : ''}

Contexte web:
${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "category": "catégorie principale",
  "subcategory": "sous-catégorie", 
  "tags": ["tag1", "tag2", "tag3"],
  "characteristics": ["carac1", "carac2"],
  "brand": "marque si identifiée",
  "confidence_score": 0.85
}`;

    return await this.executeToolWithRetry(prompt, 'categorizer', 0.85);
  }

  private async competitorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Analysez la concurrence de ce produit en identifiant les concurrents directs, leurs prix et leurs avantages.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "competitors": [
    {
      "name": "concurrent 1", 
      "price": "prix si trouvé",
      "advantages": ["avantage 1", "avantage 2"],
      "url": "url si disponible"
    }
  ],
  "market_position": "positionnement du produit",
  "price_range": {"min": 0, "max": 0},
  "confidence_score": 0.75
}`;

    return await this.executeToolWithRetry(prompt, 'competitor', 0.75);
  }

  private async seoOptimizerTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Optimisez le SEO de ce produit en proposant des mots-clés, méta-descriptions et titres optimisés.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "title_seo": "titre optimisé SEO (max 60 chars)",
  "meta_description": "méta description (max 160 chars)", 
  "keywords": ["mot-clé1", "mot-clé2"],
  "h1_suggestion": "titre H1 optimisé",
  "url_slug": "url-optimise-seo",
  "confidence_score": 0.9
}`;

    return await this.executeToolWithRetry(prompt, 'seo_optimizer', 0.9);
  }

  private async trendsTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Analysez les tendances du marché pour ce produit et prédisez sa popularité.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "trend_score": 0.8,
  "trend_direction": "croissante",
  "seasonal_factors": ["facteur1", "facteur2"],
  "popularity_prediction": "prédiction sur 6 mois", 
  "trending_keywords": ["tendance1", "tendance2"],
  "confidence_score": 0.7
}`;

    return await this.executeToolWithRetry(prompt, 'trends', 0.7);
  }

  private async priceOptimizerTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Analysez les prix du marché et suggérez une stratégie de prix optimale.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "suggested_price_range": {"min": 10, "max": 100},
  "market_average": 50,
  "pricing_strategy": "stratégie recommandée",
  "margin_recommendations": "recommandations de marge",
  "competitor_prices": [{"name": "concurrent", "price": 45}],
  "confidence_score": 0.8
}`;

    return await this.executeToolWithRetry(prompt, 'price_optimizer', 0.8);
  }

  private async contentEnhancerTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Enrichissez le contenu de ce produit avec des détails pertinents et des spécifications techniques.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "enhanced_features": ["fonctionnalité 1", "fonctionnalité 2"],
  "technical_specs": {"spec1": "valeur1", "spec2": "valeur2"},
  "usage_scenarios": ["usage 1", "usage 2"],
  "compatibility": ["compatible avec 1", "compatible avec 2"],
  "warranty_info": "informations garantie",
  "confidence_score": 0.85
}`;

    return await this.executeToolWithRetry(prompt, 'content_enhancer', 0.85);
  }

  private async descriptionGeneratorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Générez une description détaillée et attractive pour ce produit.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "short_description": "description courte (1-2 phrases)",
  "long_description": "description détaillée (plusieurs paragraphes)",
  "bullet_points": ["point 1", "point 2", "point 3"],
  "call_to_action": "appel à l'action suggéré",
  "confidence_score": 0.9
}`;

    return await this.executeToolWithRetry(prompt, 'description_generator', 0.9);
  }

  private async seoGeneratorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Générez du contenu SEO optimisé pour ce produit incluant FAQ et contenu structuré.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "faq": [{"question": "Q1", "answer": "R1"}],
  "structured_data": {"@type": "Product", "name": "nom", "description": "desc"},
  "seo_content": "contenu SEO additionnel",
  "related_searches": ["recherche 1", "recherche 2"],
  "confidence_score": 0.85
}`;

    return await this.executeToolWithRetry(prompt, 'seo_generator', 0.85);
  }

  private async marketingGeneratorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Créez du contenu marketing persuasif pour ce produit.

Produit: ${product.name}
Contexte: ${context}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.

Exemple de format attendu:
{
  "headline": "titre accrocheur",
  "value_propositions": ["proposition 1", "proposition 2"],
  "benefits": ["bénéfice 1", "bénéfice 2"],
  "social_proof": "preuve sociale suggérée",
  "urgency_triggers": ["déclencheur 1", "déclencheur 2"],
  "target_audience": "audience cible",
  "confidence_score": 0.8
}`;

    return await this.executeToolWithRetry(prompt, 'marketing_generator', 0.8);
  }

  private async saveToolResult(toolId: string, product: ProductData, result: any): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { error } = await supabase
        .from('magic_tools_results')
        .insert({
          user_id: user.id,
          tool_id: toolId,
          tool_name: this.getToolName(toolId),
          product_name: product.name,
          result_data: result.data,
          confidence_score: result.confidence_score,
          metadata: {
            product_identifier: product.identifier,
            product_type: product.type,
            analyzed_at: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Failed to save tool result:', error);
      }
    } catch (error) {
      console.error('Failed to save to Supabase:', error);
    }
  }

  private getToolName(toolId: string): string {
    const toolNames: { [key: string]: string } = {
      'categorizer': 'Catégorisateur Automatique',
      'competitor': 'Analyseur Concurrentiel',
      'seo_optimizer': 'Optimiseur SEO',
      'trends': 'Détecteur de Tendances',
      'price_optimizer': 'Optimiseur de Prix',
      'content_enhancer': 'Améliorateur de Contenu',
      'description_generator': 'Générateur de Descriptions',
      'seo_generator': 'Générateur SEO',
      'marketing_generator': 'Générateur Marketing'
    };
    
    return toolNames[toolId] || toolId;
  }

  private async executeToolWithRetry(prompt: string, toolId: string, defaultConfidence: number, maxRetries: number = 3): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${toolId}] Attempt ${attempt}/${maxRetries}`);
        
        // Use a more reliable model for better consistency
        const response = await OllamaService.chat('deepseek-v3.1:671b-cloud', [
          { 
            role: 'system', 
            content: 'Vous êtes un assistant spécialisé en analyse de produits. Répondez TOUJOURS et UNIQUEMENT avec du JSON valide, sans aucun texte additionnel.' 
          },
          { role: 'user', content: prompt }
        ]);

        console.log(`[${toolId}] Raw response:`, response.substring(0, 200) + '...');
        
        // Clean and validate JSON response
        const cleanedResponse = this.cleanJsonResponse(response);
        console.log(`[${toolId}] Cleaned response:`, cleanedResponse.substring(0, 200) + '...');
        
        const parsedData = this.parseJsonSafely(cleanedResponse);
        
        if (!parsedData) {
          throw new Error(`Failed to parse JSON for ${toolId}`);
        }

        // Validate required structure
        if (!this.validateToolResponse(parsedData, toolId)) {
          throw new Error(`Invalid response structure for ${toolId}`);
        }

        console.log(`[${toolId}] Success on attempt ${attempt}`);
        return {
          data: parsedData,
          confidence_score: parsedData.confidence_score || defaultConfidence
        };

      } catch (error) {
        console.error(`[${toolId}] Attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`[${toolId}] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed, return fallback response
    console.error(`[${toolId}] All retries failed, using fallback`);
    return this.getFallbackResponse(toolId, defaultConfidence);
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any text before the first {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > -1 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // Remove common prefixes
    cleaned = cleaned.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    return cleaned.trim();
  }

  private parseJsonSafely(jsonString: string): any | null {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parsing failed:', error);
      
      // Try to fix common JSON issues
      try {
        // Fix unescaped quotes in strings
        let fixed = jsonString.replace(/": "([^"]*)"([^",}\]])/g, '": "$1\\"$2');
        fixed = fixed.replace(/": "([^"]*)"/g, (match, content) => {
          return '": "' + content.replace(/"/g, '\\"') + '"';
        });
        
        return JSON.parse(fixed);
      } catch (secondError) {
        console.error('JSON fix attempt failed:', secondError);
        return null;
      }
    }
  }

  private validateToolResponse(data: any, toolId: string): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Basic validation - ensure it's an object and has some content
    const keys = Object.keys(data);
    return keys.length > 0;
  }

  private getFallbackResponse(toolId: string, confidence: number): any {
    const fallbackResponses: { [key: string]: any } = {
      'categorizer': {
        data: {
          category: 'Produit général',
          subcategory: 'Non classifié',
          tags: ['produit', 'général'],
          characteristics: ['À analyser'],
          brand: 'Non identifiée',
          confidence_score: 0.3
        },
        confidence_score: 0.3
      },
      'competitor': {
        data: {
          competitors: [],
          market_position: 'À analyser',
          price_range: { min: 0, max: 0 },
          confidence_score: 0.3
        },
        confidence_score: 0.3
      },
      'seo_optimizer': {
        data: {
          title_seo: 'Titre à optimiser',
          meta_description: 'Description à optimiser',
          keywords: ['produit'],
          h1_suggestion: 'Titre H1 à optimiser',
          url_slug: 'produit-a-optimiser',
          confidence_score: 0.3
        },
        confidence_score: 0.3
      }
    };

    return fallbackResponses[toolId] || {
      data: { error: 'Analyse indisponible', confidence_score: 0.1 },
      confidence_score: 0.1
    };
  }
}