/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';


import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import {
  FileText,
  Trash2,
  Eye,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  FolderOpen
} from 'lucide-react';

export default function Documents() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [openFolder, setOpenFolder] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'altro',
    file: null,
    client_id: null,
    client_email: null
  });
  const [isUploading, setIsUploading] = useState(false);

  // PDF Viewer State
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState('');

  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });
  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';
  const clients = useQuery(api.clients.list, isAdmin ? {} : "skip") || []; // Admin only query, safe now

  const documentsQuery = useQuery(api.documents.getByUser, { email: user?.primaryEmailAddress?.emailAddress || "" });
  const documents = documentsQuery || [];
  const isLoading = documentsQuery === undefined;
  const createDocument = useMutation(api.documents.create);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const respondToQuoteMutation = useMutation(api.quotes.respondToQuote);

  // Quote queries - user sees their own quotes
  const userQuotes = useQuery(api.quotes.getByUser, { email: user?.primaryEmailAddress?.emailAddress || "" }) || [];
  // Shared documents (final quotes from admin)
  const sharedDocs = useQuery(api.documents.getSharedWith, { email: user?.primaryEmailAddress?.emailAddress || "" }) || [];

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return;
    setIsUploading(true);

    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": uploadData.file.type },
        body: uploadData.file,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      // Store ONLY the storageId, let the backend generate the signed URL
      const storageUrl = storageId;

      if (user?.primaryEmailAddress?.emailAddress) {
        await createDocument({
          title: uploadData.title,
          description: uploadData.description,
          category: uploadData.category,
          file_url: storageUrl,
          file_name: uploadData.file.name,
          file_type: uploadData.file.type,
          file_size: uploadData.file.size,
          is_public: false,
          created_by: user.primaryEmailAddress.emailAddress,
          created_date: new Date().toISOString(),
          client_id: uploadData.client_id || undefined, // Link to client if selected
          shared_with: uploadData.client_email ? [uploadData.client_email] : undefined, // Optional: duplicate check
        });
      }

      setUploadModalOpen(false);
      setUploadData({ title: '', description: '', category: 'altro', file: null, client_id: null, client_email: null });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Errore durante il caricamento del file.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedDocuments = React.useMemo(() => {
    if (viewMode !== 'folders') return {};
    const groups = {};
    if (isAdmin) {
      filteredDocuments.forEach(doc => {
        let key = 'Documenti Generali';
        if (doc.client_id) {
          const clientName = clients?.find(c => c._id === doc.client_id)?.full_name || 'Cliente Sconosciuto';
          key = clientName;
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(doc);
      });
    } else {
      filteredDocuments.forEach(doc => {
        const key = doc.category.charAt(0).toUpperCase() + doc.category.slice(1);
        if (!groups[key]) groups[key] = [];
        groups[key].push(doc);
      });
    }
    return groups;
  }, [filteredDocuments, viewMode, isAdmin, clients]);

  React.useEffect(() => {
    setOpenFolder(null);
  }, [viewMode, searchQuery, categoryFilter]);

  // Loading guard removed — auth handled globally by App.jsx

  // if (!user) check removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">



      {/* Universal PDF Viewer */}
      <UniversalPdfViewer
        isOpen={!!selectedDocUrl}
        onClose={() => setSelectedDocUrl(null)}
        url={selectedDocUrl}
        title={selectedDocTitle}
      />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1">I Miei Documenti</h1>
              <p className="text-xs sm:text-sm text-[#dee2e6]">Gestisci preventivi, contratti e documenti</p>
            </div>
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] shadow-lg hover:shadow-xl transition-all">
                  <Plus size={16} className="mr-2" />
                  Carica Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa]">
                <DialogHeader>
                  <DialogTitle>Carica Nuovo Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">Titolo</Label>
                    <Input
                      value={uploadData.title}
                      onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                      className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">Descrizione</Label>
                    <Input
                      value={uploadData.description}
                      onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                      className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                    />
                  </div>
                  {/* Admin: Select Client */}
                  {isAdmin && (
                    <div className="space-y-2">
                      <Label className="text-[#f8f9fa]">Cliente (Opzionale)</Label>
                      <Select
                        value={uploadData.client_id}
                        onValueChange={(v) => {
                          const client = clients.find(c => c._id === v);
                          setUploadData({ ...uploadData, client_id: v, client_email: client?.email });
                        }}
                      >
                        <SelectTrigger className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                          <SelectValue placeholder="Seleziona cliente..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#343a40] border-[#f8f9fa]/20 max-h-[200px]">
                          {clients.map(client => (
                            <SelectItem key={client._id} value={client._id} className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">
                              {client.full_name} ({client.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">Categoria</Label>
                    <Select value={uploadData.category} onValueChange={v => setUploadData({ ...uploadData, category: v })}>
                      <SelectTrigger className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#343a40] border-[#f8f9fa]/20">
                        <SelectItem value="preventivo" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Preventivo</SelectItem>
                        <SelectItem value="contratto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Contratto</SelectItem>
                        <SelectItem value="fattura" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Fattura</SelectItem>
                        <SelectItem value="progetto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Progetto</SelectItem>
                        <SelectItem value="altro" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">File</Label>
                    <Input
                      type="file"
                      onChange={e => setUploadData({ ...uploadData, file: e.target.files[0] })}
                      className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] file:bg-[#f8f9fa] file:text-[#212529] file:border-0 file:rounded file:mr-4"
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !uploadData.file || !uploadData.title}
                    className="w-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef]"
                  >
                    {isUploading ? 'Caricamento...' : 'Carica'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
              <Input
                placeholder="Cerca documenti..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#343a40]/50 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-[#343a40] border-[#f8f9fa]/20">
                <SelectItem value="all" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Tutte le Categorie</SelectItem>
                <SelectItem value="preventivo" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Preventivo</SelectItem>
                <SelectItem value="contratto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Contratto</SelectItem>
                <SelectItem value="fattura" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Fattura</SelectItem>
                <SelectItem value="progetto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Progetto</SelectItem>
                <SelectItem value="altro" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Altro</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-[#343a40]/50 border border-[#f8f9fa]/20 rounded-md p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`flex-1 ${viewMode === 'grid' ? 'bg-[#495057] text-white shadow-sm' : 'text-[#adb5bd] hover:text-white'}`}
              >
                Griglia
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('folders')}
                className={`flex-1 ${viewMode === 'folders' ? 'bg-[#495057] text-white shadow-sm' : 'text-[#adb5bd] hover:text-white'}`}
              >
                {isAdmin ? 'Clienti' : 'Cartelle'}
              </Button>
            </div>
          </div>

          {/* Preventivi Section */}
          {(userQuotes.length > 0 || sharedDocs.length > 0) && (
            <div className="mb-6 lg:mb-8">
              <h2 className="text-lg font-medium text-[#f8f9fa] mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                I Tuoi Preventivi
              </h2>

              {/* Shared final quotes from admin */}
              {sharedDocs.filter(d => d.category === 'preventivo').length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-[#adb5bd] mb-3">Preventivi Definitivi</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sharedDocs.filter(d => d.category === 'preventivo').map(doc => (
                      <motion.div
                        key={doc._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-green-500/20 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <FileText size={20} className="text-green-400" />
                            </div>
                            <div>
                              <p className="text-[#f8f9fa] font-medium text-sm">{doc.title}</p>
                              <p className="text-xs text-[#adb5bd]">{doc.file_name}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDocUrl(doc.file_url);
                              setSelectedDocTitle(doc.title);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Eye size={14} className="mr-1" /> Apri
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quote requests */}
              <div className="space-y-3">
                {userQuotes.map(quote => (
                  <motion.div
                    key={quote._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-xl p-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[#f8f9fa] font-medium">
                            {quote.title || (
                              quote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                quote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'
                            )}
                          </h4>
                          <Badge variant="secondary" className={`text-xs border-none ${quote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                            quote.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              quote.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {quote.status === 'accepted' && <><CheckCircle size={10} className="mr-1" /> Accettato</>}
                            {quote.status === 'rejected' && <><XCircle size={10} className="mr-1" /> Rifiutato</>}
                            {quote.status === 'sent' && <><AlertCircle size={10} className="mr-1" /> In Attesa</>}
                            {quote.status === 'draft' && <><Clock size={10} className="mr-1" /> In Elaborazione</>}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#adb5bd]">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(quote.created_date).toLocaleDateString('it-IT')}
                          </span>
                          {quote.estimated_price && (
                            <span className="text-[#f8f9fa] font-medium">
                              € {quote.estimated_price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Accept/Reject for sent quotes */}
                      {quote.status === 'sent' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (window.confirm('Sei sicuro di voler accettare questo preventivo? Il lavoro comincerà una volta effettuato il pagamento dell\'acconto.')) {
                                await respondToQuoteMutation({ quote_id: quote._id, response: 'accepted' });
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle size={14} className="mr-1" /> Accetta
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (window.confirm('Sei sicuro di voler rifiutare questo preventivo?')) {
                                await respondToQuoteMutation({ quote_id: quote._id, response: 'rejected' });
                              }
                            }}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle size={14} className="mr-1" /> Rifiuta
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Documents Grid / Folders */}
          {isLoading ? (
            <div className="text-center py-12 text-[#dee2e6]">Caricamento...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={64} className="text-[#6c757d] mx-auto mb-4" />
              <p className="text-[#dee2e6] text-lg">Nessun documento trovato</p>
              <p className="text-[#adb5bd] text-sm mt-2">Carica il tuo primo documento per iniziare</p>
            </div>
          ) : viewMode === 'folders' && !openFolder ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.keys(groupedDocuments).map(folderName => (
                <motion.div
                  key={folderName}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setOpenFolder(folderName)}
                  className="bg-[#343a40]/50 hover:bg-[#495057]/50 cursor-pointer backdrop-blur-md rounded-xl p-6 border border-[#f8f9fa]/10 flex flex-col items-center justify-center text-center shadow-lg transition-all"
                >
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 text-blue-400">
                    <FolderOpen size={32} />
                  </div>
                  <h3 className="text-[#f8f9fa] font-medium text-lg leading-tight mb-1">{folderName}</h3>
                  <p className="text-[#adb5bd] text-sm">{groupedDocuments[folderName].length} elementi</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div>
              {openFolder && (
                <div className="flex items-center gap-3 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => setOpenFolder(null)} className="text-[#adb5bd] hover:text-white pr-2 pl-2">
                    <Trash2 size={16} className="rotate-90 hidden" /> {/* Just for spacing layout logic */}
                    &larr; Indietro
                  </Button>
                  <h2 className="text-xl text-[#f8f9fa] font-medium">{openFolder}</h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {(openFolder ? groupedDocuments[openFolder] : filteredDocuments).map((doc) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    className="bg-[#343a40]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#f8f9fa]/20 shadow-xl hover:bg-[#343a40]/50 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 backdrop-blur-sm flex items-center justify-center">
                        <FileText size={24} className="text-[#f8f9fa]" />
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-[#f8f9fa]/10 text-[#f8f9fa]">
                          {doc.category}
                        </span>
                        {(doc.status === 'accepted' || doc.status === 'definitive') && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 flex items-center gap-1">
                            <CheckCircle size={10} /> Accettato
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-[#f8f9fa] mb-2">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-sm text-[#dee2e6] mb-4 line-clamp-2">{doc.description}</p>
                    )}
                    <div className="text-xs text-[#adb5bd] mb-4">
                      {doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDocUrl(doc.file_url);
                          setSelectedDocTitle(doc.title);
                        }}
                        className="flex-1 bg-[#495057] text-[#f8f9fa] hover:bg-[#6c757d] transition-colors font-medium border border-[#f8f9fa]/20"
                      >
                        <Eye size={14} className="mr-1" />
                        Vedi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDocument({ id: doc._id })}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}