import { WebSearchResult } from '@/lib/ollama';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    searchResults?: WebSearchResult[];
    isTyping?: boolean;
  };
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`chat-message flex gap-4 p-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-chat-user' : 'bg-chat-assistant border border-border'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Bot className="w-4 h-4 text-foreground" />
          )}
        </div>
      </div>
      
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-4 rounded-lg ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-card border border-border'
        } ${message.isTyping ? 'typing-indicator' : ''}`}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {message.searchResults && message.searchResults.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/20">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-muted-foreground">
                  Sources Web
                </span>
              </div>
              <div className="space-y-2">
                {message.searchResults.map((result, index) => (
                  <Card key={index} className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {result.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.content}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {new URL(result.url).hostname}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className={`text-xs text-muted-foreground mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};