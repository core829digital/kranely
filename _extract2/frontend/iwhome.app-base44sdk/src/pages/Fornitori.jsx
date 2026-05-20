/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { validateFiles } from '../lib/security';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import {
    Truck, Package, Factory, CreditCard, MapPin, Search, Plus, Edit, Trash2,
    ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Loader2,
    FileText, Send, Eye, Calendar, MessageCircle, Phone, UserPlus,
    Copy, Mail, Shield, Star, PhoneCall, User, Hash, Building2, ExternalLink,
    Lock, Unlock, ArrowRight, Link2, Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { convertToWebP } from '../utils/imageConverter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';




// ─── Status Helpers ──────────────────────────────────────
const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    archived: 'bg-red-500/20 text-red-400 border-red-500/30',
    partito: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_transito: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    consegnato: 'bg-green-500/20 text-green-400 border-green-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_production: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ready: 'bg-green-500/20 text-green-400 border-green-500/30',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    received: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    quoted: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    preventivato: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    counterproposal_sent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    in_lavorazione: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const statusLabels = {
    active: 'Attivo', inactive: 'Inattivo', archived: 'Archiviato',
    partito: 'Partito', in_transito: 'In Transito', consegnato: 'Consegnato',
    confirmed: 'Confermato', in_production: 'In Produzione', ready: 'Pronto',
    shipped: 'Spedito', delivered: 'Consegnato', sent: 'Inviata',
    received: 'Ricevuta', quoted: 'Preventivata', accepted: 'Accettata',
    rejected: 'Rifiutata', draft: 'Bozza', pending: 'In Attesa',
    in_progress: 'In Corso', completed: 'Completato',
    preventivato: 'Preventivato', counterproposal_sent: 'Controproposta',
    in_lavorazione: 'In Lavorazione',
};

const invitationStatusLabels = {
    pending: 'Invito Inviato', accepted: 'Accettato', expired: 'Scaduto',
};

// ─── File Link Helper ────────────────────────────────────
function FileLink({ storageId, isImage }) {
    const isUrl = typeof storageId === 'string' && storageId.startsWith('http');
    const url = useQuery(api.files.getFileUrl, isUrl ? "skip" : { storageId });
    const finalUrl = isUrl ? storageId : url;

    if (!finalUrl && !isUrl) {
        if (url === null) return <span className="text-xs text-red-500">Errore nel caricamento</span>;
        return <span className="text-xs text-gray-500 animate-pulse">Caricamento...</span>;
    }

    // Detect if actually an image to be safe (e.g. if a PDF was put in "photos")
    const lowerUrl = finalUrl.toLowerCase();
    const isActuallyImage = isImage || lowerUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)/);

    if (isActuallyImage) {
        return <a href={finalUrl} target="_blank" rel="noreferrer"><img src={finalUrl} className="w-16 h-16 object-cover rounded-md border border-[#495057] hover:border-orange-500 transition-colors" alt="Allegato" /></a>;
    }
    return <a href={finalUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline text-xs flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md w-max"><FileText size={12} /> Apri Documento</a>;
}

