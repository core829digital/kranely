/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { validateFiles } from '../lib/security';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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




// â”€â”€â”€ Status Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    archived: 'bg-red-500/20 text-red-400 border-red-500/30',
    partito: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_transito: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30',
    consegnato: 'bg-green-500/20 text-green-400 border-green-500/30',
    confirmed: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30',
    in_production: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ready: 'bg-green-500/20 text-green-400 border-green-500/30',
    shipped: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30',
    delivered: 'bg-white/10 text-white/70 border-white/20',
    sent: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30',
    received: 'bg-white/10 text-white/60 border-white/20',
    quoted: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    preventivato: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    counterproposal_sent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    in_lavorazione: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const statusLabels = {
    active: 'Active', inactive: 'Inactive', archived: 'Archived',
    partito: 'Dispatched', in_transito: 'In Transit', consegnato: 'Delivered',
    confirmed: 'Confirmed', in_production: 'In Production', ready: 'Ready',
    shipped: 'Shipped', delivered: 'Delivered', sent: 'Sent',
    received: 'Received', quoted: 'Quoted', accepted: 'Accepted',
    rejected: 'Rejected', draft: 'Draft', pending: 'Pending',
    in_progress: 'In Progress', completed: 'Completed',
    preventivato: 'Quoted', counterproposal_sent: 'Counter-proposal',
    in_lavorazione: 'In Production',
};

const invitationStatusLabels = {
    pending: 'Invite Sent', accepted: 'Accepted', expired: 'Expired',
};

// â”€â”€â”€ File Link Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FileLink({ storageId, isImage }) {
    const isUrl = typeof storageId === 'string' && storageId.startsWith('http');
    const url = useQuery(api.files.getFileUrl, isUrl ? "skip" : { storageId });
    const finalUrl = isUrl ? storageId : url;

    if (!finalUrl && !isUrl) {
        if (url === null) return <span className="text-xs text-red-500">Error loading file</span>;
        return <span className="text-xs text-[#F0EBE8]/60 animate-pulse">Loading...</span>;
    }

    // Detect if actually an image to be safe (e.g. if a PDF was put in "photos")
    const lowerUrl = finalUrl.toLowerCase();
    const isActuallyImage = isImage || lowerUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)/);

    if (isActuallyImage) {
        return <a href={finalUrl} target="_blank" rel="noreferrer"><img src={finalUrl} className="w-16 h-16 object-cover rounded-md border border-white/10 hover:border-[#FFC703]/50 transition-colors" alt="Attachment" /></a>;
    }
    return <a href={finalUrl} target="_blank" rel="noreferrer" className="text-[#FFC703] hover:text-[#FFC703] hover:underline text-xs flex items-center gap-1 bg-[#FFC703]/20 px-2 py-1 rounded-md w-max"><FileText size={12} /> Open Document</a>;
}

