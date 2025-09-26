import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Scan } from 'lucide-react';
import { ProductData } from '@/lib/productAnalyzer';

interface ProductInputProps {
  products: ProductData[];
  onChange: (products: ProductData[]) => void;
  disabled?: boolean;
}

export const ProductInput: React.FC<ProductInputProps> = ({ products, onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'name' | 'ean'>('name');

  const handleAddProduct = () => {
    if (!inputValue.trim()) return;

    const identifier = inputValue.trim();
    const isEAN = /^\d{8,13}$/.test(identifier);
    
    const newProduct: ProductData = {
      identifier,
      name: isEAN ? `Produit EAN ${identifier}` : identifier,
      type: isEAN ? 'ean' : 'name'
    };

    // Check if product already exists
    const exists = products.some(p => p.identifier === identifier);
    if (exists) return;

    onChange([...products, newProduct]);
    setInputValue('');
  };

  const handleRemoveProduct = (identifier: string) => {
    onChange(products.filter(p => p.identifier !== identifier));
  };

  const handleBulkAdd = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newProducts: ProductData[] = [];

    lines.forEach(line => {
      const identifier = line.trim();
      if (!identifier) return;

      const isEAN = /^\d{8,13}$/.test(identifier);
      const exists = products.some(p => p.identifier === identifier) || 
                   newProducts.some(p => p.identifier === identifier);
      
      if (!exists) {
        newProducts.push({
          identifier,
          name: isEAN ? `Produit EAN ${identifier}` : identifier,
          type: isEAN ? 'ean' : 'name'
        });
      }
    });

    onChange([...products, ...newProducts]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddProduct();
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Product Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un produit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="product-input" className="sr-only">
                Nom du produit ou code EAN
              </Label>
              <Input
                id="product-input"
                placeholder="Nom du produit ou code EAN..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                className="flex-1"
              />
            </div>
            <Button 
              onClick={handleAddProduct}
              disabled={!inputValue.trim() || disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Saisissez un nom de produit ou un code EAN (8-13 chiffres). La détection EAN est automatique.
          </p>
        </CardContent>
      </Card>

      {/* Bulk Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Ajout en lot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Collez plusieurs produits ou codes EAN, un par ligne..."
            className="min-h-[100px]"
            disabled={disabled}
            onChange={(e) => {
              const text = e.target.value;
              if (text.includes('\n')) {
                handleBulkAdd(text);
                e.target.value = '';
              }
            }}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Collez une liste de produits ou codes EAN, un par ligne. L'ajout se fait automatiquement.
          </p>
        </CardContent>
      </Card>

      {/* Products List */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Produits à analyser ({products.length})
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange([])}
                disabled={disabled}
              >
                Tout supprimer
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {products.map((product) => (
                <Badge
                  key={product.identifier}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                >
                  {product.type === 'ean' && (
                    <Scan className="h-3 w-3 text-blue-500" />
                  )}
                  <span className="max-w-[200px] truncate">
                    {product.name}
                  </span>
                  {!disabled && (
                    <button
                      onClick={() => handleRemoveProduct(product.identifier)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};