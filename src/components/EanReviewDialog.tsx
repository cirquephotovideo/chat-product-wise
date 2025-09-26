import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export interface EanCandidate {
  name: string;
  brand?: string;
  category?: string;
  sourceUrl: string;
  sourceDomain: string;
  matchedOnPage: boolean;
  score: number;
}

export interface EanReview {
  ean: string;
  originalName: string;
  candidates: EanCandidate[];
  confirmedName?: string;
  isManual?: boolean;
}

interface EanReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eanReviews: EanReview[];
  onConfirmAll: (confirmed: Record<string, string>) => void;
  onResolveEan: (ean: string) => Promise<EanCandidate[]>;
}

export function EanReviewDialog({ 
  open, 
  onOpenChange, 
  eanReviews, 
  onConfirmAll, 
  onResolveEan 
}: EanReviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState<Record<string, string>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [showManual, setShowManual] = useState<Record<string, boolean>>({});

  const currentReview = eanReviews[currentIndex];
  const isLastEan = currentIndex === eanReviews.length - 1;
  const allConfirmed = eanReviews.every(review => 
    confirmed[review.ean] || manualInputs[review.ean]
  );

  const handleResolveEan = async (ean: string) => {
    setResolving(prev => ({ ...prev, [ean]: true }));
    try {
      const candidates = await onResolveEan(ean);
      // Update the review with candidates (this would need parent state management)
      toast.success(`${candidates.length} candidats trouvés pour l'EAN ${ean}`);
    } catch (error) {
      toast.error("Erreur lors de la résolution EAN");
      console.error('Error resolving EAN:', error);
    } finally {
      setResolving(prev => ({ ...prev, [ean]: false }));
    }
  };

  const handleConfirmCandidate = (ean: string, name: string) => {
    setConfirmed(prev => ({ ...prev, [ean]: name }));
    setShowManual(prev => ({ ...prev, [ean]: false }));
    
    // Auto-advance to next EAN
    if (!isLastEan) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleManualInput = (ean: string, name: string) => {
    setManualInputs(prev => ({ ...prev, [ean]: name }));
    setConfirmed(prev => {
      const updated = { ...prev };
      delete updated[ean];
      return updated;
    });
  };

  const handleConfirmAll = () => {
    const finalConfirmed: Record<string, string> = {};
    
    eanReviews.forEach(review => {
      finalConfirmed[review.ean] = confirmed[review.ean] || manualInputs[review.ean] || review.originalName;
    });

    onConfirmAll(finalConfirmed);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (!isLastEan) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentReview) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation des codes EAN</DialogTitle>
          <DialogDescription>
            Vérifiez la correspondance des codes EAN avec les bons produits avant l'analyse.
            ({currentIndex + 1}/{eanReviews.length})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current EAN Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">{currentReview.ean}</Badge>
                {confirmed[currentReview.ean] && <CheckCircle className="h-4 w-4 text-green-500" />}
              </CardTitle>
              <CardDescription>
                Nom original: <strong>{currentReview.originalName}</strong>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Candidates or Resolution */}
          {currentReview.candidates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                  <p className="text-muted-foreground">
                    Aucun candidat trouvé pour cet EAN.
                  </p>
                  <Button 
                    onClick={() => handleResolveEan(currentReview.ean)}
                    disabled={resolving[currentReview.ean]}
                  >
                    {resolving[currentReview.ean] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recherche...
                      </>
                    ) : (
                      'Rechercher à nouveau'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Candidats trouvés:</Label>
              {currentReview.candidates.map((candidate, idx) => (
                <Card 
                  key={idx} 
                  className={`cursor-pointer transition-all ${
                    confirmed[currentReview.ean] === candidate.name 
                      ? 'ring-2 ring-primary' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleConfirmCandidate(currentReview.ean, candidate.name)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{candidate.name}</h4>
                          {candidate.matchedOnPage && (
                            <Badge variant="default" className="text-xs">
                              EAN présent
                            </Badge>
                          )}
                        </div>
                        {candidate.brand && (
                          <p className="text-sm text-muted-foreground">
                            Marque: {candidate.brand}
                          </p>
                        )}
                        {candidate.category && (
                          <p className="text-sm text-muted-foreground">
                            Catégorie: {candidate.category}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {candidate.sourceDomain}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Score: {Math.round(candidate.score * 100)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(candidate.sourceUrl, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={confirmed[currentReview.ean] === candidate.name ? "default" : "outline"}
                        >
                          {confirmed[currentReview.ean] === candidate.name ? "Sélectionné" : "Choisir"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Manual Input Option */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ou saisir manuellement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showManual[currentReview.ean] ? (
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Nom du produit</Label>
                  <Input
                    id="manual-name"
                    value={manualInputs[currentReview.ean] || ''}
                    onChange={(e) => handleManualInput(currentReview.ean, e.target.value)}
                    placeholder="Saisissez le nom correct du produit"
                  />
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowManual(prev => ({ ...prev, [currentReview.ean]: true }))}
                >
                  Saisir manuellement
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Précédent
            </Button>

            <div className="flex items-center gap-2">
              {eanReviews.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentIndex
                      ? 'bg-primary'
                      : confirmed[eanReviews[idx].ean] || manualInputs[eanReviews[idx].ean]
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {isLastEan ? (
              <Button
                onClick={handleConfirmAll}
                disabled={!allConfirmed}
              >
                Confirmer et analyser
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!confirmed[currentReview.ean] && !manualInputs[currentReview.ean]}
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}