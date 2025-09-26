import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { OllamaService, OllamaModel, OllamaMessage, WebSearchResult } from '@/lib/ollama';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Search, Sparkles, Home, BarChart3 } from 'lucide-react';

interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResults?: WebSearchResult[];
  isTyping?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessageType[];
  messageCount: number;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<OllamaModel>('gpt-oss:120b-cloud');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  useEffect(() => {
    checkApiKey();
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const checkApiKey = () => {
    const apiKey = OllamaService.getApiKey();
    setHasApiKey(!!apiKey);
    if (!apiKey) {
      setShowApiKeyDialog(true);
    }
  };

  const loadConversations = () => {
    const saved = localStorage.getItem('ollama_conversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      const conversations: Conversation[] = parsed.map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
      setConversations(conversations);
    }
  };

  const saveConversations = (updatedConversations: Conversation[]) => {
    localStorage.setItem('ollama_conversations', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'Nouvelle conversation',
      timestamp: new Date(),
      messages: [],
      messageCount: 0
    };
    
    const updated = [newConversation, ...conversations];
    saveConversations(updated);
    setCurrentConversationId(newConversation.id);
  };

  const generateConversationTitle = (firstMessage: string): string => {
    return firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage;
  };

  const handleSendMessage = async (content: string) => {
    if (!hasApiKey || !currentConversationId) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    let updatedConversations = conversations.map(c => {
      if (c.id === currentConversationId) {
        const updated = {
          ...c,
          messages: [...c.messages, userMessage],
          messageCount: c.messages.length + 1
        };
        
        // Update title if this is the first message
        if (c.messages.length === 0) {
          updated.title = generateConversationTitle(content);
        }
        
        return updated;
      }
      return c;
    });

    saveConversations(updatedConversations);
    setIsLoading(true);

    try {
      // Enhanced product query detection
      const isProductQuery = /produit|product|achat|acheter|buy|buying|prix|price|cost|coût|avis|review|opinion|comparaison|compare|test|évaluation|meilleur|best|top|recommandation|smartphone|laptop|ordinateur|voiture|car|électronique|electronics|maison|home|cuisine|kitchen|sport|fitness|beauté|beauty|vêtement|clothing|livre|book|gadget|appareil|device|marque|brand|modèle|model|spécifications|specs|caractéristiques|features|où acheter|where to buy|disponible|available|stock|promotion|promo|discount|réduction|solde|sale/i.test(content);
      let searchResults: WebSearchResult[] = [];
      
      if (isProductQuery) {
        try {
          console.log('Product query detected, performing web search...');
          
          // Show search in progress toast
          toast({
            title: "🔍 Recherche en cours...",
            description: "Recherche d'informations à jour sur le web.",
          });
          
          const searchResponse = await OllamaService.webSearch(content, 3);
          searchResults = searchResponse.results || [];
          
          if (searchResults.length > 0) {
            toast({
              title: "✅ Recherche web effectuée",
              description: `${searchResults.length} sources trouvées pour enrichir la réponse.`,
            });
          } else {
            toast({
              title: "ℹ️ Recherche terminée",
              description: "Aucune source pertinente trouvée, utilisation des connaissances générales.",
            });
          }
        } catch (error) {
          console.error('Web search failed:', error);
          toast({
            title: "⚠️ Recherche web échouée",
            description: "Impossible d'effectuer la recherche web, utilisation des connaissances générales.",
            variant: "destructive",
          });
        }
      }

      // Prepare messages for Ollama
      const conversation = updatedConversations.find(c => c.id === currentConversationId);
      const messages: OllamaMessage[] = [
        {
          role: 'system',
          content: 'Tu es un assistant spécialisé dans l\'analyse de produits. Utilise les informations de recherche web fournies pour donner des réponses précises et utiles. Si des sources sont disponibles, mentionne-les dans ta réponse.'
        },
        ...(conversation?.messages.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })) || [])
      ];

      // Add search context if available
      if (searchResults.length > 0) {
        const searchContext = searchResults.map(r => 
          `Source: ${r.title} (${r.url})\n${r.content}`
        ).join('\n\n');
        
        messages.push({
          role: 'user',
          content: `${content}\n\nInformations complémentaires trouvées sur le web:\n${searchContext}`
        });
      }

      // Create typing indicator
      const typingMessage: ChatMessageType = {
        id: 'typing',
        role: 'assistant',
        content: 'Analyse en cours...',
        timestamp: new Date(),
        isTyping: true
      };

      updatedConversations = updatedConversations.map(c => {
        if (c.id === currentConversationId) {
          return {
            ...c,
            messages: [...c.messages, typingMessage]
          };
        }
        return c;
      });
      saveConversations(updatedConversations);

      let assistantResponse = '';
      
      await OllamaService.chat(selectedModel, messages, (chunk) => {
        assistantResponse += chunk;
        
        // Update the typing message with accumulated response
        updatedConversations = updatedConversations.map(c => {
          if (c.id === currentConversationId) {
            return {
              ...c,
              messages: c.messages.map(m => 
                m.id === 'typing' 
                  ? { ...m, content: assistantResponse }
                  : m
              )
            };
          }
          return c;
        });
        saveConversations(updatedConversations);
      });

      // Replace typing message with final response
      const finalMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        searchResults: searchResults.length > 0 ? searchResults : undefined
      };

      updatedConversations = updatedConversations.map(c => {
        if (c.id === currentConversationId) {
          return {
            ...c,
            messages: [...c.messages.filter(m => m.id !== 'typing'), finalMessage],
            messageCount: c.messages.length + 1
          };
        }
        return c;
      });

      saveConversations(updatedConversations);

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir une réponse. Vérifiez votre clé API.",
        variant: "destructive",
      });
      
      // Remove typing indicator on error
      updatedConversations = updatedConversations.map(c => {
        if (c.id === currentConversationId) {
          return {
            ...c,
            messages: c.messages.filter(m => m.id !== 'typing')
          };
        }
        return c;
      });
      saveConversations(updatedConversations);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    saveConversations(updated);
    
    if (currentConversationId === id) {
      setCurrentConversationId(updated.length > 0 ? updated[0].id : null);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="p-8 max-w-md text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Ollama Chat</h1>
          <p className="text-muted-foreground mb-4">
            Analysez des produits avec l'IA et la recherche web
          </p>
          <Button onClick={() => setShowApiKeyDialog(true)} className="w-full">
            Configurer l'API
          </Button>
        </Card>
        
        <ApiKeyDialog
          open={showApiKeyDialog}
          onOpenChange={setShowApiKeyDialog}
          onApiKeySet={() => setHasApiKey(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={conversations}
        currentConversation={currentConversationId}
        onConversationSelect={setCurrentConversationId}
        onNewConversation={createNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setShowApiKeyDialog(true)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <div className="flex-1 flex flex-col">
        {/* Navigation Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                  Accueil
                </Link>
                <div className="text-sm text-muted-foreground">•</div>
                <span className="text-sm font-medium">Chat IA</span>
              </div>
              <Link to="/analyzer">
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyseur
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {!currentConversationId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                <Bot className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Ollama Product Analyzer</h1>
              <p className="text-muted-foreground mb-6">
                Analysez des produits avec l'intelligence artificielle et la recherche web en temps réel
              </p>
              
              <div className="grid gap-4 mb-6">
                <Card className="p-4 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Search className="w-5 h-5 text-accent" />
                    <span className="font-medium">Recherche Web</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Informations à jour depuis Internet
                  </p>
                </Card>
                
                <Card className="p-4 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-medium">IA Avancée</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Modèles Ollama Cloud dernière génération
                  </p>
                </Card>
              </div>
              
              <Button onClick={createNewConversation} size="lg" className="glow-effect">
                Commencer l'analyse
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {currentConversation?.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="border-t border-border">
              <div className="max-w-4xl mx-auto">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={isLoading}
                  placeholder="Demandez des infos sur un produit (ex: 'Quels sont les meilleurs smartphones en 2024?')"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onApiKeySet={() => setHasApiKey(true)}
      />
    </div>
  );
}