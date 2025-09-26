import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Scan, AlertCircle } from 'lucide-react';
import { ProductData } from '@/lib/productAnalyzer';
import { toast } from 'sonner';

interface ProductInputProps {
  products: ProductData[];
  onChange: (products: ProductData[]) => void;
  disabled?: boolean;
}

export const ProductInput: React.FC<ProductInputProps> = ({ products, onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'name' | 'ean'>('name');
  const [bulkTextValue, setBulkTextValue] = useState('');

  // Validation function for product input
  const validateProductInput = (input: string): { isValid: boolean; errorMessage?: string } => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      return { isValid: false, errorMessage: "Le nom du produit ne peut pas être vide" };
    }
    
    if (trimmedInput.length > 200) {
      return { isValid: false, errorMessage: "Le nom du produit ne peut pas dépasser 200 caractères" };
    }
    
    // Check for potentially dangerous characters
    if (/[<>\"'&]/.test(trimmedInput)) {
      return { isValid: false, errorMessage: "Le nom du produit contient des caractères non autorisés" };
    }
    
    return { isValid: true };
  };

  const handleAddProduct = () => {
    const validation = validateProductInput(inputValue);
    
    if (!validation.isValid) {
      toast.error(validation.errorMessage || "Erreur de validation");
      return;
    }

    const identifier = inputValue.trim();
    const isEAN = /^\d{8,13}$/.test(identifier);
    
    // Additional EAN validation
    if (isEAN && !validateEAN13(identifier)) {
      toast.error("Le code EAN n'est pas valide (vérification de la somme de contrôle échouée)");
      return;
    }
    
    const newProduct: ProductData = {
      identifier,
      name: isEAN ? `Produit EAN ${identifier}` : identifier,
      type: isEAN ? 'ean' : 'name'
    };

    // Check if product already exists
    const exists = products.some(p => p.identifier === identifier);
    if (exists) {
      toast.error("Ce produit est déjà dans la liste");
      return;
    }

    // Check products limit
    if (products.length >= 50) {
      toast.error("Limite de 50 produits atteinte");
      return;
    }

    try {
      onChange([...products, newProduct]);
      setInputValue('');
      toast.success(`Produit ${isEAN ? 'EAN' : ''} ajouté avec succès`);
      console.log('Product added:', newProduct);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("Erreur lors de l'ajout du produit");
    }
  };

  // EAN-13 validation using Luhn algorithm
  const validateEAN13 = (ean: string): boolean => {
    if (!/^\d{13}$/.test(ean)) return true; // Allow shorter EANs for now
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(ean[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(ean[12]);
  };

  const handleRemoveProduct = (identifier: string) => {
    try {
      onChange(products.filter(p => p.identifier !== identifier));
      toast.success("Produit supprimé");
      console.log('Product removed:', identifier);
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleBulkAdd = () => {
    if (!bulkTextValue.trim()) {
      toast.error("Veuillez saisir du texte pour l'ajout en lot");
      return;
    }

    const lines = bulkTextValue.split('\n').filter(line => line.trim());
    const newProducts: ProductData[] = [];
    let errorCount = 0;
    let duplicateCount = 0;

    lines.forEach(line => {
      const identifier = line.trim();
      if (!identifier) return;

      const validation = validateProductInput(identifier);
      if (!validation.isValid) {
        errorCount++;
        return;
      }

      const isEAN = /^\d{8,13}$/.test(identifier);
      
      // EAN validation
      if (isEAN && !validateEAN13(identifier)) {
        errorCount++;
        return;
      }

      const exists = products.some(p => p.identifier === identifier) || 
                   newProducts.some(p => p.identifier === identifier);
      
      if (exists) {
        duplicateCount++;
        return;
      }

      if (products.length + newProducts.length >= 50) {
        toast.error("Limite de 50 produits atteinte");
        return;
      }

      newProducts.push({
        identifier,
        name: isEAN ? `Produit EAN ${identifier}` : identifier,
        type: isEAN ? 'ean' : 'name'
      });
    });

    try {
      onChange([...products, ...newProducts]);
      setBulkTextValue('');
      
      let message = `${newProducts.length} produit(s) ajouté(s)`;
      if (duplicateCount > 0) message += `, ${duplicateCount} doublon(s) ignoré(s)`;
      if (errorCount > 0) message += `, ${errorCount} erreur(s)`;
      
      toast.success(message);
      console.log('Bulk add completed:', { added: newProducts.length, duplicates: duplicateCount, errors: errorCount });
    } catch (error) {
      console.error('Error in bulk add:', error);
      toast.error("Erreur lors de l'ajout en lot");
    }
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
                maxLength={200}
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
          
          <div className="flex items-start gap-2 mt-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Saisissez un nom de produit ou un code EAN (8-13 chiffres). La détection EAN est automatique.
              Maximum 200 caractères, 50 produits au total.
            </p>
          </div>
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
          <div className="space-y-3">
            <Textarea
              placeholder="Collez plusieurs produits ou codes EAN, un par ligne..."
              className="min-h-[100px]"
              disabled={disabled}
              value={bulkTextValue}
              onChange={(e) => setBulkTextValue(e.target.value)}
              maxLength={5000}
            />
            <Button 
              onClick={handleBulkAdd}
              disabled={!bulkTextValue.trim() || disabled}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter tous les produits
            </Button>
          </div>
          
          <div className="flex items-start gap-2 mt-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Collez une liste de produits ou codes EAN, un par ligne. Cliquez sur le bouton pour ajouter tous les produits valides.
            </p>
          </div>
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