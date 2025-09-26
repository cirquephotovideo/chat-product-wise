import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductInput } from '@/components/ProductInput';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { ProductAnalysisCard } from '@/components/ProductAnalysisCard';
import { ResultsExport } from '@/components/ResultsExport';
import { ProductAnalyzer as ProductAnalyzerService, AnalysisResult, ProductData } from '@/lib/productAnalyzer';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Search, TrendingUp, Target, DollarSign, FileText, Wand2, Globe, MessageSquare, Home, Bot } from 'lucide-react';

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

    setIsAnalyzing(true);
    setActiveTab('results');
    
    // Reset tool statuses
    setTools(prev => prev.map(tool => ({ ...tool, status: 'pending' as const })));
    
    toast({
      title: "🚀 Analyse lancée",
      description: `Analyse de ${products.length} produit(s) avec ${tools.length} outils.`,
    });

    try {
      const analyzer = new ProductAnalyzerService();
      const results = new Map<string, AnalysisResult>();
      
      // Process each product
      for (const product of products) {
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
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <div className="text-sm text-muted-foreground">•</div>
              <span className="text-sm font-medium">Analyseur de Produits</span>
            </div>
            <Link to="/chat">
              <Button variant="outline" size="sm">
                <Bot className="w-4 h-4 mr-2" />
                Chat IA
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analyseur de Produits IA</h1>
          <p className="text-muted-foreground">
            Analysez vos produits avec 9 outils d'intelligence artificielle pour optimiser vos descriptions, prix et stratégie marketing.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">📝 Saisie Produits</TabsTrigger>
            <TabsTrigger value="results">📊 Résultats</TabsTrigger>
            <TabsTrigger value="export">💾 Export</TabsTrigger>
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
      </div>
    </div>
  );
};

export default ProductAnalyzer;