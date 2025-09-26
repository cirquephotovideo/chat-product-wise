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

Répondez au format JSON:
{
  "category": "catégorie principale",
  "subcategory": "sous-catégorie",
  "tags": ["tag1", "tag2", "tag3"],
  "characteristics": ["carac1", "carac2"],
  "brand": "marque si identifiée",
  "confidence_score": 0.85
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.85
    };
  }

  private async competitorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Analysez la concurrence de ce produit en identifiant les concurrents directs, leurs prix et leurs avantages.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
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

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.75
    };
  }

  private async seoOptimizerTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Optimisez le SEO de ce produit en proposant des mots-clés, méta-descriptions et titres optimisés.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
{
  "title_seo": "titre optimisé SEO (max 60 chars)",
  "meta_description": "méta description (max 160 chars)",
  "keywords": ["mot-clé1", "mot-clé2"],
  "h1_suggestion": "titre H1 optimisé",
  "url_slug": "url-optimise-seo",
  "confidence_score": 0.9
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.9
    };
  }

  private async trendsTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Analysez les tendances du marché pour ce produit et prédisez sa popularité.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
{
  "trend_score": 0.8,
  "trend_direction": "croissante|stable|décroissante",
  "seasonal_factors": ["facteur1", "facteur2"],
  "popularity_prediction": "prédiction sur 6 mois",
  "trending_keywords": ["tendance1", "tendance2"],
  "confidence_score": 0.7
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.7
    };
  }

  private async priceOptimizerTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Analysez les prix du marché et suggérez une stratégie de prix optimale.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
{
  "suggested_price_range": {"min": 0, "max": 0},
  "market_average": 0,
  "pricing_strategy": "stratégie recommandée",
  "margin_recommendations": "recommandations de marge",
  "competitor_prices": [{"name": "concurrent", "price": 0}],
  "confidence_score": 0.8
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.8
    };
  }

  private async contentEnhancerTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Enrichissez le contenu de ce produit avec des détails pertinents et des spécifications techniques.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
{
  "enhanced_features": ["fonctionnalité 1", "fonctionnalité 2"],
  "technical_specs": {"spec1": "valeur1", "spec2": "valeur2"},
  "usage_scenarios": ["usage 1", "usage 2"],
  "compatibility": ["compatible avec 1", "compatible avec 2"],
  "warranty_info": "informations garantie",
  "confidence_score": 0.85
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.85
    };
  }

  private async descriptionGeneratorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Générez une description détaillée et attractive pour ce produit.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
{
  "short_description": "description courte (1-2 phrases)",
  "long_description": "description détaillée (plusieurs paragraphes)",
  "bullet_points": ["point 1", "point 2", "point 3"],
  "call_to_action": "appel à l'action suggéré",
  "confidence_score": 0.9
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.9
    };
  }

  private async seoGeneratorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Générez du contenu SEO optimisé pour ce produit incluant FAQ et contenu structuré.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
{
  "faq": [{"question": "Q1", "answer": "R1"}],
  "structured_data": {"@type": "Product", "name": "nom", "description": "desc"},
  "seo_content": "contenu SEO additionnel",
  "related_searches": ["recherche 1", "recherche 2"],
  "confidence_score": 0.85
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.85
    };
  }

  private async marketingGeneratorTool(product: ProductData, context: string): Promise<any> {
    const prompt = `Créez du contenu marketing persuasif pour ce produit.

Produit: ${product.name}
Contexte: ${context}

Répondez au format JSON:
{
  "headline": "titre accrocheur",
  "value_propositions": ["proposition 1", "proposition 2"],
  "benefits": ["bénéfice 1", "bénéfice 2"],
  "social_proof": "preuve sociale suggérée",
  "urgency_triggers": ["déclencheur 1", "déclencheur 2"],
  "target_audience": "audience cible",
  "confidence_score": 0.8
}`;

    const response = await OllamaService.chat('gpt-oss:20b-cloud', [
      { role: 'user', content: prompt }
    ]);

    return {
      data: JSON.parse(response),
      confidence_score: 0.8
    };
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
}