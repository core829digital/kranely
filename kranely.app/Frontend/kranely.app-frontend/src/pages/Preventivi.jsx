/// <reference types="vite/client" />
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useTranslation } from 'react-i18next';
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

export default function Quotes() {
    const { t } = useTranslation();
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
    const finalizeQuoteMutation = useMutation(api.suppliers.finalizeKranelyQuote);
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
            if (!request) { alert('Supplier request not found.'); return; }
            await createOrderFromQuoteMutation({
                supplier_id: request.supplier_id,
                // @ts-ignore
                request_id: selectedRequestToConvert,
                quote_id: quoteToConvert._id,
                cantiere_id: quoteToConvert.cantiere_id,
                total_amount: request.quoted_price || quoteToConvert.estimated_price
            });
            alert('Supplier order created successfully!');
            setConvertModalOpen(false);
            setQuoteToConvert(null);
            setSelectedRequestToConvert("");
        } catch (err) {
            console.error('Error converting to order:', err);
            alert("Error creating supplier order.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) return;
        try {
            await deleteQuoteMutation({ id });
        } catch (err) {
            console.error('Error deleting quote:', err);
            alert('Error deleting the quote.');
        }
    };

    const handleForwardToSupplier = async () => {
        if (!quoteToForward || !selectedSupplier) return;
        setIsForwarding(true);
        try {
            const supplier = suppliers.find(s => s._id === selectedSupplier);
            if (!supplier) { alert('Supplier not found.'); return; }

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
                title: `Client Request: ${quoteToForward.full_name || quoteToForward.email}`,
                description: `Request forwarded by Kranely.\n\nClient notes: ${quoteToForward.notes || 'None'}\nType: ${quoteToForward.quote_type}`,
                fixture_type: quoteToForward.quote_type,
                urgency: 'normal',
                quantity: 1,
                preliminary_quote: preliminaryQuote ? parseFloat(preliminaryQuote) : undefined,
                quote_id: quoteToForward._id, // Track the source
                photos,
                documents
            });

            alert(`Request sent successfully to ${supplier.name}`);
            setForwardModalOpen(false);
            setQuoteToForward(null);
            setSelectedSupplier("");
            setPreliminaryQuote("");
        } catch (err) {
            console.error('Error forwarding to supplier:', err);
            alert("Error sending to supplier.");
        } finally {
            setIsForwarding(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" /> Accepted</Badge>;
            case 'rejected':
                return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-none"><XCircle size={12} className="mr-1" /> Rejected</Badge>;
            case 'sent':
                return <Badge variant="secondary" className="bg-[#FFC703]/20 text-[#FFC703] border-none"><FileText size={12} className="mr-1" /> Quote Sent</Badge>;
            case 'request':
                return <Badge variant="secondary" className="bg-[#FFC703]/20 text-[#FFC703]/80 border-none"><Upload size={12} className="mr-1" /> Request Client</Badge>;
            case 'in_lavorazione':
                return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-none"><Clock size={12} className="mr-1" /> In Progress</Badge>;
            case 'scaduto':
                return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-none"><XCircle size={12} className="mr-1" /> Expired</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" /> Pending</Badge>;
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
                title: `Final Quote - ${uploadQuote.full_name || uploadQuote.email}`,
                description: `Final quote for ${uploadQuote.quote_type === 'finestre' ? 'Windows & Doors' : uploadQuote.quote_type === 'chiavi_in_mano' ? 'Turnkey Renovation' : 'Complete Project'}`,
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
            alert('Error uploading the quote.');
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
            alert('Quote finalized and sent to client!');
            setFinalizeModalOpen(false);
            setSelectedRequestToFinalize(null);
            setMarginPrice("");
            setFinalDocId("");
            setExpiresDays("7");
            setAccontoPercentage("30");
        } catch (err) {
            console.error('Error finalizing quote:', err);
            alert("Error finalizing the quote.");
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
            alert("Error accepting the quote.");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleClientReject = async (quote) => {
        if (!window.confirm('Are you sure you want to reject this quote?')) return;
        try {
            // respondToQuote: client-only endpoint that verifies ownership
            await respondToQuoteMutation({ quote_id: quote._id, response: 'rejected' });
        } catch (err) {
            console.error('Error rejecting quote:', err);
            alert("Error rejecting the quote.");
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
                    <AlertTriangle size={12} className="mr-1" /> Expires in {diffHours}h
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-none">
                <Calendar size={12} className="mr-1" /> Expires on {expiry.toLocaleDateString('en-GB')}
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
        <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">


            <UniversalPdfViewer
                isOpen={!!viewPdfUrl}
                onClose={() => setViewPdfUrl(null)}
                url={viewPdfUrl}
                title="Quote Preview"
            />

            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                {convexUser === undefined ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (!isAdmin && !isClient) ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center">
                            <h2 className="text-xl text-white mb-2">{t('access.denied')}</h2>
                            <p className="text-white/40">{t('access.no_permission')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-light text-white mb-2 flex items-center gap-3">
                                    <FileText className="text-white" />
                                    {isAdmin ? 'Quote Management' : 'My Quotes'}
                                </h1>
                                <p className="text-white/40">
                                    {isAdmin ? 'View and link quotes to projects' : 'View and manage your quote requests'}
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 mb-8">
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <Input
                                        placeholder={t('quotes.search')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-[#535252] border-white/10 text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                    <Button
                                        variant={statusFilter === 'all' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('all')}
                                        className={statusFilter === 'all' ? "bg-[#F0EBE8] text-black" : "bg-transparent text-white/40 border-white/10"}
                                    >
                                        {t('common.all')}
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'pending' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('pending')}
                                        className={statusFilter === 'pending' ? "bg-yellow-500 text-white border-none" : "bg-transparent text-white/40 border-white/10"}
                                    >
                                        {t('quotes.pending')}
                                    </Button>
<Button
                                        variant={statusFilter === 'accepted' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('accepted')}
                                        className={statusFilter === 'accepted' ? "bg-green-500 text-white border-none" : "bg-transparent text-white/40 border-white/10"}
                                    >
                                        {t('quotes.accepted')}
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'rejected' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('rejected')}
                                        className={statusFilter === 'rejected' ? "bg-red-500 text-white border-none" : "bg-transparent text-white/40 border-white/10"}
                                    >
                                        {t('quotes.rejected')}
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'request' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('request')}
                                        className={statusFilter === 'request' ? "bg-cyan-500 text-white border-none" : "bg-transparent text-white/40 border-white/10"}
                                    >
                                        {t('suppliers.requests')}
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'in_lavorazione' ? "default" : "outline"}
                                        onClick={() => setStatusFilter('in_lavorazione')}
                                        className={statusFilter === 'in_lavorazione' ? "bg-purple-500 text-white border-none" : "bg-transparent text-white/40 border-white/10"}
                                    >
                                        {t('cantiere.in_lavorazione')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Link Modal - Unified */}
                        <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
                            <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-white">{t('quotes.title')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-5 py-4">
                                    {selectedQuote && (
                                        <div className="bg-[#535252]/ rounded-lg p-3">
                                            <p className="text-sm text-white/40">{t('quotes.title')}:</p>
                                            <p className="text-white font-medium">
                                                {selectedQuote.title || (
                                                    selectedQuote.quote_type === 'finestre' ? t('landing.quote_types.finestre') :
                                                        selectedQuote.quote_type === 'chiavi_in_mano' ? 'Turnkey Renovation' : 'Complete Project'
                                                )}
                                            </p>
                                            <p className="text-xs text-white/25">{selectedQuote.email}</p>
                                        </div>
                                    )}

                                    {/* Client Selector */}
                                    {!selectedQuote?.client_id && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-white/70 flex items-center gap-2">
                                                <Users size={14} /> Select Client
                                            </label>
                                            <Select value={selectedClient} onValueChange={setSelectedClient}>
                                                <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                                    <SelectValue placeholder={t('clients.select')} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white/5 border-white/10">
                                                    {clientsList.filter(c => c.status === 'active').map(client => (
                                                        <SelectItem key={client._id} value={client._id} className="text-white focus:bg-[#535252]">
                                                            <div className="flex items-center gap-2">
                                                                <span>{client.full_name}</span>
                                                                {client.company_name && <span className="text-white/40 text-xs">({client.company_name})</span>}
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
                                            <label className="text-sm text-white/70 flex items-center gap-2">
                                                <HardHat size={14} /> Select Project
                                            </label>
                                            <Select value={selectedCantiere} onValueChange={setSelectedCantiere}>
                                                <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                                    <SelectValue placeholder={t('projects.select_option')} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white/5 border-white/10">
                                                    {cantieri.map(cantiere => (
                                                        <SelectItem key={cantiere._id} value={cantiere._id} className="text-white focus:bg-[#535252]">
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
                                        className="w-full bg-[#FFC703] hover:bg-[#FFC703]"
                                    >
                                        <Link2 size={16} className="mr-2" /> Link
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Quotes List */}
                        <div className="grid grid-cols-1 gap-4">
                            {filteredQuotes.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8">
                                    <FileText size={48} className="text-white/25 mx-auto mb-4" />
                                    <h3 className="text-xl text-white/70">No quotes found</h3>
                                    <p className="text-white/40 mt-2">Your quote requests will appear here.</p>
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
                                            <Card className="bg-white/5 border border-white/10 hover:border-white/10 transition-all">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                <h3 className="text-lg font-medium text-white">
                                                                    {quote.title || (
                                                                        quote.quote_type === 'finestre' ? 'Windows & Doors' :
                                                                            quote.quote_type === 'chiavi_in_mano' ? 'Turnkey Renovation' : 'Complete Project'
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
                                                                    <Badge variant="secondary" className="bg-[#FFC703]/20 text-[#FFC703] border-none">
                                                                        <Users size={12} className="mr-1" />
                                                                        {linkedClient.full_name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center text-sm text-white/40 gap-4 flex-wrap">
                                                                {isAdmin && (
                                                                    <div className="flex items-center gap-3 text-cyan-400">
                                                                        <Users size={14} />
                                                                        <span className="font-medium">{quote.full_name}</span>
                                                                        <span className="text-white/25">({quote.email})</span>
                                                                        {quote.phone && <span className="text-white/40">{quote.phone}</span>}
                                                                    </div>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={14} />
                                                                    {new Date(quote.created_date).toLocaleDateString('en-GB')}
                                                                </span>
                                                                {quote.estimated_price && (
                                                                    <span className="text-white font-medium">
                                                                        â‚¬ {quote.estimated_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {quote.notes && (
                                                                <div className="mt-3 p-3 bg-[#141210]/ rounded-lg border border-white/ text-sm text-white/70">
                                                                    <p className="text-xs text-white/25 mb-1">Request Notes:</p>
                                                                    <p>{quote.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap justify-end">
                                                            {quote.files && quote.files.length > 0 && (
                                                                <Button
                                                                    variant="default"
                                                                    className="bg-[#F0EBE8] text-black hover:bg-white/10 border-none font-medium"
                                                                    onClick={() => setViewPdfUrl(quote.files[0])}
                                                                >
                                                                    <Download size={16} className="mr-2" /> Download
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
                                                                            <Unlink size={16} className="mr-1" /> Unlink Project
                                                                        </Button>
                                                                    ) : null}

                                                                    {linkedClient ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            onClick={() => handleUnlinkClient(quote._id)}
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                                        >
                                                                            <Unlink size={16} className="mr-1" /> Unlink Client
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
                                                                                <Link2 size={16} className="mr-1" /> Link
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                variant="outline"
disabled
                                                                                 title="The quote must be accepted by the client to be linked to a project."
                                                                                 className="text-[#F0EBE8]/60 border-gray-600/30 cursor-not-allowed bg-gray-500/5"
                                                                             >
                                                                                 <Lock size={16} className="mr-1" /> Link
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
                                                                            <HardHat size={16} className="mr-1" /> Supplier Order
                                                                        </Button>
                                                                    )}

                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={() => handleDelete(quote._id)}
                                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                                        title="Delete Quote"
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
                                                                    <TrendingUp size={16} className="mr-1" /> Finalize for Client
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
                                                                    <Upload size={16} className="mr-1" /> Upload Final
                                                                </Button>
                                                            )}

                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setDetailQuote(quote)}
                                                                className="text-[#FFC703] border-[#FFC703]/20 hover:bg-[#FFC703]/20 hover:text-[#FFC703]"
                                                            >
                                                                <Eye size={16} className="mr-1" /> Details
                                                            </Button>

                                                            {/* Client: Accept/Reject when quote is sent */}
                                                            {isClient && quote.status === 'sent' && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => { setQuoteToAccept(quote); setAcceptConfirmOpen(true); }}
                                                                        className="text-green-400 border-green-500/30 hover:bg-green-500/20"
                                                                    >
                                                                        <ThumbsUp size={16} className="mr-1" /> Accept
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleClientReject(quote)}
                                                                        className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                                                                    >
                                                                        <ThumbsDown size={16} className="mr-1" /> Reject
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
                                                                            <Send size={16} className="mr-1" /> Send to Supplier
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 flex items-center gap-1.5">
                                                                            <Send size={13} /> Sent to Supplier
                                                                        </span>
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => navigate(`/Messages?clientEmail=${encodeURIComponent(quote.email || '')}`)}
                                                                        className="text-cyan-400 border-cyan-500/30 hover:bg-[#FFC703]/80yan-500/20"
                                                                    >
                                                                        <MessageSquare size={16} className="mr-1" /> Client Chat
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
                            <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-white flex items-center gap-2">
                                        <ThumbsUp size={20} className="text-green-400" />
                                        Accept Quote
                                    </DialogTitle>
                                </DialogHeader>
                                {quoteToAccept && (
                                    <div className="space-y-4 py-2">
                                        <div className="bg-[#535252]/ rounded-lg p-3">
                                            <p className="text-sm text-white/40">You are about to accept the quote:</p>
                                            <p className="text-white font-medium mt-1">
                                                {quoteToAccept.title || (
                                                    quoteToAccept.quote_type === 'finestre' ? 'Windows & Doors' :
                                                        quoteToAccept.quote_type === 'chiavi_in_mano' ? 'Turnkey Renovation' : 'Complete Project'
                                                )}
                                            </p>
                                        </div>

                                        {quoteToAccept.estimated_price && (
                                            <div className="bg-gradient-to-r from-[#FFC703]/10 to-[#FFC703]/10 border border-[#FFC703]/20 rounded-lg p-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/40 text-sm">Total Price</span>
                                                    <span className="text-xl font-bold text-white">â‚¬ {quoteToAccept.estimated_price.toLocaleString('it-IT')}</span>
                                                </div>
                                                {quoteToAccept.acconto_percentage && (
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#FFC703]/20">
                                                        <span className="text-amber-400 text-sm font-medium">Acconto richiesto ({quoteToAccept.acconto_percentage}%)</span>
                                                        <span className="text-amber-400 font-bold">â‚¬ {(quoteToAccept.estimated_price * quoteToAccept.acconto_percentage / 100).toLocaleString('it-IT')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {quoteToAccept.client_quote_expires_at && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
                                                <Calendar size={16} className="text-amber-400 shrink-0" />
                                                <p className="text-sm text-amber-300">
                                                    Offerta valida fino al <strong>{new Date(quoteToAccept.client_quote_expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                                </p>
                                            </div>
                                        )}

                                        <p className="text-xs text-white/25">
                                            By accepting the quote, you authorize Kranely to proceed with the supplier order. You will receive instructions for the deposit payment.
                                        </p>

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setAcceptConfirmOpen(false); setQuoteToAccept(null); }}
                                                className="flex-1 text-white/40 hover:text-white"
                                                disabled={isAccepting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleClientAccept}
                                                disabled={isAccepting}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {isAccepting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <ThumbsUp size={16} className="mr-2" />}
                                                Confirm Acceptance
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Forward to Supplier Modal */}
                        <Dialog open={forwardModalOpen} onOpenChange={setForwardModalOpen}>
                            <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-white flex items-center gap-2">
                                        <Truck size={20} className="text-orange-400" />
                                        Send Request al Supplier
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="bg-[#535252]/ rounded-lg p-3">
                                        <p className="text-sm text-white/40">Request del cliente:</p>
                                        <p className="text-white font-medium">{quoteToForward?.full_name || quoteToForward?.email}</p>
                                        <p className="text-xs text-white/25">{quoteToForward?.quote_type}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/70">Select Supplier:</label>
                                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                            <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                                <SelectValue placeholder={t('suppliers.select')} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white/5 border-white/10">
                                                {suppliers.map(s => (
                                                    <SelectItem key={s._id} value={s._id} className="text-white focus:bg-[#535252]">
                                                        {s.name} ({s.type})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/70">Prezzo Preliminare (Opzionale):</label>
                                        <Input
                                            type="number"
                                            placeholder="â‚¬"
                                            value={preliminaryQuote}
                                            onChange={(e) => setPreliminaryQuote(e.target.value)}
                                            className="bg-[#535252] border-white/10 text-white"
                                        />
                                        <p className="text-[10px] text-white/25">Prezzo indicativo non vincolante tra Kranely e Supplier.</p>
                                    </div>

                                    <Button
                                        onClick={handleForwardToSupplier}
                                        disabled={!selectedSupplier || isForwarding}
                                        className="w-full bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isForwarding ? (
                                            <><Loader2 size={16} className="mr-2 animate-spin" /> Invio...</>
                                        ) : (
                                            <><Send size={16} className="mr-2" /> Send Request</>
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Quote Detail Modal */}
                        <Dialog open={!!detailQuote} onOpenChange={(open) => !open && setDetailQuote(null)}>
                            <DialogContent className="bg-white/5 border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <DialogHeader>
                                    <DialogTitle className="text-white flex items-center gap-2">
                                        <FileText size={20} className="text-[#FFC703]" />
                                        Quote Details
                                    </DialogTitle>
                                </DialogHeader>
                                {detailQuote && <QuoteDetailContent quote={detailQuote} onViewPdf={setViewPdfUrl} />}
                            </DialogContent>
                        </Dialog>

                        {/* Upload Final Quote Modal */}
                        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                            <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-white flex items-center gap-2">
                                        <Upload size={20} className="text-green-400" />
                                        Carica Quote Definitivo
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    {uploadQuote && (
                                        <div className="bg-[#535252]/ rounded-lg p-3">
                                            <p className="text-sm text-white/40">Per il preventivo di:</p>
                                            <p className="text-white font-medium">{uploadQuote.full_name || uploadQuote.email}</p>
                                            <p className="text-xs text-white/25">
                                                {uploadQuote.quote_type === 'finestre' ? 'Windows & Doors' :
                                                    uploadQuote.quote_type === 'chiavi_in_mano' ? 'Turnkey Renovation' : 'Complete Project'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/70">File PDF del preventivo definitivo</label>
                                        <Input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            className="bg-[#535252] border-white/10 text-white file:bg-[#1C1A18] file:text-white file:border-none"
                                        />
                                        {uploadFile && (
                                            <p className="text-xs text-white/40">{uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)</p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleUploadFinalQuote}
                                        disabled={!uploadFile || isUploading}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {isUploading ? (
                                            <><Loader2 size={16} className="mr-2 animate-spin" /> Loading...</>
                                        ) : (
                                            <><Upload size={16} className="mr-2" /> Upload & Send to Client</>
                                        )}
                                    </Button>
                                    <p className="text-xs text-white/25 text-center">
                                        Il file sarÃ  condiviso con il cliente e lo stato del preventivo sarÃ  aggiornato a "Inviato"
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Convert to Order Modal */}
                        <Dialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
                            <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-white flex items-center gap-2">
                                        <HardHat size={20} className="text-orange-400" />
                                        Transform to Supplier Order
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="bg-[#535252]/ rounded-lg p-3">
                                        <p className="text-sm text-white/40">Quote approvato dal cliente:</p>
                                        <p className="text-white font-medium">{quoteToConvert?.full_name || quoteToConvert?.email}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/70">Select Supplier Request for convertire in Ordine:</label>
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
                                                    <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                                        <SelectValue placeholder={t('suppliers.requests')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white/5 border-white/10 z-[9999]">
                                                        {allAvailable.length === 0 ? (
                                                            <SelectItem value="__nessuna__" disabled className="text-white/25 italic text-sm">
                                                                No requests found "” create a request in Suppliers first
                                                            </SelectItem>
                                                        ) : (
                                                            allAvailable.map(req => {
                                                                const supplier = suppliers.find(s => s._id === req.supplier_id);
                                                                const isLinked = req.quote_id === quoteToConvert?._id;
                                                                return (
                                                                    <SelectItem key={req._id} value={req._id} className="text-white focus:bg-[#535252]">
                                                                        {isLinked ? 'â˜… ' : ''}{req.title} {supplier ? `(${supplier.name})` : ''} "” {req.quoted_price ? `â‚¬${req.quoted_price}` : 'Price TBD'} [{req.status}]
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
                                            <><Loader2 size={16} className="mr-2 animate-spin" /> Creating Order...</>
                                        ) : (
                                            <><HardHat size={16} className="mr-2" /> Create Order & Send to Supplier</>
                                        )}
                                    </Button>
                                    <p className="text-xs text-white/25 text-center">
                                        This will automatically create a Purchase Order and notify the supplier to start production, generating a pending payment.
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Modal: Finalize for Client */}
            <Dialog open={finalizeModalOpen} onOpenChange={setFinalizeModalOpen}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingUp className="text-orange-500" size={20} />
                            Finalize Quote for Client
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRequestToFinalize && (
                        <div className="space-y-4 py-4">
                            <div className="bg-[#FFC703]/10 border border-[#FFC703]/20 p-3 rounded-lg">
                                <p className="text-[10px] text-[#FFC703] uppercase font-bold mb-1">Dati Supplier</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span>Prezzo Supplier:</span>
                                    <span className="font-medium">â‚¬{selectedRequestToFinalize.quoted_price}</span>
                                </div>
                                {selectedRequestToFinalize.supplier_notes && (
                                    <p className="text-xs text-white/25 mt-1">Notes: {selectedRequestToFinalize.supplier_notes}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-white/40 uppercase font-bold">Prezzo Finale al Client (con margine)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">â‚¬</span>
                                    <Input
                                        type="number"
                                        placeholder={t('quotes.enter_final_price')}
                                        className="bg-[#141210] border-white/10 pl-8 text-white"
                                        value={marginPrice}
                                        onChange={(e) => setMarginPrice(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-orange-400">
                                    Il margine di ricarico è di: â‚¬{(parseFloat(marginPrice) - selectedRequestToFinalize.quoted_price || 0).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-white/40 uppercase font-bold">Final PDF from "Documents"</label>
                                <Select value={finalDocId} onValueChange={setFinalDocId}>
                                    <SelectTrigger className="bg-[#141210] border-white/10 text-white">
                                        <SelectValue placeholder={t('documents.select')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/5 border-white/10">
                                        {myDocuments.map(doc => (
                                            <SelectItem key={doc._id} value={doc._id} className="text-white">{doc.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 uppercase font-bold">Quote Expiry (days)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 7"
                                        value={expiresDays}
                                        onChange={(e) => setExpiresDays(e.target.value)}
                                        className="bg-[#141210] border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 uppercase font-bold">Deposit (%)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="es. 30"
                                        value={accontoPercentage}
                                        onChange={(e) => setAccontoPercentage(e.target.value)}
                                        className="bg-[#141210] border-white/10 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                                <Button variant="ghost" onClick={() => setFinalizeModalOpen(false)} className="text-white/40 hover:text-white" disabled={isFinalizing}>Cancel</Button>
                                <Button
                                    onClick={handleFinalizeQuote}
                                    disabled={!marginPrice || !finalDocId || isFinalizing}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {isFinalizing ? <Loader2 className="animate-spin mr-2" size={16} /> : <TrendingUp size={16} className="mr-2" />}
                                    Finalize and Send
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
                return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" /> Accepted</Badge>;
            case 'rejected':
                return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-none"><XCircle size={12} className="mr-1" /> Rejected</Badge>;
            case 'sent':
                return <Badge variant="secondary" className="bg-[#FFC703]/20 text-[#FFC703] border-none"><FileText size={12} className="mr-1" /> Inviato</Badge>;
            case 'in_lavorazione':
                return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-none"><Clock size={12} className="mr-1" /> In Progress</Badge>;
            case 'scaduto':
                return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-none"><XCircle size={12} className="mr-1" /> Expired</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" /> Pending</Badge>;
        }
    };

    // Documents linked to this quote
    // Wait, quote.email is client email. listProjects expects company_email of the logged in user usually. 
    // But here we just want to display names. The parent component already passed them maybe? 
    // Let's rely on parent passing or fetch simple info.
    // Actually simplicity: just show what's in the quote object if enriched? No, quote has IDs.
    // For now, let's just show the basic info we have in the quote object, or simple IDs. 
    // Or simpler: The parent `Quotes` renders the dialog content directly. 
    // I cannot easily introduce a new component inside `replace_file_content` if I don't replace the whole file structure or define it outside.
    // I will stick to modifying the existing render logic in the parent component and fetching documents there?
    // Rules of Hooks: cannot call useQuery conditionally.
    // So `Quotes` component must fetch documents for the `detailQuote`.
    // But `detailQuote` is state.
    // Solution: Create a sub-component `QuoteDetailModal` and render it when `detailQuote` is present.
    return (
        <div className="space-y-4 py-2">
            {/* Status + Type */}
            <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-medium">
                    {quote.quote_type === 'finestre' ? 'Windows & Doors' :
                        quote.quote_type === 'chiavi_in_mano' ? 'Turnkey Renovation' : 'Complete Project'}
                </h3>
                {getStatusBadge(quote.status)}
            </div>

            {/* Definitive Quote Download */}
            {definitiveDoc && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-green-400 flex items-center gap-2">
                            <CheckCircle size={16} /> Quote Definitivo Disponibile
                        </p>
                        <p className="text-xs text-white/40 mt-1">{definitiveDoc.file_name}</p>
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
                <div className="bg-[#535252]/ rounded-lg p-3">
                    <p className="text-xs text-white/40">Client</p>
                    <p className="text-white font-medium">{quote.full_name || 'N/A'}</p>
                </div>
                <div className="bg-[#535252]/ rounded-lg p-3">
                    <p className="text-xs text-white/40">Email</p>
                    <p className="text-white text-sm">{quote.email}</p>
                </div>
                {quote.phone && (
                    <div className="bg-[#535252]/ rounded-lg p-3">
                        <p className="text-xs text-white/40">Telefono</p>
                        <p className="text-white">{quote.phone}</p>
                    </div>
                )}
                <div className="bg-[#535252]/ rounded-lg p-3">
                    <p className="text-xs text-white/40">Data</p>
                    <p className="text-white">{new Date(quote.created_date).toLocaleDateString('en-GB')}</p>
                </div>
            </div>

            {/* Price */}
            {quote.estimated_price && (
                <div className="bg-gradient-to-r from-[#FFC703]/10 to-[#FFC703]/10 border border-[#FFC703]/20 rounded-lg p-4">
                    <p className="text-xs text-white/40 mb-1">Prezzo Stimato</p>
                    <p className="text-2xl font-bold text-white">â‚¬ {quote.estimated_price.toLocaleString()}</p>
                </div>
            )}

            {/* Notes */}
            {quote.notes && (
                <div className="bg-[#535252]/ rounded-lg p-3">
                    <p className="text-xs text-white/40 mb-1">Note</p>
                    <p className="text-white text-sm whitespace-pre-wrap">{quote.notes}</p>
                </div>
            )}

            {/* Uploaded Files */}
            {quote.files && quote.files.length > 0 && (
                <div className="bg-[#535252]/ rounded-lg p-3">
                    <p className="text-xs text-white/40 mb-2">Allegati Client</p>
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
                <div className="bg-[#535252]/ rounded-lg p-3">
                    <p className="text-xs text-white/40 mb-2">Configurazione Infissi</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(quote.window_config).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-white/40 capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-white">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Project Config */}
            {quote.project_config && (
                <div className="bg-[#535252]/ rounded-lg p-3">
                    <p className="text-xs text-white/40 mb-2">Configurazione Progetto</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(quote.project_config).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-white/40 capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-white">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}





