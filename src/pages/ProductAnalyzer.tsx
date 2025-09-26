import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductInput } from '@/components/ProductInput';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { ProductAnalysisCard } from '@/components/ProductAnalysisCard';
import { ResultsExport } from '@/components/ResultsExport';
import { EanReviewDialog, type EanReview, type EanCandidate } from '@/components/EanReviewDialog';
import { ProductAnalyzer as ProductAnalyzerService, AnalysisResult, ProductData } from '@/lib/productAnalyzer';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Search, TrendingUp, Target, DollarSign, FileText, Wand2, Globe, MessageSquare } from 'lucide-react';

export interface AnalysisTool {
  id: string;
  name: string;
  description: string;
  category: 'Analyse' | 'Génération' | 'Optimisation';
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  confidenceScore?: number;
}

const ANALYSIS_TOOLS: AnalysisTool[] = [
  {
    id: 'categorizer',
    name: 'Catégorisateur Automatique',
    description: 'Détecte automatiquement la catégorie de produit et suggère des tags pertinents',
    category: 'Analyse',
    icon: Target,
    status: 'pending'
  },
  {
    id: 'competitor',
    name: 'Analyseur Concurrentiel',
    description: 'Analyse les prix et caractéristiques des concurrents en temps réel',
    category: 'Analyse',
    icon: Search,
    status: 'pending'
  },
  {
    id: 'seo_optimizer',
    name: 'Optimiseur SEO',
    description: 'Optimise les descriptions pour le référencement et les moteurs de recherche',
    category: 'Optimisation',
    icon: Globe,
    status: 'pending'
  },
  {
    id: 'trends',
    name: 'Détecteur de Tendances',
    description: 'Identifie les tendances du marché et prédit la popularité du produit',
    category: 'Analyse',
    icon: TrendingUp,
    status: 'pending'
  },
  {
    id: 'price_optimizer',
    name: 'Optimiseur de Prix',
    description: 'Suggère des prix optimaux basés sur le marché et la concurrence',
    category: 'Optimisation',
    icon: DollarSign,
    status: 'pending'
  },
  {
    id: 'content_enhancer',
    name: 'Améliorateur de Contenu',
    description: 'Enrichit automatiquement les descriptions avec des détails pertinents',
    category: 'Génération',
    icon: Wand2,
    status: 'pending'
  },
  {
    id: 'description_generator',
    name: 'Générateur de Descriptions',
    description: 'Génère des descriptions détaillées avec recherche web en temps réel',
    category: 'Génération',
    icon: FileText,
    status: 'pending'
  },
  {
    id: 'seo_generator',
    name: 'Générateur SEO',
    description: 'Crée du contenu optimisé SEO avec recherche de mots-clés',
    category: 'Génération',
    icon: Sparkles,
    status: 'pending'
  },
  {
    id: 'marketing_generator',
    name: 'Générateur Marketing',
    description: 'Produit du contenu marketing persuasif et accrocheur',
    category: 'Génération',
    icon: MessageSquare,
    status: 'pending'
  }
];

