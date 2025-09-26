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

    // Enhanced web search with EAN validation
    let webSearchResults: any[] = [];
    let eanValidation: any = null;
    
    try {
      if (product.type === 'ean') {
        // Step 1: EAN-specific search using specialized sources
        eanValidation = await this.performEANValidation(product.identifier);
        
        // Step 2: Enhanced search with validated product info
        webSearchResults = await this.performEnhancedProductSearch(product, eanValidation);
      } else {
        // Standard product name search
        const searchQuery = `"${product.name}" prix caractéristiques spécifications`;
        const searchResponse = await OllamaService.webSearch(searchQuery, 5);
        webSearchResults = searchResponse.results || [];
      }
    } catch (error) {
      console.error('Web search failed:', error);
    }

    // Run all analysis tools in parallel with enhanced context
    const enhancedContext = {
      webSearchResults,
      eanValidation,
      productValidation: product.type === 'ean' && eanValidation ? 
        this.validateProductEANCoherence(product, eanValidation) : null
    };

    const toolPromises = this.ANALYSIS_TOOLS.map(async (toolId) => {
      if (onProgress) onProgress(toolId, 'running');
      
      try {
        const toolResult = await this.runAnalysisTool(toolId, product, enhancedContext);
        
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

  private async runAnalysisTool(toolId: string, product: ProductData, enhancedContext: any): Promise<any> {
    const { webSearchResults, eanValidation, productValidation } = enhancedContext;
    const contextString = webSearchResults?.map(r => `${r.title}: ${r.content}`).join('\n\n') || '';
    
    // Enhanced context with EAN validation info
    const fullContext = {
      webSearchResults: contextString,
      eanValidation,
      productValidation,
      isEANProduct: product.type === 'ean'
    };
    
    switch (toolId) {
      case 'categorizer':
        return this.categorizerTool(product, fullContext);
      
      case 'competitor':
        return this.competitorTool(product, fullContext);
      
      case 'seo_optimizer':
        return this.seoOptimizerTool(product, fullContext);
      
      case 'trends':
        return this.trendsTool(product, fullContext);
      
      case 'price_optimizer':
        return this.priceOptimizerTool(product, fullContext);
      
      case 'content_enhancer':
        return this.contentEnhancerTool(product, fullContext);
      
      case 'description_generator':
        return this.descriptionGeneratorTool(product, fullContext);
      
      case 'seo_generator':
        return this.seoGeneratorTool(product, fullContext);
      
      case 'marketing_generator':
        return this.marketingGeneratorTool(product, fullContext);
      
      default:
        throw new Error(`Unknown tool: ${toolId}`);
    }
  }

  private async categorizerTool(product: ProductData, context: any): Promise<any> {
    const eanInfo = context.eanValidation ? 
      `\n\nINFORMATIONS EAN VALIDÉES (PRIORITAIRES):
Code EAN: ${product.identifier}
Nom réel du produit: ${context.eanValidation.realProductName || 'Non trouvé'}
Catégorie EAN: ${context.eanValidation.category || 'Non trouvée'}
Marque EAN: ${context.eanValidation.brand || 'Non trouvée'}
IMPORTANT: Ces informations EAN sont prioritaires sur le nom fourni par l'utilisateur.` : '';

    const validationWarning = context.productValidation && !context.productValidation.isCoherent ?
      `\n\nATTENTION: Incohérence détectée entre le nom fourni "${product.name}" et le nom EAN "${context.eanValidation?.realProductName}". Utilisez les données EAN comme référence.` : '';

    const prompt = `Analysez ce produit et déterminez sa catégorie précise, ses tags pertinants et ses caractéristiques principales.

Nom fourni: ${product.name}
${product.type === 'ean' ? `Code EAN: ${product.identifier}` : ''}${eanInfo}${validationWarning}

Contexte web recherche:
${context.webSearchResults}

IMPORTANT: 
- Si c'est un produit EAN, les informations EAN validées sont PRIORITAIRES
- Répondez UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans backticks, sans formatage markdown.
- Utilisez le nom réel du produit basé sur l'EAN si disponible

Exemple de format attendu:
{
  "category": "catégorie principale",
  "subcategory": "sous-catégorie", 
  "tags": ["tag1", "tag2", "tag3"],
  "characteristics": ["carac1", "carac2"],
  "brand": "marque si identifiée",
  "real_product_name": "nom réel si différent du nom fourni",
  "ean_coherence": true/false,
  "confidence_score": 0.85
}`;

    return await this.executeToolWithRetry(prompt, 'categorizer', 0.85);
  }

  private async competitorTool(product: ProductData, context: any): Promise<any> {
    const eanInfo = context.eanValidation ? 
      `\nInformations EAN validées: ${context.eanValidation.realProductName || product.name}` : '';

    const prompt = `Analysez la concurrence de ce produit en identifiant les concurrents directs, leurs prix et leurs avantages.

Produit: ${context.eanValidation?.realProductName || product.name}${eanInfo}
Contexte: ${context.webSearchResults}

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

  private async seoOptimizerTool(product: ProductData, context: any): Promise<any> {
    const realName = context.eanValidation?.realProductName || product.name;
    
    const prompt = `Optimisez le SEO de ce produit en proposant des mots-clés, méta-descriptions et titres optimisés.

Produit: ${realName}
Contexte: ${context.webSearchResults}

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

  private async trendsTool(product: ProductData, context: any): Promise<any> {
    const realName = context.eanValidation?.realProductName || product.name;
    
    const prompt = `Analysez les tendances du marché pour ce produit et prédisez sa popularité.

Produit: ${realName}
Contexte: ${context.webSearchResults}

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

  private async priceOptimizerTool(product: ProductData, context: any): Promise<any> {
    const realName = context.eanValidation?.realProductName || product.name;
    
    const prompt = `Analysez les prix du marché et suggérez une stratégie de prix optimale.

Produit: ${realName}
Contexte: ${context.webSearchResults}

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

  private async contentEnhancerTool(product: ProductData, context: any): Promise<any> {
    const realName = context.eanValidation?.realProductName || product.name;
    
    const prompt = `Enrichissez le contenu de ce produit avec des détails pertinents et des spécifications techniques.

Produit: ${realName}
Contexte: ${context.webSearchResults}

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

  private async descriptionGeneratorTool(product: ProductData, context: any): Promise<any> {
    const realName = context.eanValidation?.realProductName || product.name;
    
    const prompt = `Générez une description détaillée et attractive pour ce produit.

Produit: ${realName}
Contexte: ${context.webSearchResults}

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

  private async seoGeneratorTool(product: ProductData, context: any): Promise<any> {
    const realName = context.eanValidation?.realProductName || product.name;
    
    const prompt = `Générez du contenu SEO optimisé pour ce produit incluant FAQ et contenu structuré.

Produit: ${realName}
Contexte: ${context.webSearchResults}

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

  private async marketingGeneratorTool(product: ProductData, context: any): Promise<any> {
    const realName = context.eanValidation?.realProductName || product.name;
    
    const prompt = `Créez du contenu marketing persuasif pour ce produit.

Produit: ${realName}
Contexte: ${context.webSearchResults}

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

  // New methods for enhanced EAN handling
  private async performEANValidation(eanCode: string): Promise<any> {
    try {
      console.log(`[EAN Validation] Starting for EAN: ${eanCode}`);
      
      // Step 1: Search specialized EAN databases
      const eanSpecificQuery = `"${eanCode}" site:eandata.com OR site:barcodelookup.com OR site:openfoodfacts.org OR site:upcitemdb.com`;
      const eanResponse = await OllamaService.webSearch(eanSpecificQuery, 3);
      
      // Step 2: Extract real product information from EAN results
      if (eanResponse.results && eanResponse.results.length > 0) {
        const eanContext = eanResponse.results.map(r => `${r.title}: ${r.content}`).join('\n\n');
        
        const extractionPrompt = `Extrayez les informations précises du produit à partir des données EAN spécialisées.

Code EAN: ${eanCode}

Données des bases EAN spécialisées:
${eanContext}

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide contenant les informations réelles du produit.

{
  "realProductName": "nom exact du produit selon l'EAN",
  "brand": "marque exacte",
  "category": "catégorie selon EAN", 
  "description": "description courte",
  "specifications": ["spec1", "spec2"],
  "confidence_score": 0.9,
  "source": "source de l'information"
}`;

        const validation = await this.executeToolWithRetry(extractionPrompt, 'ean_validation', 0.9);
        console.log(`[EAN Validation] Success:`, validation.data);
        return validation.data;
      }
      
      return null;
    } catch (error) {
      console.error('[EAN Validation] Failed:', error);
      return null;
    }
  }

  private async performEnhancedProductSearch(product: ProductData, eanValidation: any): Promise<any[]> {
    try {
      const realProductName = eanValidation?.realProductName || product.name;
      const brand = eanValidation?.brand;
      
      // Enhanced search query using real product info from EAN
      const enhancedQuery = brand ? 
        `"${realProductName}" "${brand}" prix spécifications -${product.name}` :
        `"${realProductName}" "${product.identifier}" prix caractéristiques`;
      
      console.log(`[Enhanced Search] Query: ${enhancedQuery}`);
      const searchResponse = await OllamaService.webSearch(enhancedQuery, 5);
      
      return searchResponse.results || [];
    } catch (error) {
      console.error('[Enhanced Search] Failed:', error);
      return [];
    }
  }

  private validateProductEANCoherence(product: ProductData, eanValidation: any): any {
    if (!eanValidation || !eanValidation.realProductName) {
      return { isCoherent: false, reason: 'No EAN validation data' };
    }

    const providedName = product.name.toLowerCase();
    const realName = eanValidation.realProductName.toLowerCase();
    
    // Simple coherence check - can be enhanced with fuzzy matching
    const similarity = this.calculateStringSimilarity(providedName, realName);
    const isCoherent = similarity > 0.6; // 60% similarity threshold
    
    return {
      isCoherent,
      similarity,
      providedName: product.name,
      realName: eanValidation.realProductName,
      reason: isCoherent ? 'Names are coherent' : `Names too different: "${product.name}" vs "${eanValidation.realProductName}"`
    };
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity based on words
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
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