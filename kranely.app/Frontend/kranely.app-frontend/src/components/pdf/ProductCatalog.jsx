import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, ShoppingCart } from 'lucide-react';

export default function ProductCatalog({ user, onAddToQuote }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productData, setProductData] = useState({
    nome: '',
    codice: '',
    descrizione: '',
    categoria: 'altro',
    prezzo_unitario: 0,
    unita_misura: 'pz',
    iva: 22,
    attivo: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['product-catalog', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.ProductCatalog.filter({ company_email: user.email });
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductCatalog.create({ ...data, company_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-catalog'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductCatalog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-catalog'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductCatalog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-catalog'] });
    }
  });

  const resetForm = () => {
    setProductData({
      nome: '',
      codice: '',
      descrizione: '',
      categoria: 'altro',
      prezzo_unitario: 0,
      unita_misura: 'pz',
      iva: 22,
      attivo: true
    });
    setEditingProduct(null);
    setShowAddModal(false);
  };

  const handleSave = () => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductData(product);
    setShowAddModal(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.codice?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.categoria === filterCategory;
    return matchesSearch && matchesCategory && p.attivo;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#f8f9fa]">Catalogo Prodotti</h3>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#FFC703] hover:bg-[#FFC703]"
          size="sm"
        >
          <Plus size={16} className="mr-2" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          placeholder="Cerca prodotto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le Categorie</SelectItem>
            <SelectItem value="finestre">Finestre</SelectItem>
            <SelectItem value="porte">Porte</SelectItem>
            <SelectItem value="materiali">Materiali</SelectItem>
            <SelectItem value="manodopera">Manodopera</SelectItem>
            <SelectItem value="accessori">Accessori</SelectItem>
            <SelectItem value="altro">Altro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-[#495057]/30 border-[#f8f9fa]/10">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-[#f8f9fa]">{product.nome}</h4>
                  {product.codice && (
                    <p className="text-xs text-[#adb5bd]">Cod: {product.codice}</p>
                  )}
                  <p className="text-xs text-[#dee2e6] mt-1">{product.descrizione}</p>
                </div>
                <Package size={16} className="text-[#FFC703]" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-sm font-semibold text-green-400">
                    € {product.prezzo_unitario.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#adb5bd] ml-1">/{product.unita_misura}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddToQuote(product)}
                    className="h-7 px-2 text-green-400 hover:text-green-300"
                  >
                    <ShoppingCart size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(product)}
                    className="h-7 px-2 text-[#FFC703] hover:text-[#FFC703]"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(product.id)}
                    className="h-7 px-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa]">
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">
              {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#f8f9fa] text-xs">Nome *</Label>
                <Input
                  value={productData.nome}
                  onChange={(e) => setProductData({ ...productData, nome: e.target.value })}
                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>
              <div>
                <Label className="text-[#f8f9fa] text-xs">Codice</Label>
                <Input
                  value={productData.codice}
                  onChange={(e) => setProductData({ ...productData, codice: e.target.value })}
                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>
            </div>
            <div>
              <Label className="text-[#f8f9fa] text-xs">Descrizione</Label>
              <Textarea
                value={productData.descrizione}
                onChange={(e) => setProductData({ ...productData, descrizione: e.target.value })}
                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#f8f9fa] text-xs">Categoria</Label>
                <Select value={productData.categoria} onValueChange={(v) => setProductData({ ...productData, categoria: v })}>
                  <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finestre">Finestre</SelectItem>
                    <SelectItem value="porte">Porte</SelectItem>
                    <SelectItem value="materiali">Materiali</SelectItem>
                    <SelectItem value="manodopera">Manodopera</SelectItem>
                    <SelectItem value="accessori">Accessori</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#f8f9fa] text-xs">Unità Misura</Label>
                <Select value={productData.unita_misura} onValueChange={(v) => setProductData({ ...productData, unita_misura: v })}>
                  <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pz">Pezzi</SelectItem>
                    <SelectItem value="mq">Metri Quadri</SelectItem>
                    <SelectItem value="ml">Metri Lineari</SelectItem>
                    <SelectItem value="ore">Ore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#f8f9fa] text-xs">Prezzo Unitario *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productData.prezzo_unitario}
                  onChange={(e) => setProductData({ ...productData, prezzo_unitario: parseFloat(e.target.value) })}
                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>
              <div>
                <Label className="text-[#f8f9fa] text-xs">IVA %</Label>
                <Input
                  type="number"
                  value={productData.iva}
                  onChange={(e) => setProductData({ ...productData, iva: parseFloat(e.target.value) })}
                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex-1 border-[#f8f9fa]/30 text-[#f8f9fa]"
              >
                Annulla
              </Button>
              <Button
                onClick={handleSave}
                disabled={!productData.nome || !productData.prezzo_unitario}
                className="flex-1 bg-[#FFC703] hover:bg-[#FFC703]"
              >
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
