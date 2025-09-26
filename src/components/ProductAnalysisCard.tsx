import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Eye, 
  TrendingUp,
  Target,
  Search,
  Globe,
  DollarSign,
  Wand2,
  FileText,
  Sparkles,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { AnalysisTool } from '@/pages/ProductAnalyzer';

interface ProductAnalysisCardProps {
  tool: AnalysisTool;
  onRetry: () => void;
}

const getStatusIcon = (status: AnalysisTool['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: AnalysisTool['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    case 'running':
      return 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    case 'error':
      return 'bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    default:
      return 'bg-muted/20 border-muted';
  }
};

const getCategoryBadgeColor = (category: AnalysisTool['category']) => {
  switch (category) {
    case 'Analyse':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'Génération':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'Optimisation':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatResultData = (result: any) => {
  if (!result || typeof result !== 'object') return [];
  
  const entries = Object.entries(result);
  if (entries.length === 0) return [];
  
  return entries.slice(0, 4).map(([key, value]) => {
    let displayValue = '';
    
    if (Array.isArray(value)) {
      displayValue = `${value.length} élément(s)`;
    } else if (typeof value === 'object' && value !== null) {
      displayValue = `${Object.keys(value).length} propriété(s)`;
    } else {
      const stringValue = String(value);
      displayValue = stringValue.length > 80 ? stringValue.substring(0, 80) + '...' : stringValue;
    }
    
    return {
      key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: displayValue
    };
  });
};

export const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({ tool, onRetry }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const IconComponent = tool.icon;
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${getStatusColor(tool.status)} border-2`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-background shadow-sm border">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold tracking-tight leading-tight">
                {tool.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="secondary" 
                  className={`text-sm font-semibold px-3 py-1 ${getCategoryBadgeColor(tool.category)}`}
                >
                  {tool.category}
                </Badge>
                {tool.confidenceScore && (
                  <Badge variant="outline" className="text-sm font-medium border-2">
                    {Math.round(tool.confidenceScore * 100)}% confiance
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(tool.status)}
          </div>
        </div>
        
        <CardDescription className="text-base font-medium text-muted-foreground mt-3 leading-relaxed">
          {tool.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {tool.status === 'running' && (
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="text-base font-semibold text-blue-800 dark:text-blue-200">
                Analyse en cours...
              </span>
            </div>
            <Progress value={undefined} className="h-3 bg-blue-100" />
          </div>
        )}

        {tool.status === 'completed' && tool.result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-base font-bold text-green-800 dark:text-green-200">
                  Analyse terminée
                </span>
              </div>
              {tool.confidenceScore && (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={tool.confidenceScore * 100} 
                    className="h-3 w-24 bg-green-100"
                  />
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    {Math.round(tool.confidenceScore * 100)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-4 border-2">
                <h4 className="text-base font-bold text-foreground mb-3">Résultats clés</h4>
                <div className="space-y-3">
                  {formatResultData(tool.result.data).map((item, index) => (
                    <div key={index} className="flex flex-col space-y-1">
                      <span className="text-sm font-bold text-primary uppercase tracking-wide">
                        {item.key}
                      </span>
                      <span className="text-base font-medium text-foreground leading-relaxed">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="font-semibold border-2 hover:bg-muted"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isExpanded ? 'Masquer les détails' : 'Voir tous les détails'}
              </Button>
              
              {isExpanded && (
                <div className="bg-background border-2 p-4 rounded-lg">
                  <h5 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">
                    Données complètes (JSON)
                  </h5>
                  <pre className="text-sm font-mono bg-muted/30 p-4 rounded border overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(tool.result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {tool.status === 'error' && (
          <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-base font-bold text-red-800 dark:text-red-200">
                Erreur d'analyse
              </span>
            </div>
            <p className="text-base font-medium text-red-700 dark:text-red-300 leading-relaxed">
              Une erreur est survenue lors de l'analyse. Veuillez réessayer.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="font-semibold border-red-300 text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réessayer l'analyse
            </Button>
          </div>
        )}

        {tool.status === 'pending' && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border-2">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-base font-semibold text-muted-foreground">
                En attente du démarrage
              </span>
            </div>
            <p className="text-base font-medium text-muted-foreground leading-relaxed">
              L'analyse démarrera automatiquement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};