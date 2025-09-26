import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Search, TrendingUp, Sparkles, ArrowRight, Globe, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center glow-effect">
                <Bot className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Intelligence Artificielle
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                pour l'E-commerce
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Analysez vos produits, chattez avec l'IA et optimisez votre stratégie commerciale 
              avec la puissance de l'intelligence artificielle et de la recherche web en temps réel.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-glow rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Chat IA Intelligent</CardTitle>
                    <CardDescription>Analyse de produits avec recherche web</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Posez des questions sur n'importe quel produit et obtenez des analyses détaillées 
                  avec des informations à jour provenant d'Internet.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>Recherche web temps réel</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span>IA avancée Ollama</span>
                  </div>
                </div>
                <Link to="/chat">
                  <Button className="w-full group-hover:glow-effect transition-all duration-300">
                    Commencer le Chat
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Analyseur de Produits</CardTitle>
                    <CardDescription>9 outils d'analyse automatisée</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Analysez vos produits avec 9 outils spécialisés : SEO, prix, concurrence, 
                  tendances et génération de contenu marketing.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>Analyse concurrentielle</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span>Optimisation SEO</span>
                  </div>
                </div>
                <Link to="/analyzer">
                  <Button className="w-full group-hover:glow-effect transition-all duration-300">
                    Analyser des Produits
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Pourquoi choisir notre plateforme ?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des outils puissants pour optimiser votre e-commerce avec l'intelligence artificielle
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-glow rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Recherche Web Intégrée</h3>
            <p className="text-muted-foreground">
              Accès aux informations les plus récentes via la recherche web automatique
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">IA Avancée</h3>
            <p className="text-muted-foreground">
              Modèles Ollama de dernière génération pour des analyses précises
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Analyse Complète</h3>
            <p className="text-muted-foreground">
              9 outils spécialisés pour analyser tous les aspects de vos produits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