// â”€â”€â”€ Mini Chat Component (Task 6: Enhanced with files, read, search) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        ...supplierRequests.map(r => ({ id: r._id, type: 'Request', label: r.title, description: r.material || r.fixture_type })),
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
                        placeholder={t('messages.search')}
                        className="bg-[#535252] border-white/10 text-white text-xs h-7"
                    />
                    {searchKeyword.length >= 2 && <p className="text-[9px] text-white/25 mt-0.5">{searchResults.length} results</p>}
                </div>
            )}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3 bg-[#141210] rounded-lg">
                {displayMessages.length === 0 && (
                    <p className="text-xs text-white/25 text-center py-8">
                        {showSearch ? 'No results' : 'No messages. Write to communicate with this contact.'}
                    </p>
                )}
                {displayMessages.map(msg => {
                    const isSystem = msg.sender_role === 'system';
                    const isMine = !isSystem && msg.sender_email === currentUserEmail;
                    return (
                        <div key={msg._id} className={`flex ${isSystem ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${isSystem ? 'bg-[#1C1A18] text-white/25 italic' :
                                isMine ? 'bg-orange-600/20 text-white border border-orange-500/20' : 'bg-[#535252]/ text-white border border-white/10/30'
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
                                                <p className="text-[10px] text-white/25 mt-0.5">{msg.file_name}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <p>{msg.message}</p>
                                <p className="text-[9px] text-white/25" title="Unread">✓</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSearch(!showSearch)} className={`h-8 w-8 p-0 ${showSearch ? 'text-orange-400' : 'text-white/25'}`} title="Search">
                    <Search size={14} />
                </Button>
                {/* Hidden file input */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 p-0 text-white/25 hover:text-orange-400" title="Allega file" disabled={isUploading}>
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                </Button>
                {contactPhone && (
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `tel:${contactPhone}`} className="h-8 w-8 p-0 text-white/25 hover:text-green-400" title="Chiama">
                        <Phone size={14} />
                    </Button>
                )}
                <div className="flex-1 relative">
                    {/* Mention Autocomplete Popup */}
                    {showMentions && filteredMentions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-white/5 border border-white/10 rounded-lg shadow-xl z-10 flex flex-col pointer-events-auto">
                            {filteredMentions.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleMentionSelect(m)}
                                    className="text-left px-3 py-2 text-[10px] hover:bg-[#535252] border-b border-white/10 last:border-0 transition-colors"
                                >
                                    <span className="text-orange-400 font-medium block">@{m.label}</span>
                                    <span className="text-white/40 block truncate">{m.type} {m.description ? `"¢ ${m.description}` : ''}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <Input
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="Type or use @ to mention orders/requests..."
                        className="bg-[#535252] border-white/10 text-white text-xs h-8 w-full placeholder:text-white/40"
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={isUploading}
                    />
                </div>
                <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="font-bold text-[#1C1A18] h-8" style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)' }}>
                    <Send size={14} />
                </Button>
            </div>
        </div>
    );
}

export default function Suppliers() {
    const { t } = useTranslation();
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

    // Ensure 'anagrafica' is not selected for suppliers "” redirect to 'richieste' so they see requests immediately
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

    // Controproposta (Admin â†’ Supplier counter-price)
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

    // Workflow advance "” quote PDF input per ordine (step 3)
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

    // Diagnostics "” visible only to suppliers; shows linking/data status for debugging
    const diagnostics = useQuery(api.suppliers.getMyDiagnostics, isSupplier ? {} : "skip");

    // Data queries (filtered for supplier self-view)
    const suppliers = useQuery(api.suppliers.list) || [];
    const requests = useQuery(api.suppliers.listRequests, isSupplier && supplierId ? { supplier_id: supplierId } : {}) || [];
    const orders = useQuery(api.suppliers.listOrders, isSupplier && supplierId ? { supplier_id: supplierId } : {}) || [];
    const deliveries = useQuery(api.suppliers.listDeliveries, isSupplier && supplierId ? { supplier_id: supplierId } : {}) || [];
    const allCertificates = useQuery(api.certificates.list, {}) || [];
    const allProjects = useQuery(api.cantieri.listCantieri, { company_email: 'contact.core829@gmail.com' }) || [];
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
        const notes = window.prompt('Reason for rejection (optional):') ?? undefined;
        try {
            await rejectSupplierQuote({
                request_id: request._id,
                notes: notes || undefined,
            });
            setShowRequestDetailsModal(null);
        } catch (err) {
            console.error(err);
            alert('Error rejecting supplier quote.');
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
            const cantiere = allProjects.find(c => c._id === order?.cantiere_id);
            const client = allClients.find(c => c._id === request?.client_id || c._id === cantiere?.client_id);

            const clientName = client?.full_name || "Client Sconosciuto";
            const cantiereName = cantiere?.nome_cantiere || "Unknown Project";
            const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            
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
            alert("Proposta sent correttamente all'amministrazione.");
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
            <div className="min-h-screen relative overflow-hidden" style={{ background: '#1C1A18' }}>
                <div className="pt-0 relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="text-4xl mb-4">ðŸ”’</div>
                        <h2 className="text-xl text-[#F0EBE8] mb-2">{t('access.denied')}</h2>
                        <p className="text-[#F0EBE8]/40 text-sm">{t('access.no_permission')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // â”€â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        if (!window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) return;
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
            const whatsappMsg = encodeURIComponent(`Welcome to Kranely! Access with this link to set up your account:\n${whatsappUrl}\n\nTemporary password: ${password}\nSupplier Code (if needed): ${response.supplier_code}`);
            navigator.clipboard.writeText(whatsappUrl).catch(() => { });
            window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank');
            alert('Link WhatsApp generato e copiato! Si apre WhatsApp per inviarlo.');
        } catch (err) { console.error(err); alert(err.message || 'Errore generazione link'); }
    };

    const handleLinkSupplierAccount = async (supplierId) => {
        const email = prompt('Email dell\'account Convex del fornitore (deve essere giÃ  registrato):');
        if (!email?.trim()) return;
        try {
            await adminLinkSupplierUser({ supplier_id: supplierId, user_email: email.trim().toLowerCase() });
            alert('Account linked! The supplier now has the "Supplier" role and can access their area.');
        } catch (err) { alert(err.message || 'Errore collegamento account'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deletere questo fornitore? All i dati correlati verranno persi.')) return;
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
            alert("No payment record found for this order.");
            return;
        }

        if (!window.confirm("Do you confirm you have correctly received the payment from Kranely? The order will automatically move to the Production phase.")) return;

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
        { key: 'richieste', label: 'Requests', icon: FileText },
        { key: 'ordini', label: 'Orders', icon: Package },
        { key: 'produzione', label: 'Production', icon: Factory },
        { key: 'consegne', label: 'Deliveries', icon: MapPin },
        { key: 'comunicazioni', label: 'Chat', icon: MessageCircle },
        { key: 'calendario', label: 'Calendar', icon: Calendar }] : [
        { key: 'anagrafica', label: 'Profile', icon: Building2 },
        { key: 'richieste', label: 'Requests', icon: FileText },
        { key: 'ordini', label: 'Orders', icon: Package },
        { key: 'produzione', label: 'Production', icon: Factory },
        { key: 'consegne', label: 'Deliveries', icon: MapPin },
        { key: 'comunicazioni', label: 'Chat', icon: MessageCircle },
        { key: 'calendario', label: 'Calendar', icon: Calendar }];

    return (
        <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">


            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header "” Command Center feel */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-light text-white mb-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                                    <Truck size={20} className="text-white" />
                                </div>
                                Centro Controllo Suppliers
                            </h1>
                            <p className="text-white/40 text-sm">Full management: profile, requests, orders, production, deliveries and communications</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {isAdmin && (
                                <>
                                    <Button onClick={() => setShowNewSupplierModal(true)} className="bg-orange-600 hover:bg-orange-700 text-sm">
                                        <Plus size={14} className="mr-1" /> New Supplier
                                    </Button>
                                    <Button onClick={() => setShowNewRequestModal(true)} className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold text-sm">
                                        <Send size={14} className="mr-1" /> New Request
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
                                    <MapPin size={14} className="mr-1" /> Ship Order
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats Row "” Hidden for suppliers to avoid info overload (they have Dashboard KPIs) */}
                    {!isSupplier && (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                            {[
                                { label: 'Active Orders', count: orders.filter(o => o.status === 'confirmed' || o.status === 'in_production').length, color: 'from-[#FFC703]/80 to-[#FFC703]/80', icon: Package },
                                { label: 'Requests', count: requests.filter(r => r.status === 'sent' || r.status === 'received').length, color: 'from-[#FFC703]/80 to-[#FFC703]/80', icon: FileText },
                                { label: 'In Delivery', count: deliveries.filter(d => d.status !== 'consegnato').length, color: 'from-yellow-600/80 to-yellow-700/80', icon: MapPin },
                                { label: 'Pending Payments', count: allPayments.filter(p => p.status === 'in_attesa' || p.status === 'in_ritardo').length, color: 'from-[#FFC703]/20 to-[#FFC703]/10', icon: CreditCard },
                                { label: 'Delivered', count: deliveries.filter(d => d.status === 'consegnato').length, color: 'from-emerald-600/80 to-emerald-700/80', icon: CheckCircle }].map((stat) => (
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
                    <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 mb-5">
                        <CardContent className="p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                <Input placeholder={isSupplier ? "Search orders, deliveries, tracking..." : "Search suppliers, orders, deliveries..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-[#535252] border-white/10 text-white placeholder:text-white/40 text-sm" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-white/5 border border-white/10 w-full flex overflow-x-auto no-scrollbar mb-5 justify-start lg:grid lg:grid-cols-none lg:auto-cols-fr lg:grid-flow-col">
                            {tabConfig.map(tab => (
                                <TabsTrigger key={tab.key} value={tab.key} className="flex-1 min-w-[max-content] px-4 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-white/40 text-xs gap-1">
                                    <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* â•â•â• TAB: ANAGRAFICA (Hidden for Suppliers) â•â•â• */}
                        {!isSupplier && (
                            <TabsContent value="anagrafica">
                                <div className="space-y-3">
                                    {filtered(suppliers).length === 0 ? (
                                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8">
                                            <Truck size={48} className="text-white/25 mx-auto mb-4" />
                                            <h3 className="text-xl text-white/70">No suppliers registered</h3>
                                            <p className="text-white/40 mt-2">Add your first supplier to get started.</p>
                                        </div>
                                    ) : filtered(suppliers).map(supplier => (
                                        <motion.div key={supplier._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <Card className="bg-white/5 border border-white/10 hover:border-orange-500/40 transition-all duration-300">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* Left: Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 flex items-center justify-center border border-orange-500/20">
                                                                    <Building2 size={18} className="text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-medium text-white">{supplier.name}</h3>
                                                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                                                        <span className="flex items-center gap-1"><Mail size={11} /> {supplier.email}</span>
                                                                        {supplier.phone && <span className="flex items-center gap-1"><Phone size={11} /> {supplier.phone}</span>}
                                                                        {supplier.piva && <span className="flex items-center gap-1"><Hash size={11} /> {supplier.piva}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Tags row */}
                                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                <Badge variant="default" className={statusColors[supplier.status] || 'bg-gray-500/20 text-gray-400'}>{statusLabels[supplier.status]}</Badge>
                                                                <Badge variant="default" className="bg-[#535252] text-white/40 text-xs">{supplier.type === 'subprod' ? 'Infissi' : 'Edilizia'}</Badge>
                                                                {supplier.contact_person && <Badge variant="default" className="bg-[#FFC703]/20 text-[#FFC703] text-xs"><User size={10} className="mr-1" />{supplier.contact_person}</Badge>}
                                                                {supplier.invitation_status && (
                                                                    <Badge variant="default" className={`text-xs ${supplier.invitation_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                                                        supplier.invitation_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                        {invitationStatusLabels[supplier.invitation_status] || supplier.invitation_status}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {supplier.notes && <p className="text-xs text-white/25 mt-2 line-clamp-1">{supplier.notes}</p>}
                                                            {/* Task 7: Supplier Code */}
                                                            {supplier.supplier_code && (
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Badge variant="default" className="bg-[#FFC703]/20 text-[#FFC703] text-xs font-mono">
                                                                        <Hash size={10} className="mr-1" />{supplier.supplier_code}
                                                                    </Badge>
                                                                    <button onClick={() => { navigator.clipboard.writeText(supplier.supplier_code); }} className="text-[10px] text-white/25 hover:text-[#FFC703]"><Copy size={10} /></button>
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
                                                                                <CreditCard size={10} /> {pendingPayments.length} pagamenti (â‚¬{pendingTotal.toLocaleString()})
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
                                                            <Button variant="ghost" size="sm" onClick={() => setShowChatModal(supplier)} className="text-[#FFC703] hover:bg-[#FFC703]/20 h-8 w-8 p-0">
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
                                                                <Button variant="ghost" size="sm" onClick={() => handleLinkSupplierAccount(supplier._id)} className="text-purple-400 hover:bg-purple-500/20 h-8 w-8 p-0" title="Collega Account Supplier">
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

                        {/* â•â•â• TAB: RICHIESTE â•â•â• */}
                        <TabsContent value="richieste">
                            <div className="space-y-3">
                            {/* Diagnostics panel "” shown to supplier when requests list is empty */}
                            {isSupplier && diagnostics && filtered(requests).length === 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm space-y-2">
                                    <p className="text-yellow-300 font-semibold">Supplier account diagnostics</p>
                                    <p className="text-yellow-200/80">Email account: <span className="font-mono">{diagnostics.email}</span></p>
                                    <p className="text-yellow-200/80">Ruolo (backend): <span className={`font-mono ${diagnostics.role === 'supplier' ? 'text-green-300' : 'text-red-300'}`}>{diagnostics.role}</span>{diagnostics.role !== 'supplier' && ' â† problema rilevato'}</p>
                                    <p className="text-yellow-200/80">Record fornitore: {diagnostics.supplier ? <span className="text-green-300">âœ“ trovato "” {diagnostics.supplier.name} ({diagnostics.supplier.email})</span> : <span className="text-red-300">âœ— non trovato</span>}</p>
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
                                        <p className="text-orange-300 text-xs">Admin must click "Send to Supplier" in Quotes per creare una richiesta.</p>
                                    )}
                                </div>
                            )}
                            {filtered(requests).length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8"><Send size={48} className="text-white/25 mx-auto mb-4" /><h3 className="text-xl text-white/70">No requests</h3><p className="text-white/40 mt-2">No requests found.</p></div>
                            ) : filtered(requests).map(req => {
                                const supplier = suppliers.find(s => s._id === req.supplier_id);
                                return (
                                    <motion.div key={req._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-white/5 border border-white/10 hover:border-white/10 transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white">{req.title}</h3>
                                                        <p className="text-sm text-white/40">{supplier?.name || 'Supplier'} "¢ {req.fixture_type || req.fixture_category || 'Generico'}</p>
                                                        {req.description && <p className="text-sm text-white/25 mt-1 line-clamp-2">{req.description}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {req.preliminary_quote && !req.quoted_price && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] text-orange-400 font-bold uppercase">Preliminare</span>
                                                                <span className="text-white font-medium">â‚¬{req.preliminary_quote?.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        {req.quoted_price && <span className="text-white font-medium">â‚¬{req.quoted_price?.toLocaleString()}</span>}
                                                        <Badge variant="default" className={statusColors[req.status] || 'bg-gray-500/20 text-gray-400'}>{statusLabels[req.status] || req.status}</Badge>

                                                        <Button size="sm" onClick={() => setShowRequestDetailsModal(req)} className="bg-[#535252] hover:bg-[#535252] text-white ml-2 h-8 text-xs">
                                                            Details
                                                        </Button>

                                                        {isSupplier && (req.status === 'sent' || req.status === 'received') && (
                                                            <Button size="sm" onClick={() => setShowQuoteModal(req)} className="bg-orange-600 hover:bg-orange-700 ml-2 h-8 text-xs">
                                                                Rispondi / Preventiva
                                                            </Button>
                                                        )}

                                                        {isAdmin && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(req._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 ml-2">
                                                                <Trash2 size={14} className="mr-1" /> Delete
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

                        {/* â•â•â• TAB: ORDINI (Task 11 cross-nav + Task 12 workflow) â•â•â• */}
                        <TabsContent value="ordini">
                            <div className="space-y-3">{filtered(orders).length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8"><Package size={48} className="text-white/25 mx-auto mb-4" /><h3 className="text-xl text-white/70">No orders</h3></div>
                            ) : filtered(orders).map(order => {
                                const supplier = suppliers.find(s => s._id === order.supplier_id);
                                const linkedRequest = requests.find(r => r._id === order.request_id);
                                const linkedDelivery = deliveries.find(d => d.order_id === order._id);
                                const workflowSteps = [
                                    'Request', 'To Supplier', 'Quote', 'Admin Review',
                                    'Sent to Client', 'Client Reply', 'Deal Closed', 'Awaiting Client Payment', 'Kranely Payment', 'In Production'
                                ];
                                return (
                                    <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className={`bg-[#1C1A18] border ${order.locked ? 'border-red-500/40' : 'border-white/10'} hover:border-white/10 transition-all`}>
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-medium text-white">Ordine #{order.order_number || order._id.slice(-6)}</h3>
                                                            {order.locked && <Badge variant="default" className="bg-red-500/20 text-red-400 text-[10px]"><Lock size={10} className="mr-1" />BLOCCATO</Badge>}
                                                        </div>
                                                        <p className="text-sm text-white/40">{supplier?.name || 'Supplier'}</p>
                                                        {order.delivery_date && <p className="text-xs text-white/25 mt-1 flex items-center gap-1"><Calendar size={12} /> Consegna: {new Date(order.delivery_date).toLocaleDateString('en-GB')}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {order.total_amount && <span className="text-white font-medium text-lg">â‚¬{order.total_amount?.toLocaleString()}</span>}
                                                        <Badge variant="default" className={order.workflow_step ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : (statusColors[order.status] || 'bg-gray-500/20 text-gray-400')}>
                                                            {order.workflow_step ? workflowSteps[order.workflow_step - 1] : (statusLabels[order.status] || order.status)}
                                                        </Badge>
                                                        {isAdmin && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteOrder(order._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 ml-2">
                                                                <Trash2 size={14} className="mr-1" /> Delete
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" size="sm" onClick={() => setShowOrderChatModal(order)} className="border-[#FFC703]/30 text-[#FFC703] hover:bg-[#FFC703]/20 px-2 h-8 ml-2">
                                                            <MessageCircle size={14} className="mr-1" /> Chat Progetto
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Task 12: Workflow Stepper */}
                                                {order.workflow_step && order.workflow_step > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-white/10">
                                                        <p className="text-[10px] text-white/25 mb-2 font-medium">WORKFLOW "” Step {order.workflow_step}/10</p>
                                                        <div className="flex items-center gap-0.5">
                                                            {workflowSteps.map((step, i) => {
                                                                const stepNum = i + 1;
                                                                const isCompleted = stepNum < (order.workflow_step || 0);
                                                                const isCurrent = stepNum === (order.workflow_step || 0);
                                                                return (
                                                                    <React.Fragment key={step}>
                                                                        {i > 0 && <div className={`flex-shrink-0 w-2 h-0.5 ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-orange-500' : 'bg-[#535252]'}`} />}
                                                                        <div className={`flex-1 text-center py-1 rounded text-[7px] font-medium leading-[1.1] ${isCompleted ? 'bg-green-500/20 text-green-400' : isCurrent ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-[#535252]/ text-white/25'}`} title={step}>
                                                                            {step.replace('Payment ', 'P. ')}
                                                                        </div>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Workflow Advance Buttons "” RBAC gated per step */}
                                                        {order.locked ? (
                                                            <div className="mt-3 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                                <Lock size={12} className="text-red-400" />
                                                                <p className="text-xs text-red-400">Impossibile modificare: la produzione è giÃ  iniziata.</p>
                                                            </div>
                                                        ) : (() => {
                                                            const step = order.workflow_step || 0;
                                                            // Step 2: Admin invia al fornitore
                                                            if (step === 1 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 2)}>
                                                                        Send to Supplier â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 3: Supplier carica preventivo PDF
                                                            if (step === 2 && isSupplier) return (
                                                                <div className="mt-3 space-y-2">
                                                                    <p className="text-[10px] text-amber-400">Carica il preventivo per procedere (URL PDF o link Drive):</p>
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="URL preventivo PDF..."
                                                                            value={quotePdfInputs[order._id] || ''}
                                                                            onChange={e => setQuotePdfInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                                                                            className="flex-1 bg-[#141210] border border-white/10 text-white text-xs rounded px-2 py-1"
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            disabled={!quotePdfInputs[order._id]}
                                                                            className="bg-[#FFC703] hover:bg-[#e6b300] text-[#1C1A18] text-xs h-7"
                                                                            onClick={() => handleAdvanceWorkflow(order._id, 3, { quote_pdf_url: quotePdfInputs[order._id] })}
                                                                        >
                                                                            Send Quote â†’
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                            // Step 4: Admin valuta preventivo
                                                            if (step === 3 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 4)}>
                                                                        Review Quote â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 5: Admin invia al cliente
                                                            if (step === 4 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 5)}>
                                                                        Send to Client â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 6: Risposta cliente (admin registra)
                                                            if (step === 5 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-cyan-600 hover:bg-[#FFC703]/80yan-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 6)}>
                                                                        Record Client Response â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 7: Deal chiuso (admin)
                                                            if (step === 6 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 7)}>
                                                                        Chiudi Deal â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 8: Supplier conferma ordine (supplier)
                                                            if (step === 7 && isSupplier) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 8)}>
                                                                        Confirm Ordine â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 9: Admin registra pagamento al fornitore
                                                            if (step === 8 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 9)}>
                                                                        Payment Sent to Supplier â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            // Step 10: Admin avvia produzione
                                                            if (step === 9 && isAdmin) return (
                                                                <div className="mt-3 flex justify-end">
                                                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs h-7" onClick={() => handleAdvanceWorkflow(order._id, 10)}>
                                                                        Avvia Produzione â†’
                                                                    </Button>
                                                                </div>
                                                            );
                                                            return null;
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Task 11: Circular cross-navigation links */}
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 flex-wrap">
                                                    {linkedRequest && (
                                                        <button onClick={() => setActiveTab('richieste')} className="flex items-center gap-1 text-[10px] bg-[#FFC703]/20 text-[#FFC703] px-2 py-1 rounded-md hover:bg-[#FFC703]/20 transition-all">
                                                            <FileText size={10} /> Request: {linkedRequest.title?.substring(0, 20)}
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
                                                            <button onClick={() => navigate('/Pagamenti')} className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-[#FFC703]/60 px-2 py-1 rounded-md hover:bg-[#FFC703]/10 transition-all">
                                                                <CreditCard size={10} /> Payment: {linkedPayment.status === 'pagato' ? 'Paid' : linkedPayment.status === 'in_ritardo' ? 'Overdue' : 'Pending'} (â‚¬{linkedPayment.amount?.toLocaleString()})
                                                            </button>
                                                        ) : null;
                                                    })()}
                                                    {/* Acconto gate indicator */}
                                                    {order.acconto_paid && (
                                                        <Badge variant="default" className="bg-green-500/20 text-green-400 text-[10px]">
                                                            <Unlock size={10} className="mr-1" />Acconto Confirmed
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
                                                                            className="border-[#FFC703]/30 text-[#FFC703] hover:bg-[#FFC703]/20 text-[10px] h-7 px-2"
                                                                            onClick={() => {
                                                                                setPdfUrl(payment.proof_url);
                                                                                setPdfTitle(`Prova Payment Kranely - Ordine #${order.order_number || order._id.slice(-6)}`);
                                                                                setIsPdfOpen(true);
                                                                            }}
                                                                        >
                                                                            <Eye size={12} className="mr-1" /> Vedi Payment
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
                                                                <CheckCircle size={12} className="mr-1" /> Confirm Ricezione
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
                                                                Plan: {order.payment_proposal_status === 'accepted' ? 'Approved' : 'Pending'}
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

                        {/* â•â•â• TAB: PRODUZIONE â•â•â• */}
                        <TabsContent value="produzione">
                            <div className="space-y-3">{orders.filter(o => o.status === 'in_production' || o.status === 'confirmed').length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8"><Factory size={48} className="text-white/25 mx-auto mb-4" /><h3 className="text-xl text-white/70">No orders in production</h3></div>
                            ) : orders.filter(o => o.status === 'in_production' || o.status === 'confirmed').map(order => {
                                const supplier = suppliers.find(s => s._id === order.supplier_id);
                                const productionPhases = ['Materiali', 'Taglio', 'Assemblaggio', 'Controllo QualitÃ ', 'Pronto'];
                                const currentPhase = order.production_phase || 0;
                                return (
                                    <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-white/5 border border-white/10">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white">Ordine #{order.order_number || order._id.slice(-6)}</h3>
                                                        <p className="text-sm text-white/40">{supplier?.name}</p>
                                                    </div>
                                                    <Badge variant="default" className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                                                </div>
                                                {/* Phase Progress */}
                                                <div className="flex items-center gap-1 mt-3">
                                                    {productionPhases.map((phase, i) => (
                                                        <div key={phase} className="flex-1">
                                                            <div className={`h-2.5 rounded-full transition-all duration-500 ${
                                                                i < currentPhase ? 'bg-green-500' :
                                                                i === currentPhase ? 'bg-yellow-500 animate-pulse' : 'bg-[#535252]'
                                                            }`} />
                                                            <p className={`text-[9px] mt-1 text-center ${
                                                                i < currentPhase ? 'text-green-400 font-medium' :
                                                                i === currentPhase ? 'text-yellow-400 font-medium' : 'text-white/25'
                                                            }`}>{phase}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Supplier-only: Advance Phase Button */}
                                                {isSupplier && currentPhase < productionPhases.length && (
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <p className="text-xs text-white/40">
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
                                                    <p className="text-[10px] text-white/25 mt-3 flex items-center gap-1">
                                                        <Eye size={12} /> Solo il fornitore può modificare le fasi di produzione
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* â•â•â• TAB: CONSEGNE (with driver info) â•â•â• */}
                        <TabsContent value="consegne">
                            <div className="space-y-3">{filtered(deliveries).length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8"><MapPin size={48} className="text-white/25 mx-auto mb-4" /><h3 className="text-xl text-white/70">No consegna</h3></div>
                            ) : filtered(deliveries).map(delivery => {
                                const supplier = suppliers.find(s => s._id === delivery.supplier_id);
                                return (
                                    <motion.div key={delivery._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-white/5 border border-white/10 hover:border-white/10 transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-medium text-white">{supplier?.name || 'Supplier'}</h3>
                                                        {delivery.tracking_number && <p className="text-sm text-white/40">Tracking: {delivery.tracking_number}</p>}
                                                        {delivery.estimated_arrival && <p className="text-xs text-white/25">Arrivo stimato: {new Date(delivery.estimated_arrival).toLocaleDateString('en-GB')}</p>}

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
                                                            <div className="mt-3 bg-[#141210] rounded-lg p-3 border border-white/10">
                                                                <p className="text-xs text-orange-400 font-medium mb-1 flex items-center gap-1"><Truck size={12} /> Autista</p>
                                                                <div className="flex items-center gap-4">
                                                                    {delivery.driver_name && <span className="text-sm text-white flex items-center gap-1"><User size={12} className="text-white/25" /> {delivery.driver_name}</span>}
                                                                    {delivery.driver_phone && (
                                                                        <a href={`tel:${delivery.driver_phone}`} className="text-sm text-green-400 flex items-center gap-1 hover:underline">
                                                                            <PhoneCall size={12} /> {delivery.driver_phone}
                                                                        </a>
                                                                    )}
                                                                    {delivery.driver_vehicle && <span className="text-xs text-white/40">{delivery.driver_vehicle}</span>}
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
                                                                const colors = ['bg-yellow-500', 'bg-[#FFC703]/20', 'bg-green-500'];
                                                                return (
                                                                    <React.Fragment key={state.key}>
                                                                        {i > 0 && <div className={`w-4 h-0.5 ${isPast ? colors[i] : 'bg-[#535252]'}`} />}
                                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isPast ? `${colors[i]}/30 text-white border border-white/20` : 'bg-[#535252] text-white/25'}`}>
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
                                                                    <CheckCircle size={12} className="mr-1" /> Confirm
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button size="sm" onClick={() => handleDeleteDelivery(delivery._id)} className="bg-red-600/80 hover:bg-red-700 text-xs h-7 ml-1">
                                                                    <Trash2 size={12} className="mr-1" /> Delete
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

                        {/* â•â•â• TAB: COMUNICAZIONI â•â•â• */}
                        <TabsContent value="comunicazioni">
                            {isSupplier ? (
                                <Card className="bg-white/5 border border-white/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-white flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[#FFC703]/20 flex items-center justify-center"><Building2 size={14} className="text-[#FFC703]" /></div>
                                                Kranely (Amministrazione)
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {/* Il fornitore chatta usando il proprio ID come channelId, per comunicare con admin (che ascolta sullo stesso canale) */}
                                        {supplierId ? <MiniChat channelType="supplier" channelId={supplierId} channelName="Kranely" currentUserEmail={email} contactPhone={""} /> : <p className="text-white/40 text-sm py-4">Loading chat...</p>}
                                    </CardContent>
                                </Card>
                            ) : suppliers.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8">
                                    <MessageCircle size={48} className="text-white/25 mx-auto mb-4" />
                                    <h3 className="text-xl text-white/70">No suppliers</h3>
                                    <p className="text-white/40 mt-2">Add suppliers to communicate with them.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {suppliers.map(supplier => (
                                        <Card key={supplier._id} className="bg-white/5 border border-white/10">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm text-white flex items-center justify-between">
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

                        {/* â•â•â• TAB: CALENDARIO (Task 13) â•â•â• */}
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
                                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                                <Calendar size={18} className="text-orange-400" /> Calendario Consegne
                                            </h3>
                                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                                                {[{ key: 'weekly', label: '1 Sett.' }, { key: 'biweekly', label: '2 Sett.' }, { key: 'monthly', label: 'Mensile' }].map(v => (
                                                    <button
                                                        key={v.key}
                                                        onClick={() => setCalendarView(v.key)}
                                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                            calendarView === v.key ? 'bg-orange-600 text-white' : 'text-white/40 hover:text-white'
                                                        }`}
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/40">
                                            {weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })} "” {calDays[calDays.length - 1].toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
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
                                                    <div key={dayStr} className={`rounded-lg border p-1.5 ${calendarView === 'monthly' ? 'min-h-[80px]' : 'min-h-[120px]'} ${isToday ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[#1C1A18]/'}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`text-[10px] font-medium ${isToday ? 'text-orange-400' : 'text-white/40'}`}>
                                                                {dayNames[i % 7]}
                                                            </span>
                                                            <span className={`text-xs ${isToday ? 'text-orange-400 font-bold' : 'text-white/25'}`}>
                                                                {day.getDate()}
                                                            </span>
                                                        </div>
                                                        {dayDeliveries.length === 0 ? (
                                                            <p className="text-[8px] text-[#535252] text-center mt-2">"”</p>
                                                        ) : dayDeliveries.map(d => {
                                                            const supplier = suppliers.find(s => s._id === d.supplier_id);
                                                            const hasConfirmed = !!d.confirmed_arrival;
                                                            return (
                                                                <div key={d._id} className={`text-[9px] rounded px-1.5 py-0.5 mb-0.5 ${d.status === 'consegnato' ? 'bg-green-500/20 text-green-400' : hasConfirmed ? 'bg-[#FFC703]/20 text-[#FFC703]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                    <p className="font-medium truncate">{supplier?.name?.substring(0, calendarView === 'monthly' ? 6 : 10)}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Date Progression Legend */}
                                        <Card className="bg-white/5 border border-white/8">
                                            <CardContent className="p-3">
                                                <p className="text-[10px] text-white/25 font-medium mb-2">PROGRESSIONE DATE</p>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                                        <span className="text-[10px] text-white/40">Stimata</span>
                                                    </div>
                                                    <ArrowRight size={10} className="text-white/25" />
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-[#FFC703]/20" />
                                                        <span className="text-[10px] text-white/40">Confirmta</span>
                                                    </div>
                                                    <ArrowRight size={10} className="text-white/25" />
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-green-400" />
                                                        <span className="text-[10px] text-white/40">Client</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Upcoming deliveries list */}
                                        <div className="space-y-2">
                                            <p className="text-xs text-white/25 font-medium">PROSSIME CONSEGNE</p>
                                            {deliveries.filter(d => d.status !== 'consegnato').sort((a, b) => {
                                                const aDate = a.confirmed_arrival || a.estimated_arrival || '';
                                                const bDate = b.confirmed_arrival || b.estimated_arrival || '';
                                                return aDate.localeCompare(bDate);
                                            }).slice(0, 5).map(d => {
                                                const supplier = suppliers.find(s => s._id === d.supplier_id);
                                                const displayDate = d.client_delivery_date || d.confirmed_arrival || d.estimated_arrival;
                                                return (
                                                    <Card key={d._id} className="bg-white/5 border border-white/10">
                                                        <CardContent className="p-3 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm text-white font-medium">{supplier?.name}</p>
                                                                {d.tracking_number && <p className="text-[10px] text-white/25">Tracking: {d.tracking_number}</p>}
                                                            </div>
                                                            <div className="text-right flex flex-col items-end gap-1">
                                                                {displayDate && <p className="text-xs text-white/40">{new Date(displayDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>}
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="default" className={`text-[9px] ${d.confirmed_arrival ? 'bg-[#FFC703]/20 text-[#FFC703]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                        {d.confirmed_arrival ? 'Confirmta' : 'Stimata'}
                                                                    </Badge>
                                                                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[#FFC703] hover:bg-[#FFC703]/20 text-[10px]" onClick={() => {
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
                                                <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/8">
                                                    <Calendar size={32} className="text-white/25 mx-auto mb-2" />
                                                    <p className="text-sm text-white/40">No consegna programmata</p>
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

            {/* â•â•â• MODAL: New Supplier â•â•â• */}
            <Dialog open={showNewSupplierModal} onOpenChange={setShowNewSupplierModal}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-white">{t('common.new_supplier')}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Nome Azienda *" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Email *" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Telefono" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Referente" value={newSupplier.contact_person} onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="P.IVA" value={newSupplier.piva} onChange={e => setNewSupplier({ ...newSupplier, piva: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Indirizzo" value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Select value={newSupplier.type} onValueChange={v => setNewSupplier({ ...newSupplier, type: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                <SelectItem value="subprod" className="text-white">Subprodotti (Infissi)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea placeholder="Note" value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Button onClick={handleCreateSupplier} disabled={!newSupplier.name || !newSupplier.email} className="w-full bg-orange-600 hover:bg-orange-700">Crea Supplier</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* â•â•â• MODAL: New Request (Task 9/10 expanded) â•â•â• */}
            <Dialog open={showNewRequestModal} onOpenChange={setShowNewRequestModal}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-white">{t('common.new_request')}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={newRequest.supplier_id} onValueChange={v => setNewRequest({ ...newRequest, supplier_id: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Select Supplier *" /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-white">{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input placeholder="Titolo Request *" value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })} className="bg-[#535252] border-white/10 text-white" />

                        {/* Task 10: Fixture Category Selector */}
                        <p className="text-xs text-orange-400 font-medium mt-2">Category Prodotto</p>
                        <Select value={newRequest.fixture_category} onValueChange={v => setNewRequest({ ...newRequest, fixture_category: v, fixture_type: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Category *" /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                <SelectItem value="finestra" className="text-white">Finestra</SelectItem>
                                <SelectItem value="porta" className="text-white">Porta</SelectItem>
                                <SelectItem value="portafinestra" className="text-white">Portafinestra</SelectItem>
                                <SelectItem value="veneziana" className="text-white">Veneziana</SelectItem>
                                <SelectItem value="tapparella" className="text-white">Tapparella</SelectItem>
                                <SelectItem value="zanzariera" className="text-white">Zanzariera</SelectItem>
                                <SelectItem value="scorrevole" className="text-white">Scorrevole</SelectItem>
                                <SelectItem value="avvolgibile" className="text-white">Avvolgibile</SelectItem>
                                <SelectItem value="persiana" className="text-white">Persiana</SelectItem>
                                <SelectItem value="altro" className="text-white">Altro</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Task 9: Urgency */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-white/40 block mb-1">Urgenza</label>
                                <Select value={newRequest.urgency} onValueChange={v => setNewRequest({ ...newRequest, urgency: v })}>
                                    <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white/5 border-white/10">
                                        <SelectItem value="normal" className="text-white">Normale</SelectItem>
                                        <SelectItem value="urgent" className="text-red-400">ðŸ”´ Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-white/40 block mb-1">QuantitÃ </label>
                                <Input type="number" min="1" value={newRequest.quantity} onChange={e => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                        </div>

                        {/* Dimensions */}
                        <p className="text-xs text-orange-400 font-medium mt-2">Dimensioni (mm)</p>
                        <div className="grid grid-cols-3 gap-2">
                            <Input placeholder="Larghezza" value={newRequest.dimensions_width} onChange={e => setNewRequest({ ...newRequest, dimensions_width: e.target.value })} className="bg-[#535252] border-white/10 text-white text-sm" />
                            <Input placeholder="Altezza" value={newRequest.dimensions_height} onChange={e => setNewRequest({ ...newRequest, dimensions_height: e.target.value })} className="bg-[#535252] border-white/10 text-white text-sm" />
                            <Input placeholder="ProfonditÃ " value={newRequest.dimensions_depth} onChange={e => setNewRequest({ ...newRequest, dimensions_depth: e.target.value })} className="bg-[#535252] border-white/10 text-white text-sm" />
                        </div>

                        {/* Material, Color, Glass */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Materiale</label>
                                <Select value={newRequest.material} onValueChange={v => setNewRequest({ ...newRequest, material: v })}>
                                    <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Materiale" /></SelectTrigger>
                                    <SelectContent className="bg-white/5 border-white/10">
                                        <SelectItem value="pvc" className="text-white">PVC</SelectItem>
                                        <SelectItem value="alluminio" className="text-white">Alluminio</SelectItem>
                                        <SelectItem value="legno" className="text-white">Legno</SelectItem>
                                        <SelectItem value="legno_alluminio" className="text-white">Legno/Alluminio</SelectItem>
                                        <SelectItem value="acciaio" className="text-white">Acciaio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Colore</label>
                                <Input placeholder="es. Bianco RAL 9010" value={newRequest.color} onChange={e => setNewRequest({ ...newRequest, color: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Tipo Vetro</label>
                                <Select value={newRequest.glass_type} onValueChange={v => setNewRequest({ ...newRequest, glass_type: v })}>
                                    <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Vetro" /></SelectTrigger>
                                    <SelectContent className="bg-white/5 border-white/10">
                                        <SelectItem value="doppio" className="text-white">Doppio Vetro</SelectItem>
                                        <SelectItem value="triplo" className="text-white">Triplo Vetro</SelectItem>
                                        <SelectItem value="basso_emissivo" className="text-white">Basso Emissivo</SelectItem>
                                        <SelectItem value="temperato" className="text-white">Temperato</SelectItem>
                                        <SelectItem value="stratificato" className="text-white">Stratificato</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Budget Stimato (â‚¬)</label>
                                <Input type="number" placeholder="0" value={newRequest.budget_estimate} onChange={e => setNewRequest({ ...newRequest, budget_estimate: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                        </div>

                        <Textarea placeholder="Description e specifiche tecniche" value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} className="bg-[#535252] border-white/10 text-white" rows={3} />

                        {/* Task 9: Attachments */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Foto / Immagini</label>
                                <Input type="file" multiple accept="image/*" onChange={e => { const files = Array.from(e.target.files); const err = validateFiles(files, 'image'); if (err) { alert(err); e.target.value = ''; return; } setNewRequestPhotos(files); }} className="bg-[#535252] border-white/10 text-white text-xs file:bg-[#1C1A18] file:text-orange-400 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 hover:file:bg-[#141210]" />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Documenti (PDF, DWG)</label>
                                <Input type="file" multiple accept=".pdf,.doc,.docx,.dwg" onChange={e => { const files = Array.from(e.target.files); const err = validateFiles(files, 'document'); if (err) { alert(err); e.target.value = ''; return; } setNewRequestDocs(files); }} className="bg-[#535252] border-white/10 text-white text-xs file:bg-[#1C1A18] file:text-[#FFC703] file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 hover:file:bg-[#141210]" />
                            </div>
                        </div>

                        <Button onClick={handleCreateRequest} disabled={!newRequest.supplier_id || !newRequest.title || isUploading} className="w-full bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold mt-4">
                            {isUploading ? <><Loader2 className="animate-spin mr-2" size={16} /> Loading corso...</> : 'Invia Request'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* â•â•â• MODAL: New Delivery â•â•â• */}
            {/* â•â•â• MODAL: Edit Date Calendario (Task 13) â•â•â• */}
            <Dialog open={showEditDeliveryModal} onOpenChange={setShowEditDeliveryModal}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-sm max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-white">Update Date Consegna</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-3">
                        <div>
                            <label className="text-xs text-white/25 mb-1 block">Data Stimata (Supplier)</label>
                            <Input type="date" value={editingDelivery.estimated_arrival} onChange={e => setEditingDelivery({ ...editingDelivery, estimated_arrival: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-white/25 mb-1 block">Data Confirmta (Supplier)</label>
                            <Input type="date" value={editingDelivery.confirmed_arrival} onChange={e => setEditingDelivery({ ...editingDelivery, confirmed_arrival: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        </div>
                        {isAdmin && (
                            <div>
                                <label className="text-xs text-orange-400 mb-1 block">Data Client (Kranely)</label>
                                <Input type="date" value={editingDelivery.client_delivery_date} onChange={e => setEditingDelivery({ ...editingDelivery, client_delivery_date: e.target.value })} className="bg-[#535252] border-orange-500/50 text-white" />
                            </div>
                        )}
                        <Button onClick={handleUpdateDeliveryDates} className="w-full bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold">{t('common.save_date')}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-white">{t('common.new_delivery')}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        {!isSupplier && (
                            <Select value={newDelivery.supplier_id} onValueChange={v => setNewDelivery({ ...newDelivery, supplier_id: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Select Supplier *" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-white">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={newDelivery.order_id} onValueChange={v => setNewDelivery({ ...newDelivery, order_id: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Select Order *" /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                {orders.filter(o => !newDelivery.supplier_id || o.supplier_id === newDelivery.supplier_id).map(o => (
                                    <SelectItem key={o._id} value={o._id} className="text-white">Ordine #{o.order_number || o._id.slice(-6)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-orange-400 font-medium flex items-center gap-1"><Truck size={12} /> Info Autista</p>
                        <Input placeholder="Nome Autista" value={newDelivery.driver_name} onChange={e => setNewDelivery({ ...newDelivery, driver_name: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Telefono Autista" value={newDelivery.driver_phone} onChange={e => setNewDelivery({ ...newDelivery, driver_phone: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Veicolo (Targa)" value={newDelivery.driver_vehicle} onChange={e => setNewDelivery({ ...newDelivery, driver_vehicle: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Nr. Tracking" value={newDelivery.tracking_number} onChange={e => setNewDelivery({ ...newDelivery, tracking_number: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Arrivo Stimato</label>
                            <Input type="date" value={newDelivery.estimated_arrival} onChange={e => setNewDelivery({ ...newDelivery, estimated_arrival: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        </div>
                        <Textarea placeholder="Note" value={newDelivery.notes} onChange={e => setNewDelivery({ ...newDelivery, notes: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Button onClick={handleCreateDelivery} disabled={!newDelivery.order_id || !newDelivery.supplier_id} className="w-full bg-green-600 hover:bg-green-700">Crea Consegna</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* â•â•â• MODAL: Dettagli Request â•â•â• */}
            <Dialog open={!!showRequestDetailsModal} onOpenChange={(open) => !open && setShowRequestDetailsModal(null)}>
                <DialogContent className="bg-[#141210] text-white border-white/10 w-[95vw] max-w-2xl" style={{ maxWidth: 'min(calc(100vw - 3rem), 32rem)' }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="text-[#FFC703]" /> Dettagli Request
                            {showRequestDetailsModal?.status && (
                                <Badge variant="default" className={`ml-2 ${statusColors[showRequestDetailsModal.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                    {statusLabels[showRequestDetailsModal.status] || showRequestDetailsModal.status}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {showRequestDetailsModal && (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="bg-[#1C1A18] p-4 rounded-lg border border-white/10">
                                <h3 className="text-xl font-medium text-white mb-1">{showRequestDetailsModal.title}</h3>
                                {showRequestDetailsModal.description && <p className="text-sm text-white/40 mt-2 whitespace-pre-wrap">{showRequestDetailsModal.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Card className="bg-white/5 border-white/10">
                                    <CardContent className="p-3">
                                        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Specifiche Base</p>
                                        <ul className="space-y-1.5 text-xs text-white/70">
                                            <li><span className="text-white/40 inline-block w-20">Category:</span> <span className="font-medium">{showRequestDetailsModal.fixture_category || showRequestDetailsModal.fixture_type || 'N/A'}</span></li>
                                            <li><span className="text-white/40 inline-block w-20">Urgenza:</span> <span className={showRequestDetailsModal.urgency === 'high' ? 'text-red-400 font-medium' : ''}>{showRequestDetailsModal.urgency === 'high' ? 'Alta' : 'Normale'}</span></li>
                                            <li><span className="text-white/40 inline-block w-20">QuantitÃ :</span> <span className="font-medium">{showRequestDetailsModal.quantity || 1}</span></li>
                                            {showRequestDetailsModal.budget_estimate && <li><span className="text-white/40 inline-block w-20">Budget:</span> <span className="font-medium">â‚¬{showRequestDetailsModal.budget_estimate}</span></li>}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10">
                                    <CardContent className="p-3">
                                        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Caratteristiche</p>
                                        <ul className="space-y-1.5 text-xs text-white/70">
                                            <li><span className="text-white/40 inline-block w-20">Misure:</span> {(showRequestDetailsModal.dimensions?.width && showRequestDetailsModal.dimensions?.height) ? `${showRequestDetailsModal.dimensions.width}x${showRequestDetailsModal.dimensions.height} cm (P:${showRequestDetailsModal.dimensions.depth || '-'})` : 'N/A'}</li>
                                            <li><span className="text-white/40 inline-block w-20">Materiale:</span> {showRequestDetailsModal.material || 'N/A'}</li>
                                            <li><span className="text-white/40 inline-block w-20">Colore:</span> <span className="capitalize">{showRequestDetailsModal.color || 'N/A'}</span></li>
                                            <li><span className="text-white/40 inline-block w-20">Vetro:</span> <span className="capitalize">{showRequestDetailsModal.glass_type || 'N/A'}</span></li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Phase 8: Supplier Response (Visible to Admin) */}
                            {isAdmin && showRequestDetailsModal.status === 'preventivato' && (
                                <div className="space-y-3">
                                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Risposta Supplier</p>
                                            <p className="text-xl font-medium text-white">â‚¬{showRequestDetailsModal.quoted_price?.toLocaleString('it-IT')}</p>
                                            {showRequestDetailsModal.supplier_notes && <p className="text-xs text-white/40 mt-1 italic">"{showRequestDetailsModal.supplier_notes}"</p>}
                                        </div>
                                        {showRequestDetailsModal.supplier_quote_doc_id && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Documento Quote</p>
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
                                    <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Controproposta Sent al Supplier</p>
                                    <p className="text-lg font-medium text-white">â‚¬{showRequestDetailsModal.counterproposal_price?.toLocaleString('it-IT')}</p>
                                    {showRequestDetailsModal.counterproposal_notes && <p className="text-xs text-white/40 mt-1 italic">"{showRequestDetailsModal.counterproposal_notes}"</p>}
                                    <p className="text-xs text-amber-300 mt-2">Pending di risposta dal fornitore...</p>
                                </div>
                            )}

                            {/* Supplier: respond to counterproposal */}
                            {isSupplier && showRequestDetailsModal.status === 'counterproposal_sent' && showRequestDetailsModal.counterproposal_status === 'pending' && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg space-y-3">
                                    <p className="text-sm font-medium text-amber-300">Kranely propone un prezzo diverso:</p>
                                    <p className="text-2xl font-bold text-white">â‚¬{showRequestDetailsModal.counterproposal_price?.toLocaleString('it-IT')}</p>
                                    {showRequestDetailsModal.counterproposal_notes && (
                                        <p className="text-xs text-white/40 italic">"{showRequestDetailsModal.counterproposal_notes}"</p>
                                    )}
                                    <p className="text-xs text-white/40">Your original quote was: â‚¬{showRequestDetailsModal.quoted_price?.toLocaleString('it-IT')}</p>
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
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-sm font-medium text-white mb-3">Allegati</p>

                                    {showRequestDetailsModal.photos?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs text-white/40 mb-2">Foto / Immagini:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {showRequestDetailsModal.photos.map((storageId, idx) => (
                                                    <FileLink key={idx} storageId={storageId} isImage={true} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {showRequestDetailsModal.documents?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-white/40 mb-2">Documenti:</p>
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
                                        <h4 className="text-lg font-medium text-white border-b border-white/10 pb-2">Progress Ordine</h4>
                                        
                                        {/* Order Info */}
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Ordine #{linkedOrder.order_number || linkedOrder._id.slice(-6)}</p>
                                                    <p className="text-xs text-white/40">Importo Totale: {linkedOrder.total_amount ? `â‚¬${linkedOrder.total_amount.toLocaleString()}` : 'N/A'}</p>
                                                </div>
                                                <Badge variant="default" className={statusColors[linkedOrder.status] || 'bg-gray-500/20 text-gray-400'}>
                                                    {statusLabels[linkedOrder.status] || linkedOrder.status}
                                                </Badge>
                                            </div>
                                            
                                            {/* Payments */}
                                            {linkedPayments.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Pagamenti Collegati</p>
                                                    <div className="space-y-2">
                                                        {linkedPayments.map(payment => (
                                                            <div key={payment._id} className="flex justify-between items-center bg-[#141210] p-2 rounded text-xs border border-white/10/50">
                                                                <div className="flex items-center gap-2">
                                                                                                        <CreditCard size={14} className={payment.status === 'pagato' ? 'text-[#FFC703]' : 'text-[#F0EBE8]/40'} />
                                                                    <span className="text-white/70">{payment.type === 'client' ? 'Client â†’ Kranely' : 'Kranely â†’ Supplier'}</span>
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    <span className="font-medium text-white">â‚¬{payment.amount?.toLocaleString()}</span>
                                                                    <span className={payment.status === 'pagato' ? 'text-[#FFC703]' : 'text-[#F0EBE8]/50'}>{payment.status === 'pagato' ? 'Paid' : 'Pending'}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery */}
                                            {linkedDelivery && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Logistica / Consegna</p>
                                                    <div className="bg-[#141210] p-2 flex justify-between items-center rounded text-xs border border-white/10/50">
                                                        <div className="flex items-center gap-2">
                                                            <Truck size={14} className="text-[#FFC703]" />
                                                            <span className="text-white/70">Arrivo Previsto: {linkedDelivery.estimated_arrival ? new Date(linkedDelivery.estimated_arrival).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                        <span className="text-[#FFC703] bg-[#FFC703]/20 px-2 py-0.5 rounded">{statusLabels[linkedDelivery.status] || linkedDelivery.status}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Project-Exclusive Chat for this Request */}
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                    <MessageCircle size={16} className="text-[#FFC703]" /> Chat di Progetto (Esclusiva)
                                </p>
                                <div className="border border-white/10 rounded-lg overflow-hidden">
                                     <MiniChat 
                                         channelType="request" 
                                         channelId={isAdmin ? `${showRequestDetailsModal._id}_admin_supplier` : showRequestDetailsModal._id} 
                                         channelName={`Request: ${showRequestDetailsModal.title}`} 
                                         currentUserEmail={email}
                                         contactPhone={isAdmin ? (suppliers.find(s => s._id === showRequestDetailsModal.supplier_id)?.phone) : "0039300000000"} 
                                     />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* â•â•â• MODAL: Chat con Supplier â•â•â• */}
            <Dialog open={!!showChatModal} onOpenChange={() => setShowChatModal(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
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

            {/* â•â•â• MODAL: Chat Ordine Progetto â•â•â• */}
            <Dialog open={!!showOrderChatModal} onOpenChange={() => setShowOrderChatModal(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <MessageCircle size={18} className="text-[#FFC703]" /> Chat Ordine #{showOrderChatModal?.order_number || showOrderChatModal?._id?.slice(-6)}
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

            {/* â•â•â• MODAL: RISPOSTA/PREVENTIVO FORNITORE â•â•â• */}
            <Dialog open={!!showQuoteModal} onOpenChange={(open) => !open && setShowQuoteModal(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">Invia Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm text-white/40">Proposed Price (€) *</label>
                            <Input
                                type="number"
                                placeholder="es. 1500"
                                value={quoteData.quoted_price}
                                onChange={e => setQuoteData({ ...quoteData, quoted_price: e.target.value })}
                                className="bg-[#535252] border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-white/40">Notes for Kranely (optional)</label>
                            <Textarea
                                placeholder="Dettagli aggiuntivi, tempi di realizzazione, etc."
                                value={quoteData.supplier_notes}
                                onChange={e => setQuoteData({ ...quoteData, supplier_notes: e.target.value })}
                                className="bg-[#535252] border-white/10 text-white min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-white/40">Attach Document from "Documents" (optional)</label>
                            <Select value={quoteData.supplier_quote_doc_id} onValueChange={v => setQuoteData({ ...quoteData, supplier_quote_doc_id: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                    <SelectValue placeholder="Select a document..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    {myDocuments.map(doc => (
                                        <SelectItem key={doc._id} value={doc._id} className="text-white">{doc.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-white/25">Puoi selezionare un PDF o un'immagine giÃ  caricata nella tua area documenti.</p>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setShowQuoteModal(null)} className="text-white/40 hover:text-white">Cancel</Button>
                            <Button onClick={handleQuoteSubmit} disabled={!quoteData.quoted_price} className="bg-orange-600 hover:bg-orange-700">Invia Quote</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* â•â•â• MODAL: Proposta Piano Pagamenti â•â•â• */}
            <Dialog open={!!showPaymentPlanModal} onOpenChange={() => setShowPaymentPlanModal(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <CreditCard size={18} className="text-orange-400" /> Proponi Piano Pagamenti
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-xs text-white/40">Definisci le rate per l'ordine #{showPaymentPlanModal?.order_number || showPaymentPlanModal?._id?.slice(-6)} per un totale di â‚¬{showPaymentPlanModal?.total_amount?.toLocaleString()}</p>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-[10px] h-7 border-[#FFC703]/30 text-[#FFC703] hover:bg-[#FFC703]/20"
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
                            <div key={index} className="space-y-2 p-3 bg-[#141210] rounded-lg border border-white/10">
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
                                        <label className="text-[10px] text-white/25 block mb-1">Importo (â‚¬)</label>
                                        <Input 
                                            type="number" 
                                            value={item.amount} 
                                            onChange={e => {
                                                const newProposal = [...paymentProposal];
                                                newProposal[index].amount = parseFloat(e.target.value) || 0;
                                                setPaymentProposal(newProposal);
                                            }}
                                            className="bg-white/5 border-white/10 text-white text-xs h-8"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/25 block mb-1">Scadenza</label>
                                        <Input 
                                            type="date" 
                                            value={item.due_date} 
                                            onChange={e => {
                                                const newProposal = [...paymentProposal];
                                                newProposal[index].due_date = e.target.value;
                                                setPaymentProposal(newProposal);
                                            }}
                                            className="bg-white/5 border-white/10 text-white text-xs h-8"
                                        />
                                    </div>
                                </div>
                                <Input 
                                    placeholder="Description (es. Acconto, Saldo)" 
                                    value={item.description}
                                    onChange={e => {
                                        const newProposal = [...paymentProposal];
                                        newProposal[index].description = e.target.value;
                                        setPaymentProposal(newProposal);
                                    }}
                                    className="bg-white/5 border-white/10 text-white text-xs h-8 mt-2"
                                />
                            </div>
                        ))}

                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-dashed border-white/10 text-white/40 hover:text-white h-8 text-xs" 
                            onClick={() => setPaymentProposal([...paymentProposal, { amount: 0, due_date: '', description: '' }])}
                        >
                            + Add Installment
                        </Button>

                        <div className="space-y-1">
                            <label className="text-[10px] text-white/25 block">Notes (optional)</label>
                            <Textarea 
                                placeholder="Add details about your proposal..."
                                value={proposalNotes}
                                onChange={e => setProposalNotes(e.target.value)}
                                className="bg-[#535252] border-white/10 text-white text-xs min-h-[60px]"
                            />
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button variant="ghost" className="flex-1 text-xs" onClick={() => setShowPaymentPlanModal(null)}>Cancel</Button>
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

            {/* â•â•â• MODAL: CONTROPROPOSTA ADMIN â†’ FORNITORE â•â•â• */}
            <Dialog open={!!counterproposalModal} onOpenChange={(open) => !open && setCounterproposalModal(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRight size={18} className="text-amber-400" /> Controproposta al Supplier
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {counterproposalModal && (
                            <div className="bg-[#535252]/ rounded-lg p-3">
                                <p className="text-xs text-white/40">Quote fornitore:</p>
                                <p className="text-white font-medium">{counterproposalModal.title}</p>
                                <p className="text-orange-400 font-bold">â‚¬{counterproposalModal.quoted_price?.toLocaleString('it-IT')}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm text-white/40">Proposed Price (€) *</label>
                            <Input
                                type="number"
                                placeholder="Enter new price..."
                                value={counterproposalPrice}
                                onChange={e => setCounterproposalPrice(e.target.value)}
                                className="bg-[#535252] border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-white/40">Notes (optional)</label>
                            <Textarea
                                placeholder="Motivazione della controproposta..."
                                value={counterproposalNotes}
                                onChange={e => setCounterproposalNotes(e.target.value)}
                                className="bg-[#535252] border-white/10 text-white min-h-[80px]"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setCounterproposalModal(null)} className="text-white/40" disabled={isSubmittingCounter}>Cancel</Button>
                            <Button
                                onClick={handleSendCounterproposal}
                                disabled={!counterproposalPrice || isSubmittingCounter}
                                className="bg-[#FFC703] hover:bg-[#e6b300] text-[#1C1A18]"
                            >
                                {isSubmittingCounter ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Send size={14} className="mr-1" />}
                                Invia Controproposta
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* â•â•â• MODAL: FORNITORE RISPONDE ALLA CONTROPROPOSTA â•â•â• */}
            <Dialog open={!!counterResponseModal} onOpenChange={(open) => !open && setCounterResponseModal(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
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
                                <p className="text-xs text-amber-400 uppercase mb-1">Controproposta Kranely</p>
                                <p className="text-xl font-bold text-white">â‚¬{counterResponseModal.counterproposal_price?.toLocaleString('it-IT')}</p>
                                {counterResponseModal.counterproposal_notes && (
                                    <p className="text-xs text-white/40 mt-1 italic">"{counterResponseModal.counterproposal_notes}"</p>
                                )}
                            </div>
                        )}
                        {!counterResponseModal?._acceptMode && (
                            <div className="space-y-2">
                                <label className="text-sm text-white/40">Reason for rejection (optional)</label>
                                <Textarea
                                    placeholder="Spiega perché non puoi accettare questo prezzo..."
                                    value={counterRejectionNotes}
                                    onChange={e => setCounterRejectionNotes(e.target.value)}
                                    className="bg-[#535252] border-white/10 text-white min-h-[80px]"
                                />
                            </div>
                        )}
                        {counterResponseModal?._acceptMode && (
                            <p className="text-sm text-white/40">
                                Accettando la controproposta, il tuo preventivo sarÃ  aggiornato al prezzo proposto da Kranely e la richiesta passerÃ  in stato "Preventivato".
                            </p>
                        )}
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setCounterResponseModal(null)} className="text-white/40" disabled={isRespondingCounter}>Cancel</Button>
                            <Button
                                onClick={() => handleRespondCounterproposal(counterResponseModal?._acceptMode)}
                                disabled={isRespondingCounter}
                                className={counterResponseModal?._acceptMode ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                            >
                                {isRespondingCounter ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                                {counterResponseModal?._acceptMode ? 'Confirm Accettazione' : 'Confirm Rifiuto'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}