// ─── Mini Chat Component (Task 6: Enhanced with files, read, search) ──────────
function MiniChat({ channelType, channelId, channelName, currentUserEmail, contactPhone }) {
    const [message, setMessage] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    
    // Task 4.3: Mention autocomplete state
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    
    // Fetch mentionables ONLY if the channel is a supplier chat to avoid ID validation errors
    const isSupplierChannel = channelType === 'supplier';
    const supplierRequests = useQuery(api.suppliers.listRequests, isSupplierChannel ? { supplier_id: channelId } : "skip") || [];
    const supplierOrders = useQuery(api.suppliers.listOrders, isSupplierChannel ? { supplier_id: channelId } : "skip") || [];
    
    const mentionables = [
        ...supplierRequests.map(r => ({ id: r._id, type: 'Richiesta', label: r.title, description: r.material || r.fixture_type })),
        ...supplierOrders.map(o => ({ id: o._id, type: 'Ordine', label: `Ordine-${o.order_number || o._id.slice(-4)}`, description: o.notes || '' }))
    ];

    const scrollRef = useRef(null);
    const messages = useQuery(api.internal_messages.list, { channel_type: channelType, channel_id: channelId }) || [];
    const searchResults = useQuery(
        api.internal_messages.searchMessages,
        searchKeyword.length >= 2 ? { channel_type: channelType, channel_id: channelId, keyword: searchKeyword } : 'skip'
    ) || [];
    const sendMessage = useMutation(api.internal_messages.send);
    const markAsRead = useMutation(api.internal_messages.markAsRead);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0) {
            markAsRead({ channel_type: channelType, channel_id: channelId }).catch(err => { console.error('markAsRead failed:', err); });
        }
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages.length, channelType, channelId]);

    const handleMessageChange = (e) => {
        const val = e.target.value;
        setMessage(val);
        
        const lastAt = val.lastIndexOf('@');
        if (lastAt !== -1) {
            const query = val.slice(lastAt + 1);
            if (!query.includes(' ')) {
                setMentionQuery(query);
                setShowMentions(true);
                return;
            }
        }
        setShowMentions(false);
    };

    const handleMentionSelect = (mention) => {
        const lastAt = message.lastIndexOf('@');
        const newMessage = message.slice(0, lastAt) + `@${mention.label} `;
        setMessage(newMessage);
        setShowMentions(false);
        // refocus logic can be handled by just letting react update
    };

    const filteredMentions = mentionables.filter(m => 
        m.label.toLowerCase().includes(mentionQuery.toLowerCase()) || 
        (m.description && m.description.toLowerCase().includes(mentionQuery.toLowerCase()))
    );

    const handleSend = async () => {
        if (!message.trim()) return;
        try {
            await sendMessage({
                channel_type: channelType,
                channel_id: channelId,
                channel_name: channelName,
                message: message.trim(),
            });
            setMessage('');
        } catch (err) { console.error(err); }
    };

    const handleFileUpload = async (e) => {
        let file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);

            // Task 14: Universal WEBP Transcoder for JPG/PNG
            file = await convertToWebP(file, 0.85);

            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            // Determine file type
            let fileType = 'document';
            if (file.type.startsWith('image/')) fileType = 'image';
            else if (file.type.startsWith('video/')) fileType = 'video';

            await sendMessage({
                channel_type: channelType,
                channel_id: channelId,
                channel_name: channelName,
                message: `Ha inviato un file: ${file.name}`,
                file_url: storageId, // Convex will resolve this to URL or we can store storageId. Wait, schema says file_url: string. The MiniChat FileLink usually expects a URL, but useQuery(api.files.getFileUrl, {storageId}) requires a storageId. Let's pass storageId directly.
                file_name: file.name,
                file_type: fileType,
                file_size: file.size,
            });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Errore durante il caricamento del file.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const displayMessages = showSearch && searchKeyword.length >= 2 ? searchResults : messages;

    return (
        <div className="flex flex-col h-[300px]">
            {/* Search bar */}
            {showSearch && (
                <div className="mb-2">
                    <Input
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        placeholder="Cerca nei messaggi..."
                        className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-xs h-7"
                    />
                    {searchKeyword.length >= 2 && <p className="text-[9px] text-[#6c757d] mt-0.5">{searchResults.length} risultati</p>}
                </div>
            )}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3 bg-[#212529] rounded-lg">
                {displayMessages.length === 0 && (
                    <p className="text-xs text-[#6c757d] text-center py-8">
                        {showSearch ? 'Nessun risultato' : 'Nessun messaggio. Scrivi per comunicare con questo contatto.'}
                    </p>
                )}
                {displayMessages.map(msg => {
                    const isSystem = msg.sender_role === 'system';
                    const isMine = !isSystem && msg.sender_email === currentUserEmail;
                    return (
                        <div key={msg._id} className={`flex ${isSystem ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${isSystem ? 'bg-[#343a40] text-[#6c757d] italic' :
                                isMine ? 'bg-orange-600/20 text-[#f8f9fa] border border-orange-500/20' : 'bg-[#495057]/50 text-[#f8f9fa] border border-[#6c757d]/30'
                                }`}>
                                {msg.sender_name && <p className="text-[10px] text-orange-400 mb-0.5 font-medium">{msg.sender_name}</p>}
                                {/* File attachment display */}
                                {msg.file_url && (
                                    <div className="mb-1">
                                        {msg.file_type === 'image' ? (
                                            <div className="max-w-full max-h-32 mb-1 overflow-hidden rounded-md">
                                                <FileLink storageId={msg.file_url} isImage={true} />
                                            </div>
                                        ) : (
                                            <div className="mb-1">
                                                <FileLink storageId={msg.file_url} isImage={false} />
                                                <p className="text-[10px] text-[#6c757d] mt-0.5">{msg.file_name}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <p>{msg.message}</p>
                                <div className="flex items-center justify-between mt-1 gap-2">
                                    <p className="text-[9px] text-[#6c757d]">{new Date(msg.created_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                                    {/* Read indicator */}
                                    {msg.read ? (
                                        <span className="text-[9px] text-blue-400" title={msg.read_date ? `Letto: ${new Date(msg.read_date).toLocaleString('it-IT')}` : 'Letto'}>✓✓</span>
                                    ) : (
                                        <span className="text-[9px] text-[#6c757d]" title="Non letto">✓</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSearch(!showSearch)} className={`h-8 w-8 p-0 ${showSearch ? 'text-orange-400' : 'text-[#6c757d]'}`} title="Cerca">
                    <Search size={14} />
                </Button>
                {/* Hidden file input */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 p-0 text-[#6c757d] hover:text-orange-400" title="Allega file" disabled={isUploading}>
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                </Button>
                {contactPhone && (
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `tel:${contactPhone}`} className="h-8 w-8 p-0 text-[#6c757d] hover:text-green-400" title="Chiama">
                        <Phone size={14} />
                    </Button>
                )}
                <div className="flex-1 relative">
                    {/* Mention Autocomplete Popup */}
                    {showMentions && filteredMentions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-[#343a40] border border-[#495057] rounded-lg shadow-xl z-10 flex flex-col pointer-events-auto">
                            {filteredMentions.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleMentionSelect(m)}
                                    className="text-left px-3 py-2 text-[10px] hover:bg-[#495057] border-b border-[#495057] last:border-0 transition-colors"
                                >
                                    <span className="text-orange-400 font-medium block">@{m.label}</span>
                                    <span className="text-[#adb5bd] block truncate">{m.type} {m.description ? `• ${m.description}` : ''}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <Input
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="Scrivi o usa @ per citare ordini/richieste..."
                        className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-xs h-8 w-full placeholder:text-[#adb5bd]"
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={isUploading}
                    />
                </div>
                <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="bg-orange-600 hover:bg-orange-700 h-8">
                    <Send size={14} />
                </Button>
            </div>
        </div>
    );
}

export default function Fornitori() {
    const { role, isAdmin, isSupplier, canView, isLoading: rbacLoading, supplierRecord, supplierId, email } = useRBAC();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('anagrafica');

    // Auto-link: if user is not yet a supplier but their email matches an active supplier record,
    // syncSupplierRole upgrades their role automatically without needing admin intervention.
    const syncSupplierRole = useMutation(api.suppliers.syncSupplierRole);
    useEffect(() => {
        if (!rbacLoading && role && role !== 'supplier' && role !== 'admin' && role !== 'superadmin') {
            syncSupplierRole().catch(() => {});
        }
    }, [rbacLoading, role]);

    // Ensure 'anagrafica' is not selected for suppliers — redirect to 'richieste' so they see requests immediately
    React.useEffect(() => {
        if (isSupplier && activeTab === 'anagrafica') {
            setActiveTab('richieste');
        }
    }, [isSupplier, activeTab]);
    const allPayments = useQuery(api.payments.list, {}) || [];
    const myDocuments = useQuery(api.documents.get, {}) || [];

    // State for modals
    const [searchTerm, setSearchTerm] = useState('');
    // Modals
    const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);
    const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(null); // stores the request object
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(null); // supplier ID for chat
    const [showOrderChatModal, setShowOrderChatModal] = useState(null); // order for project chat
    const [showQuoteModal, setShowQuoteModal] = useState(null); // request ID to quote
    const [showEditDeliveryModal, setShowEditDeliveryModal] = useState(false); // Task 13
    const [calendarView, setCalendarView] = useState('weekly'); // weekly | biweekly | monthly

    // Forms
    const [editingDelivery, setEditingDelivery] = useState({ id: undefined, estimated_arrival: '', confirmed_arrival: '', client_delivery_date: '' }); // Task 13
    const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', address: '', piva: '', type: 'subprod', notes: '', contact_person: '' });
    const [quoteData, setQuoteData] = useState({ quoted_price: '', preliminary_quote: '', supplier_notes: '', supplier_quote_doc_id: undefined });
    const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(null); // order object
    const [paymentProposal, setPaymentProposal] = useState([{ amount: 0, due_date: '', description: 'Acconto' }]);
    const [proposalNotes, setProposalNotes] = useState('');

    // Controproposta (Admin → Supplier counter-price)
    const [counterproposalModal, setCounterproposalModal] = useState(null); // request object
    const [counterproposalPrice, setCounterproposalPrice] = useState('');
    const [counterproposalNotes, setCounterproposalNotes] = useState('');
    const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);
    // Supplier: respond to counterproposal
    const [counterResponseModal, setCounterResponseModal] = useState(null); // request object
    const [counterRejectionNotes, setCounterRejectionNotes] = useState('');
    const [isRespondingCounter, setIsRespondingCounter] = useState(false);

    // Payment Proof Viewer State
    const [isPdfOpen, setIsPdfOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfTitle, setPdfTitle] = useState('');

    // Workflow advance — quote PDF input per ordine (step 3)
    const [quotePdfInputs, setQuotePdfInputs] = useState({}); // { [orderId]: url }
    const [newRequest, setNewRequest] = useState({
        supplier_id: undefined, title: '', description: '', fixture_type: '',
        // Task 9/10: expanded fields
        urgency: 'normal', quantity: 1,
        dimensions_width: '', dimensions_height: '', dimensions_depth: '',
        material: '', color: '', glass_type: '', budget_estimate: '',
        fixture_category: '', fixture_subcategory: '',
        client_id: undefined, cantiere_id: undefined // NEW: Links
    });
    const [newRequestPhotos, setNewRequestPhotos] = useState([]);
    const [newRequestDocs, setNewRequestDocs] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [newDelivery, setNewDelivery] = useState({ order_id: undefined, supplier_id: undefined, driver_name: '', driver_phone: '', driver_vehicle: '', tracking_number: '', estimated_arrival: '', notes: '' });

    // Diagnostics — visible only to suppliers; shows linking/data status for debugging
    const diagnostics = useQuery(api.suppliers.getMyDiagnostics, isSupplier ? {} : "skip");

    // Data queries (filtered for supplier self-view)
    const suppliers = useQuery(api.suppliers.list) || [];
    const requests = useQuery(api.suppliers.listRequests, isSupplier && supplierId ? { supplier_id: supplierId } : {}) || [];
    const orders = useQuery(api.suppliers.listOrders, isSupplier && supplierId ? { supplier_id: supplierId } : {}) || [];
    const deliveries = useQuery(api.suppliers.listDeliveries, isSupplier && supplierId ? { supplier_id: supplierId } : {}) || [];
    const allCertificates = useQuery(api.certificates.list, {}) || [];
    const allCantieri = useQuery(api.cantieri.listCantieri, { company_email: 'contact.core829@gmail.com' }) || [];
    const allClients = useQuery(api.clients.list, isAdmin ? {} : "skip") || [];

    // Mutations
    const createSupplier = useMutation(api.suppliers.create);
    const createRequest = useMutation(api.suppliers.createRequest);
    const removeRequest = useMutation(api.suppliers.removeRequest);
    const updateRequest = useMutation(api.suppliers.updateRequest);
    const createDelivery = useMutation(api.suppliers.createDelivery);
    const removeOrder = useMutation(api.suppliers.removeOrder);
    const removeDelivery = useMutation(api.suppliers.removeDelivery);
    const updateDelivery = useMutation(api.suppliers.updateDelivery);
    const removeSupplier = useMutation(api.suppliers.remove);
    const updateSupplier = useMutation(api.suppliers.update);
    const generateInvitation = useMutation(api.suppliers.generateInvitation);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl); // File upload
    // Task 1: WhatsApp onboarding
    const generateWhatsAppInvite = useMutation(api.suppliers.generateWhatsAppInvite);
    const adminLinkSupplierUser = useMutation(api.suppliers.adminLinkSupplierUser);
    // Task 12: Workflow
    const advanceWorkflow = useMutation(api.suppliers.advanceWorkflow);
    const markAccontoPaid = useMutation(api.suppliers.markAccontoPaid);
    const confirmPaymentMutation = useMutation(api.payments.confirmPayment);
    const proposePaymentPlan = useMutation(api.suppliers.proposePaymentPlan);
    const updateProductionPhase = useMutation(api.suppliers.updateProductionPhase);
    const createDocument = useMutation(api.documents.create);
    const sendCounterproposal = useMutation(api.suppliers.sendCounterproposal);
    const respondToCounterproposal = useMutation(api.suppliers.respondToCounterproposal);
    const rejectSupplierQuote = useMutation(api.suppliers.rejectSupplierQuote);

    const handleSendCounterproposal = async () => {
        if (!counterproposalModal || !counterproposalPrice) return;
        setIsSubmittingCounter(true);
        try {
            await sendCounterproposal({
                request_id: counterproposalModal._id,
                proposed_price: parseFloat(counterproposalPrice),
                notes: counterproposalNotes || undefined,
            });
            setCounterproposalModal(null);
            setCounterproposalPrice('');
            setCounterproposalNotes('');
            setShowRequestDetailsModal(null);
        } catch (err) {
            console.error(err);
            alert('Errore durante l\'invio della controproposta.');
        } finally {
            setIsSubmittingCounter(false);
        }
    };

    const handleRejectSupplierQuote = async (request) => {
        const notes = window.prompt('Motivo del rifiuto (opzionale):') ?? undefined;
        try {
            await rejectSupplierQuote({
                request_id: request._id,
                notes: notes || undefined,
            });
            setShowRequestDetailsModal(null);
        } catch (err) {
            console.error(err);
            alert('Errore durante il rifiuto del preventivo fornitore.');
        }
    };

    const handleRespondCounterproposal = async (accepted) => {
        if (!counterResponseModal) return;
        setIsRespondingCounter(true);
        try {
            await respondToCounterproposal({
                request_id: counterResponseModal._id,
                decision: accepted ? 'accepted' : 'rejected',
                notes: accepted ? undefined : (counterRejectionNotes || undefined),
            });
            setCounterResponseModal(null);
            setCounterRejectionNotes('');
            setShowRequestDetailsModal(null);
        } catch (err) {
            console.error(err);
            alert('Errore durante la risposta alla controproposta.');
        } finally {
            setIsRespondingCounter(false);
        }
    };

    const handleFatturaUpload = async (event, deliveryId) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const delivery = deliveries.find(d => d._id === deliveryId);
            const order = orders.find(o => o._id === delivery?.order_id);
            const request = requests.find(r => r._id === order?.request_id);
            const cantiere = allCantieri.find(c => c._id === order?.cantiere_id);
            const client = allClients.find(c => c._id === request?.client_id || c._id === cantiere?.client_id);

            const clientName = client?.full_name || "Cliente Sconosciuto";
            const cantiereName = cantiere?.nome_cantiere || "Cantiere Sconosciuto";
            const dateStr = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
            
            const newName = `${clientName} - ${cantiereName} - ${dateStr}${file.name.substring(file.name.lastIndexOf('.'))}`;

            // Upload
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            // Create document record
            await createDocument({
                title: newName,
                category: "Fatture",
                file_url: storageId,
                file_name: newName,
                file_size: file.size,
                file_type: file.type,
                cantiere_id: order?.cantiere_id,
                client_id: request?.client_id || cantiere?.client_id,
                order_id: order?._id,
                delivery_id: deliveryId,
                status: "definitive",
                created_date: new Date().toISOString()
            });

            alert(`Fattura caricata con successo come: ${newName}`);
        } catch (err) {
            console.error(err);
            alert("Errore durante il caricamento della fattura.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleProposePaymentPlan = async () => {
        if (!showPaymentPlanModal) return;
        try {
            await proposePaymentPlan({
                order_id: showPaymentPlanModal._id,
                proposal: paymentProposal,
                notes: proposalNotes,
            });
            setShowPaymentPlanModal(null);
            alert("Proposta inviata correttamente all'amministrazione.");
        } catch (err) {
            console.error(err);
            alert("Errore nell'invio della proposta.");
        }
    };

    const handleAdvanceWorkflow = async (orderId, targetStep, extraData = {}) => {
        try {
            await advanceWorkflow({ order_id: orderId, target_step: targetStep, ...extraData });
        } catch (err) {
            console.error(err);
            alert(`Errore: ${err.message || 'Impossibile avanzare il workflow.'}`);
        }
    };

    // WhatsApp link state
    const [whatsappPassword, setWhatsappPassword] = useState('');

    if (rbacLoading) return null;

    if (!canView('fornitori')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">

                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
                </div>
            </div>
        );
    }

    // ─── Handlers ──────────────────────────────────
    const handleCreateSupplier = async () => {
        if (!newSupplier.name || !newSupplier.email) return;
        try {
            await createSupplier(newSupplier);
            setShowNewSupplierModal(false);
            setNewSupplier({ name: '', email: '', phone: '', address: '', piva: '', type: 'subprod', notes: '', contact_person: '' });
        } catch (err) { console.error(err); }
    };

    const handleCreateRequest = async () => {
        if (!newRequest.supplier_id || !newRequest.title) return;
        setIsUploading(true);
        try {
            // Helper function to upload files
            const uploadFiles = async (files) => {
                const storageIds = [];
                for (const file of files) {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });
                    const { storageId } = await result.json();
                    storageIds.push(storageId);
                }
                return storageIds;
            };

            const photoIds = newRequestPhotos.length > 0 ? await uploadFiles(newRequestPhotos) : undefined;
            const docIds = newRequestDocs.length > 0 ? await uploadFiles(newRequestDocs) : undefined;

            await createRequest({
                supplier_id: newRequest.supplier_id,
                title: newRequest.title,
                description: newRequest.description,
                fixture_type: newRequest.fixture_type,
                client_id: newRequest.client_id !== 'none' ? newRequest.client_id : undefined,
                cantiere_id: newRequest.cantiere_id !== 'none' ? newRequest.cantiere_id : undefined,
                urgency: newRequest.urgency,
                quantity: newRequest.quantity,
                dimensions: { width: newRequest.dimensions_width, height: newRequest.dimensions_height, depth: newRequest.dimensions_depth },
                material: newRequest.material,
                color: newRequest.color,
                glass_type: newRequest.glass_type,
                budget_estimate: newRequest.budget_estimate ? parseFloat(newRequest.budget_estimate) : undefined,
                fixture_category: newRequest.fixture_category,
                fixture_subcategory: newRequest.fixture_subcategory,
                photos: photoIds,
                documents: docIds
            });
            setShowNewRequestModal(false);
            setNewRequest({ supplier_id: undefined, title: '', description: '', fixture_type: '', urgency: 'normal', quantity: 1, dimensions_width: '', dimensions_height: '', dimensions_depth: '', material: '', color: '', glass_type: '', budget_estimate: '', fixture_category: '', fixture_subcategory: '', client_id: undefined, cantiere_id: undefined });
            setNewRequestPhotos([]);
            setNewRequestDocs([]);
        } catch (err) {
            console.error(err);
            alert("Errore durante la creazione della richiesta.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa richiesta? L'operazione non è reversibile.")) return;
        try { await removeRequest({ id }); } catch (err) { console.error(err); }
    };

    const handleDeleteOrder = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo ordine?")) return;
        try { await removeOrder({ id }); } catch (err) { console.error(err); }
    };

    const handleDeleteDelivery = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa consegna?")) return;
        try { await removeDelivery({ id }); } catch (err) { console.error(err); }
    };

    const handleCreateDelivery = async () => {
        if (!newDelivery.order_id || !newDelivery.supplier_id) return;
        try {
            await createDelivery({
                order_id: newDelivery.order_id,
                supplier_id: newDelivery.supplier_id,
                driver_name: newDelivery.driver_name || undefined,
                driver_phone: newDelivery.driver_phone || undefined,
                driver_vehicle: newDelivery.driver_vehicle || undefined,
                tracking_number: newDelivery.tracking_number || undefined,
                estimated_arrival: newDelivery.estimated_arrival || undefined,
                notes: newDelivery.notes || undefined,
            });
            setShowDeliveryModal(false);
            setNewDelivery({ order_id: undefined, supplier_id: undefined, driver_name: '', driver_phone: '', driver_vehicle: '', tracking_number: '', estimated_arrival: '', notes: '' });
        } catch (err) { console.error(err); }
    };

    const handleConfirmDelivery = async (deliveryId) => {
        try { await updateDelivery({ id: deliveryId, data: { status: 'consegnato', delivery_date: new Date().toISOString() } }); }
        catch (err) { console.error(err); }
    };

    // Task 13: update specific calendar dates
    const handleUpdateDeliveryDates = async () => {
        if (!editingDelivery.id) return;
        try {
            await updateDelivery({
                id: editingDelivery.id,
                data: {
                    estimated_arrival: editingDelivery.estimated_arrival || undefined,
                    confirmed_arrival: editingDelivery.confirmed_arrival || undefined,
                    client_delivery_date: editingDelivery.client_delivery_date || undefined
                }
            });
            setShowEditDeliveryModal(false);
        } catch (err) { console.error(err); }
    };

    const handleInvite = async (supplierId) => {
        try {
            const code = await generateInvitation({ id: supplierId });
            if (code) {
                navigator.clipboard.writeText(code).catch(() => { });
                alert(`Codice invito copiato: ${code}`);
            }
        } catch (err) { console.error(err); }
    };

    // Task 1: WhatsApp link handler
    const handleWhatsAppInvite = async (supplierId) => {
        const password = prompt('Imposta la password temporanea per il fornitore:');
        if (!password) return;
        try {
            const response = await generateWhatsAppInvite({ supplierId, password });
            const whatsappUrl = `${window.location.origin}/SupplierOnboarding?token=${response.token}`;
            const whatsappMsg = encodeURIComponent(`Benvenuto su IWHome! Accedi con questo link per configurare il tuo account:\n${whatsappUrl}\n\nPassword temporanea: ${password}\nCodice Fornitore (in caso di necessità): ${response.supplier_code}`);
            navigator.clipboard.writeText(whatsappUrl).catch(() => { });
            window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank');
            alert('Link WhatsApp generato e copiato! Si apre WhatsApp per inviarlo.');
        } catch (err) { console.error(err); alert(err.message || 'Errore generazione link'); }
    };

    const handleLinkSupplierAccount = async (supplierId) => {
        const email = prompt('Email dell\'account Convex del fornitore (deve essere già registrato):');
        if (!email?.trim()) return;
        try {
            await adminLinkSupplierUser({ supplier_id: supplierId, user_email: email.trim().toLowerCase() });
            alert('Account collegato! Il fornitore ha ora ruolo "Fornitore" e può accedere alla sua area.');
        } catch (err) { alert(err.message || 'Errore collegamento account'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Eliminare questo fornitore? Tutti i dati correlati verranno persi.')) return;
        try { await removeSupplier({ id }); } catch (err) { console.error(err); }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try { await updateSupplier({ id, data: { status: newStatus } }); } catch (err) { console.error(err); }
    };

    // Task: Supplier quoting a request
    const handleQuoteSubmit = async () => {
        if (!quoteData.quoted_price) return;
        try {
            await updateRequest({
                id: showQuoteModal._id,
                data: {
                    status: 'preventivato',
                    quoted_price: parseFloat(quoteData.quoted_price),
                    supplier_notes: quoteData.supplier_notes,
                    supplier_quote_doc_id: quoteData.supplier_quote_doc_id
                }
            });
            setShowQuoteModal(null);
            setQuoteData({ quoted_price: '', preliminary_quote: '', supplier_notes: '', supplier_quote_doc_id: undefined });
        } catch (err) {
            console.error(err);
            alert("Errore durante l'invio del preventivo. Riprova o contatta l'amministrazione.");
        }
    };

    const handleConfirmPayment = async (orderId) => {
        const payment = allPayments.find(p => p.order_id === orderId && p.type === "supplier");
        if (!payment) {
            alert("Nessun record di pagamento trovato per questo ordine.");
            return;
        }

        if (!window.confirm("Confermi di aver ricevuto correttamente il pagamento da IWHome? L'ordine passerà automaticamente alla fase di Produzione.")) return;

        try {
            await confirmPaymentMutation({ payment_id: payment._id });
        } catch (err) {
            console.error(err);
            alert("Errore durante la conferma del pagamento.");
        }
    };

    const filtered = (items) => items.filter(item => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return JSON.stringify(item).toLowerCase().includes(s);
    });

    const tabConfig = isSupplier ? [
        { key: 'richieste', label: 'Richieste', icon: FileText },
        { key: 'ordini', label: 'Ordini', icon: Package },
        { key: 'produzione', label: 'Produzione', icon: Factory },
        { key: 'consegne', label: 'Consegne', icon: MapPin },
        { key: 'comunicazioni', label: 'Chat', icon: MessageCircle },
        { key: 'calendario', label: 'Calendario', icon: Calendar }] : [
        { key: 'anagrafica', label: 'Anagrafica', icon: Building2 },
        { key: 'richieste', label: 'Richieste', icon: FileText },
        { key: 'ordini', label: 'Ordini', icon: Package },
        { key: 'produzione', label: 'Produzione', icon: Factory },
        { key: 'consegne', label: 'Consegne', icon: MapPin },
        { key: 'comunicazioni', label: 'Chat', icon: MessageCircle },
        { key: 'calendario', label: 'Calendario', icon: Calendar }];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">


            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header — Command Center feel */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                                    <Truck size={20} className="text-white" />
                                </div>
                                Centro Controllo Fornitori
                            </h1>
                            <p className="text-[#adb5bd] text-sm">Gestione completa: anagrafica, richieste, ordini, produzione, consegne e comunicazioni</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {isAdmin && (
                                <>
                                    <Button onClick={() => setShowNewSupplierModal(true)} className="bg-orange-600 hover:bg-orange-700 text-sm">
                                        <Plus size={14} className="mr-1" /> Nuovo Fornitore
                                    </Button>
                                    <Button onClick={() => setShowNewRequestModal(true)} className="bg-blue-600 hover:bg-blue-700 text-sm">
                                        <Send size={14} className="mr-1" /> Nuova Richiesta
                                    </Button>
                                </>
                            )}
                            {isSupplier && (
                                <Button onClick={() => {
                                    if (supplierId) {
                                        setNewDelivery(prev => ({ ...prev, supplier_id: supplierId }));
                                    }
                                    setShowDeliveryModal(true);
                                }} className="bg-green-600 hover:bg-green-700 text-sm">
                                    <MapPin size={14} className="mr-1" /> Spedisci Ordine
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats Row — Hidden for suppliers to avoid info overload (they have Dashboard KPIs) */}
                    {!isSupplier && (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                            {[
                                { label: 'Fornitori', count: suppliers.length, color: 'from-orange-600/80 to-orange-700/80', icon: Truck },
                                { label: 'Ordini Attivi', count: orders.filter(o => o.status === 'confirmed' || o.status === 'in_production').length, color: 'from-purple-600/80 to-purple-700/80', icon: Package },
                                { label: 'Richieste', count: requests.filter(r => r.status === 'sent' || r.status === 'received').length, color: 'from-blue-600/80 to-blue-700/80', icon: FileText },
                                { label: 'In Consegna', count: deliveries.filter(d => d.status !== 'consegnato').length, color: 'from-yellow-600/80 to-yellow-700/80', icon: MapPin },
                                { label: 'Pagamenti Pendenti', count: allPayments.filter(p => p.status === 'in_attesa' || p.status === 'in_ritardo').length, color: 'from-red-600/80 to-red-700/80', icon: CreditCard },
                                { label: 'Consegnati', count: deliveries.filter(d => d.status === 'consegnato').length, color: 'from-emerald-600/80 to-emerald-700/80', icon: CheckCircle }].map((stat) => (
                                <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} border-0 cursor-pointer hover:scale-[1.02] transition-transform`} onClick={() => setActiveTab(stat.label === 'Pagamenti Pendenti' ? 'ordini' : stat.label === 'Consegnati' || stat.label === 'In Consegna' ? 'consegne' : stat.label === 'Richieste' ? 'richieste' : stat.label === 'Ordini Attivi' ? 'ordini' : 'anagrafica')}>
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <stat.icon className="h-4 w-4 text-white/70" />
                                            <span className="text-xl font-light text-white">{stat.count}</span>
                                        </div>
                                        <p className="text-[10px] text-white/60 mt-0.5">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-5">
                        <CardContent className="p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={16} />
                                <Input placeholder={isSupplier ? "Cerca ordini, consegne, tracking..." : "Cerca fornitori, ordini, consegne..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd] text-sm" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-[#343a40] border border-[#495057] w-full flex overflow-x-auto no-scrollbar mb-5 justify-start lg:grid lg:grid-cols-none lg:auto-cols-fr lg:grid-flow-col">
                            {tabConfig.map(tab => (
                                <TabsTrigger key={tab.key} value={tab.key} className="flex-1 min-w-[max-content] px-4 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-[#adb5bd] text-xs gap-1">
                                    <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* ═══ TAB: ANAGRAFICA (Hidden for Suppliers) ═══ */}
                        {!isSupplier && (
                            <TabsContent value="anagrafica">
                                <div className="space-y-3">
                                    {filtered(suppliers).length === 0 ? (
                                        <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                            <Truck size={48} className="text-[#6c757d] mx-auto mb-4" />
                                            <h3 className="text-xl text-[#dee2e6]">Nessun fornitore registrato</h3>
                                            <p className="text-[#adb5bd] mt-2">Aggiungi il primo fornitore per iniziare.</p>
                                        </div>
                                    ) : filtered(suppliers).map(supplier => (
                                        <motion.div key={supplier._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <Card className="bg-[#343a40] border border-[#495057] hover:border-orange-500/40 transition-all duration-300">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* Left: Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 flex items-center justify-center border border-orange-500/20">
                                                                    <Building2 size={18} className="text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-medium text-[#f8f9fa]">{supplier.name}</h3>
                                                                    <div className="flex items-center gap-3 text-xs text-[#adb5bd]">
                                                                        <span className="flex items-center gap-1"><Mail size={11} /> {supplier.email}</span>
                                                                        {supplier.phone && <span className="flex items-center gap-1"><Phone size={11} /> {supplier.phone}</span>}
                                                                        {supplier.piva && <span className="flex items-center gap-1"><Hash size={11} /> {supplier.piva}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Tags row */}
                                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                <Badge variant="default" className={statusColors[supplier.status] || 'bg-gray-500/20 text-gray-400'}>{statusLabels[supplier.status]}</Badge>
                                                                <Badge variant="default" className="bg-[#495057] text-[#adb5bd] text-xs">{supplier.type === 'subprod' ? 'Infissi' : 'Edilizia'}</Badge>
                                                                {supplier.contact_person && <Badge variant="default" className="bg-blue-500/20 text-blue-400 text-xs"><User size={10} className="mr-1" />{supplier.contact_person}</Badge>}
                                                                {supplier.invitation_status && (
                                                                    <Badge variant="default" className={`text-xs ${supplier.invitation_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                                                        supplier.invitation_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                        {invitationStatusLabels[supplier.invitation_status] || supplier.invitation_status}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {supplier.notes && <p className="text-xs text-[#6c757d] mt-2 line-clamp-1">{supplier.notes}</p>}
                                                            {/* Task 7: Supplier Code */}
                                                            {supplier.supplier_code && (
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Badge variant="default" className="bg-indigo-500/20 text-indigo-400 text-xs font-mono">
                                                                        <Hash size={10} className="mr-1" />{supplier.supplier_code}
                                                                    </Badge>
                                                                    <button onClick={() => { navigator.clipboard.writeText(supplier.supplier_code); }} className="text-[10px] text-[#6c757d] hover:text-indigo-400"><Copy size={10} /></button>
                                                                </div>
                                                            )}
                                                            {/* Cross-reference stats */}
                                                            {(() => {
                                                                const supplierOrders = orders.filter(o => o.supplier_id === supplier._id);
                                                                const supplierPayments = allPayments.filter(p => p.supplier_id === supplier._id);
                                                                const pendingPayments = supplierPayments.filter(p => p.status === 'in_attesa' || p.status === 'in_ritardo');
                                                                const supplierCerts = allCertificates.filter(c => c.supplier_id === supplier._id);
                                                                const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
                                                                return (
                                                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                                        {supplierOrders.length > 0 && (
                                                                            <button onClick={() => setActiveTab('ordini')} className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md hover:bg-purple-500/20 transition-all">
                                                                                <Package size={10} /> {supplierOrders.length} ordini
                                                                            </button>
                                                                        )}
                                                                        {pendingPayments.length > 0 && (
                                                                            <button onClick={() => navigate('/Pagamenti')} className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-md hover:bg-red-500/20 transition-all">
                                                                                <CreditCard size={10} /> {pendingPayments.length} pagamenti (€{pendingTotal.toLocaleString()})
                                                                            </button>
                                                                        )}
                                                                        {supplierCerts.length > 0 && (
                                                                            <button onClick={() => navigate('/Certificati')} className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md hover:bg-amber-500/20 transition-all">
                                                                                <Shield size={10} /> {supplierCerts.length} certificati
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                        {/* Right: Actions */}
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {supplier.phone && (
                                                                <a href={`tel:${supplier.phone}`}>
                                                                    <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20 h-8 w-8 p-0">
                                                                        <PhoneCall size={16} />
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            <Button variant="ghost" size="sm" onClick={() => setShowChatModal(supplier)} className="text-blue-400 hover:bg-blue-500/20 h-8 w-8 p-0">
                                                                <MessageCircle size={16} />
                                                            </Button>
                                                            {isAdmin && !supplier.invitation_status && (
                                                                <Button variant="ghost" size="sm" onClick={() => handleInvite(supplier._id)} className="text-yellow-400 hover:bg-yellow-500/20 h-8 w-8 p-0" title="Genera codice invito">
                                                                    <UserPlus size={16} />
                                                                </Button>
                                                            )}
                                                            {/* Task 1: WhatsApp onboarding */}
                                                            {isAdmin && (
                                                                <Button variant="ghost" size="sm" onClick={() => handleWhatsAppInvite(supplier._id)} className="text-green-400 hover:bg-green-500/20 h-8 w-8 p-0" title="Invito WhatsApp">
                                                                    <Link2 size={16} />
                                                                </Button>
                                                            )}
                                                            {/* Admin force-link: visible when supplier hasn't linked their account yet */}
                                                            {isAdmin && !supplier.user_id && (
                                                                <Button variant="ghost" size="sm" onClick={() => handleLinkSupplierAccount(supplier._id)} className="text-purple-400 hover:bg-purple-500/20 h-8 w-8 p-0" title="Collega Account Fornitore">
                                                                    <UserPlus size={16} />
                                                                </Button>
                                                            )}

                                                            {isAdmin && (
                                                                <>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(supplier._id, supplier.status)} className="text-orange-400 hover:bg-orange-500/20 h-8 w-8 p-0" title={supplier.status === 'active' ? 'Disattiva' : 'Attiva'}>
                                                                        {supplier.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier._id)} className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0">
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </TabsContent>
                        )}

                        {/* ═══ TAB: RICHIESTE ═══ */}
                        <TabsContent value="richieste">
                            <div className="space-y-3">
                            {/* Diagnostics panel — shown to supplier when requests list is empty */}
                            {isSupplier && diagnostics && filtered(requests).length === 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm space-y-2">
                                    <p className="text-yellow-300 font-semibold">Diagnostica account fornitore</p>
                                    <p className="text-yellow-200/80">Email account: <span className="font-mono">{diagnostics.email}</span></p>
                                    <p className="text-yellow-200/80">Ruolo (backend): <span className={`font-mono ${diagnostics.role === 'supplier' ? 'text-green-300' : 'text-red-300'}`}>{diagnostics.role}</span>{diagnostics.role !== 'supplier' && ' ← problema rilevato'}</p>
                                    <p className="text-yellow-200/80">Record fornitore: {diagnostics.supplier ? <span className="text-green-300">✓ trovato — {diagnostics.supplier.name} ({diagnostics.supplier.email})</span> : <span className="text-red-300">✗ non trovato</span>}</p>
                                    <p className="text-yellow-200/80">Richieste nel DB: <span className={diagnostics.requestCount > 0 ? "text-green-300 font-bold" : "text-red-300"}>{diagnostics.requestCount}</span></p>
                                    {diagnostics.role !== 'supplier' && diagnostics.supplier && (
                                        <div className="pt-1">
                                            <p className="text-orange-300 text-xs mb-2">Il ruolo del record di autenticazione non è "supplier". Clicca per correggere:</p>
                                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7"
                                                onClick={() => syncSupplierRole().then(() => window.location.reload()).catch(e => alert(e.message))}>
                                                Correggi Ruolo e Ricarica
                                            </Button>
                                        </div>
                                    )}
                                    {diagnostics.requestCount === 0 && diagnostics.supplier && diagnostics.role === 'supplier' && (
                                        <p className="text-orange-300 text-xs">L'admin deve cliccare "Invia a Fornitore" in Preventivi per creare una richiesta.</p>
                                    )}
                                </div>
                            )}
                            {filtered(requests).length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><Send size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessuna richiesta</h3><p className="text-[#adb5bd] mt-2">Nessuna richiesta trovata.</p></div>
                            ) : filtered(requests).map(req => {
                                const supplier = suppliers.find(s => s._id === req.supplier_id);
                                return (
                                    <motion.div key={req._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">{req.title}</h3>
                                                        <p className="text-sm text-[#adb5bd]">{supplier?.name || 'Fornitore'} • {req.fixture_type || req.fixture_category || 'Generico'}</p>
                                                        {req.description && <p className="text-sm text-[#6c757d] mt-1 line-clamp-2">{req.description}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {req.preliminary_quote && !req.quoted_price && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] text-orange-400 font-bold uppercase">Preliminare</span>
                                                                <span className="text-[#f8f9fa] font-medium">€{req.preliminary_quote?.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        {req.quoted_price && <span className="text-[#f8f9fa] font-medium">€{req.quoted_price?.toLocaleString()}</span>}
                                                        <Badge variant="default" className={statusColors[req.status] || 'bg-gray-500/20 text-gray-400'}>{statusLabels[req.status] || req.status}</Badge>

                                                        <Button size="sm" onClick={() => setShowRequestDetailsModal(req)} className="bg-[#495057] hover:bg-[#6c757d] text-white ml-2 h-8 text-xs">
                                                            Dettagli
                                                        </Button>

                                                        {isSupplier && (req.status === 'sent' || req.status === 'received') && (
                                                            <Button size="sm" onClick={() => setShowQuoteModal(req)} className="bg-orange-600 hover:bg-orange-700 ml-2 h-8 text-xs">
                                                                Rispondi / Preventiva
                                                            </Button>
                                                        )}

                                                        {isAdmin && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(req._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 ml-2">
                                                                <Trash2 size={14} className="mr-1" /> Elimina
                                                            </Button>
                                                        )}

                                                        {/* Task 11: Cross-navigation to Orders */}
                                                        {(() => {
                                                            const linkedOrder = orders.find(o => o.request_id === req._id);
                                                            return linkedOrder ? (
                                                                <Button size="sm" onClick={() => setActiveTab('ordini')} className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-2 h-8 ml-2 text-xs">
                                                                    <Package size={14} className="mr-1" /> Vedi Ordine
                                                                </Button>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: ORDINI (Task 11 cross-nav + Task 12 workflow) ═══ */}
                        <TabsContent value="ordini">
                            <div className="space-y-3">{filtered(orders).length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><Package size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessun ordine</h3></div>
                            ) : filtered(orders).map(order => {
                                const supplier = suppliers.find(s => s._id === order.supplier_id);
                                const linkedRequest = requests.find(r => r._id === order.request_id);
                                const linkedDelivery = deliveries.find(d => d.order_id === order._id);
                                const workflowSteps = [
                                    'Richiesta', 'Al Fornitore', 'Preventivo', 'Valutazione Admin',
                                    'Al Cliente', 'Risposta Cliente', 'Deal Chiuso', 'In Attesa Pagamento Cliente', 'Pagamento IWHome', 'In Produzione'
                                ];
                                return (
                                    <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className={`bg-[#343a40] border ${order.locked ? 'border-red-500/40' : 'border-[#495057]'} hover:border-[#6c757d] transition-all`}>
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-medium text-[#f8f9fa]">Ordine #{order.order_number || order._id.slice(-6)}</h3>
                                                            {order.locked && <Badge variant="default" className="bg-red-500/20 text-red-400 text-[10px]"><Lock size={10} className="mr-1" />BLOCCATO</Badge>}
                                                        </div>
                                                        <p className="text-sm text-[#adb5bd]">{supplier?.name || 'Fornitore'}</p>
                                                        {order.delivery_date && <p className="text-xs text-[#6c757d] mt-1 flex items-center gap-1"><Calendar size={12} /> Consegna: {new Date(order.delivery_date).toLocaleDateString('it-IT')}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {order.total_amount && <span className="text-[#f8f9fa] font-medium text-lg">€{order.total_amount?.toLocaleString()}</span>}
                                                        <Badge variant="default" className={order.workflow_step ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : (statusColors[order.status] || 'bg-gray-500/20 text-gray-400')}>
                                                            {order.workflow_step ? workflowSteps[order.workflow_step - 1] : (statusLabels[order.status] || order.status)}
                                                        </Badge>
                                                        {isAdmin && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteOrder(order._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 ml-2">
                                                                <Trash2 size={14} className="mr-1" /> Elimina
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" size="sm" onClick={() => setShowOrderChatModal(order)} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-2 h-8 ml-2">
                                                            <MessageCircle size={14} className="mr-1" /> Chat Progetto
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Task 12: Workflow Stepper */}
                                                {order.workflow_step && order.workflow_step > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-[#495057]">
                                                        <p className="text-[10px] text-[#6c757d] mb-2 font-medium">WORKFLOW — Step {order.workflow_step}/10</p>
                                                        <div className="flex items-center gap-0.5">
                                                            {workflowSteps.map((step, i) => {
                                                                const stepNum = i + 1;
                                                                const isCompleted = stepNum < (order.workflow_step || 0);
                                                                const isCurrent = stepNum === (order.workflow_step || 0);
                                                                return (
                                                                    <React.Fragment key={step}>
                                                                        {i > 0 && <div className={`flex-shrink-0 w-2 h-0.5 ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-orange-500' : 'bg-[#495057]'}`} />}
                                                                        <div className={`flex-1 text-center py-1 rounded text-[7px] font-medium leading-[1.1] ${isCompleted ? 'bg-green-500/20 text-green-400' : isCurrent ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-[#495057]/50 text-[#6c757d]'}`} title={step}>
                                                                            {step.replace('Pagamento ', 'P. ')}
                                                                        </div>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Workflow Advance Buttons — RBAC gated per step */}
                                                        {order.locked ? (
                                                            <div className="mt-3 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                                <Lock size={12} className="text-red-400" />
                                                                <p className="text-xs text-red-400">Impossibile modificare: la produzione è già iniziata.</p>
                                                            </div>
                                                        ) : (() => {
                                                            const step = order.workflow_step || 0;
                                                            // Step 2: Admin invia al fornitore
                                                            if (step === 1 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 2)}>
                                                                        Invia al Fornitore →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 3: Fornitore carica preventivo PDF
                                                            if (step === 2 && isSupplier) return (
                                                                <div className="mt-3 space-y-2">
                                                                    <p className="text-[10px] text-amber-400">Carica il preventivo per procedere (URL PDF o link Drive):</p>
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="URL preventivo PDF..."
                                                                            value={quotePdfInputs[order._id] || ''}
                                                                            onChange={e => setQuotePdfInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                                                                            className="flex-1 bg-[#212529] border border-[#495057] text-[#f8f9fa] text-xs rounded px-2 py-1"
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            disabled={!quotePdfInputs[order._id]}
                                                                            className="bg-amber-600 hover:bg-amber-700 text-xs h-7"
                                                                            onClick={() => handleAdvanceWorkflow(order._id, 3, { quote_pdf_url: quotePdfInputs[order._id] })}
                                                                        >
                                                                            Invia Preventivo →
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                            // Step 4: Admin valuta preventivo
                                                            if (step === 3 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 4)}>
                                                                        Valuta Preventivo →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 5: Admin invia al cliente
                                                            if (step === 4 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 5)}>
                                                                        Invia al Cliente →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 6: Risposta cliente (admin registra)
                                                            if (step === 5 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 6)}>
                                                                        Registra Risposta Cliente →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 7: Deal chiuso (admin)
                                                            if (step === 6 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 7)}>
                                                                        Chiudi Deal →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 8: Fornitore conferma ordine (supplier)
                                                            if (step === 7 && isSupplier) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 8)}>
                                                                        Conferma Ordine →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 9: Admin registra pagamento al fornitore
                                                            if (step === 8 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 9)}>
                                                                        Pagamento Inviato al Fornitore →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 10: Admin avvia produzione
                                                            if (step === 9 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 10)}>
                                                                        Avvia Produzione →
                                                                    </Button>
                                                                </div>
                                                            );
                                                            return null;
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Task 11: Circular cross-navigation links */}
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#495057] flex-wrap">
                                                    {linkedRequest && (
                                                        <button onClick={() => setActiveTab('richieste')} className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md hover:bg-blue-500/20 transition-all">
                                                            <FileText size={10} /> Richiesta: {linkedRequest.title?.substring(0, 20)}
                                                        </button>
                                                    )}
                                                    {linkedDelivery && (
                                                        <button onClick={() => setActiveTab('consegne')} className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-md hover:bg-yellow-500/20 transition-all">
                                                            <MapPin size={10} /> Consegna: {statusLabels[linkedDelivery.status]}
                                                        </button>
                                                    )}
                                                    {(() => {
                                                        const linkedPayment = allPayments.find(p => p.order_id === order._id);
                                                        return linkedPayment ? (
                                                            <button onClick={() => navigate('/Pagamenti')} className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-all">
                                                                <CreditCard size={10} /> Pagamento: {linkedPayment.status === 'pagato' ? 'Pagato' : linkedPayment.status === 'in_ritardo' ? 'In Ritardo' : 'In Attesa'} (€{linkedPayment.amount?.toLocaleString()})
                                                            </button>
                                                        ) : null;
                                                    })()}
                                                    {/* Acconto gate indicator */}
                                                    {order.acconto_paid && (
                                                        <Badge variant="default" className="bg-green-500/20 text-green-400 text-[10px]">
                                                            <Unlock size={10} className="mr-1" />Acconto Confermato
                                                        </Badge>
                                                    )}

                                                    {/* Task Payment Verification UI for Supplier */}
                                                    {isSupplier && order.workflow_step === 9 && (
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            {(() => {
                                                                const payment = allPayments.find(p => p.order_id === order._id && p.type === "supplier");
                                                                if (payment?.proof_url) {
                                                                    return (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-[10px] h-7 px-2"
                                                                            onClick={() => {
                                                                                setPdfUrl(payment.proof_url);
                                                                                setPdfTitle(`Prova Pagamento IWHome - Ordine #${order.order_number || order._id.slice(-6)}`);
                                                                                setIsPdfOpen(true);
                                                                            }}
                                                                        >
                                                                            <Eye size={12} className="mr-1" /> Vedi Pagamento
                                                                        </Button>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white text-[10px] h-7 px-2"
                                                                onClick={() => handleConfirmPayment(order._id)}
                                                            >
                                                                <CheckCircle size={12} className="mr-1" /> Conferma Ricezione
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Supplier Propose Payment Plan (Available anytime if not yet proposed) */}
                                                    {isSupplier && !order.payment_proposal && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 text-[10px] h-7 px-2 ml-auto mt-2"
                                                            onClick={() => {
                                                                setShowPaymentPlanModal(order);
                                                                setPaymentProposal([{ amount: order.total_amount || 0, due_date: '', description: 'Saldo' }]);
                                                            }}
                                                        >
                                                            <CreditCard size={12} className="mr-1" /> Proponi Piano Pagamenti
                                                        </Button>
                                                    )}
                                                    {order.payment_proposal && (
                                                        <div className="ml-auto mt-2">
                                                            <Badge variant="outline" className={`text-[9px] ${order.payment_proposal_status === 'accepted' ? 'text-green-400 border-green-500/50' : 'text-yellow-400 border-yellow-500/50'}`}>
                                                                Piano: {order.payment_proposal_status === 'accepted' ? 'Approvato' : 'In Attesa'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: PRODUZIONE ═══ */}
                        <TabsContent value="produzione">
                            <div className="space-y-3">{orders.filter(o => o.status === 'in_production' || o.status === 'confirmed').length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><Factory size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessun ordine in produzione</h3></div>
                            ) : orders.filter(o => o.status === 'in_production' || o.status === 'confirmed').map(order => {
                                const supplier = suppliers.find(s => s._id === order.supplier_id);
                                const productionPhases = ['Materiali', 'Taglio', 'Assemblaggio', 'Controllo Qualità', 'Pronto'];
                                const currentPhase = order.production_phase || 0;
                                return (
                                    <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057]">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">Ordine #{order.order_number || order._id.slice(-6)}</h3>
                                                        <p className="text-sm text-[#adb5bd]">{supplier?.name}</p>
                                                    </div>
                                                    <Badge variant="default" className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                                                </div>
                                                {/* Phase Progress */}
                                                <div className="flex items-center gap-1 mt-3">
                                                    {productionPhases.map((phase, i) => (
                                                        <div key={phase} className="flex-1">
                                                            <div className={`h-2.5 rounded-full transition-all duration-500 ${
                                                                i < currentPhase ? 'bg-green-500' :
                                                                i === currentPhase ? 'bg-yellow-500 animate-pulse' : 'bg-[#495057]'
                                                            }`} />
                                                            <p className={`text-[9px] mt-1 text-center ${
                                                                i < currentPhase ? 'text-green-400 font-medium' :
                                                                i === currentPhase ? 'text-yellow-400 font-medium' : 'text-[#6c757d]'
                                                            }`}>{phase}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Supplier-only: Advance Phase Button */}
                                                {isSupplier && currentPhase < productionPhases.length && (
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <p className="text-xs text-[#adb5bd]">
                                                            Fase attuale: <span className="text-yellow-400 font-medium">{productionPhases[currentPhase]}</span>
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            className="bg-orange-600 hover:bg-orange-700"
                                                            onClick={async () => {
                                                                try {
                                                                    await updateProductionPhase({ 
                                                                        order_id: order._id, 
                                                                        phase_index: currentPhase + 1 
                                                                    });
                                                                    alert(`Fase avanzata a: ${productionPhases[currentPhase + 1] || 'Completata'}`);
                                                                } catch (err) { 
                                                                    console.error(err); 
                                                                    alert(err.message || 'Errore nell\'avanzamento della fase.'); 
                                                                }
                                                            }}
                                                        >
                                                            <ArrowRight size={14} className="mr-1" /> Avanza Fase
                                                        </Button>
                                                    </div>
                                                )}
                                                {/* Admin read-only indicator */}
                                                {isAdmin && (
                                                    <p className="text-[10px] text-[#6c757d] mt-3 flex items-center gap-1">
                                                        <Eye size={12} /> Solo il fornitore può modificare le fasi di produzione
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: CONSEGNE (with driver info) ═══ */}
                        <TabsContent value="consegne">
                            <div className="space-y-3">{filtered(deliveries).length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><MapPin size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessuna consegna</h3></div>
                            ) : filtered(deliveries).map(delivery => {
                                const supplier = suppliers.find(s => s._id === delivery.supplier_id);
                                return (
                                    <motion.div key={delivery._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">{supplier?.name || 'Fornitore'}</h3>
                                                        {delivery.tracking_number && <p className="text-sm text-[#adb5bd]">Tracking: {delivery.tracking_number}</p>}
                                                        {delivery.estimated_arrival && <p className="text-xs text-[#6c757d]">Arrivo stimato: {new Date(delivery.estimated_arrival).toLocaleDateString('it-IT')}</p>}

                                                        {/* Task 11: Cross-navigation to Orders */}
                                                        {delivery.order_id && (
                                                            <div className="mt-2 mb-2">
                                                                <button onClick={() => setActiveTab('ordini')} className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md hover:bg-purple-500/20 transition-all w-fit">
                                                                    <Package size={10} /> Vedi Ordine Collegato
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Driver Info Card */}
                                                        {(delivery.driver_name || delivery.driver_phone) && (
                                                            <div className="mt-3 bg-[#212529] rounded-lg p-3 border border-[#495057]">
                                                                <p className="text-xs text-orange-400 font-medium mb-1 flex items-center gap-1"><Truck size={12} /> Autista</p>
                                                                <div className="flex items-center gap-4">
                                                                    {delivery.driver_name && <span className="text-sm text-[#f8f9fa] flex items-center gap-1"><User size={12} className="text-[#6c757d]" /> {delivery.driver_name}</span>}
                                                                    {delivery.driver_phone && (
                                                                        <a href={`tel:${delivery.driver_phone}`} className="text-sm text-green-400 flex items-center gap-1 hover:underline">
                                                                            <PhoneCall size={12} /> {delivery.driver_phone}
                                                                        </a>
                                                                    )}
                                                                    {delivery.driver_vehicle && <span className="text-xs text-[#adb5bd]">{delivery.driver_vehicle}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {/* 3 State Progress */}
                                                        <div className="flex items-center gap-1">
                                                            {[
                                                                { key: 'partito', label: 'P' },
                                                                { key: 'in_transito', label: 'T' },
                                                                { key: 'consegnato', label: 'C' }].map((state, i) => {
                                                                const phases = ['partito', 'in_transito', 'consegnato'];
                                                                const isPast = phases.indexOf(delivery.status) >= i;
                                                                const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
                                                                return (
                                                                    <React.Fragment key={state.key}>
                                                                        {i > 0 && <div className={`w-4 h-0.5 ${isPast ? colors[i] : 'bg-[#495057]'}`} />}
                                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isPast ? `${colors[i]}/30 text-white border border-white/20` : 'bg-[#495057] text-[#6c757d]'}`}>
                                                                            {state.label}
                                                                        </div>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {delivery.driver_phone && (
                                                                <a href={`tel:${delivery.driver_phone}`}>
                                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2">
                                                                        <PhoneCall size={12} className="mr-1" /> Chiama
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            {isAdmin && delivery.status !== 'consegnato' && (
                                                                <Button size="sm" onClick={() => handleConfirmDelivery(delivery._id)} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7">
                                                                    <CheckCircle size={12} className="mr-1" /> Conferma
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button size="sm" onClick={() => handleDeleteDelivery(delivery._id)} className="bg-red-600/80 hover:bg-red-700 text-xs h-7 ml-1">
                                                                    <Trash2 size={12} className="mr-1" /> Elimina
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: COMUNICAZIONI ═══ */}
                        <TabsContent value="comunicazioni">
                            {isSupplier ? (
                                <Card className="bg-[#343a40] border border-[#495057]">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-[#f8f9fa] flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center"><Building2 size={14} className="text-blue-400" /></div>
                                                IWHome (Amministrazione)
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {/* Il fornitore chatta usando il proprio ID come channelId, per comunicare con admin (che ascolta sullo stesso canale) */}
                                        {supplierId ? <MiniChat channelType="supplier" channelId={supplierId} channelName="IWHome" currentUserEmail={email} contactPhone={""} /> : <p className="text-[#adb5bd] text-sm py-4">Caricamento chat in corso...</p>}
                                    </CardContent>
                                </Card>
                            ) : suppliers.length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <MessageCircle size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun fornitore</h3>
                                    <p className="text-[#adb5bd] mt-2">Aggiungi fornitori per comunicare con loro.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {suppliers.map(supplier => (
                                        <Card key={supplier._id} className="bg-[#343a40] border border-[#495057]">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm text-[#f8f9fa] flex items-center justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center"><Building2 size={14} className="text-orange-400" /></div>
                                                        {supplier.name}
                                                    </span>
                                                    {supplier.phone && (
                                                        <a href={`tel:${supplier.phone}`}>
                                                            <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20 h-7 px-2 text-xs">
                                                                <PhoneCall size={12} className="mr-1" /> Chiama
                                                            </Button>
                                                        </a>
                                                    )}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <MiniChat channelType="supplier" channelId={supplier._id} channelName={supplier.name} currentUserEmail={email} contactPhone={supplier.phone || ""} />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* ═══ TAB: CALENDARIO (Task 13) ═══ */}
                        <TabsContent value="calendario">
                            {(() => {
                                const today = new Date();
                                const weekStart = new Date(today);
                                weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
                                const numDays = calendarView === 'monthly' ? 28 : calendarView === 'biweekly' ? 14 : 7;
                                const gridCols = calendarView === 'monthly' ? 7 : 7;
                                const calDays = Array.from({ length: numDays }, (_, i) => {
                                    const d = new Date(weekStart);
                                    d.setDate(weekStart.getDate() + i);
                                    return d;
                                });
                                const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

                                return (
                                    <div className="space-y-4">
                                        {/* Calendar Header */}
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <h3 className="text-lg font-medium text-[#f8f9fa] flex items-center gap-2">
                                                <Calendar size={18} className="text-orange-400" /> Calendario Consegne
                                            </h3>
                                            <div className="flex items-center gap-1 bg-[#343a40] border border-[#495057] rounded-lg p-0.5">
                                                {[{ key: 'weekly', label: '1 Sett.' }, { key: 'biweekly', label: '2 Sett.' }, { key: 'monthly', label: 'Mensile' }].map(v => (
                                                    <button
                                                        key={v.key}
                                                        onClick={() => setCalendarView(v.key)}
                                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                            calendarView === v.key ? 'bg-orange-600 text-white' : 'text-[#adb5bd] hover:text-white'
                                                        }`}
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#adb5bd]">
                                            {weekStart.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })} — {calDays[calDays.length - 1].toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>

                                        {/* Calendar Grid */}
                                        <div className={`grid grid-cols-${gridCols} gap-1`}>
                                            {calDays.map((day, i) => {
                                                const dayStr = day.toISOString().split('T')[0];
                                                const isToday = dayStr === today.toISOString().split('T')[0];
                                                const dayDeliveries = deliveries.filter(d => {
                                                    const estDate = d.estimated_arrival ? new Date(d.estimated_arrival).toISOString().split('T')[0] : null;
                                                    const confDate = d.confirmed_arrival ? new Date(d.confirmed_arrival).toISOString().split('T')[0] : null;
                                                    const clientDate = d.client_delivery_date ? new Date(d.client_delivery_date).toISOString().split('T')[0] : null;
                                                    return estDate === dayStr || confDate === dayStr || clientDate === dayStr;
                                                });

                                                return (
                                                    <div key={dayStr} className={`rounded-lg border p-1.5 ${calendarView === 'monthly' ? 'min-h-[80px]' : 'min-h-[120px]'} ${isToday ? 'border-orange-500 bg-orange-500/10' : 'border-[#495057] bg-[#343a40]/50'}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`text-[10px] font-medium ${isToday ? 'text-orange-400' : 'text-[#adb5bd]'}`}>
                                                                {dayNames[i % 7]}
                                                            </span>
                                                            <span className={`text-xs ${isToday ? 'text-orange-400 font-bold' : 'text-[#6c757d]'}`}>
                                                                {day.getDate()}
                                                            </span>
                                                        </div>
                                                        {dayDeliveries.length === 0 ? (
                                                            <p className="text-[8px] text-[#495057] text-center mt-2">—</p>
                                                        ) : dayDeliveries.map(d => {
                                                            const supplier = suppliers.find(s => s._id === d.supplier_id);
                                                            const hasConfirmed = !!d.confirmed_arrival;
                                                            return (
                                                                <div key={d._id} className={`text-[9px] rounded px-1.5 py-0.5 mb-0.5 ${d.status === 'consegnato' ? 'bg-green-500/20 text-green-400' : hasConfirmed ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                    <p className="font-medium truncate">{supplier?.name?.substring(0, calendarView === 'monthly' ? 6 : 10)}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Date Progression Legend */}
                                        <Card className="bg-[#343a40]/50 border border-[#495057]">
                                            <CardContent className="p-3">
                                                <p className="text-[10px] text-[#6c757d] font-medium mb-2">PROGRESSIONE DATE</p>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                                        <span className="text-[10px] text-[#adb5bd]">Stimata</span>
                                                    </div>
                                                    <ArrowRight size={10} className="text-[#6c757d]" />
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                                                        <span className="text-[10px] text-[#adb5bd]">Confermata</span>
                                                    </div>
                                                    <ArrowRight size={10} className="text-[#6c757d]" />
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-green-400" />
                                                        <span className="text-[10px] text-[#adb5bd]">Cliente</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Upcoming deliveries list */}
                                        <div className="space-y-2">
                                            <p className="text-xs text-[#6c757d] font-medium">PROSSIME CONSEGNE</p>
                                            {deliveries.filter(d => d.status !== 'consegnato').sort((a, b) => {
                                                const aDate = a.confirmed_arrival || a.estimated_arrival || '';
                                                const bDate = b.confirmed_arrival || b.estimated_arrival || '';
                                                return aDate.localeCompare(bDate);
                                            }).slice(0, 5).map(d => {
                                                const supplier = suppliers.find(s => s._id === d.supplier_id);
                                                const displayDate = d.client_delivery_date || d.confirmed_arrival || d.estimated_arrival;
                                                return (
                                                    <Card key={d._id} className="bg-[#343a40] border border-[#495057]">
                                                        <CardContent className="p-3 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm text-[#f8f9fa] font-medium">{supplier?.name}</p>
                                                                {d.tracking_number && <p className="text-[10px] text-[#6c757d]">Tracking: {d.tracking_number}</p>}
                                                            </div>
                                                            <div className="text-right flex flex-col items-end gap-1">
                                                                {displayDate && <p className="text-xs text-[#adb5bd]">{new Date(displayDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</p>}
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="default" className={`text-[9px] ${d.confirmed_arrival ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                        {d.confirmed_arrival ? 'Confermata' : 'Stimata'}
                                                                    </Badge>
                                                                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-blue-400 hover:bg-blue-500/20 text-[10px]" onClick={() => {
                                                                        setEditingDelivery({
                                                                            id: d._id,
                                                                            estimated_arrival: d.estimated_arrival ? new Date(d.estimated_arrival).toISOString().split('T')[0] : '',
                                                                            confirmed_arrival: d.confirmed_arrival ? new Date(d.confirmed_arrival).toISOString().split('T')[0] : '',
                                                                            client_delivery_date: d.client_delivery_date ? new Date(d.client_delivery_date).toISOString().split('T')[0] : ''
                                                                        });
                                                                        setShowEditDeliveryModal(true);
                                                                    }}>
                                                                        Edit Date
                                                                    </Button>
                                                                    {isAdmin && (
                                                                        <>
                                                                            <input
                                                                                type="file"
                                                                                id={`fattura-upload-${d._id}`}
                                                                                className="hidden"
                                                                                accept=".xml,.pdf,.p7m"
                                                                                onChange={(e) => handleFatturaUpload(e, d._id)}
                                                                            />
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-5 px-1.5 text-orange-400 hover:bg-orange-500/20 text-[10px] flex items-center gap-1"
                                                                                onClick={() => document.getElementById(`fattura-upload-${d._id}`).click()}
                                                                                disabled={isUploading}
                                                                            >
                                                                                {isUploading ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
                                                                                Fattura
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                            {deliveries.filter(d => d.status !== 'consegnato').length === 0 && (
                                                <div className="text-center py-8 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                                    <Calendar size={32} className="text-[#6c757d] mx-auto mb-2" />
                                                    <p className="text-sm text-[#adb5bd]">Nessuna consegna programmata</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* ═══ MODAL: Nuovo Fornitore ═══ */}
            <Dialog open={showNewSupplierModal} onOpenChange={setShowNewSupplierModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuovo Fornitore</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Nome Azienda *" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Email *" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Telefono" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Referente" value={newSupplier.contact_person} onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="P.IVA" value={newSupplier.piva} onChange={e => setNewSupplier({ ...newSupplier, piva: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Indirizzo" value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Select value={newSupplier.type} onValueChange={v => setNewSupplier({ ...newSupplier, type: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="subprod" className="text-[#f8f9fa]">Subprodotti (Infissi)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea placeholder="Note" value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreateSupplier} disabled={!newSupplier.name || !newSupplier.email} className="w-full bg-orange-600 hover:bg-orange-700">Crea Fornitore</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Nuova Richiesta (Task 9/10 expanded) ═══ */}
            <Dialog open={showNewRequestModal} onOpenChange={setShowNewRequestModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuova Richiesta</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={newRequest.supplier_id} onValueChange={v => setNewRequest({ ...newRequest, supplier_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Fornitore *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa]">{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input placeholder="Titolo Richiesta *" value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />

                        {/* Task 10: Fixture Category Selector */}
                        <p className="text-xs text-orange-400 font-medium mt-2">Categoria Prodotto</p>
                        <Select value={newRequest.fixture_category} onValueChange={v => setNewRequest({ ...newRequest, fixture_category: v, fixture_type: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Categoria *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="finestra" className="text-[#f8f9fa]">Finestra</SelectItem>
                                <SelectItem value="porta" className="text-[#f8f9fa]">Porta</SelectItem>
                                <SelectItem value="portafinestra" className="text-[#f8f9fa]">Portafinestra</SelectItem>
                                <SelectItem value="veneziana" className="text-[#f8f9fa]">Veneziana</SelectItem>
                                <SelectItem value="tapparella" className="text-[#f8f9fa]">Tapparella</SelectItem>
                                <SelectItem value="zanzariera" className="text-[#f8f9fa]">Zanzariera</SelectItem>
                                <SelectItem value="scorrevole" className="text-[#f8f9fa]">Scorrevole</SelectItem>
                                <SelectItem value="avvolgibile" className="text-[#f8f9fa]">Avvolgibile</SelectItem>
                                <SelectItem value="persiana" className="text-[#f8f9fa]">Persiana</SelectItem>
                                <SelectItem value="altro" className="text-[#f8f9fa]">Altro</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Task 9: Urgency */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-[#adb5bd] block mb-1">Urgenza</label>
                                <Select value={newRequest.urgency} onValueChange={v => setNewRequest({ ...newRequest, urgency: v })}>
                                    <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                        <SelectItem value="normal" className="text-[#f8f9fa]">Normale</SelectItem>
                                        <SelectItem value="urgent" className="text-red-400">🔴 Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-[#adb5bd] block mb-1">Quantità</label>
                                <Input type="number" min="1" value={newRequest.quantity} onChange={e => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                        </div>

                        {/* Dimensions */}
                        <p className="text-xs text-orange-400 font-medium mt-2">Dimensioni (mm)</p>
                        <div className="grid grid-cols-3 gap-2">
                            <Input placeholder="Larghezza" value={newRequest.dimensions_width} onChange={e => setNewRequest({ ...newRequest, dimensions_width: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-sm" />
                            <Input placeholder="Altezza" value={newRequest.dimensions_height} onChange={e => setNewRequest({ ...newRequest, dimensions_height: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-sm" />
                            <Input placeholder="Profondità" value={newRequest.dimensions_depth} onChange={e => setNewRequest({ ...newRequest, dimensions_depth: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-sm" />
                        </div>

                        {/* Material, Color, Glass */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Materiale</label>
                                <Select value={newRequest.material} onValueChange={v => setNewRequest({ ...newRequest, material: v })}>
                                    <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Materiale" /></SelectTrigger>
                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                        <SelectItem value="pvc" className="text-[#f8f9fa]">PVC</SelectItem>
                                        <SelectItem value="alluminio" className="text-[#f8f9fa]">Alluminio</SelectItem>
                                        <SelectItem value="legno" className="text-[#f8f9fa]">Legno</SelectItem>
                                        <SelectItem value="legno_alluminio" className="text-[#f8f9fa]">Legno/Alluminio</SelectItem>
                                        <SelectItem value="acciaio" className="text-[#f8f9fa]">Acciaio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Colore</label>
                                <Input placeholder="es. Bianco RAL 9010" value={newRequest.color} onChange={e => setNewRequest({ ...newRequest, color: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Tipo Vetro</label>
                                <Select value={newRequest.glass_type} onValueChange={v => setNewRequest({ ...newRequest, glass_type: v })}>
                                    <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Vetro" /></SelectTrigger>
                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                        <SelectItem value="doppio" className="text-[#f8f9fa]">Doppio Vetro</SelectItem>
                                        <SelectItem value="triplo" className="text-[#f8f9fa]">Triplo Vetro</SelectItem>
                                        <SelectItem value="basso_emissivo" className="text-[#f8f9fa]">Basso Emissivo</SelectItem>
                                        <SelectItem value="temperato" className="text-[#f8f9fa]">Temperato</SelectItem>
                                        <SelectItem value="stratificato" className="text-[#f8f9fa]">Stratificato</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Budget Stimato (€)</label>
                                <Input type="number" placeholder="0" value={newRequest.budget_estimate} onChange={e => setNewRequest({ ...newRequest, budget_estimate: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                        </div>

                        <Textarea placeholder="Descrizione e specifiche tecniche" value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" rows={3} />

                        {/* Task 9: Attachments */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Foto / Immagini</label>
                                <Input type="file" multiple accept="image/*" onChange={e => { const files = Array.from(e.target.files); const err = validateFiles(files, 'image'); if (err) { alert(err); e.target.value = ''; return; } setNewRequestPhotos(files); }} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-xs file:bg-[#343a40] file:text-orange-400 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 hover:file:bg-[#212529]" />
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Documenti (PDF, DWG)</label>
                                <Input type="file" multiple accept=".pdf,.doc,.docx,.dwg" onChange={e => { const files = Array.from(e.target.files); const err = validateFiles(files, 'document'); if (err) { alert(err); e.target.value = ''; return; } setNewRequestDocs(files); }} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-xs file:bg-[#343a40] file:text-blue-400 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 hover:file:bg-[#212529]" />
                            </div>
                        </div>

                        <Button onClick={handleCreateRequest} disabled={!newRequest.supplier_id || !newRequest.title || isUploading} className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                            {isUploading ? <><Loader2 className="animate-spin mr-2" size={16} /> Caricamento in corso...</> : 'Invia Richiesta'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Nuova Consegna ═══ */}
            {/* ═══ MODAL: Modifica Date Calendario (Task 13) ═══ */}
            <Dialog open={showEditDeliveryModal} onOpenChange={setShowEditDeliveryModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-sm max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Aggiorna Date Consegna</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-3">
                        <div>
                            <label className="text-xs text-[#6c757d] mb-1 block">Data Stimata (Fornitore)</label>
                            <Input type="date" value={editingDelivery.estimated_arrival} onChange={e => setEditingDelivery({ ...editingDelivery, estimated_arrival: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>
                        <div>
                            <label className="text-xs text-[#6c757d] mb-1 block">Data Confermata (Fornitore)</label>
                            <Input type="date" value={editingDelivery.confirmed_arrival} onChange={e => setEditingDelivery({ ...editingDelivery, confirmed_arrival: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>
                        {isAdmin && (
                            <div>
                                <label className="text-xs text-orange-400 mb-1 block">Data Cliente (IWHome)</label>
                                <Input type="date" value={editingDelivery.client_delivery_date} onChange={e => setEditingDelivery({ ...editingDelivery, client_delivery_date: e.target.value })} className="bg-[#495057] border-orange-500/50 text-[#f8f9fa]" />
                            </div>
                        )}
                        <Button onClick={handleUpdateDeliveryDates} className="w-full bg-blue-600 hover:bg-blue-700">Salva Date</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuova Consegna</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        {!isSupplier && (
                            <Select value={newDelivery.supplier_id} onValueChange={v => setNewDelivery({ ...newDelivery, supplier_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Fornitore *" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa]">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={newDelivery.order_id} onValueChange={v => setNewDelivery({ ...newDelivery, order_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Ordine *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {orders.filter(o => !newDelivery.supplier_id || o.supplier_id === newDelivery.supplier_id).map(o => (
                                    <SelectItem key={o._id} value={o._id} className="text-[#f8f9fa]">Ordine #{o.order_number || o._id.slice(-6)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-orange-400 font-medium flex items-center gap-1"><Truck size={12} /> Info Autista</p>
                        <Input placeholder="Nome Autista" value={newDelivery.driver_name} onChange={e => setNewDelivery({ ...newDelivery, driver_name: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Telefono Autista" value={newDelivery.driver_phone} onChange={e => setNewDelivery({ ...newDelivery, driver_phone: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Veicolo (Targa)" value={newDelivery.driver_vehicle} onChange={e => setNewDelivery({ ...newDelivery, driver_vehicle: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Nr. Tracking" value={newDelivery.tracking_number} onChange={e => setNewDelivery({ ...newDelivery, tracking_number: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <div>
                            <label className="text-xs text-[#adb5bd] block mb-1">Arrivo Stimato</label>
                            <Input type="date" value={newDelivery.estimated_arrival} onChange={e => setNewDelivery({ ...newDelivery, estimated_arrival: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>
                        <Textarea placeholder="Note" value={newDelivery.notes} onChange={e => setNewDelivery({ ...newDelivery, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreateDelivery} disabled={!newDelivery.order_id || !newDelivery.supplier_id} className="w-full bg-green-600 hover:bg-green-700">Crea Consegna</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Dettagli Richiesta ═══ */}
            <Dialog open={!!showRequestDetailsModal} onOpenChange={(open) => !open && setShowRequestDetailsModal(null)}>
                <DialogContent className="bg-[#212529] text-[#f8f9fa] border-[#495057] w-[95vw] max-w-2xl" style={{ maxWidth: 'min(calc(100vw - 3rem), 32rem)' }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="text-blue-500" /> Dettagli Richiesta
                            {showRequestDetailsModal?.status && (
                                <Badge variant="default" className={`ml-2 ${statusColors[showRequestDetailsModal.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                    {statusLabels[showRequestDetailsModal.status] || showRequestDetailsModal.status}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {showRequestDetailsModal && (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="bg-[#343a40] p-4 rounded-lg border border-[#495057]">
                                <h3 className="text-xl font-medium text-white mb-1">{showRequestDetailsModal.title}</h3>
                                {showRequestDetailsModal.description && <p className="text-sm text-[#adb5bd] mt-2 whitespace-pre-wrap">{showRequestDetailsModal.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Card className="bg-[#343a40] border-[#495057]">
                                    <CardContent className="p-3">
                                        <p className="text-[10px] text-[#6c757d] uppercase tracking-wider mb-2">Specifiche Base</p>
                                        <ul className="space-y-1.5 text-xs text-[#dee2e6]">
                                            <li><span className="text-[#adb5bd] inline-block w-20">Categoria:</span> <span className="font-medium">{showRequestDetailsModal.fixture_category || showRequestDetailsModal.fixture_type || 'N/A'}</span></li>
                                            <li><span className="text-[#adb5bd] inline-block w-20">Urgenza:</span> <span className={showRequestDetailsModal.urgency === 'high' ? 'text-red-400 font-medium' : ''}>{showRequestDetailsModal.urgency === 'high' ? 'Alta' : 'Normale'}</span></li>
                                            <li><span className="text-[#adb5bd] inline-block w-20">Quantità:</span> <span className="font-medium">{showRequestDetailsModal.quantity || 1}</span></li>
                                            {showRequestDetailsModal.budget_estimate && <li><span className="text-[#adb5bd] inline-block w-20">Budget:</span> <span className="font-medium">€{showRequestDetailsModal.budget_estimate}</span></li>}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#343a40] border-[#495057]">
                                    <CardContent className="p-3">
                                        <p className="text-[10px] text-[#6c757d] uppercase tracking-wider mb-2">Caratteristiche</p>
                                        <ul className="space-y-1.5 text-xs text-[#dee2e6]">
                                            <li><span className="text-[#adb5bd] inline-block w-20">Misure:</span> {(showRequestDetailsModal.dimensions?.width && showRequestDetailsModal.dimensions?.height) ? `${showRequestDetailsModal.dimensions.width}x${showRequestDetailsModal.dimensions.height} cm (P:${showRequestDetailsModal.dimensions.depth || '-'})` : 'N/A'}</li>
                                            <li><span className="text-[#adb5bd] inline-block w-20">Materiale:</span> {showRequestDetailsModal.material || 'N/A'}</li>
                                            <li><span className="text-[#adb5bd] inline-block w-20">Colore:</span> <span className="capitalize">{showRequestDetailsModal.color || 'N/A'}</span></li>
                                            <li><span className="text-[#adb5bd] inline-block w-20">Vetro:</span> <span className="capitalize">{showRequestDetailsModal.glass_type || 'N/A'}</span></li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Phase 8: Supplier Response (Visible to Admin) */}
                            {isAdmin && showRequestDetailsModal.status === 'preventivato' && (
                                <div className="space-y-3">
                                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Risposta Fornitore</p>
                                            <p className="text-xl font-medium text-white">€{showRequestDetailsModal.quoted_price?.toLocaleString('it-IT')}</p>
                                            {showRequestDetailsModal.supplier_notes && <p className="text-xs text-[#adb5bd] mt-1 italic">"{showRequestDetailsModal.supplier_notes}"</p>}
                                        </div>
                                        {showRequestDetailsModal.supplier_quote_doc_id && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Documento Preventivo</p>
                                                <FileLink storageId={showRequestDetailsModal.supplier_quote_doc_id} isImage={false} />
                                            </div>
                                        )}
                                    </div>
                                    {/* Admin actions on supplier quote */}
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                                            onClick={() => handleRejectSupplierQuote(showRequestDetailsModal)}
                                        >
                                            <XCircle size={14} className="mr-1" /> Rifiuta e Chiedi Revisione
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                            onClick={() => {
                                                setCounterproposalPrice(showRequestDetailsModal.quoted_price?.toString() || '');
                                                setCounterproposalModal(showRequestDetailsModal);
                                            }}
                                        >
                                            <ArrowRight size={14} className="mr-1" /> Controproposta
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Controproposta status (sent, awaiting supplier response) */}
                            {showRequestDetailsModal.status === 'counterproposal_sent' && showRequestDetailsModal.counterproposal_status === 'pending' && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                                    <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Controproposta Inviata al Fornitore</p>
                                    <p className="text-lg font-medium text-white">€{showRequestDetailsModal.counterproposal_price?.toLocaleString('it-IT')}</p>
                                    {showRequestDetailsModal.counterproposal_notes && <p className="text-xs text-[#adb5bd] mt-1 italic">"{showRequestDetailsModal.counterproposal_notes}"</p>}
                                    <p className="text-xs text-amber-300 mt-2">In attesa di risposta dal fornitore...</p>
                                </div>
                            )}

                            {/* Supplier: respond to counterproposal */}
                            {isSupplier && showRequestDetailsModal.status === 'counterproposal_sent' && showRequestDetailsModal.counterproposal_status === 'pending' && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg space-y-3">
                                    <p className="text-sm font-medium text-amber-300">IWHome propone un prezzo diverso:</p>
                                    <p className="text-2xl font-bold text-white">€{showRequestDetailsModal.counterproposal_price?.toLocaleString('it-IT')}</p>
                                    {showRequestDetailsModal.counterproposal_notes && (
                                        <p className="text-xs text-[#adb5bd] italic">"{showRequestDetailsModal.counterproposal_notes}"</p>
                                    )}
                                    <p className="text-xs text-[#adb5bd]">Il tuo preventivo originale era: €{showRequestDetailsModal.quoted_price?.toLocaleString('it-IT')}</p>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => setCounterResponseModal({ ...showRequestDetailsModal, _acceptMode: true })}
                                        >
                                            <CheckCircle size={14} className="mr-1" /> Accetto
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                            onClick={() => setCounterResponseModal({ ...showRequestDetailsModal, _acceptMode: false })}
                                        >
                                            <XCircle size={14} className="mr-1" /> Rifiuto
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Attachments Section */}
                            {(showRequestDetailsModal.photos?.length > 0 || showRequestDetailsModal.documents?.length > 0) && (
                                <div className="mt-4 pt-4 border-t border-[#495057]">
                                    <p className="text-sm font-medium text-[#f8f9fa] mb-3">Allegati</p>

                                    {showRequestDetailsModal.photos?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs text-[#adb5bd] mb-2">Foto / Immagini:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {showRequestDetailsModal.photos.map((storageId, idx) => (
                                                    <FileLink key={idx} storageId={storageId} isImage={true} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {showRequestDetailsModal.documents?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-[#adb5bd] mb-2">Documenti:</p>
                                            <div className="flex gap-2 flex-wrap flex-col">
                                                {showRequestDetailsModal.documents.map((storageId, idx) => (
                                                    <FileLink key={idx} storageId={storageId} isImage={false} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Phase 8/9/10: Full System View (Orders, Payments, Delivery) */}
                            {(() => {
                                const linkedOrder = orders.find(o => o.request_id === showRequestDetailsModal._id);
                                if (!linkedOrder) return null;
                                const linkedDelivery = deliveries.find(d => d.order_id === linkedOrder._id);
                                const linkedPayments = allPayments.filter(p => p.order_id === linkedOrder._id);

                                return (
                                    <div className="mt-6 space-y-4">
                                        <h4 className="text-lg font-medium text-[#f8f9fa] border-b border-[#495057] pb-2">Avanzamento Ordine</h4>
                                        
                                        {/* Order Info */}
                                        <div className="bg-[#343a40] border border-[#495057] p-4 rounded-lg">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Ordine #{linkedOrder.order_number || linkedOrder._id.slice(-6)}</p>
                                                    <p className="text-xs text-[#adb5bd]">Importo Totale: {linkedOrder.total_amount ? `€${linkedOrder.total_amount.toLocaleString()}` : 'N/A'}</p>
                                                </div>
                                                <Badge variant="default" className={statusColors[linkedOrder.status] || 'bg-gray-500/20 text-gray-400'}>
                                                    {statusLabels[linkedOrder.status] || linkedOrder.status}
                                                </Badge>
                                            </div>
                                            
                                            {/* Payments */}
                                            {linkedPayments.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-[#495057]">
                                                    <p className="text-xs text-[#adb5bd] mb-2 uppercase tracking-wider">Pagamenti Collegati</p>
                                                    <div className="space-y-2">
                                                        {linkedPayments.map(payment => (
                                                            <div key={payment._id} className="flex justify-between items-center bg-[#212529] p-2 rounded text-xs border border-[#495057]/50">
                                                                <div className="flex items-center gap-2">
                                                                    <CreditCard size={14} className={payment.status === 'pagato' ? 'text-green-400' : 'text-yellow-400'} />
                                                                    <span className="text-[#dee2e6]">{payment.type === 'client' ? 'Cliente → IWHome' : 'IWHome → Fornitore'}</span>
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    <span className="font-medium text-white">€{payment.amount?.toLocaleString()}</span>
                                                                    <span className={payment.status === 'pagato' ? 'text-green-400' : 'text-yellow-400'}>{payment.status === 'pagato' ? 'Pagato' : 'Attesa'}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery */}
                                            {linkedDelivery && (
                                                <div className="mt-3 pt-3 border-t border-[#495057]">
                                                    <p className="text-xs text-[#adb5bd] mb-2 uppercase tracking-wider">Logistica / Consegna</p>
                                                    <div className="bg-[#212529] p-2 flex justify-between items-center rounded text-xs border border-[#495057]/50">
                                                        <div className="flex items-center gap-2">
                                                            <Truck size={14} className="text-blue-400" />
                                                            <span className="text-[#dee2e6]">Arrivo Previsto: {linkedDelivery.estimated_arrival ? new Date(linkedDelivery.estimated_arrival).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                        <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{statusLabels[linkedDelivery.status] || linkedDelivery.status}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Project-Exclusive Chat for this Request */}
                            <div className="mt-6 pt-4 border-t border-[#495057]">
                                <p className="text-sm font-medium text-[#f8f9fa] mb-3 flex items-center gap-2">
                                    <MessageCircle size={16} className="text-blue-400" /> Chat di Progetto (Esclusiva)
                                </p>
                                <div className="border border-[#495057] rounded-lg overflow-hidden">
                                     <MiniChat 
                                         channelType="request" 
                                         channelId={isAdmin ? `${showRequestDetailsModal._id}_admin_supplier` : showRequestDetailsModal._id} 
                                         channelName={`Richiesta: ${showRequestDetailsModal.title}`} 
                                         currentUserEmail={email}
                                         contactPhone={isAdmin ? (suppliers.find(s => s._id === showRequestDetailsModal.supplier_id)?.phone) : "0039300000000"} 
                                     />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Chat con Fornitore ═══ */}
            <Dialog open={!!showChatModal} onOpenChange={() => setShowChatModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <MessageCircle size={18} className="text-orange-400" /> Chat con {showChatModal?.name}
                        </DialogTitle>
                    </DialogHeader>
                     {showChatModal && (
                        <MiniChat 
                            channelType="supplier" 
                            channelId={isAdmin ? `${showChatModal._id}_admin_supplier` : `${showChatModal._id}_admin_supplier`} 
                            channelName={showChatModal.name} 
                            currentUserEmail={email} 
                            contactPhone={isAdmin ? showChatModal.phone : "0039300000000"} 
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Chat Ordine Progetto ═══ */}
            <Dialog open={!!showOrderChatModal} onOpenChange={() => setShowOrderChatModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <MessageCircle size={18} className="text-blue-400" /> Chat Ordine #{showOrderChatModal?.order_number || showOrderChatModal?._id?.slice(-6)}
                        </DialogTitle>
                    </DialogHeader>
                     {showOrderChatModal && (
                        <MiniChat 
                            channelType="order" 
                            channelId={isAdmin ? `${showOrderChatModal._id}_admin_supplier` : showOrderChatModal._id} 
                            channelName={`Ordine #${showOrderChatModal.order_number || showOrderChatModal._id.slice(-6)}`} 
                            currentUserEmail={email} 
                            contactPhone={isAdmin ? (suppliers.find(s => s._id === showOrderChatModal.supplier_id)?.phone) : "0039300000000"} 
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: RISPOSTA/PREVENTIVO FORNITORE ═══ */}
            <Dialog open={!!showQuoteModal} onOpenChange={(open) => !open && setShowQuoteModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa]">Invia Preventivo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm text-[#adb5bd]">Prezzo Proposto (€) *</label>
                            <Input
                                type="number"
                                placeholder="es. 1500"
                                value={quoteData.quoted_price}
                                onChange={e => setQuoteData({ ...quoteData, quoted_price: e.target.value })}
                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-[#adb5bd]">Note per IWHome (opzionale)</label>
                            <Textarea
                                placeholder="Dettagli aggiuntivi, tempi di realizzazione, etc."
                                value={quoteData.supplier_notes}
                                onChange={e => setQuoteData({ ...quoteData, supplier_notes: e.target.value })}
                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-[#adb5bd]">Allega Documento da "Documenti" (opzionale)</label>
                            <Select value={quoteData.supplier_quote_doc_id} onValueChange={v => setQuoteData({ ...quoteData, supplier_quote_doc_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                    <SelectValue placeholder="Seleziona un documento..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {myDocuments.map(doc => (
                                        <SelectItem key={doc._id} value={doc._id} className="text-[#f8f9fa]">{doc.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-[#6c757d]">Puoi selezionare un PDF o un'immagine già caricata nella tua area documenti.</p>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setShowQuoteModal(null)} className="text-[#adb5bd] hover:text-white">Annulla</Button>
                            <Button onClick={handleQuoteSubmit} disabled={!quoteData.quoted_price} className="bg-orange-600 hover:bg-orange-700">Invia Preventivo</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Proposta Piano Pagamenti ═══ */}
            <Dialog open={!!showPaymentPlanModal} onOpenChange={() => setShowPaymentPlanModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <CreditCard size={18} className="text-orange-400" /> Proponi Piano Pagamenti
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-xs text-[#adb5bd]">Definisci le rate per l'ordine #{showPaymentPlanModal?.order_number || showPaymentPlanModal?._id?.slice(-6)} per un totale di €{showPaymentPlanModal?.total_amount?.toLocaleString()}</p>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-[10px] h-7 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                onClick={() => {
                                    const total = showPaymentPlanModal?.total_amount || 0;
                                    setPaymentProposal([
                                        { amount: total * 0.5, due_date: '', description: 'Acconto 50%' },
                                        { amount: total * 0.5, due_date: '', description: 'Saldo 50%' }
                                    ]);
                                }}
                            >
                                Dividi 50% - 50%
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-[10px] h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
                                onClick={() => {
                                    const total = showPaymentPlanModal?.total_amount || 0;
                                    setPaymentProposal([
                                        { amount: total * 0.3, due_date: '', description: 'Acconto 30%' },
                                        { amount: total * 0.3, due_date: '', description: 'Acconto intermedio 30%' },
                                        { amount: total * 0.4, due_date: '', description: 'Saldo 40%' }
                                    ]);
                                }}
                            >
                                Dividi 30 - 30 - 40
                            </Button>
                        </div>
                        
                        {paymentProposal.map((item, index) => (
                            <div key={index} className="space-y-2 p-3 bg-[#212529] rounded-lg border border-[#495057]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-orange-400 font-bold uppercase">Rata {index + 1}</span>
                                    {paymentProposal.length > 1 && (
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => {
                                            const newProposal = [...paymentProposal];
                                            newProposal.splice(index, 1);
                                            setPaymentProposal(newProposal);
                                        }}>
                                            <Trash2 size={12} />
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-[#6c757d] block mb-1">Importo (€)</label>
                                        <Input 
                                            type="number" 
                                            value={item.amount} 
                                            onChange={e => {
                                                const newProposal = [...paymentProposal];
                                                newProposal[index].amount = parseFloat(e.target.value) || 0;
                                                setPaymentProposal(newProposal);
                                            }}
                                            className="bg-[#343a40] border-[#495057] text-white text-xs h-8"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#6c757d] block mb-1">Scadenza</label>
                                        <Input 
                                            type="date" 
                                            value={item.due_date} 
                                            onChange={e => {
                                                const newProposal = [...paymentProposal];
                                                newProposal[index].due_date = e.target.value;
                                                setPaymentProposal(newProposal);
                                            }}
                                            className="bg-[#343a40] border-[#495057] text-white text-xs h-8"
                                        />
                                    </div>
                                </div>
                                <Input 
                                    placeholder="Descrizione (es. Acconto, Saldo)" 
                                    value={item.description}
                                    onChange={e => {
                                        const newProposal = [...paymentProposal];
                                        newProposal[index].description = e.target.value;
                                        setPaymentProposal(newProposal);
                                    }}
                                    className="bg-[#343a40] border-[#495057] text-white text-xs h-8 mt-2"
                                />
                            </div>
                        ))}

                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-dashed border-[#495057] text-[#adb5bd] hover:text-white h-8 text-xs" 
                            onClick={() => setPaymentProposal([...paymentProposal, { amount: 0, due_date: '', description: '' }])}
                        >
                            + Aggiungi Rata
                        </Button>

                        <div className="space-y-1">
                            <label className="text-[10px] text-[#6c757d] block">Note (opzionale)</label>
                            <Textarea 
                                placeholder="Aggiungi spiegazioni sulla tua proposta..."
                                value={proposalNotes}
                                onChange={e => setProposalNotes(e.target.value)}
                                className="bg-[#495057] border-[#6c757d] text-white text-xs min-h-[60px]"
                            />
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button variant="ghost" className="flex-1 text-xs" onClick={() => setShowPaymentPlanModal(null)}>Annulla</Button>
                            <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs" onClick={handleProposePaymentPlan}>Invia Proposta</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <UniversalPdfViewer
                isOpen={isPdfOpen}
                onClose={() => setIsPdfOpen(false)}
                url={pdfUrl}
                title={pdfTitle}
            />

            {/* ═══ MODAL: CONTROPROPOSTA ADMIN → FORNITORE ═══ */}
            <Dialog open={!!counterproposalModal} onOpenChange={(open) => !open && setCounterproposalModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRight size={18} className="text-amber-400" /> Controproposta al Fornitore
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {counterproposalModal && (
                            <div className="bg-[#495057]/50 rounded-lg p-3">
                                <p className="text-xs text-[#adb5bd]">Preventivo fornitore:</p>
                                <p className="text-white font-medium">{counterproposalModal.title}</p>
                                <p className="text-orange-400 font-bold">€{counterproposalModal.quoted_price?.toLocaleString('it-IT')}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm text-[#adb5bd]">Prezzo Proposto (€) *</label>
                            <Input
                                type="number"
                                placeholder="Inserisci il nuovo prezzo..."
                                value={counterproposalPrice}
                                onChange={e => setCounterproposalPrice(e.target.value)}
                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-[#adb5bd]">Note (opzionale)</label>
                            <Textarea
                                placeholder="Motivazione della controproposta..."
                                value={counterproposalNotes}
                                onChange={e => setCounterproposalNotes(e.target.value)}
                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] min-h-[80px]"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setCounterproposalModal(null)} className="text-[#adb5bd]" disabled={isSubmittingCounter}>Annulla</Button>
                            <Button
                                onClick={handleSendCounterproposal}
                                disabled={!counterproposalPrice || isSubmittingCounter}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                {isSubmittingCounter ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Send size={14} className="mr-1" />}
                                Invia Controproposta
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: FORNITORE RISPONDE ALLA CONTROPROPOSTA ═══ */}
            <Dialog open={!!counterResponseModal} onOpenChange={(open) => !open && setCounterResponseModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {counterResponseModal?._acceptMode
                                ? <><CheckCircle size={18} className="text-green-400" /> Accetta Controproposta</>
                                : <><XCircle size={18} className="text-red-400" /> Rifiuta Controproposta</>
                            }
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {counterResponseModal && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                <p className="text-xs text-amber-400 uppercase mb-1">Controproposta IWHome</p>
                                <p className="text-xl font-bold text-white">€{counterResponseModal.counterproposal_price?.toLocaleString('it-IT')}</p>
                                {counterResponseModal.counterproposal_notes && (
                                    <p className="text-xs text-[#adb5bd] mt-1 italic">"{counterResponseModal.counterproposal_notes}"</p>
                                )}
                            </div>
                        )}
                        {!counterResponseModal?._acceptMode && (
                            <div className="space-y-2">
                                <label className="text-sm text-[#adb5bd]">Motivo del rifiuto (opzionale)</label>
                                <Textarea
                                    placeholder="Spiega perché non puoi accettare questo prezzo..."
                                    value={counterRejectionNotes}
                                    onChange={e => setCounterRejectionNotes(e.target.value)}
                                    className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] min-h-[80px]"
                                />
                            </div>
                        )}
                        {counterResponseModal?._acceptMode && (
                            <p className="text-sm text-[#adb5bd]">
                                Accettando la controproposta, il tuo preventivo sarà aggiornato al prezzo proposto da IWHome e la richiesta passerà in stato "Preventivato".
                            </p>
                        )}
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setCounterResponseModal(null)} className="text-[#adb5bd]" disabled={isRespondingCounter}>Annulla</Button>
                            <Button
                                onClick={() => handleRespondCounterproposal(counterResponseModal?._acceptMode)}
                                disabled={isRespondingCounter}
                                className={counterResponseModal?._acceptMode ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                            >
                                {isRespondingCounter ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                                {counterResponseModal?._acceptMode ? 'Conferma Accettazione' : 'Conferma Rifiuto'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
