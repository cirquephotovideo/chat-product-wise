import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OllamaService } from '@/lib/ollama';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Key, ExternalLink } from 'lucide-react';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet: () => void;
}

export const ApiKeyDialog = ({ open, onOpenChange, onApiKeySet }: ApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    
    try {
      const isValid = await OllamaService.testApiKey(apiKey);
      
      if (isValid) {
        OllamaService.saveApiKey(apiKey);
        toast({
          title: "Clé API configurée",
          description: "Votre clé API Ollama a été sauvegardée avec succès.",
        });
        onApiKeySet();
        onOpenChange(false);
        setApiKey('');
      } else {
        toast({
          title: "Clé API invalide",
          description: "La clé API fournie n'est pas valide. Vérifiez et réessayez.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de validation",
        description: "Impossible de valider la clé API. Vérifiez votre connexion.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Configuration API Ollama
          </DialogTitle>
          <DialogDescription>
            Pour utiliser les modèles Ollama Cloud et la recherche web, vous devez fournir votre clé API.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">Clé API Ollama</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ollama_..."
                disabled={isValidating}
              />
              <p className="text-sm text-muted-foreground">
                Créez votre clé API gratuite sur{' '}
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => window.open('https://ollama.com/settings/keys', '_blank')}
                >
                  ollama.com/settings/keys
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isValidating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!apiKey.trim() || isValidating}>
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              {isValidating ? 'Validation...' : 'Configurer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};