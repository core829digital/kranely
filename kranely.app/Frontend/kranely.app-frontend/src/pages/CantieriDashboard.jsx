/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useTranslation } from 'react-i18next';
import {
    Search, Plus, Building, Calendar,
    HardHat, X, Users, MessageSquare, ChevronRight, Send, Paperclip,
    GripVertical, ArrowRight, Mic, MicOff, Image, FileText,
    Volume2, UserPlus, Mail, Loader2, ClipboardList, Check, Trash2, ChevronDown,
    Phone, MapPin, User, Receipt,
    Video, Camera, Shield, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';

// Kanban phases (3 phases only)
const KANBAN_PHASES = [
    { id: 'in_lavorazione', label: 'In Production', color: 'bg-[#FFC703]', textColor: 'text-[#FFC703]' },
    { id: 'posa_in_opera', label: 'Installation', color: 'bg-[#535252]', textColor: 'text-[#F0EBE8]' },
    { id: 'completed', label: 'Completed', color: 'bg-white/20', textColor: 'text-white/70' }];

export default function ProjectsDashboard() {
    const { user } = useUser();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedCantiere, setSelectedCantiere] = useState(null);
    const [viewPdfUrl, setViewPdfUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('kanban');
    const [detailTab, setDetailTab] = useState('details');
    // ... (rest of state)


    const [newCantiere, setNewCantiere] = useState({
        nome_cantiere: '',
        cliente: '',
        client_id: null,
        indirizzo: '',
        status: 'in_lavorazione',
        valore_contratto: '',
        valore_progetto: '',
        quote_id: null,
    });

    // Drag state
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverPhase, setDragOverPhase] = useState(null);

    // Team invite state
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmails, setInviteEmails] = useState([]);
    const [inviteSending, setInviteSending] = useState(false);

    // Message state
    const [newMessage, setNewMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const recordingIntervalRef = useRef(null);



    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    // --- Queries & Access Control ---
    // Fetch Convex User to determine role securely
    const convexUser = useQuery(api.users.getByEmail, { email: userEmail || "" });

    // Orders for Phase Lock (Task 10)
    const dashboardOrders = useQuery(api.suppliers.listOrders, {}) || [];

    const isClient = convexUser?.role === 'client' || convexUser?.role === 'user';
    const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';
    const isWorker = ['collaborator', 'collaborator_internal', 'collaborator_external', 'worker', 'operaio'].includes(convexUser?.role);
    const isSupervisor = false;

    // Queries for Admin/Creation
    const allQuotes = useQuery(api.quotes.getAll, isAdmin ? {} : "skip") || [];
    const clientsList = useQuery(api.clients.list, isAdmin ? {} : "skip") || [];
    const collaboratoriList = useQuery(api.collaborators.list, isAdmin ? {} : "skip") || [];

    // Main Projects Query
    // Differentiate queries to avoid TS union type mismatch
    const cantieriClient = useQuery(api.cantieri.getByClient, isClient ? {} : "skip");
    const cantieriAdmin = useQuery(api.cantieri.listCantieri, (isAdmin || isSupervisor) ? { company_email: userEmail } : "skip");
    const cantieriWorker = useQuery(api.cantieri.getByWorker, isWorker ? {} : "skip");

    const cantieri = (isClient ? cantieriClient : (isWorker ? cantieriWorker : cantieriAdmin)) || [];

    // --- Derived State for Views ---
    const filteredProjects = cantieri.filter(c =>
        c.nome_cantiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cantieriByPhase = {};
    KANBAN_PHASES.forEach(phase => {
        cantieriByPhase[phase.id] = filteredProjects.filter(c => c.status === phase.id);
    });

    // --- Detail View Queries (Dependent on selectedCantiere) ---
    const cantiereDetail = useQuery(api.cantieri.getById, selectedCantiere ? { id: selectedCantiere._id } : "skip");
    const phaseTasks = useQuery(api.phase_tasks.listByPhase, selectedCantiere ? { cantiere_id: selectedCantiere._id } : "skip") || [];
    const cantiereTeam = useQuery(api.cantieri.getCantiereTeam, selectedCantiere ? { cantiere_id: selectedCantiere._id } : "skip") || [];

    // Messages - Assume cantiere ID is the channel ID for cantiere-specific chat
    const messages = useQuery(api.chat.getChannelMessages, selectedCantiere ? { channel_id: selectedCantiere._id } : "skip") || [];

    // --- Mutations ---
    const createCantiereMutation = useMutation(api.cantieri.createCantiere);
    const updateCantiereMutation = useMutation(api.cantieri.updateCantiere);
    const deleteCantiereMutation = useMutation(api.cantieri.deleteCantiere);

    const createPhaseTaskMutation = useMutation(api.phase_tasks.create);
    const updatePhaseTaskMutation = useMutation(api.phase_tasks.update);
    const removePhaseTaskMutation = useMutation(api.phase_tasks.remove);

    const inviteTeamMemberMutation = useMutation(api.cantieri.inviteTeamMember);
    const sendMessageMutation = useMutation(api.chat.sendCantiereMessage);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // --- Local State ---
    const [expandedPhase, setExpandedPhase] = useState(null);
    const [newPhaseTask, setNewPhaseTask] = useState({ title: '', phase: '', priority: 'media', assigned_to: '' });

    // --- Handlers ---

    const handleCreate = async () => {
        if (!newCantiere.quote_id || !newCantiere.client_id) return;

        try {
            await createCantiereMutation({
                company_email: userEmail,
                nome_cantiere: newCantiere.nome_cantiere,
                cliente: newCantiere.cliente,
                client_id: newCantiere.client_id,
                quote_id: newCantiere.quote_id,
                indirizzo: newCantiere.indirizzo,
                status: newCantiere.status,
                valore_contratto: parseFloat(newCantiere.valore_contratto) || 0,
                valore_progetto: parseFloat(newCantiere.valore_progetto) || 0,
                created_date: new Date().toISOString(),
            });
            setCreateModalOpen(false);
            setNewCantiere({
                nome_cantiere: '',
                cliente: '',
                client_id: null,
                indirizzo: '',
                status: 'in_lavorazione',
                valore_contratto: '',
                valore_progetto: '',
                quote_id: null,
            });
        } catch (error) {
            console.error("Error creating cantiere:", error);
            alert("Errore durante la creazione: " + error.message);
        }
    };

    // Drag & Drop
    const handleDragStart = (e, cantiere) => {
        if (!isAdmin) return;
        setDraggedItem(cantiere);
        e.dataTransfer.setData('text/plain', cantiere._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, phaseId) => {
        if (!isAdmin) return;
        e.preventDefault();
        setDragOverPhase(phaseId);
    };

    const handleDragLeave = (e) => {
        setDragOverPhase(null);
    };

    const handleDrop = async (e, phaseId) => {
        if (!isAdmin) return;
        e.preventDefault();
        setDragOverPhase(null);
        const cantiereId = e.dataTransfer.getData('text/plain');

        if (cantiereId && phaseId) {
            // Task 10 Lock: check if moving AWAY from in_lavorazione
            if (draggedItem.status === 'in_lavorazione' && phaseId !== 'in_lavorazione') {
                const linkedOrders = dashboardOrders.filter(o => o.cantiere_id === cantiereId);
                const inInProduction = linkedOrders.some(o => o.status === 'in_production');
                if (inInProduction) {
                    alert("âš ï¸ Impossibile avanzare di fase: Ci sono ancora ordini fornitore in fase di Produzione.");
                    setDraggedItem(null);
                    return;
                }
            }
            try {
                await updateCantiereMutation({
                    id: cantiereId,
                    data: { status: phaseId }
                });
            } catch (err) {
                console.error("Failed to move cantiere:", err);
            }
        }
        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverPhase(null);
    };

    // Phase Change (Dropdown)
    const handlePhaseChange = async (cantiereId, newPhase) => {
        if (!isAdmin) return;
        
        // Task 10 Lock
        const cantiere = cantieri.find(c => c._id === cantiereId);
        if (cantiere && cantiere.status === 'in_lavorazione' && newPhase !== 'in_lavorazione') {
            const linkedOrders = dashboardOrders.filter(o => o.cantiere_id === cantiereId);
            const inInProduction = linkedOrders.some(o => o.status === 'in_production');
            if (inInProduction) {
                alert("âš ï¸ Impossibile avanzare di fase: Ci sono ancora ordini fornitore in fase di Produzione.");
                return;
            }
        }

        try {
            await updateCantiereMutation({
                id: cantiereId,
                data: { status: newPhase }
            });
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    // Team Invite
    const handleInviteTeamMember = async () => {
        if (inviteEmails.length === 0 || !selectedCantiere) return;
        setInviteSending(true);
        try {
            for (const email of inviteEmails) {
                const existing = cantiereTeam?.find(m => m.email === email);
                if (!existing) {
                    await inviteTeamMemberMutation({
                        cantiere_id: selectedCantiere._id,
                        email,
                        role: 'worker', // Default role for now
                        invited_by: userEmail
                    });
                }
            }
            setInviteModalOpen(false);
            setInviteEmails([]);
            alert("Inviti inviati con successo!");
        } catch (error) {
            alert("Errore invio inviti: " + error.message);
        } finally {
            setInviteSending(false);
        }
    };

    // Messaging
    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !audioBlob && !selectedFile) || !selectedCantiere) return;

        try {
            let fileUrl = null;
            let fileName = null;
            let fileType = 'text';

            // Upload File/Audio if present
            if (audioBlob || selectedFile) {
                const uploadUrl = await generateUploadUrl();
                const fileToUpload = audioBlob || selectedFile;

                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": fileToUpload.type },
                    body: fileToUpload,
                });

                if (!result.ok) throw new Error("Upload failed");
                const { storageId } = await result.json();
                fileUrl = storageId;

                if (audioBlob) {
                    fileType = 'voice';
                    fileName = 'voice_message.webm';
                } else if (selectedFile) {
                    fileName = selectedFile.name;
                    if (selectedFile.type.startsWith('image/')) fileType = 'image';
                    else fileType = 'file';
                }
            }

            await sendMessageMutation({
                channel_id: selectedCantiere._id,
                sender_email: userEmail,
                sender_name: user?.fullName || userEmail,
                content: newMessage.trim(),
                file_url: fileUrl || undefined,
                file_name: fileName || undefined,
                message_type: fileType // Defaults to 'text' if not overwritten by file logic, but we should handle text-only
            });

            setNewMessage('');
            setSelectedFile(null);
            setAudioBlob(null);
            setRecordingTime(0);
        } catch (error) {
            console.error("Send message error:", error);
            alert("Errore invio messaggio");
        }
    };

    // Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Impossibile accedere al microfono");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Phase Helpers
    const getPhaseColor = (status) => {
        const phase = KANBAN_PHASES.find(p => p.id === status);
        return phase ? phase.color : 'bg-gray-500';
    };

    const getPhaseLabel = (status) => {
        const phase = KANBAN_PHASES.find(p => p.id === status);
        return phase ? phase.label : status;
    };


    if (!isAdmin && !isClient && !isWorker) {
        return (
            <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center">
                <div className="text-center">
<h2 className="text-xl text-white mb-2">{t('access.denied')}</h2>
                    <p className="text-white/40">{t('access.no_permission')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">
            
            
            <UniversalPdfViewer
                isOpen={!!viewPdfUrl}
                onClose={() => setViewPdfUrl(null)}
                url={viewPdfUrl}
                title="Document View"
            />

            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-light text-white mb-2 flex items-center gap-3">
                                <HardHat className="text-white" />
                                Gestione Projects
                            </h1>
                            <p className="text-white/40">Drag projects to change phase</p>
                        </div>

                        <div className="flex gap-3">
                            {isAdmin && (
                                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] shadow-lg hover:shadow-xl">
                                            <Plus size={20} className="mr-2" />
                                            New Project
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white/5 border-white/10 text-white">
                                        <DialogHeader>
                                            <DialogTitle className="text-white">Create New Project</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            {/* Quote Selection */}
                                            <div className="space-y-2">
                                                <Label className="text-white/70">Select Final Quote (Required)</Label>
                                                <Select
                                                    value={newCantiere.quote_id || ""}
                                                    onValueChange={(val) => {
                                                        const quote = allQuotes.find(q => q._id === val);
                                                        if (quote) {
                                                            const client = clientsList.find(c => c._id === quote.client_id) ||
                                                                clientsList.find(c => c.email === quote.email);

                                                            setNewCantiere(prev => ({
                                                                ...prev,
                                                                quote_id: quote._id,
                                                                nome_cantiere: `Project ${quote.full_name || 'New'}`,
                                                                client_id: quote.client_id || (client ? client._id : null),
                                                                cliente: quote.full_name || quote.email,
                                                                valore_contratto: quote.estimated_price?.toString() || '',
                                                                valore_progetto: quote.estimated_price?.toString() || ''
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                                        <SelectValue placeholder="Select accepted quote..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white/5 border-white/10 text-white">
                                                        {allQuotes.filter(q => q.status === 'accepted' && !q.cantiere_id).map(quote => (
                                                            <SelectItem key={quote._id} value={quote._id} className="text-white">
                                                                {quote.full_name} - â‚¬{quote.estimated_price?.toLocaleString()}
                                                            </SelectItem>
                                                        ))}
                                                        {allQuotes.filter(q => q.status === 'accepted' && !q.cantiere_id).length === 0 && (
                                                            <div className="p-2 text-sm text-white/40 text-center">No accepted quotes available</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-white/25">Solo i preventivi "Accettati" e non ancora collegati possono essere selezionati.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-white/70">Nome Cantiere</Label>
                                                <Input
                                                    value={newCantiere.nome_cantiere}
                                                    onChange={e => setNewCantiere({ ...newCantiere, nome_cantiere: e.target.value })}
                                                    placeholder="Es. Ristrutturazione Villa Rossi"
                                                    className="bg-[#535252] border-white/10 text-white placeholder:text-white/40"
                                                />
                                            </div>

                                            {/* Client Info (Read Only or verify) */}
                                            <div className="space-y-2">
                                                <Label className="text-white/70">Client</Label>
                                                <Input
                                                    value={newCantiere.cliente}
                                                    readOnly
                                                    placeholder="Select a quote to prefill"
                                                    className="bg-[#1C1A18] border-white/10 text-white/40 cursor-not-allowed"
                                                />
                                                {!newCantiere.client_id && newCantiere.quote_id && (
                                                    <p className="text-xs text-yellow-500">Attenzione: Il preventivo selezionato non ha un cliente collegato nel database.</p>
                                                )}
                                            </div>

                                            {/* Address */}
                                            <div className="space-y-2">
                                                <Label className="text-white/70">Indirizzo Cantiere</Label>
                                                <Input
                                                    value={newCantiere.indirizzo}
                                                    onChange={e => setNewCantiere({ ...newCantiere, indirizzo: e.target.value })}
                                                    placeholder="Via, Numero, CittÃ "
                                                    className="bg-[#535252] border-white/10 text-white placeholder:text-white/40"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-white/70">Valore Contratto (â‚¬)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newCantiere.valore_contratto}
                                                        onChange={e => setNewCantiere({ ...newCantiere, valore_contratto: e.target.value })}
                                                        className="bg-[#535252] border-white/10 text-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-white/70">Valore Progetto (â‚¬)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newCantiere.valore_progetto}
                                                        onChange={e => setNewCantiere({ ...newCantiere, valore_progetto: e.target.value })}
                                                        placeholder="Stima progetto"
                                                        className="bg-[#535252] border-white/10 text-white placeholder:text-white/40"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white/70">Fase Iniziale</Label>
                                                <Select
                                                    value={newCantiere.status}
                                                    onValueChange={v => setNewCantiere({ ...newCantiere, status: v })}
                                                >
                                                    <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white/5 border-white/10 text-white">
                                                        {KANBAN_PHASES.map(phase => (
                                                            <SelectItem key={phase.id} value={phase.id} className="text-white focus:bg-[#535252] focus:text-white">
                                                                {phase.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                onClick={handleCreate}
                                                disabled={!newCantiere.nome_cantiere || !newCantiere.quote_id || !newCantiere.client_id}
                                                className="w-full bg-[#F0EBE8] text-[#141210] hover:bg-white/10 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Crea Cantiere
                                            </Button>
                                            {!newCantiere.client_id && newCantiere.quote_id && (
                                                <p className="text-xs text-red-400 mt-2 text-center">
                                                    Impossibile creare cantiere: Il preventivo selezionato non è associato a un cliente.
                                                </p>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>

                    {/* Search and View Toggle */}
                    <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 mb-6">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <Input
                                    placeholder="Search project..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-[#535252] border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="bg-[#535252]">
                                    <TabsTrigger value="kanban" className="text-white/40 data-[state=active]:bg-[#F0EBE8] data-[state=active]:text-[#141210]">
                                        Kanban
                                    </TabsTrigger>
                                    <TabsTrigger value="grid" className="text-white/40 data-[state=active]:bg-[#F0EBE8] data-[state=active]:text-[#141210]">
                                        Griglia
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Kanban View */}
                    {activeTab === 'kanban' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {KANBAN_PHASES.map(phase => (
                                <div
                                    key={phase.id}
                                    className={`min-w-[280px] transition-all duration-200 ${dragOverPhase === phase.id ? 'scale-[1.02]' : ''
                                        }`}
                                    onDragOver={(e) => handleDragOver(e, phase.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, phase.id)}
                                >
                                    {/* Phase Header */}
                                    <div className={`flex items-center gap-2 mb-3 p-3 rounded-lg bg-[#1C1A18]/ border ${dragOverPhase === phase.id ? 'border-white/10' : 'border-white/10'
                                        }`}>
                                        <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                                        <h3 className="font-medium text-white">{phase.label}</h3>
                                        <span className="ml-auto text-xs bg-[#535252] px-2 py-1 rounded-full text-white/70">
                                            {cantieriByPhase[phase.id]?.length || 0}
                                        </span>
                                    </div>

                                    {/* Projects Cards */}
                                    <div className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${dragOverPhase === phase.id ? 'bg-[#535252]/' : ''
                                        }`}>
                                        {(cantieriByPhase[phase.id] || []).map(cantiere => (
                                            <motion.div
                                                key={cantiere._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{
                                                    opacity: draggedItem?._id === cantiere._id ? 0.5 : 1,
                                                    y: 0
                                                }}
                                                draggable={isAdmin}
                                                onDragStart={(e) => isAdmin && handleDragStart(e, cantiere)}
                                                onDragEnd={isAdmin ? handleDragEnd : undefined}
                                                className={`bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/10 transition-all ${draggedItem?._id === cantiere._id ? 'ring-2 ring-[#F0EBE8]' : ''
                                                    } ${!isAdmin ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                                                onClick={() => setSelectedCantiere(cantiere)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-white text-sm line-clamp-1">
                                                        {cantiere.nome_cantiere}
                                                    </h4>
                                                    <GripVertical size={14} className="text-white/25 flex-shrink-0" />
                                                </div>
                                                <p className="text-xs text-white/40 mb-3 flex items-center gap-1">
                                                    <Building size={12} />
                                                    {cantiere.cliente}
                                                </p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-white/70">
                                                        â‚¬ {cantiere.valore_contratto?.toLocaleString() || '0'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-[#535252] rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${phase.color} rounded-full transition-all`}
                                                                style={{ width: `${cantiere.progresso || 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-white/70">{cantiere.progresso || 0}%</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {(!cantieriByPhase[phase.id] || cantieriByPhase[phase.id].length === 0) && (
                                            <div className="text-center py-8 text-white/25 text-sm border-2 border-dashed border-white/10 rounded-lg">
                                                Trascina qui
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Grid View */}
                    {activeTab === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.length === 0 ? (
                                <div className="col-span-full text-center py-12 bg-white/5 rounded-2xl border border-white/8">
                                    <Building size={48} className="text-white/25 mx-auto mb-4" />
                                    <h3 className="text-xl text-white/70">No projects found</h3>
                                    <p className="text-white/40 mt-2">Create your first project to get started.</p>
                                </div>
                            ) : (
                                filteredProjects.map(cantiere => (
                                    <motion.div
                                        key={cantiere._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        onClick={() => setSelectedCantiere(cantiere)}
                                        className="cursor-pointer"
                                    >
                                        <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 h-full hover:border-white/10 transition-all overflow-hidden">
                                            <CardHeader className="p-5 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(cantiere.status)} text-white`}>
                                                        {getPhaseLabel(cantiere.status)}
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-medium text-white mt-3 line-clamp-1">
                                                    {cantiere.nome_cantiere}
                                                </CardTitle>
                                                <p className="text-sm text-white/40 flex items-center gap-1 mt-1">
                                                    <Building size={14} />
                                                    {cantiere.cliente}
                                                </p>
                                            </CardHeader>
                                            <CardContent className="p-5 pt-2">
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-white/40">Valore</span>
                                                        <span className="text-white font-medium">â‚¬ {cantiere.valore_contratto?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-white/40">Progress</span>
                                                        <span className="text-white font-medium">{cantiere.progresso || 0}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-[#535252] rounded-full overflow-hidden"><div className="h-full bg-[#FFC703] transition-all rounded-full" style={{ width: `${cantiere.progresso || 0}%` }} /></div>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/40">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(cantiere.created_date).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[#FFC703]">
                                                        Dettagli <ChevronRight size={14} />
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cantiere Detail Sidebar */}
            <AnimatePresence>
                {selectedCantiere && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40"
                            onClick={() => setSelectedCantiere(null)}
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-screen w-full max-w-lg bg-[#141210] border-l border-white/10 z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 bg-[#1C1A18] flex-shrink-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-medium text-white">{selectedCantiere.nome_cantiere}</h2>
                                        <p className="text-sm text-white/40 mt-1">{selectedCantiere.cliente}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedCantiere(null)}
                                        className="text-white/40 hover:text-white hover:bg-[#535252]"
                                    >
                                        <X size={20} />
                                    </Button>
                                    {isAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={async () => {
                                                if (window.confirm("Sei sicuro di voler eliminare DEFINITIVAMENTE questo cantiere? L'operazione non può essere annullata.")) {
                                                    try {
                                                        await deleteCantiereMutation({ id: selectedCantiere._id });
                                                        setSelectedCantiere(null);
                                                    } catch (e) {
                                                        alert("Errore durante l'eliminazione: " + e.message);
                                                    }
                                                }
                                            }}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
                                        >
                                            <Trash2 size={20} />
                                        </Button>
                                    )}
                                </div>

                                {/* Phase Selector */}
                                <div className="mt-4">
                                    <Label className="text-xs text-white/40 mb-2 block">Fase Corrente</Label>
                                    <Select
                                        value={selectedCantiere.status}
                                        onValueChange={(v) => handlePhaseChange(selectedCantiere._id, v)}
                                        disabled={!isAdmin}
                                    >
                                        <SelectTrigger className="bg-[#535252] border-white/10 text-white disabled:opacity-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white/5 border-white/10 text-white">
                                            {KANBAN_PHASES.map(phase => (
                                                <SelectItem key={phase.id} value={phase.id} className="text-white focus:bg-[#535252] focus:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${phase.color}`} />
                                                        {phase.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <TabsList className="bg-transparent border-b border-white/10 rounded-none px-6 justify-start flex-shrink-0 h-auto py-0">
                                    <TabsTrigger value="details" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white/10 rounded-none">
                                        Dettagli
                                    </TabsTrigger>
                                    <TabsTrigger value="tasks" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white/10 rounded-none">
                                        Tasks
                                    </TabsTrigger>
                                    <TabsTrigger value="team" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white/10 rounded-none">
                                        Team
                                    </TabsTrigger>
                                    <TabsTrigger value="messages" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white/10 rounded-none">
                                        Messages
                                    </TabsTrigger>
                                    <TabsTrigger value="bodycam" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white/10 rounded-none">
                                        Bodycam
                                    </TabsTrigger>
                                </TabsList>

                                {/* Details Tab */}
                                <TabsContent value="details" className="flex-1 overflow-y-auto p-6 pt-4 m-0 min-h-0">
                                    <div className="space-y-6 pb-12">
                                        {/* Value & Progress Cards */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#1C1A18] rounded-xl p-4 border border-white/10">
                                                <p className="text-xs text-white/40 mb-1">Valore Contratto</p>
                                                <p className="text-lg font-medium text-white">
                                                    â‚¬ {selectedCantiere.valore_contratto?.toLocaleString() || '0'}
                                                </p>
                                            </div>
                                            <div className="bg-[#1C1A18] rounded-xl p-4 border border-white/10">
                                                <p className="text-xs text-white/40 mb-1">Progress (auto)</p>
                                                <p className="text-lg font-medium text-white">
                                                    {selectedCantiere.progresso || 0}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Client Info */}
                                        {cantiereDetail?.client && (
                                            <div className="bg-[#1C1A18] rounded-xl p-4 border border-white/10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-[#FFC703]/20 flex items-center justify-center">
                                                        <User size={14} className="text-[#FFC703]" />
                                                    </div>
                                                    <p className="text-sm font-medium text-white">Informazioni Client</p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <User size={14} className="text-white/25 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-white/25">Nome</p>
                                                            <p className="text-sm text-white font-medium">{cantiereDetail.client.full_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Mail size={14} className="text-white/25 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-white/25">Email</p>
                                                            <p className="text-sm text-white">{cantiereDetail.client.email}</p>
                                                        </div>
                                                    </div>
                                                    {cantiereDetail.client.phone && (
                                                        <div className="flex items-center gap-3">
                                                            <Phone size={14} className="text-white/25 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-white/25">Telefono</p>
                                                                <p className="text-sm text-white">{cantiereDetail.client.phone}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {cantiereDetail.client.address && (
                                                        <div className="flex items-center gap-3">
                                                            <MapPin size={14} className="text-white/25 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-white/25">Indirizzo</p>
                                                                <p className="text-sm text-white">{cantiereDetail.client.address}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {cantiereDetail.client.fiscal_code && (
                                                        <div className="flex items-center gap-3">
                                                            <FileText size={14} className="text-white/25 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-white/25">Codice Fiscale / P.IVA</p>
                                                                <p className="text-sm text-white font-mono">{cantiereDetail.client.fiscal_code}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {cantiereDetail.client.company_name && (
                                                        <div className="flex items-center gap-3">
                                                            <Building size={14} className="text-white/25 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-white/25">Azienda</p>
                                                                <p className="text-sm text-white">{cantiereDetail.client.company_name}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="pt-2 border-t border-white/10">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cantiereDetail.client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                            cantiereDetail.client.status === 'lead' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {cantiereDetail.client.status === 'active' ? 'Active' :
                                                                cantiereDetail.client.status === 'lead' ? 'Lead' : 'Archived'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Linked Quotes */}
                                        <div className="bg-[#1C1A18] rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-[#FFC703]/10 flex items-center justify-center">
                                                    <Receipt size={14} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">Linked Quotes</p>
                                                    <p className="text-xs text-white/25">
                                                        {cantiereDetail?.quotes?.length || 0} preventiv{(cantiereDetail?.quotes?.length || 0) === 1 ? 'o' : 'i'}
                                                    </p>
                                                </div>
                                            </div>

                                            {(!cantiereDetail?.quotes || cantiereDetail.quotes.length === 0) ? (
                                                <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-lg">
                                                    <Receipt size={24} className="text-white/25 mx-auto mb-2" />
                                                    <p className="text-sm text-white/25">No linked quotes</p>
                                                    <p className="text-xs text-[#535252] mt-1">Collega un preventivo dalla sezione Quotes</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {cantiereDetail.quotes.map((quote) => (
                                                        <div key={quote._id} className="bg-[#141210] rounded-lg p-3 border border-white/10 hover:border-white/10 transition-colors">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <p className="text-sm font-medium text-white">
                                                                        {quote.quote_type === 'finestre' ? 'ðŸªŸ Solo Infissi' :
                                                                            quote.quote_type === 'chiavi_in_mano' ? 'ðŸ  Chiavi in Mano' :
                                                                                quote.quote_type === 'completo' ? 'ðŸ—ï¸ Completo' : quote.quote_type}
                                                                    </p>
                                                                    <p className="text-xs text-white/25 mt-0.5">
                                                                        {quote.full_name || quote.email}
                                                                    </p>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${quote.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                                    quote.status === 'in_revisione' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        quote.status === 'inviato' ? 'bg-[#FFC703]/20 text-[#FFC703]' :
                                                                            quote.status === 'rifiutato' ? 'bg-red-500/20 text-red-400' :
                                                                                'bg-gray-500/20 text-gray-400'
                                                                    }`}>
                                                                    {quote.status === 'completed' ? 'Completed' :
                                                                        quote.status === 'in_revisione' ? 'In Review' :
                                                                            quote.status === 'inviato' ? 'Sent' :
                                                                                quote.status === 'rifiutato' ? 'Rejected' :
                                                                                    quote.status?.replace(/_/g, ' ') || 'New'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 text-xs text-white/40">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar size={10} />
                                                                        {quote.created_date ? new Date(quote.created_date).toLocaleDateString('en-GB') : '-'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-white font-semibold text-sm">
                                                                    â‚¬ {quote.estimated_price?.toLocaleString('it-IT') || '0'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Total */}
                                                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                                        <p className="text-xs text-white/40 font-medium">Totale Quotes</p>
                                                        <p className="text-white font-bold">
                                                            â‚¬ {cantiereDetail.quotes.reduce((sum, q) => sum + (q.estimated_price || 0), 0).toLocaleString('it-IT')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="bg-[#1C1A18] rounded-xl p-4 border border-white/10">
                                            <p className="text-xs text-white/40 mb-3">Progresso Lavori (automatico)</p>
                                            <div className="space-y-3">
                                                <div className="h-3 bg-[#535252] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#FFC703] to-green-500 transition-all rounded-full"
                                                        style={{ width: `${selectedCantiere.progresso || 0}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-white/40">
                                                    <span>0%</span>
                                                    <span className="text-white font-medium">{selectedCantiere.progresso || 0}% completed</span>
                                                    <span>100%</span>
                                                </div>
                                                <p className="text-xs text-white/25 italic">
                                                    Calcolato automaticamente dal completamento delle task
                                                </p>
                                            </div>
                                        </div>

                                        {/* Workflow */}
                                        <div className="bg-[#1C1A18] rounded-xl p-4 border border-white/10">
                                            <p className="text-xs text-white/40 mb-3">Flusso di Lavoro</p>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {KANBAN_PHASES.map((phase, idx) => (
                                                    <React.Fragment key={phase.id}>
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${selectedCantiere.status === phase.id
                                                            ? `${phase.color} text-white font-medium`
                                                            : 'bg-[#535252] text-white/40'
                                                            }`}>
                                                            {phase.label}
                                                        </div>
                                                        {idx < KANBAN_PHASES.length - 1 && (
                                                            <ArrowRight size={12} className="text-white/25" />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Tasks Tab - Phase Based */}
                                <TabsContent value="tasks" className="flex-1 overflow-y-auto p-6 pt-4 m-0 min-h-0">
                                    <div className="space-y-6 pb-12">
                                        {/* Overall Progress */}
                                        <div className="bg-gradient-to-r from-[#FFC703]/20 to-[#FFC703]/20 rounded-xl p-4 border border-[#FFC703]/20">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-medium text-white">Progresso Totale</h3>
                                                <span className="text-sm text-[#FFC703] font-medium">
                                                    {phaseTasks.filter(t => t.status === 'completato').length}/{phaseTasks.length} task completate
                                                </span>
                                            </div>
                                            <div className="h-3 bg-[#535252] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#FFC703] to-green-500 transition-all rounded-full"
                                                    style={{ width: `${phaseTasks.length > 0 ? Math.round((phaseTasks.filter(t => t.status === 'completato').length / phaseTasks.length) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Phase Sections */}
                                        {KANBAN_PHASES.map((phase) => {
                                            const phaseName = phase.id;
                                            const tasksInPhase = phaseTasks.filter(t => t.phase === phaseName);
                                            const completedInPhase = tasksInPhase.filter(t => t.status === 'completato').length;
                                            const phaseProgress = tasksInPhase.length > 0 ? Math.round((completedInPhase / tasksInPhase.length) * 100) : 0;
                                            const isExpanded = expandedPhase === phaseName;

                                            return (
                                                <div key={phase.id} className="bg-[#1C1A18] rounded-xl border border-white/10 overflow-hidden">
                                                    {/* Phase Header */}
                                                    <button
                                                        onClick={() => setExpandedPhase(isExpanded ? null : phaseName)}
                                                        className="w-full flex items-center justify-between p-4 hover:bg-[#535252]/ transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                                                            <span className="font-medium text-white">{phase.label}</span>
                                                            <span className="text-xs text-white/25">({tasksInPhase.length} task)</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-24 h-2 bg-[#535252] rounded-full overflow-hidden">
                                                                <div className={`h-full ${phase.color} transition-all rounded-full`} style={{ width: `${phaseProgress}%` }} />
                                                            </div>
                                                            <span className="text-sm text-white/40 min-w-[3rem] text-right">{phaseProgress}%</span>
                                                            <ChevronDown size={16} className={`text-white/25 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {/* Expanded Content */}
                                                    {isExpanded && (
                                                        <div className="border-t border-white/10 p-4 space-y-4">
                                                            {/* Add Task Form for this phase */}
                                                            {isAdmin && (
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        value={newPhaseTask.phase === phaseName ? newPhaseTask.title : ''}
                                                                        onChange={(e) => setNewPhaseTask({ ...newPhaseTask, title: e.target.value, phase: phaseName })}
                                                                        placeholder={`Nuova task per ${phase.label}...`}
                                                                        className="flex-1 bg-[#535252] border-white/10 text-white"
                                                                        onKeyPress={(e) => {
                                                                            if (e.key === 'Enter' && newPhaseTask.title.trim()) {
                                                                                createPhaseTaskMutation({
                                                                                    cantiere_id: selectedCantiere._id,
                                                                                    phase: phaseName,
                                                                                    title: newPhaseTask.title.trim(),
                                                                                    priority: newPhaseTask.priority,
                                                                                    assigned_to: newPhaseTask.assigned_to || undefined
                                                                                });
                                                                                setNewPhaseTask({ title: '', phase: phaseName, priority: 'media', assigned_to: '' });
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Select
                                                                        value={newPhaseTask.priority}
                                                                        onValueChange={(v) => setNewPhaseTask({ ...newPhaseTask, priority: v })}
                                                                    >
                                                                        <SelectTrigger className="w-24 bg-[#535252] border-white/10 text-white">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-white/5 border-white/10">
                                                                            <SelectItem value="alta" className="text-red-400">Alta</SelectItem>
                                                                            <SelectItem value="media" className="text-yellow-400">Media</SelectItem>
                                                                            <SelectItem value="bassa" className="text-[#FFC703]">Bassa</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button
                                                                        onClick={() => {
                                                                            if (newPhaseTask.title.trim()) {
                                                                                createPhaseTaskMutation({
                                                                                    cantiere_id: selectedCantiere._id,
                                                                                    phase: phaseName,
                                                                                    title: newPhaseTask.title.trim(),
                                                                                    priority: newPhaseTask.priority,
                                                                                    assigned_to: newPhaseTask.assigned_to || undefined
                                                                                });
                                                                                setNewPhaseTask({ title: '', phase: phaseName, priority: 'media', assigned_to: '' });
                                                                            }
                                                                        }}
                                                                        size="sm"
                                                                        className="bg-[#FFC703] hover:bg-[#FFC703]"
                                                                    >
                                                                        <Plus size={16} />
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {/* Tasks List */}
                                                            {tasksInPhase.length === 0 ? (
                                                                <div className="text-center py-6 text-white/25">
                                                                    <ClipboardList size={28} className="mx-auto mb-2 opacity-50" />
                                                                    <p className="text-sm">No task in questa fase</p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {tasksInPhase.map((task) => (
                                                                        <div
                                                                            key={task._id}
                                                                            className={`flex items-center gap-3 p-3 bg-[#535252]/ rounded-lg ${task.status === 'completed' ? 'opacity-60' : ''}`}
                                                                        >
                                                                            <button
                                                                                onClick={() => isAdmin && updatePhaseTaskMutation({
                                                                                    id: task._id,
                                                                                    data: { status: task.status === 'completato' ? 'da_fare' : 'completato' }
                                                                                })}
                                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${task.status === 'completed'
                                                                                    ? 'bg-green-500 border-green-500'
                                                                                    : 'border-white/10 hover:border-green-500'
                                                                                    } ${!isAdmin ? 'cursor-default opacity-50 hover:border-white/10' : ''}`}
                                                                            >
                                                                                {task.status === 'completed' && <Check size={12} className="text-white" />}
                                                                            </button>
                                                                            <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-white/25' : 'text-white'}`}>
                                                                                {task.title}
                                                                            </span>
                                                                            {task.assigned_to && (
                                                                                <span className="text-xs bg-[#FFC703]/20 text-[#FFC703] px-2 py-0.5 rounded">
                                                                                    {task.assigned_to.split('@')[0]}
                                                                                </span>
                                                                            )}
                                                                            <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'alta' ? 'bg-red-500/20 text-red-400' :
                                                                                task.priority === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                    'bg-[#FFC703]/20 text-[#FFC703]'
                                                                                }`}>
                                                                                {task.priority}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => removePhaseTaskMutation({ id: task._id })}
                                                                                className={`text-white/25 hover:text-red-400 transition-colors ${!isAdmin ? 'hidden' : ''}`}
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>

                                {/* Team Tab */}
                                <TabsContent value="team" className="flex-1 overflow-y-auto p-6 pt-4 m-0 min-h-0">
                                    <div className="space-y-4 pb-12">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-white">Team Assegnato</h3>
                                            {isAdmin && (
                                                <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" className="bg-[#FFC703] hover:bg-[#FFC703] text-white">
                                                            <UserPlus size={14} className="mr-1" />
                                                            Invita
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-white/5 border-white/10 text-white">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-white">Invita Membro del Team</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-white/70">Select Collaborators</Label>
                                                                <div className="max-h-60 overflow-y-auto space-y-2 bg-[#141210] p-2 rounded-lg border border-white/10">
                                                                    {collaboratoriList.length === 0 ? (
                                                                        <p className="text-sm text-white/40 text-center p-2">No collaborators found. Vai su Staff per aggiungerne.</p>
                                                                    ) : (
                                                                        collaboratoriList.map(collab => {
                                                                            const isSelected = inviteEmails.includes(collab.email);
                                                                            const isAlreadyMember = cantiereTeam?.some(m => m.email === collab.email);
                                                                            return (
                                                                                <div 
                                                                                    key={collab._id} 
                                                                                    onClick={() => {
                                                                                        if (isAlreadyMember) return;
                                                                                        if (isSelected) setInviteEmails(prev => prev.filter(e => e !== collab.email));
                                                                                        else setInviteEmails(prev => [...prev, collab.email]);
                                                                                    }}
                                                                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isAlreadyMember ? 'opacity-50 cursor-not-allowed bg-[#1C1A18]' : isSelected ? 'bg-[#FFC703]/20 border border-[#FFC703]/50' : 'bg-[#1C1A18] hover:bg-[#535252] border border-transparent'}`}
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-8 h-8 rounded-full bg-[#535252] flex items-center justify-center text-xs font-medium text-white">
                                                                                            {collab.full_name[0]}
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-sm text-white">{collab.full_name}</p>
                                                                                            <p className="text-xs text-white/40">{collab.email}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    {isAlreadyMember ? (
                                                                                        <span className="text-[10px] px-2 py-1 bg-[#535252] rounded text-white/40">GiÃ  membro</span>
                                                                                    ) : isSelected ? (
                                                                                        <Check size={16} className="text-[#FFC703]" />
                                                                                    ) : null}
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="bg-[#535252]/ rounded-lg p-3">
                                                                <p className="text-xs text-white/40">
                                                                    Il membro riceverÃ  un'email con un link per accedere a questo cantiere.
                                                                    PotrÃ  visualizzare i dettagli, modificare il progresso e comunicare tramite la chat.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button
                                                                onClick={handleInviteTeamMember}
                                                                disabled={inviteEmails.length === 0 || inviteSending}
                                                                className="bg-[#FFC703] hover:bg-[#FFC703] text-white"
                                                            >
                                                                {inviteSending ? (
                                                                    <>
                                                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                                                        Invio...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Send size={16} className="mr-2" />
                                                                        Send Invite
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>

                                        {/* Team Members */}
                                        <div className="space-y-2">
                                            {/* Owner */}
                                            <div className="flex items-center gap-3 p-3 bg-[#1C1A18] rounded-lg border border-white/10">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC703] to-[#FFC703] flex items-center justify-center text-white font-medium">
                                                    {user?.fullName?.[0] || 'A'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{user?.fullName || 'Admin'}</p>
                                                    <p className="text-xs text-white/40 truncate">{userEmail}</p>
                                                </div>
                                                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded flex-shrink-0">
                                                    Proprietario
                                                </span>
                                            </div>

                                            {/* Team Members from DB */}
                                            {cantiereTeam.map((member) => (
                                                <div key={member._id} className="flex items-center gap-3 p-3 bg-[#1C1A18] rounded-lg border border-white/10">
                                                    <div className="w-10 h-10 rounded-full bg-[#535252] flex items-center justify-center">
                                                        <Users size={18} className="text-white/40" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white truncate">{member.email}</p>
                                                        <p className="text-xs text-white/40">
                                                            {member.status === 'pending' ? 'Invite Pending' : 'Active Member'}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${member.status === 'pending'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-[#FFC703]/20 text-[#FFC703]'
                                                        }`}>
                                                        {member.role === 'worker' ? 'Worker' : member.role}
                                                    </span>
                                                </div>
                                            ))}

                                            {cantiereTeam.length === 0 && (
                                                <div className="text-center py-8 text-white/25">
                                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No team members</p>
                                                    <p className="text-xs">Invita lavoratori per collaborare</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Messages Tab */}
                                <TabsContent value="messages" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden">
                                    {/* Messages List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-8">
                                                <MessageSquare size={32} className="text-white/25 mx-auto mb-2" />
                                                <p className="text-sm text-white/40">No messages</p>
                                                <p className="text-xs text-white/25">Inizia una conversazione con il team</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <div
                                                    key={msg._id}
                                                    className={`flex ${msg.sender_email === userEmail ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] rounded-xl p-3 ${msg.sender_email === userEmail
                                                        ? 'bg-[#FFC703] text-white'
                                                        : 'bg-[#1C1A18] text-white border border-white/10'
                                                        }`}>
                                                        <p className="text-xs opacity-70 mb-1">{msg.sender_name}</p>

                                                        {/* Voice Message */}
                                                        {msg.message_type === 'voice' && msg.file_url && (
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Volume2 size={16} />
                                                                <audio controls src={msg.file_url} className="h-8 max-w-[200px]" />
                                                            </div>
                                                        )}

                                                        {/* Image */}
                                                        {msg.message_type === 'image' && msg.file_url && (
                                                            <img
                                                                src={msg.file_url}
                                                                alt="Immagine"
                                                                className="max-w-full rounded-lg mb-1 cursor-pointer"
                                                                onClick={() => window.open(msg.file_url, '_blank')}
                                                            />
                                                        )}

                                                        {/* File */}
                                                        {msg.message_type === 'file' && msg.file_url && (
                                                            <div
                                                                onClick={() => {
                                                                    const isPdf = msg.file_name?.toLowerCase().endsWith('.pdf');
                                                                    if (isPdf) {
                                                                        setViewPdfUrl(msg.file_url);
                                                                    } else {
                                                                        window.open(msg.file_url, '_blank');
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 p-2 bg-white/10 rounded mb-1 hover:bg-white/20 cursor-pointer"
                                                            >
                                                                <FileText size={16} />
                                                                <span className="text-sm truncate">{msg.file_name || 'File'}</span>
                                                            </div>
                                                        )}

                                                        {/* Text Content */}
                                                        {msg.content && msg.message_type !== 'voice' && (
                                                            <p className="text-sm">{msg.content}</p>
                                                        )}

                                                        <p className="text-[10px] opacity-50 mt-1">
                                                            {new Date(msg.created_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Recording UI */}
                                    {(isRecording || audioBlob) && (
                                        <div className="px-4 py-2 bg-[#1C1A18] border-t border-white/10">
                                            <div className="flex items-center gap-3">
                                                {isRecording ? (
                                                    <>
                                                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                                        <span className="text-white text-sm">Registrazione... {formatTime(recordingTime)}</span>
                                                        <Button size="sm" variant="ghost" onClick={stopRecording} className="ml-auto text-white">
                                                            <MicOff size={16} className="mr-1" />
                                                            Stop
                                                        </Button>
                                                    </>
                                                ) : audioBlob && (
                                                    <>
                                                        <Volume2 size={16} className="text-white/40" />
                                                        <span className="text-white text-sm">Messaggio vocale ({formatTime(recordingTime)})</span>
                                                        <Button size="sm" variant="ghost" onClick={cancelRecording} className="ml-auto text-red-400">
                                                            <X size={16} />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected File Preview */}
                                    {selectedFile && (
                                        <div className="px-4 py-2 bg-[#1C1A18] border-t border-white/10">
                                            <div className="flex items-center gap-3">
                                                {selectedFile.type.startsWith('image/') ? (
                                                    <Image size={16} className="text-white/40" />
                                                ) : (
                                                    <FileText size={16} className="text-white/40" />
                                                )}
                                                <span className="text-white text-sm truncate flex-1">{selectedFile.name}</span>
                                                <Button size="sm" variant="ghost" onClick={() => setSelectedFile(null)} className="text-red-400">
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-white/10 bg-[#1C1A18]">
                                        <div className="flex gap-2">
                                            {/* File Upload */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf,.doc,.docx"
                                                className="hidden"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-white/40 hover:text-white hover:bg-[#535252]"
                                                disabled={isRecording}
                                            >
                                                <Paperclip size={18} />
                                            </Button>

                                            {/* Voice Record */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={`${isRecording ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-white'} hover:bg-[#535252]`}
                                                disabled={!!audioBlob}
                                            >
                                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                            </Button>

                                            {/* Text Input */}
                                            <Input
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder="Scrivi un messaggio..."
                                                className="flex-1 bg-[#535252] border-white/10 text-white placeholder:text-white/40"
                                                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                                disabled={isRecording}
                                            />

                                            {/* Send Button */}
                                            <Button
                                                onClick={handleSendMessage}
                                                disabled={(!newMessage.trim() && !audioBlob && !selectedFile) || isRecording}
                                                className="bg-[#FFC703] hover:bg-[#FFC703] text-white"
                                            >
                                                <Send size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Bodycam Tab - Placeholder */}
                                <TabsContent value="bodycam" className="flex-1 overflow-y-auto p-6 pt-4 m-0 min-h-0">
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-sm mx-auto">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-[#FFC703]/10 flex items-center justify-center animate-pulse">
                                                <Camera size={48} className="text-[#FFC703] opacity-50" />
                                            </div>
                                            <Shield className="absolute -top-1 -right-1 text-blue-500" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-white mb-2">Kranely Bodycamâ„¢</h3>
                                            <p className="text-sm text-white/40">
                                                Stiamo lavorando per portare la trasparenza totale in cantiere. 
                                                Presto potrai vedere lo streaming live e le registrazioni delle bodycam indossate dai nostri operai.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <div className="bg-[#1C1A18] p-4 rounded-xl border border-white/10 flex flex-col items-center gap-2">
                                                <Smartphone size={20} className="text-white/25" />
                                                <span className="text-[10px] text-white/25 uppercase tracking-wider">Live Stream</span>
                                            </div>
                                            <div className="bg-[#1C1A18] p-4 rounded-xl border border-white/10 flex flex-col items-center gap-2">
                                                <Video size={20} className="text-white/25" />
                                                <span className="text-[10px] text-white/25 uppercase tracking-wider">Cloud Storage</span>
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/20 text-[#FFC703] text-xs font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            Sviluppo in corso
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}