const ProductAnalyzer = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Map<string, AnalysisResult>>(new Map());
  const [tools, setTools] = useState<AnalysisTool[]>(ANALYSIS_TOOLS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  
  // EAN Review states
  const [showEanReview, setShowEanReview] = useState(false);
  const [eanReviews, setEanReviews] = useState<EanReview[]>([]);
  const [eanCache, setEanCache] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('eanCache') || '{}');
    } catch {
      return {};
    }
  });
  const [strictEanMode, setStrictEanMode] = useState(true);
  
  const { toast } = useToast();

  const handleProductsChange = (newProducts: ProductData[]) => {
    setProducts(newProducts);
  };

  const handleStartAnalysis = async () => {
    if (products.length === 0) {
      toast({
        title: "Aucun produit",
        description: "Veuillez ajouter au moins un produit à analyser.",
        variant: "destructive"
      });
      return;
    }

    // Check if there are EAN products that need review
    const eanProducts = products.filter(p => p.type === 'ean');
    
    if (eanProducts.length > 0) {
      // Check if all EANs are already in cache
      const uncachedEans = eanProducts.filter(p => !eanCache[p.identifier]);
      
      if (uncachedEans.length > 0 || !strictEanMode) {
        // Need EAN review
        const reviews: EanReview[] = eanProducts.map(product => ({
          ean: product.identifier,
          originalName: product.name,
          candidates: []
        }));
        
        setEanReviews(reviews);
        setShowEanReview(true);
        return;
      }
    }

    // Proceed with direct analysis (no EANs or all cached)
    await startAnalysisWithProducts(products);
  };

  const startAnalysisWithProducts = async (productsToAnalyze: ProductData[]) => {
    setIsAnalyzing(true);
    setActiveTab('results');
    
    // Reset tool statuses
    setTools(prev => prev.map(tool => ({ ...tool, status: 'pending' as const })));
    
    toast({
      title: "🚀 Analyse lancée",
      description: `Analyse de ${productsToAnalyze.length} produit(s) avec ${tools.length} outils.`,
    });

    try {
      const analyzer = new ProductAnalyzerService();
      const results = new Map<string, AnalysisResult>();
      
      // Process each product
      for (const product of productsToAnalyze) {
        // Update tool status to running
        setTools(prev => prev.map(tool => ({ ...tool, status: 'running' as const })));
        
        try {
          const result = await analyzer.analyzeProduct(product, (toolId, status, result) => {
            // Update individual tool status
            setTools(prev => prev.map(tool => 
              tool.id === toolId 
                ? { ...tool, status, result, confidenceScore: result?.confidence_score }
                : tool
            ));
          });
          
          results.set(product.identifier, result);
          
        } catch (error) {
          console.error(`Analysis failed for ${product.identifier}:`, error);
          setTools(prev => prev.map(tool => ({ ...tool, status: 'error' as const })));
          
          toast({
            title: "❌ Erreur d'analyse",
            description: `L'analyse de "${product.name}" a échoué.`,
            variant: "destructive"
          });
        }
      }
      
      setAnalysisResults(results);
      
      toast({
        title: "✅ Analyse terminée",
        description: `${results.size} produit(s) analysé(s) avec succès.`,
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "❌ Erreur critique",
        description: "L'analyse a échoué de manière inattendue.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResolveEan = async (ean: string): Promise<EanCandidate[]> => {
    const analyzer = new ProductAnalyzerService();
    const candidates = await analyzer.resolveEANCandidates(ean);
    
    // Update the review with candidates
    setEanReviews(prev => prev.map(review => 
      review.ean === ean 
        ? { ...review, candidates }
        : review
    ));
    
    return candidates;
  };

  const handleConfirmEanReviews = (confirmed: Record<string, string>) => {
    // Update cache
    const newCache = { ...eanCache, ...confirmed };
    setEanCache(newCache);
    localStorage.setItem('eanCache', JSON.stringify(newCache));

    // Update product names with confirmed names
    const updatedProducts = products.map(product => {
      if (product.type === 'ean' && confirmed[product.identifier]) {
        return { ...product, name: confirmed[product.identifier] };
      }
      return product;
    });

    // Start analysis with updated products
    startAnalysisWithProducts(updatedProducts);
    setShowEanReview(false);
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    setTools(prev => prev.map(tool => 
      tool.status === 'running' ? { ...tool, status: 'pending' as const } : tool
    ));
    
    toast({
      title: "⏸️ Analyse interrompue",
      description: "L'analyse a été interrompue par l'utilisateur.",
    });
  };

  const analysisProgress = {
    completed: tools.filter(t => t.status === 'completed').length,
    running: tools.filter(t => t.status === 'running').length,
    errors: tools.filter(t => t.status === 'error').length,
    total: tools.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Analyseur de Produits IA
          </h1>
          <p className="text-lg font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Analysez vos produits avec 9 outils d'intelligence artificielle avancés pour optimiser vos descriptions, prix et stratégie marketing en temps réel.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/40 rounded-lg p-1">
            <TabsTrigger 
              value="input" 
              className="text-base font-semibold h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              📝 Saisie Produits
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className="text-base font-semibold h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              📊 Résultats
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="text-base font-semibold h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              💾 Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ajouter des produits à analyser</CardTitle>
                <CardDescription>
                  Saisissez les noms de produits ou codes EAN. Vous pouvez en ajouter plusieurs à la fois.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductInput 
                  products={products} 
                  onChange={handleProductsChange}
                  disabled={isAnalyzing}
                />
                
                {/* EAN Mode Toggle */}
                <div className="flex items-center space-x-2 mt-4 p-3 bg-muted/30 rounded-lg">
                  <Switch
                    id="strict-ean"
                    checked={strictEanMode}
                    onCheckedChange={setStrictEanMode}
                  />
                  <Label htmlFor="strict-ean" className="text-sm">
                    Mode EAN strict (validation des codes EAN avant analyse)
                  </Label>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button 
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing || products.length === 0}
                    className="flex-1"
                  >
                    {isAnalyzing ? 'Analyse en cours...' : `Analyser ${products.length} produit(s)`}
                  </Button>
                  
                  {isAnalyzing && (
                    <Button 
                      variant="outline" 
                      onClick={handleStopAnalysis}
                    >
                      Arrêter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <div className="space-y-6">
              {(isAnalyzing || analysisResults.size > 0) && (
                <AnalysisProgress 
                  progress={analysisProgress}
                  isRunning={isAnalyzing}
                  products={products}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <ProductAnalysisCard
                    key={tool.id}
                    tool={tool}
                    onRetry={() => {
                      // TODO: Implement individual tool retry
                      console.log(`Retrying ${tool.id}`);
                    }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ResultsExport 
              products={products}
              results={analysisResults}
              tools={tools}
            />
          </TabsContent>
        </Tabs>
        
        {/* EAN Review Dialog */}
        <EanReviewDialog
          open={showEanReview}
          onOpenChange={setShowEanReview}
          eanReviews={eanReviews}
          onConfirmAll={handleConfirmEanReviews}
          onResolveEan={handleResolveEan}
        />
      </div>
    </div>
  );
};

export default ProductAnalyzer;