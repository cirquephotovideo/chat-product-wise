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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  if (!result || typeof result !== 'object') return 'Aucun résultat';
  
  const entries = Object.entries(result);
  if (entries.length === 0) return 'Aucun résultat';
  
  return entries.slice(0, 3).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: ${value.length} élément(s)`;
    } else if (typeof value === 'object') {
      return `${key}: ${Object.keys(value).length} propriété(s)`;
    } else {
      const stringValue = String(value);
      return `${key}: ${stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue}`;
    }
  }).join(', ');
};

export const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({ tool, onRetry }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const IconComponent = tool.icon;
  
  return (
    <Card className={`transition-all duration-200 ${getStatusColor(tool.status)}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              <IconComponent className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{tool.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getCategoryBadgeColor(tool.category)}`}
                >
                  {tool.category}
                </Badge>
                {tool.confidenceScore && (
                  <Badge variant="outline" className="text-xs">
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
        
        <CardDescription className="text-sm text-muted-foreground mt-2">
          {tool.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {tool.status === 'running' && (
          <div className="space-y-3">
            <Progress value={undefined} className="h-2" />
            <p className="text-sm text-muted-foreground">Analyse en cours...</p>
          </div>
        )}

        {tool.status === 'completed' && tool.result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                ✅ Terminé
              </Badge>
              {tool.confidenceScore && (
                <div className="flex items-center gap-2">
                  <Progress 
                    value={tool.confidenceScore * 100} 
                    className="h-2 w-20"
                  />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(tool.confidenceScore * 100)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {formatResultData(tool.result.data)}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 h-8 p-2"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className="h-3 w-3 mr-1" />
                {isExpanded ? 'Masquer' : 'Voir les détails'}
              </Button>
              
              {isExpanded && (
                <div className="mt-3 bg-muted/30 p-3 rounded-lg">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(tool.result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {tool.status === 'error' && (
          <div className="space-y-3">
            <Badge variant="destructive" className="text-xs">
              ❌ Erreur
            </Badge>
            <p className="text-sm text-muted-foreground">
              Une erreur est survenue lors de l'analyse. 
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="h-8"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Réessayer
            </Button>
          </div>
        )}

        {tool.status === 'pending' && (
          <div className="space-y-3">
            <Badge variant="secondary" className="text-xs">
              ⏳ En attente
            </Badge>
            <p className="text-sm text-muted-foreground">
              En attente du démarrage de l'analyse.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};