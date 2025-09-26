import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileJson, FileText, Database, Share2 } from 'lucide-react';
import { ProductData, AnalysisResult } from '@/lib/productAnalyzer';
import { AnalysisTool } from '@/pages/ProductAnalyzer';
import { useToast } from '@/hooks/use-toast';

interface ResultsExportProps {
  products: ProductData[];
  results: Map<string, AnalysisResult>;
  tools: AnalysisTool[];
}

export const ResultsExport: React.FC<ResultsExportProps> = ({ products, results, tools }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const completedResults = tools.filter(tool => tool.status === 'completed').length;
  const totalResults = results.size * tools.length;

  const exportToJSON = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalProducts: products.length,
        totalResults: completedResults,
        toolsUsed: tools.map(t => ({ id: t.id, name: t.name, status: t.status }))
      },
      products: products.map(product => ({
        ...product,
        analysisResults: results.get(product.identifier) || null
      })),
      toolResults: tools.reduce((acc, tool) => {
        acc[tool.id] = {
          name: tool.name,
          description: tool.description,
          category: tool.category,
          status: tool.status,
          result: tool.result,
          confidenceScore: tool.confidenceScore
        };
        return acc;
      }, {} as any)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-produits-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "✅ Export terminé",
      description: "Le fichier JSON a été téléchargé.",
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Produit',
      'Identifiant', 
      'Type',
      'Catégorie Détectée',
      'Score de Tendance',
      'Prix Suggéré Min',
      'Prix Suggéré Max',
      'Mots-clés SEO',
      'Score de Confiance Moyen'
    ];

    const rows = products.map(product => {
      const result = results.get(product.identifier);
      const productTools = tools.filter(t => t.status === 'completed');
      
      const avgConfidence = productTools.length > 0 
        ? productTools.reduce((sum, tool) => sum + (tool.confidenceScore || 0), 0) / productTools.length
        : 0;

      // Extract key data from different tools
      const categorizerResult = tools.find(t => t.id === 'categorizer')?.result?.data;
      const trendsResult = tools.find(t => t.id === 'trends')?.result?.data;
      const priceResult = tools.find(t => t.id === 'price_optimizer')?.result?.data;
      const seoResult = tools.find(t => t.id === 'seo_optimizer')?.result?.data;

      return [
        product.name,
        product.identifier,
        product.type,
        categorizerResult?.category || '',
        trendsResult?.trend_score || '',
        priceResult?.suggested_price_range?.min || '',
        priceResult?.suggested_price_range?.max || '',
        Array.isArray(seoResult?.keywords) ? seoResult.keywords.join(';') : '',
        Math.round(avgConfidence * 100) + '%'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-produits-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "✅ Export terminé",
      description: "Le fichier CSV a été téléchargé.",
    });
  };

  const exportSummaryReport = () => {
    const report = `RAPPORT D'ANALYSE DE PRODUITS
===============================

Généré le : ${new Date().toLocaleString('fr-FR')}
Nombre de produits analysés : ${products.length}
Outils utilisés : ${tools.length}
Analyses terminées : ${completedResults}

RÉSUMÉ PAR PRODUIT
==================

${products.map(product => {
  const productTools = tools.filter(t => t.status === 'completed');
  const avgConfidence = productTools.length > 0 
    ? productTools.reduce((sum, tool) => sum + (tool.confidenceScore || 0), 0) / productTools.length
    : 0;

  return `
Produit : ${product.name}
Identifiant : ${product.identifier}
Type : ${product.type === 'ean' ? 'Code EAN' : 'Nom de produit'}
Score de confiance moyen : ${Math.round(avgConfidence * 100)}%

Outils utilisés :
${tools.map(tool => `  - ${tool.name}: ${tool.status === 'completed' ? '✅ Terminé' : 
    tool.status === 'error' ? '❌ Erreur' : 
    tool.status === 'running' ? '⏳ En cours' : '⏸️ En attente'}`).join('\n')}
`;
}).join('\n---\n')}

RÉSUMÉ DES OUTILS
=================

${tools.map(tool => `
${tool.name} (${tool.category})
${tool.description}
Statut : ${tool.status === 'completed' ? '✅ Terminé' : 
    tool.status === 'error' ? '❌ Erreur' : 
    tool.status === 'running' ? '⏳ En cours' : '⏸️ En attente'}
${tool.confidenceScore ? `Score de confiance : ${Math.round(tool.confidenceScore * 100)}%` : ''}
`).join('\n')}
`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-analyse-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "✅ Rapport généré",
      description: "Le rapport d'analyse a été téléchargé.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export et Sauvegarde
          </CardTitle>
          <CardDescription>
            Exportez les résultats de vos analyses sous différents formats ou partagez-les.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{products.length}</div>
              <div className="text-sm text-muted-foreground">Produits</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{completedResults}</div>
              <div className="text-sm text-muted-foreground">Analyses terminées</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{tools.filter(t => t.status === 'error').length}</div>
              <div className="text-sm text-muted-foreground">Erreurs</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {completedResults > 0 ? Math.round((completedResults / (products.length * tools.length)) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Complétude</div>
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Options d'export</h3>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button 
                onClick={exportToJSON}
                className="h-auto p-4 flex-col items-start text-left"
                variant="outline"
                disabled={results.size === 0}
              >
                <div className="flex items-center gap-2 w-full">
                  <FileJson className="h-5 w-5" />
                  <span className="font-medium">Export JSON</span>
                </div>
                <span className="text-sm text-muted-foreground mt-2">
                  Données complètes pour intégration technique
                </span>
              </Button>

              <Button 
                onClick={exportToCSV}
                className="h-auto p-4 flex-col items-start text-left"
                variant="outline"
                disabled={results.size === 0}
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Export CSV</span>
                </div>
                <span className="text-sm text-muted-foreground mt-2">
                  Tableau pour Excel ou Google Sheets
                </span>
              </Button>

              <Button 
                onClick={exportSummaryReport}
                className="h-auto p-4 flex-col items-start text-left"
                variant="outline"
                disabled={results.size === 0}
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Rapport texte</span>
                </div>
                <span className="text-sm text-muted-foreground mt-2">
                  Résumé lisible des analyses
                </span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Saved in Database */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Sauvegarde automatique</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tous les résultats d'analyse sont automatiquement sauvegardés dans votre base de données Supabase. 
              Vous pouvez les retrouver et les consulter à tout moment.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {completedResults} résultats sauvegardés
              </Badge>
              <Badge variant="outline" className="text-xs">
                Synchronisation automatique
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};