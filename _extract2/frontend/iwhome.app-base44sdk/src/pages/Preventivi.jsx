/// <reference types="vite/client" />
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import {
    FileText, Download, Search, CheckCircle, XCircle, Clock, HardHat, Link2, Unlink, Users,
    Eye, Upload, Loader2, Trash2, Lock, MessageSquare, Send, Truck, TrendingUp, UserPlus,
    AlertTriangle, Calendar, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';



import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';

export default function Preventivi() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [selectedCantiere, setSelectedCantiere] = useState(undefined);
    const [detailQuote, setDetailQuote] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadQuote, setUploadQuote] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);

    const [isUploading, setIsUploading] = useState(false);
    const [viewPdfUrl, setViewPdfUrl] = useState(null);

    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    // Get role from Convex (source of truth)
    const convexUser = useQuery(api.users.getByEmail, { email: userEmail });
    const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';
    const isClient = convexUser?.role === 'client';

    // Queries
    const allQuotes = useQuery(api.quotes.getAll, {}) || [];
    const userQuotes = useQuery(api.quotes.getByUser, { email: userEmail }) || [];
    const quotes = isAdmin ? allQuotes : userQuotes;

    // Query cantieri for linking
    const cantieri = useQuery(api.cantieri.listCantieri, { company_email: userEmail }) || [];
    const clientsList = useQuery(api.clients.list, isAdmin ? {} : "skip") || []; // Fetch clients
    const myDocuments = useQuery(api.documents.get, {}) || [];

    // Query supplier requests for conversion
    const supplierRequests = useQuery(api.suppliers.listRequests, {}) || [];
    const suppliers = useQuery(api.suppliers.list, {}) || [];

    // State for Quote -> Order conversion
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [quoteToConvert, setQuoteToConvert] = useState(null);
    const [selectedRequestToConvert, setSelectedRequestToConvert] = useState("");
    const [isConverting, setIsConverting] = useState(false);

    // State for Forwarding to Supplier
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [quoteToForward, setQuoteToForward] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [preliminaryQuote, setPreliminaryQuote] = useState("");
    const [isForwarding, setIsForwarding] = useState(false);

    // State for Finalizing for Client
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [selectedRequestToFinalize, setSelectedRequestToFinalize] = useState(null);
    const [marginPrice, setMarginPrice] = useState("");
    const [finalDocId, setFinalDocId] = useState("");
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [expiresDays, setExpiresDays] = useState("7");
    const [accontoPercentage, setAccontoPercentage] = useState("30");

    // State for client acceptance confirmation
    const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
    const [quoteToAccept, setQuoteToAccept] = useState(null);
    const [isAccepting, setIsAccepting] = useState(false);

    // Mutations
    const linkToCantiereMutation = useMutation(api.quotes.linkToCantiere);
    const finalizeQuoteMutation = useMutation(api.suppliers.finalizeIWHomeQuote);
    const unlinkFromCantiereMutation = useMutation(api.quotes.unlinkFromCantiere);
    const linkToClientMutation = useMutation(api.quotes.linkToClient);
    const unlinkFromClientMutation = useMutation(api.quotes.unlinkFromClient);
    const updateCantiereMutation = useMutation(api.cantieri.updateCantiere);
    const updateStatusMutation = useMutation(api.quotes.updateStatus);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const createDocumentMutation = useMutation(api.documents.create);
    const deleteQuoteMutation = useMutation(api.quotes.deleteQuote);
    const createOrderFromQuoteMutation = useMutation(api.suppliers.createOrderFromQuote);
    const createRequestMutation = useMutation(api.suppliers.createRequest);
    // Client-side acceptance: uses respondToQuote (no admin required, verifies ownership)
    const respondToQuoteMutation = useMutation(api.quotes.respondToQuote);

    const [selectedClient, setSelectedClient] = useState(undefined);

    const handleConvertToOrder = async () => {
        if (!quoteToConvert || !selectedRequestToConvert) return;
        setIsConverting(true);
        try {
            const request = supplierRequests.find(r => r._id === selectedRequestToConvert);
            if (!request) { alert('Richiesta fornitore non trovata.'); return; }
            await createOrderFromQuoteMutation({
                supplier_id: request.supplier_id,
                // @ts-ignore
                request_id: selectedRequestToConvert,
                quote_id: quoteToConvert._id,
                cantiere_id: quoteToConvert.cantiere_id,
                total_amount: request.quoted_price || quoteToConvert.estimated_price
            });
            alert("Ordine Fornitore creato con successo!");
            setConvertModalOpen(false);
            setQuoteToConvert(null);
            setSelectedRequestToConvert("");
        } catch (err) {
            console.error('Error converting to order:', err);
            alert("Errore durante la creazione dell'ordine fornitore.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo preventivo? Questa azione è irreversibile.')) return;
        try {
            await deleteQuoteMutation({ id });
        } catch (err) {
            console.error('Error deleting quote:', err);
            alert('Errore durante l\'eliminazione del preventivo.');
        }
    };

    const handleForwardToSupplier = async () => {
        if (!quoteToForward || !selectedSupplier) return;
        setIsForwarding(true);
        try {
            const supplier = suppliers.find(s => s._id === selectedSupplier);
            if (!supplier) { alert('Fornitore non trovato.'); return; }

            // Separate photos and documents based on extension
            const photos = [];
            const documents = [];
            (quoteToForward.files || []).forEach(url => {
                const lower = url.toLowerCase();
                const isImg = lower.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)/) || lower.includes('image');
                if (isImg) photos.push(url);
                else documents.push(url);
            });

            // Create a request for the supplier based on the client quote
            await createRequestMutation({
                // @ts-ignore
                supplier_id: selectedSupplier,
                title: `Richiesta da Cliente: ${quoteToForward.full_name || quoteToForward.email}`,
                description: `Richiesta inoltrata da IWHome.\n\nNote cliente: ${quoteToForward.notes || 'Nessuna'}\nTipo: ${quoteToForward.quote_type}`,
                fixture_type: quoteToForward.quote_type,
                urgency: 'normal',
                quantity: 1,
                preliminary_quote: preliminaryQuote ? parseFloat(preliminaryQuote) : undefined,
                quote_id: quoteToForward._id, // Track the source
                photos,
                documents
            });

            alert(`Richiesta inviata con successo a ${supplier.name}`);
            setForwardModalOpen(false);
            setQuoteToForward(null);
            setSelectedSupplier("");
            setPreliminaryQuote("");
        } catch (err) {
            console.error('Error forwarding to supplier:', err);
            alert("Errore durante l'invio al fornitore.");
        } finally {
            setIsForwarding(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" /> Accettato</Badge>;
            case 'rejected':
                return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-none"><XCircle size={12} className="mr-1" /> Rifiutato</Badge>;
            case 'sent':
                return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-none"><FileText size={12} className="mr-1" /> Preventivo Inviato</Badge>;
            case 'request':
                return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-none"><Upload size={12} className="mr-1" /> Richiesta Cliente</Badge>;
            case 'in_lavorazione':
                return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-none"><Clock size={12} className="mr-1" /> In Lavorazione</Badge>;
            case 'scaduto':
                return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-none"><XCircle size={12} className="mr-1" /> Scaduto</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" /> In Attesa</Badge>;
        }
    };

    const getCantiereInfo = (cantiereId) => {
        if (!cantiereId) return null;
        return cantieri.find(c => c._id === cantiereId);
    };

    const getClientInfo = (clientId) => {
        if (!clientId) return null;
        return clientsList.find(c => c._id === clientId);
    };

    const handleLink = async () => {
        if (!selectedQuote) return;
        const hasClient = !!selectedClient;
        const hasCantiere = !!selectedCantiere;
        if (!hasClient && !hasCantiere) return;

        try {
            // 1. Link client to quote
            if (hasClient) {
                await linkToClientMutation({
                    quote_id: selectedQuote._id,
                    client_id: selectedClient
                });
            }

            // 2. Link quote to cantiere
            if (hasCantiere) {
                await linkToCantiereMutation({
                    quote_id: selectedQuote._id,
                    cantiere_id: selectedCantiere
                });
            }

            // 3. Also update cantiere's client_id if both are selected
            if (hasClient && hasCantiere) {
                await updateCantiereMutation({
                    id: selectedCantiere,
                    data: { client_id: selectedClient }
                });
            }

            setLinkModalOpen(false);
            setSelectedQuote(null);
            setSelectedCantiere(undefined);
            setSelectedClient(undefined);
        } catch (err) {
            console.error('Error linking:', err);
        }
    };

    const handleUnlink = async (quoteId) => {
        await unlinkFromCantiereMutation({ quote_id: quoteId });
    };

    const handleUnlinkClient = async (quoteId) => {
        await unlinkFromClientMutation({ quote_id: quoteId });
    };

    // Admin: Upload final quote PDF and mark as sent
    const handleUploadFinalQuote = async () => {
        if (!uploadQuote || !uploadFile) return;
        setIsUploading(true);
        try {
            // Upload file to Convex storage
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": uploadFile.type },
                body: uploadFile,
            });
            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();

            // Create document linked to quote and shared with client
            await createDocumentMutation({
                title: `Preventivo Definitivo - ${uploadQuote.full_name || uploadQuote.email}`,
                description: `Preventivo definitivo per ${uploadQuote.quote_type === 'finestre' ? 'Infissi e Serramenti' : uploadQuote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'}`,
                category: 'preventivo',
                file_url: storageId,
                file_name: uploadFile.name,
                file_type: uploadFile.type,
                file_size: uploadFile.size,
                is_public: 'false',
                created_by: userEmail,
                created_date: new Date().toISOString(),
                shared_with: [uploadQuote.email],
                quote_id: uploadQuote._id,
                status: 'definitive'
            });

            // Update quote status to sent
            await updateStatusMutation({ id: uploadQuote._id, status: 'sent' });

            setUploadModalOpen(false);
            setUploadQuote(null);
            setUploadFile(null);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Errore durante il caricamento del preventivo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFinalizeQuote = async () => {
        if (!selectedRequestToFinalize || !marginPrice || !finalDocId) return;
        setIsFinalizing(true);
        try {
            await finalizeQuoteMutation({
                request_id: selectedRequestToFinalize._id,
                margin_price: parseFloat(marginPrice),
                // @ts-ignore
                final_doc_id: finalDocId,
                expires_days: expiresDays ? parseInt(expiresDays) : undefined,
                acconto_percentage: accontoPercentage ? parseFloat(accontoPercentage) : undefined,
            });
            alert("Preventivo finalizzato e inviato al cliente!");
            setFinalizeModalOpen(false);
            setSelectedRequestToFinalize(null);
            setMarginPrice("");
            setFinalDocId("");
            setExpiresDays("7");
            setAccontoPercentage("30");
        } catch (err) {
            console.error('Error finalizing quote:', err);
            alert("Errore durante la finalizzazione del preventivo.");
        } finally {
            setIsFinalizing(false);
        }
    };

    const handleClientAccept = async () => {
        if (!quoteToAccept) return;
        setIsAccepting(true);
        try {
            // respondToQuote: client-only endpoint that verifies ownership and creates payment
            await respondToQuoteMutation({ quote_id: quoteToAccept._id, response: 'accepted' });
            setAcceptConfirmOpen(false);
            setQuoteToAccept(null);
        } catch (err) {
            console.error('Error accepting quote:', err);
            alert("Errore durante l'accettazione del preventivo.");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleClientReject = async (quote) => {
        if (!window.confirm('Sei sicuro di voler rifiutare questo preventivo?')) return;
        try {
            // respondToQuote: client-only endpoint that verifies ownership
            await respondToQuoteMutation({ quote_id: quote._id, response: 'rejected' });
        } catch (err) {
            console.error('Error rejecting quote:', err);
            alert("Errore durante il rifiuto del preventivo.");
        }
    };

    const getExpiryBadge = (quote) => {
        if (!quote.client_quote_expires_at || quote.status !== 'sent') return null;
        const now = new Date();
        const expiry = new Date(quote.client_quote_expires_at);
        const diffMs = expiry.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffMs <= 0) return null; // scaduto shown via getStatusBadge
        if (diffHours <= 24) {
            return (
                <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-none animate-pulse">
                    <AlertTriangle size={12} className="mr-1" /> Scade tra {diffHours}h
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-none">
                <Calendar size={12} className="mr-1" /> Scade il {expiry.toLocaleDateString('it-IT')}
            </Badge>
        );
    };

    const filteredQuotes = quotes.filter(quote => {
        const matchesSearch =
            (quote.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (quote.quote_type?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (quote.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (quote.email?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">


            <UniversalPdfViewer
                isOpen={!!viewPdfUrl}
                onClose={() => setViewPdfUrl(null)}
                url={viewPdfUrl}
                title="Visualizzazione Preventivo"
            />

            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                {convexUser === undefined ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (!isAdmin && !isClient) ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center">
                            <h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2>
                            <p className="text-[#adb5bd]">Solo gli amministratori possono accedere alla gestione preventivi.</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                    <FileText className="text-[#f8f9fa]" />
                                    {isAdmin ? 'Gestione Preventivi' : 'I Miei Preventivi'}
                                </h1>
                                <p className="text-[#adb5bd]">
                                    {isAdmin ? 'Visualizza e collega preventivi ai cantieri' : 'Visualizza e gestisci le tue richieste di preventivo'}
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-8">
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                    <Input
                                        placeholder="Cerca preventivi..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                    />
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                    <Button
                                        variant={statusFilter === 'all' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('all')}
                                        className={statusFilter === 'all' ? "bg-[#f8f9fa] text-black" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                    >
                                        Tutti
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'pending' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('pending')}
                                        className={statusFilter === 'pending' ? "bg-yellow-500 text-white border-none" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                    >
                                        In Attesa
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'accepted' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('accepted')}
                                        className={statusFilter === 'accepted' ? "bg-green-500 text-white border-none" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                    >
                                        Accettati
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'request' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('request')}
                                        className={statusFilter === 'request' ? "bg-cyan-500 text-white border-none" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                    >
                                        Richieste
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'in_lavorazione' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('in_lavorazione')}
                                        className={statusFilter === 'in_lavorazione' ? "bg-purple-500 text-white border-none" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                    >
                                        In Lavorazione
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Link Modal - Unified */}
                        <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
                            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-[#f8f9fa]">Collega Preventivo</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-5 py-4">
                                    {selectedQuote && (
                                        <div className="bg-[#495057]/50 rounded-lg p-3">
                                            <p className="text-sm text-[#adb5bd]">Preventivo selezionato:</p>
                                            <p className="text-[#f8f9fa] font-medium">
                                                {selectedQuote.title || (
                                                    selectedQuote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                                        selectedQuote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'
                                                )}
                                            </p>
                                            <p className="text-xs text-[#6c757d]">{selectedQuote.email}</p>
                                        </div>
                                    )}

                                    {/* Client Selector */}
                                    {!selectedQuote?.client_id && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-[#dee2e6] flex items-center gap-2">
                                                <Users size={14} /> Seleziona Cliente
                                            </label>
                                            <Select value={selectedClient} onValueChange={setSelectedClient}>
                                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                                    <SelectValue placeholder="Seleziona cliente..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                                    {clientsList.filter(c => c.status === 'active').map(client => (
                                                        <SelectItem key={client._id} value={client._id} className="text-[#f8f9fa] focus:bg-[#495057]">
                                                            <div className="flex items-center gap-2">
                                                                <span>{client.full_name}</span>
                                                                {client.company_name && <span className="text-[#adb5bd] text-xs">({client.company_name})</span>}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Cantiere Selector */}
                                    {!selectedQuote?.cantiere_id && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-[#dee2e6] flex items-center gap-2">
                                                <HardHat size={14} /> Seleziona Cantiere
                                            </label>
                                            <Select value={selectedCantiere} onValueChange={setSelectedCantiere}>
                                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                                    <SelectValue placeholder="Seleziona cantiere..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                                    {cantieri.map(cantiere => (
                                                        <SelectItem key={cantiere._id} value={cantiere._id} className="text-[#f8f9fa] focus:bg-[#495057]">
                                                            <div className="flex items-center gap-2">
                                                                <HardHat size={14} />
                                                                {cantiere.nome_cantiere}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleLink}
                                        disabled={!selectedClient && !selectedCantiere}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Link2 size={16} className="mr-2" /> Collega
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Quotes List */}
                        <div className="grid grid-cols-1 gap-4">
                            {filteredQuotes.length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <FileText size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun preventivo trovato</h3>
                                    <p className="text-[#adb5bd] mt-2">Le tue richieste di preventivo appariranno qui.</p>
                                </div>
                            ) : (
                                filteredQuotes.map((quote) => {
                                    const linkedCantiere = getCantiereInfo(quote.cantiere_id);
                                    const linkedClient = getClientInfo(quote.client_id);
                                    return (
                                        <motion.div
                                            key={quote._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                <h3 className="text-lg font-medium text-[#f8f9fa]">
                                                                    {quote.title || (
                                                                        quote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                                                            quote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'
                                                                    )}
                                                                </h3>
                                                                {getStatusBadge(quote.status)}
                                                                {getExpiryBadge(quote)}
                                                                {linkedCantiere && (
                                                                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-none">
                                                                        <HardHat size={12} className="mr-1" />
                                                                        {linkedCantiere.nome_cantiere}
                                                                    </Badge>
                                                                )}
                                                                {linkedClient && (
                                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-none">
                                                                        <Users size={12} className="mr-1" />
                                                                        {linkedClient.full_name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center text-sm text-[#adb5bd] gap-4 flex-wrap">
                                                                {isAdmin && (
                                                                    <div className="flex items-center gap-3 text-cyan-400">
                                                                        <Users size={14} />
                                                                        <span className="font-medium">{quote.full_name}</span>
                                                                        <span className="text-[#6c757d]">({quote.email})</span>
                                                                        {quote.phone && <span className="text-[#adb5bd]">{quote.phone}</span>}
                                                                    </div>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={14} />
                                                                    {new Date(quote.created_date).toLocaleDateString('it-IT')}
                                                                </span>
                                                                {quote.estimated_price && (
                                                                    <span className="text-[#f8f9fa] font-medium">
                                                                        € {quote.estimated_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {quote.notes && (
                                                                <div className="mt-3 p-3 bg-[#212529]/50 rounded-lg border border-[#f8f9fa]/5 text-sm text-[#dee2e6]">
                                                                    <p className="text-xs text-[#6c757d] mb-1">Note Richiesta:</p>
                                                                    <p>{quote.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap justify-end">
                                                            {quote.files && quote.files.length > 0 && (
                                                                <Button
                                                                    variant="default"
                                                                    className="bg-[#f8f9fa] text-black hover:bg-[#e9ecef] border-none font-medium"
                                                                    onClick={() => setViewPdfUrl(quote.files[0])}
                                                                >
                                                                    <Download size={16} className="mr-2" /> Scarica Allegato
                                                                </Button>
                                                            )}

                                                            {/* Admin linking controls */}
                                                            {isAdmin && (
                                                                <>
                                                                    {linkedCantiere ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            onClick={() => handleUnlink(quote._id)}
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                                        >
                                                                            <Unlink size={16} className="mr-1" /> Scollega Cantiere
                                                                        </Button>
                                                                    ) : null}

                                                                    {linkedClient ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            onClick={() => handleUnlinkClient(quote._id)}
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                                        >
                                                                            <Unlink size={16} className="mr-1" /> Scollega Client
                                                                        </Button>
                                                                    ) : null}

                                                                    {!linkedCantiere || !linkedClient ? (
                                                                        quote.status === 'accepted' ? (
                                                                            <Button
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    setSelectedQuote(quote);
                                                                                    setLinkModalOpen(true);
                                                                                }}
                                                                                className="text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
                                                                            >
                                                                                <Link2 size={16} className="mr-1" /> Collega
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                variant="outline"
                                                                                disabled
                                                                                title="Il preventivo deve essere accettato dal cliente per poter essere collegato a un cantiere."
                                                                                className="text-gray-500 border-gray-600/30 cursor-not-allowed bg-gray-500/5"
                                                                            >
                                                                                <Lock size={16} className="mr-1" /> Collega
                                                                            </Button>
                                                                        )
                                                                    ) : null}

                                                                    {isAdmin && quote.status === 'accepted' && (
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                setQuoteToConvert(quote);
                                                                                setConvertModalOpen(true);
                                                                            }}
                                                                            className="text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
                                                                        >
                                                                            <HardHat size={16} className="mr-1" /> Ordine Fornitore
                                                                        </Button>
                                                                    )}

                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={() => handleDelete(quote._id)}
                                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                                        title="Elimina Preventivo"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </>
                                                            )}

                                                            {/* Admin: Finalize from supplier response */}
                                                            {isAdmin && supplierRequests.find(r => r.quote_id === quote._id && r.status === 'preventivato') && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        const req = supplierRequests.find(r => r.quote_id === quote._id && r.status === 'preventivato');
                                                                        setSelectedRequestToFinalize(req);
                                                                        setMarginPrice(req.quoted_price ? (req.quoted_price * 1.2).toString() : ""); // Default 20% margin
                                                                        setFinalizeModalOpen(true);
                                                                    }}
                                                                    className="text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
                                                                >
                                                                    <TrendingUp size={16} className="mr-1" /> Finalizza per Cliente
                                                                </Button>
                                                            )}

                                                            {/* Admin: Upload final quote */}
                                                            {isAdmin && (quote.status === 'draft' || quote.status === 'accepted') && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setUploadQuote(quote);
                                                                        setUploadModalOpen(true);
                                                                    }}
                                                                    className="text-green-400 border-green-500/30 hover:bg-green-500/20"
                                                                >
                                                                    <Upload size={16} className="mr-1" /> Carica Definitivo
                                                                </Button>
                                                            )}

                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setDetailQuote(quote)}
                                                                className="text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-300"
                                                            >
                                                                <Eye size={16} className="mr-1" /> Dettagli
                                                            </Button>

                                                            {/* Client: Accept/Reject when quote is sent */}
                                                            {isClient && quote.status === 'sent' && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => { setQuoteToAccept(quote); setAcceptConfirmOpen(true); }}
                                                                        className="text-green-400 border-green-500/30 hover:bg-green-500/20"
                                                                    >
                                                                        <ThumbsUp size={16} className="mr-1" /> Accetta
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleClientReject(quote)}
                                                                        className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                                                                    >
                                                                        <ThumbsDown size={16} className="mr-1" /> Rifiuta
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {isAdmin && quote.status === 'request' && (
                                                                <div className="flex gap-2">
                                                                    {!supplierRequests.some(r => r.quote_id === quote._id) ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                setQuoteToForward(quote);
                                                                                setForwardModalOpen(true);
                                                                            }}
                                                                            className="text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
                                                                        >
                                                                            <Send size={16} className="mr-1" /> Invia a Fornitore
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 flex items-center gap-1.5">
                                                                            <Send size={13} /> Inviato al Fornitore
                                                                        </span>
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => navigate(`/Messages?clientEmail=${encodeURIComponent(quote.email || '')}`)}
                                                                        className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
                                                                    >
                                                                        <MessageSquare size={16} className="mr-1" /> Chat Cliente
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Client: Acceptance Confirmation Modal */}
                        <Dialog open={acceptConfirmOpen} onOpenChange={setAcceptConfirmOpen}>
                            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                                        <ThumbsUp size={20} className="text-green-400" />
                                        Accetta Preventivo
                                    </DialogTitle>
                                </DialogHeader>
                                {quoteToAccept && (
                                    <div className="space-y-4 py-2">
                                        <div className="bg-[#495057]/50 rounded-lg p-3">
                                            <p className="text-sm text-[#adb5bd]">Stai per accettare il preventivo:</p>
                                            <p className="text-[#f8f9fa] font-medium mt-1">
                                                {quoteToAccept.title || (
                                                    quoteToAccept.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                                        quoteToAccept.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'
                                                )}
                                            </p>
                                        </div>

                                        {quoteToAccept.estimated_price && (
                                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[#adb5bd] text-sm">Prezzo Totale</span>
                                                    <span className="text-xl font-bold text-[#f8f9fa]">€ {quoteToAccept.estimated_price.toLocaleString('it-IT')}</span>
                                                </div>
                                                {quoteToAccept.acconto_percentage && (
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-500/20">
                                                        <span className="text-amber-400 text-sm font-medium">Acconto richiesto ({quoteToAccept.acconto_percentage}%)</span>
                                                        <span className="text-amber-400 font-bold">€ {(quoteToAccept.estimated_price * quoteToAccept.acconto_percentage / 100).toLocaleString('it-IT')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {quoteToAccept.client_quote_expires_at && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
                                                <Calendar size={16} className="text-amber-400 shrink-0" />
                                                <p className="text-sm text-amber-300">
                                                    Offerta valida fino al <strong>{new Date(quoteToAccept.client_quote_expires_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                                </p>
                                            </div>
                                        )}

                                        <p className="text-xs text-[#6c757d]">
                                            Accettando il preventivo, autorizzi IWHome a procedere con l'ordine al fornitore. Riceverai istruzioni per il pagamento dell'acconto.
                                        </p>

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setAcceptConfirmOpen(false); setQuoteToAccept(null); }}
                                                className="flex-1 text-[#adb5bd] hover:text-[#f8f9fa]"
                                                disabled={isAccepting}
                                            >
                                                Annulla
                                            </Button>
                                            <Button
                                                onClick={handleClientAccept}
                                                disabled={isAccepting}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {isAccepting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <ThumbsUp size={16} className="mr-2" />}
                                                Conferma Accettazione
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Forward to Supplier Modal */}
                        <Dialog open={forwardModalOpen} onOpenChange={setForwardModalOpen}>
                            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                                        <Truck size={20} className="text-orange-400" />
                                        Invia Richiesta al Fornitore
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="bg-[#495057]/50 rounded-lg p-3">
                                        <p className="text-sm text-[#adb5bd]">Richiesta del cliente:</p>
                                        <p className="text-[#f8f9fa] font-medium">{quoteToForward?.full_name || quoteToForward?.email}</p>
                                        <p className="text-xs text-[#6c757d]">{quoteToForward?.quote_type}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-[#dee2e6]">Seleziona Fornitore:</label>
                                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                                <SelectValue placeholder="Scegli un fornitore..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                                {suppliers.map(s => (
                                                    <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa] focus:bg-[#495057]">
                                                        {s.name} ({s.type})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-[#dee2e6]">Prezzo Preliminare (Opzionale):</label>
                                        <Input
                                            type="number"
                                            placeholder="€"
                                            value={preliminaryQuote}
                                            onChange={(e) => setPreliminaryQuote(e.target.value)}
                                            className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                                        />
                                        <p className="text-[10px] text-[#6c757d]">Prezzo indicativo non vincolante tra IWHome e Fornitore.</p>
                                    </div>

                                    <Button
                                        onClick={handleForwardToSupplier}
                                        disabled={!selectedSupplier || isForwarding}
                                        className="w-full bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isForwarding ? (
                                            <><Loader2 size={16} className="mr-2 animate-spin" /> Invio...</>
                                        ) : (
                                            <><Send size={16} className="mr-2" /> Invia Richiesta</>
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Quote Detail Modal */}
                        <Dialog open={!!detailQuote} onOpenChange={(open) => !open && setDetailQuote(null)}>
                            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <DialogHeader>
                                    <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                                        <FileText size={20} className="text-blue-400" />
                                        Dettagli Preventivo
                                    </DialogTitle>
                                </DialogHeader>
                                {detailQuote && <QuoteDetailContent quote={detailQuote} onViewPdf={setViewPdfUrl} />}
                            </DialogContent>
                        </Dialog>

                        {/* Upload Final Quote Modal */}
                        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                                        <Upload size={20} className="text-green-400" />
                                        Carica Preventivo Definitivo
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    {uploadQuote && (
                                        <div className="bg-[#495057]/50 rounded-lg p-3">
                                            <p className="text-sm text-[#adb5bd]">Per il preventivo di:</p>
                                            <p className="text-[#f8f9fa] font-medium">{uploadQuote.full_name || uploadQuote.email}</p>
                                            <p className="text-xs text-[#6c757d]">
                                                {uploadQuote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                                    uploadQuote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm text-[#dee2e6]">File PDF del preventivo definitivo</label>
                                        <Input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] file:bg-[#343a40] file:text-[#f8f9fa] file:border-none"
                                        />
                                        {uploadFile && (
                                            <p className="text-xs text-[#adb5bd]">{uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)</p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleUploadFinalQuote}
                                        disabled={!uploadFile || isUploading}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {isUploading ? (
                                            <><Loader2 size={16} className="mr-2 animate-spin" /> Caricamento...</>
                                        ) : (
                                            <><Upload size={16} className="mr-2" /> Carica e Invia al Cliente</>
                                        )}
                                    </Button>
                                    <p className="text-xs text-[#6c757d] text-center">
                                        Il file sarà condiviso con il cliente e lo stato del preventivo sarà aggiornato a "Inviato"
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Convert to Order Modal */}
                        <Dialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
                            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                                        <HardHat size={20} className="text-orange-400" />
                                        Trasforma in Ordine Fornitore
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="bg-[#495057]/50 rounded-lg p-3">
                                        <p className="text-sm text-[#adb5bd]">Preventivo approvato dal cliente:</p>
                                        <p className="text-[#f8f9fa] font-medium">{quoteToConvert?.full_name || quoteToConvert?.email}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-[#dee2e6]">Seleziona la Richiesta del Fornitore da convertire in Ordine:</label>
                                        {(() => {
                                            // Show ALL non-draft/non-rejected requests.
                                            // Sort: requests linked to THIS quote first, then others.
                                            const allAvailable = supplierRequests
                                                .filter(r => r.status !== "draft" && r.status !== "rejected")
                                                .sort((a, b) => {
                                                    const aMatch = a.quote_id === quoteToConvert?._id;
                                                    const bMatch = b.quote_id === quoteToConvert?._id;
                                                    if (aMatch && !bMatch) return -1;
                                                    if (!aMatch && bMatch) return 1;
                                                    return 0;
                                                });
                                            return (
                                                <Select value={selectedRequestToConvert} onValueChange={setSelectedRequestToConvert}>
                                                    <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                                        <SelectValue placeholder="Seleziona la richiesta..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#343a40] border-[#495057] z-[9999]">
                                                        {allAvailable.length === 0 ? (
                                                            <SelectItem value="__nessuna__" disabled className="text-[#6c757d] italic text-sm">
                                                                Nessuna richiesta trovata — crea prima una richiesta in Fornitori
                                                            </SelectItem>
                                                        ) : (
                                                            allAvailable.map(req => {
                                                                const supplier = suppliers.find(s => s._id === req.supplier_id);
                                                                const isLinked = req.quote_id === quoteToConvert?._id;
                                                                return (
                                                                    <SelectItem key={req._id} value={req._id} className="text-[#f8f9fa] focus:bg-[#495057]">
                                                                        {isLinked ? '★ ' : ''}{req.title} {supplier ? `(${supplier.name})` : ''} — {req.quoted_price ? `€${req.quoted_price}` : 'Prezzo TBD'} [{req.status}]
                                                                    </SelectItem>
                                                                );
                                                            })
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            );
                                        })()}
                                    </div>

                                    <Button
                                        onClick={handleConvertToOrder}
                                        disabled={!selectedRequestToConvert || selectedRequestToConvert === "__nessuna__" || isConverting}
                                        className="w-full bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isConverting ? (
                                            <><Loader2 size={16} className="mr-2 animate-spin" /> Creazione Ordine in corso...</>
                                        ) : (
                                            <><HardHat size={16} className="mr-2" /> Crea Ordine e Invia al Fornitore</>
                                        )}
                                    </Button>
                                    <p className="text-xs text-[#6c757d] text-center">
                                        Creerà automaticamente l'OdA (Ordine di Acquisto Fornitore) e avviserà il fornitore dell'inizio produzione, generando il pagamento in attesa.
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Modal: Finalize for Client */}
            <Dialog open={finalizeModalOpen} onOpenChange={setFinalizeModalOpen}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingUp className="text-orange-500" size={20} />
                            Finalizza Preventivo per Cliente
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRequestToFinalize && (
                        <div className="space-y-4 py-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Dati Fornitore</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span>Prezzo Fornitore:</span>
                                    <span className="font-medium">€{selectedRequestToFinalize.quoted_price}</span>
                                </div>
                                {selectedRequestToFinalize.supplier_notes && (
                                    <p className="text-xs text-[#6c757d] mt-1">Notes: {selectedRequestToFinalize.supplier_notes}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-[#adb5bd] uppercase font-bold">Prezzo Finale al Cliente (con margine)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]">€</span>
                                    <Input
                                        type="number"
                                        placeholder="Inserisci prezzo finale..."
                                        className="bg-[#212529] border-[#495057] pl-8 text-[#f8f9fa]"
                                        value={marginPrice}
                                        onChange={(e) => setMarginPrice(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-orange-400">
                                    Il margine di ricarico è di: €{(parseFloat(marginPrice) - selectedRequestToFinalize.quoted_price || 0).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-[#adb5bd] uppercase font-bold">PDF Definitivo da "Documenti"</label>
                                <Select value={finalDocId} onValueChange={setFinalDocId}>
                                    <SelectTrigger className="bg-[#212529] border-[#495057] text-[#f8f9fa]">
                                        <SelectValue placeholder="Seleziona documento..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                        {myDocuments.map(doc => (
                                            <SelectItem key={doc._id} value={doc._id} className="text-[#f8f9fa]">{doc.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#adb5bd] uppercase font-bold">Scadenza Offerta (giorni)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="es. 7"
                                        value={expiresDays}
                                        onChange={(e) => setExpiresDays(e.target.value)}
                                        className="bg-[#212529] border-[#495057] text-[#f8f9fa]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#adb5bd] uppercase font-bold">Acconto (%)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="es. 30"
                                        value={accontoPercentage}
                                        onChange={(e) => setAccontoPercentage(e.target.value)}
                                        className="bg-[#212529] border-[#495057] text-[#f8f9fa]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#495057]">
                                <Button variant="ghost" onClick={() => setFinalizeModalOpen(false)} className="text-[#adb5bd] hover:text-[#f8f9fa]" disabled={isFinalizing}>Annulla</Button>
                                <Button
                                    onClick={handleFinalizeQuote}
                                    disabled={!marginPrice || !finalDocId || isFinalizing}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {isFinalizing ? <Loader2 className="animate-spin mr-2" size={16} /> : <TrendingUp size={16} className="mr-2" />}
                                    Finalizza e Invia
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Separate component for Quote Details to use hooks
function QuoteDetailContent({ quote, onViewPdf }) {
    const documents = useQuery(api.documents.getByQuote, { quote_id: quote._id }) || [];
    const definitiveDoc = documents.find(d => d.category === 'preventivo');
    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" /> Accettato</Badge>;
            case 'rejected':
                return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-none"><XCircle size={12} className="mr-1" /> Rifiutato</Badge>;
            case 'sent':
                return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-none"><FileText size={12} className="mr-1" /> Inviato</Badge>;
            case 'in_lavorazione':
                return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-none"><Clock size={12} className="mr-1" /> In Lavorazione</Badge>;
            case 'scaduto':
                return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-none"><XCircle size={12} className="mr-1" /> Scaduto</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" /> In Attesa</Badge>;
        }
    };

    // Documents linked to this quote
    // Wait, quote.email is client email. listCantieri expects company_email of the logged in user usually. 
    // But here we just want to display names. The parent component already passed them maybe? 
    // Let's rely on parent passing or fetch simple info.
    // Actually simplicity: just show what's in the quote object if enriched? No, quote has IDs.
    // For now, let's just show the basic info we have in the quote object, or simple IDs. 
    // Or simpler: The parent `Preventivi` renders the dialog content directly. 
    // I cannot easily introduce a new component inside `replace_file_content` if I don't replace the whole file structure or define it outside.
    // I will stick to modifying the existing render logic in the parent component and fetching documents there?
    // Rules of Hooks: cannot call useQuery conditionally.
    // So `Preventivi` component must fetch documents for the `detailQuote`.
    // But `detailQuote` is state.
    // Solution: Create a sub-component `QuoteDetailModal` and render it when `detailQuote` is present.
    return (
        <div className="space-y-4 py-2">
            {/* Status + Type */}
            <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-medium">
                    {quote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                        quote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'}
                </h3>
                {getStatusBadge(quote.status)}
            </div>

            {/* Definitive Quote Download */}
            {definitiveDoc && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-green-400 flex items-center gap-2">
                            <CheckCircle size={16} /> Preventivo Definitivo Disponibile
                        </p>
                        <p className="text-xs text-[#adb5bd] mt-1">{definitiveDoc.file_name}</p>
                    </div>
                    <Button
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                        onClick={() => onViewPdf(definitiveDoc.file_url)}
                    >
                        <Download size={16} className="mr-2" /> Scarica
                    </Button>
                </div>
            )}

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#495057]/40 rounded-lg p-3">
                    <p className="text-xs text-[#adb5bd]">Cliente</p>
                    <p className="text-[#f8f9fa] font-medium">{quote.full_name || 'N/A'}</p>
                </div>
                <div className="bg-[#495057]/40 rounded-lg p-3">
                    <p className="text-xs text-[#adb5bd]">Email</p>
                    <p className="text-[#f8f9fa] text-sm">{quote.email}</p>
                </div>
                {quote.phone && (
                    <div className="bg-[#495057]/40 rounded-lg p-3">
                        <p className="text-xs text-[#adb5bd]">Telefono</p>
                        <p className="text-[#f8f9fa]">{quote.phone}</p>
                    </div>
                )}
                <div className="bg-[#495057]/40 rounded-lg p-3">
                    <p className="text-xs text-[#adb5bd]">Data</p>
                    <p className="text-[#f8f9fa]">{new Date(quote.created_date).toLocaleDateString('it-IT')}</p>
                </div>
            </div>

            {/* Price */}
            {quote.estimated_price && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-xs text-[#adb5bd] mb-1">Prezzo Stimato</p>
                    <p className="text-2xl font-bold text-[#f8f9fa]">€ {quote.estimated_price.toLocaleString()}</p>
                </div>
            )}

            {/* Notes */}
            {quote.notes && (
                <div className="bg-[#495057]/40 rounded-lg p-3">
                    <p className="text-xs text-[#adb5bd] mb-1">Note</p>
                    <p className="text-[#f8f9fa] text-sm whitespace-pre-wrap">{quote.notes}</p>
                </div>
            )}

            {/* Uploaded Files */}
            {quote.files && quote.files.length > 0 && (
                <div className="bg-[#495057]/40 rounded-lg p-3">
                    <p className="text-xs text-[#adb5bd] mb-2">Allegati Cliente</p>
                    <div className="flex flex-col gap-2">
                        {quote.files.map((fileUrl, idx) => (
                            <Button 
                                key={idx} 
                                variant="default" 
                                className="justify-start bg-[#1A3C5E] hover:bg-[#255280] text-white border border-[#1A3C5E] font-medium transition-colors"
                                onClick={() => onViewPdf(fileUrl)}
                            >
                                <Eye size={16} className="mr-2" /> Visualizza Allegato {idx + 1}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Window Config */}
            {quote.window_config && (
                <div className="bg-[#495057]/40 rounded-lg p-3">
                    <p className="text-xs text-[#adb5bd] mb-2">Configurazione Infissi</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(quote.window_config).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-[#adb5bd] capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-[#f8f9fa]">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Project Config */}
            {quote.project_config && (
                <div className="bg-[#495057]/40 rounded-lg p-3">
                    <p className="text-xs text-[#adb5bd] mb-2">Configurazione Progetto</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(quote.project_config).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-[#adb5bd] capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-[#f8f9fa]">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
