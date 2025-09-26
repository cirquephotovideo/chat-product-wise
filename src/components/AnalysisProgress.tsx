import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { ProductData } from '@/lib/productAnalyzer';

interface AnalysisProgressProps {
  progress: {
    completed: number;
    running: number;
    errors: number;
    total: number;
  };
  isRunning: boolean;
  products: ProductData[];
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  progress,
  isRunning,
  products
}) => {
  const progressPercentage = ((progress.completed + progress.errors) / progress.total) * 100;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isRunning ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            Progression de l'analyse
          </span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              {products.length} produit{products.length > 1 ? 's' : ''}
            </Badge>
            <Badge variant={isRunning ? "default" : "secondary"} className="text-sm">
              {Math.round(progressPercentage)}% terminé
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Progress 
          value={progressPercentage} 
          className="h-2"
        />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div className="text-sm">
              <div className="font-medium">{progress.completed}</div>
              <div className="text-muted-foreground">Terminés</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="text-sm">
              <div className="font-medium">{progress.running}</div>
              <div className="text-muted-foreground">En cours</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <div className="text-sm">
              <div className="font-medium">{progress.errors}</div>
              <div className="text-muted-foreground">Erreurs</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted" />
            <div className="text-sm">
              <div className="font-medium">{progress.total - progress.completed - progress.running - progress.errors}</div>
              <div className="text-muted-foreground">En attente</div>
            </div>
          </div>
        </div>

        {products.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Produits en cours d'analyse :</h4>
            <div className="flex flex-wrap gap-2">
              {products.map((product, index) => (
                <Badge
                  key={product.identifier}
                  variant="outline"
                  className="text-xs"
                >
                  {index + 1}. {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {isRunning && (
          <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
            ⏱️ L'analyse peut prendre plusieurs minutes selon le nombre de produits et d'outils sélectionnés.
            Les résultats seront sauvegardés automatiquement dans votre base de données.
          </div>
        )}
      </CardContent>
    </Card>
  );
};