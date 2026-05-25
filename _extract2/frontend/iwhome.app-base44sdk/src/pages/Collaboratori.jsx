import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from "react-qr-code";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import { useUser } from "@clerk/clerk-react";
import {
    Users, UserPlus, Search, Clock, MapPin, Phone, Mail, Briefcase,
    Edit, Trash2, Loader2, CheckCircle, XCircle, Plus, Eye,
    HardHat, Activity, ChevronRight, MessageCircle, Send, PhoneCall,
    CreditCard, ExternalLink, CalendarDays, Building2, Link, Shield, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';



const liveStatusConfig = {
    in_cantiere: { label: 'In Cantiere', color: 'bg-green-500', dot: 'bg-green-400 animate-pulse' },
    in_ufficio: { label: 'In Ufficio', color: 'bg-blue-500', dot: 'bg-blue-400' },
    disponibile: { label: 'Disponibile', color: 'bg-yellow-500', dot: 'bg-yellow-400' },
    non_disponibile: { label: 'Non Disponibile', color: 'bg-gray-500', dot: 'bg-gray-400' },
};

export default function Collaboratori() {
    const { isAdmin, canView, isLoading: rbacLoading } = useRBAC();
    const { user } = useUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', type: 'internal', job_title: '', fiscal_code: '', contract_type: 'tempo_pieno', hourly_rate: '', salary: '', payment_frequency: 'monthly', location_type: 'site', notes: '',
        contract_start_date: '', contract_end_date: '', assigned_cantieri: []
    });
    const [selectedContractFile, setSelectedContractFile] = useState(null);
    const [isUploadingContract, setIsUploadingContract] = useState(false);

    const collaborators = useQuery(api.collaborators.list, typeFilter !== 'all' ? { type: typeFilter } : {}) || [];
    const stats = useQuery(api.collaborators.getStats) || null;
    const allCollabPayments = useQuery(api.payments.list, { type: 'collaborator' }) || [];
    const allHours = useQuery(api.collaborators.listHours, {}) || [];
    const cantieri = useQuery(api.cantieri.listCantieri, { company_email: userEmail }) || [];
    const createMutation = useMutation(api.collaborators.create);
    const updateMutation = useMutation(api.collaborators.update);
    const removeMutation = useMutation(api.collaborators.remove);
    const logHoursMutation = useMutation(api.collaborators.logHours);
    const approveHoursMutation = useMutation(api.collaborators.approveHours);
    const removeHoursMutation = useMutation(api.collaborators.removeHours);

    const [activeTab, setActiveTab] = useState('anagrafica');
    const [showHoursModal, setShowHoursModal] = useState(false);
    const [hoursForm, setHoursForm] = useState({
        collaborator_id: '', cantiere_id: '', date: new Date().toISOString().split('T')[0], hours_worked: '', description: ''
    });

    const jobTitles = useQuery(api.job_titles.list, {}) || [];
    const generateOnboarding = useMutation(api.collaborators.generateOnboardingLink);
    const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
    const seedJobTitlesMutation = useMutation(api.job_titles.seedDefaults);
    const [onboardingLink, setOnboardingLink] = useState(null);
    const [selectedCollabDetailId, setSelectedCollabDetailId] = useState(null);

    if (rbacLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>);
    }

    if (!canView('collaboratori')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">

                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
                </div>
            </div>
        );
    }

    const handleCreate = async () => {
        try {
            setIsUploadingContract(true);
            let contractStorageId = undefined;
            if (selectedContractFile) {
                const uploadUrl = await generateUploadUrl();
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedContractFile.type },
                    body: selectedContractFile,
                });
                const { storageId } = await result.json();
                contractStorageId = storageId;
            }

            const id = await createMutation({
                ...formData,
                hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
                salary: formData.salary ? parseFloat(formData.salary) : undefined,
                assigned_cantieri: formData.assigned_cantieri.length > 0 ? formData.assigned_cantieri : undefined,
                contract_start_date: formData.contract_start_date || undefined,
                contract_end_date: formData.contract_end_date || undefined,
                documents: contractStorageId ? [contractStorageId] : undefined,
            });
            setShowModal(false);
            setFormData({ full_name: '', email: '', phone: '', type: 'internal', job_title: '', fiscal_code: '', contract_type: 'tempo_pieno', hourly_rate: '', salary: '', payment_frequency: 'monthly', location_type: 'site', notes: '', contract_start_date: '', contract_end_date: '', assigned_cantieri: [] });
            setSelectedContractFile(null);
            
            // Auto trigger onboarding link generation
            if (window.confirm("Collaboratore creato con successo. Vuoi generare ora il link di accesso WhatsApp?")) {
                handleGenerateOnboarding(id);
            }
        } catch (err) { console.error(err); } finally { setIsUploadingContract(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Eliminare questo collaboratore?')) return;
        try { await removeMutation({ id }); } catch (err) { console.error(err); }
    };

    const handleLogHours = async () => {
        if (!hoursForm.collaborator_id || !hoursForm.date || !hoursForm.hours_worked) return;
        try {
            const payload = /** @type {any} */ ({
                collaborator_id: hoursForm.collaborator_id,
                cantiere_id: hoursForm.cantiere_id || undefined,
                date: hoursForm.date,
                hours_worked: parseFloat(hoursForm.hours_worked),
                description: hoursForm.description,
            });
            await logHoursMutation(payload);
            setShowHoursModal(false);
            setHoursForm({ collaborator_id: '', cantiere_id: '', date: new Date().toISOString().split('T')[0], hours_worked: '', description: '' });
        } catch (err) { console.error(err); }
    };

    const handleApproveHours = async (id) => {
        try { await approveHoursMutation({ id }); }
        catch (err) { console.error(err); }
    };

    const handleDeleteHours = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo record di ore?")) return;
        try { await removeHoursMutation({ id }); } catch (err) { console.error(err); }
    };

    const handleUpdateLiveStatus = async (id, live_status) => {
        try { await updateMutation({ id, data: { live_status } }); } catch (err) { console.error(err); }
    };

    const handleGenerateOnboarding = async (id) => {
        try {
            const res = await generateOnboarding({ id });
            setOnboardingLink(res);
        } catch (err) { console.error(err); }
    };

    const filteredCollaborators = collaborators.filter(c => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return c.full_name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.job_title.toLowerCase().includes(s);
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">


            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                <Users className="text-indigo-400" /> Collaboratori
                            </h1>
                            <p className="text-[#adb5bd]">Gestione staff interno, collaboratori esterni, ore e presenze</p>
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                                    <UserPlus size={16} className="mr-2" /> Nuovo Collaboratore
                                </Button>
                                <Button onClick={() => setShowHoursModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
                                    <Clock size={16} className="mr-2" /> Registra Ore
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            {[
                                { label: 'Totale', value: stats.total, color: 'from-indigo-600 to-indigo-700', icon: Users },
                                { label: 'Interni', value: stats.internal, color: 'from-blue-600 to-blue-700', icon: Briefcase },
                                { label: 'Esterni', value: stats.external, color: 'from-purple-600 to-purple-700', icon: HardHat },
                                { label: 'Attivi', value: stats.active, color: 'from-green-600 to-green-700', icon: CheckCircle },
                                { label: 'In Cantiere', value: stats.inCantiere, color: 'from-yellow-600 to-yellow-700', icon: MapPin }].map(stat => (
                                <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} border-0`}>
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <stat.icon className="h-5 w-5 text-white/80" />
                                            <span className="text-xl font-light text-white">{stat.value}</span>
                                        </div>
                                        <p className="text-xs text-white/70 mt-1">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Tabs: Anagrafica | Ore */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                        <TabsList className="bg-[#343a40] border border-[#495057] w-full grid grid-cols-2">
                            <TabsTrigger value="anagrafica" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-[#adb5bd]">
                                <Users size={16} className="mr-2" /> Anagrafica
                            </TabsTrigger>
                            <TabsTrigger value="ore" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-[#adb5bd]">
                                <Clock size={16} className="mr-2" /> Ore Lavorate ({allHours.filter(h => !h.approved).length} da approvare)
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {activeTab === 'anagrafica' && (
                        <>
                            {/* Filters */}
                            <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-6">
                                <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                        <Input placeholder="Cerca collaboratori..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]" />
                                    </div>
                                    <div className="flex gap-2">
                                        {['all', 'internal', 'external'].map(f => (
                                            <Button key={f} variant={typeFilter === f ? "default" : "outline"} onClick={() => setTypeFilter(f)}
                                                className={typeFilter === f ? "bg-indigo-600 text-white" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}>
                                                {f === 'all' ? 'Tutti' : f === 'internal' ? 'Interni' : 'Esterni'}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Collaborator Cards */}
                            {filteredCollaborators.length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <Users size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun collaboratore trovato</h3>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredCollaborators.map((collab) => {
                                        const liveConfig = liveStatusConfig[collab.live_status] || liveStatusConfig.non_disponibile;
                                        return (
                                            <motion.div key={collab._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <Card className="bg-[#343a40] border border-[#495057] hover:border-indigo-500/50 transition-all h-full cursor-pointer group" onClick={() => setSelectedCollabDetailId(collab._id)}>
                                                    <CardContent className="p-5">
                                                        {/* Header */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                                                                    {collab.full_name[0]}
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-[#f8f9fa] font-medium flex items-center gap-2">
                                                                        {collab.full_name}
                                                                        {!collab.user_id && <Badge variant="outline" className="text-[9px] h-4 border-yellow-500/30 text-yellow-500 bg-yellow-500/10">In Attesa</Badge>}
                                                                    </h3>
                                                                    <p className="text-xs text-[#adb5bd]">{collab.job_title}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="flex items-center gap-1">
                                                                    <div className={`w-2 h-2 rounded-full ${liveConfig.dot}`} />
                                                                    <span className="text-[10px] text-[#adb5bd]">{liveConfig.label}</span>
                                                                </div>
                                                                {collab.user_id ? (
                                                                    <Badge variant="outline" className="text-[9px] h-4 border-green-500/30 text-green-400 bg-green-500/10 gap-1">
                                                                        <CheckCircle size={8} /> Collegato
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[9px] h-4 border-red-500/30 text-red-400 bg-red-500/10">
                                                                        Non Collegato
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="space-y-2 mt-3">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Mail size={14} className="text-[#6c757d]" />
                                                                <span className="text-[#adb5bd] truncate">{collab.email}</span>
                                                            </div>
                                                            {collab.phone && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Phone size={14} className="text-[#6c757d]" />
                                                                    <span className="text-[#adb5bd]">{collab.phone}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="default" className={`text-xs ${collab.type === 'internal' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                                    {collab.type === 'internal' ? 'Dipendente' : 'Esterno'}
                                                                </Badge>
                                                                <Badge variant="default" className={`text-xs ${collab.status === 'active' ? 'bg-green-500/20 text-green-400' : collab.status === 'on_leave' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                    {collab.status === 'active' ? 'Attivo' : collab.status === 'on_leave' ? 'In Ferie' : 'Inattivo'}
                                                                </Badge>
                                                            </div>
                                                            {collab.live_location && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <MapPin size={14} className="text-[#6c757d]" />
                                                                    <span className="text-[#adb5bd]">{collab.live_location}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Cross-reference: payments */}
                                                        {(() => {
                                                            const collabPayments = allCollabPayments.filter(p => p.collaborator_id === collab._id);
                                                            const pending = collabPayments.filter(p => p.status === 'in_attesa' || p.status === 'in_ritardo');
                                                            const pendingTotal = pending.reduce((sum, p) => sum + p.amount, 0);
                                                            return collabPayments.length > 0 ? (
                                                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                                    {pending.length > 0 && (
                                                                        <button onClick={() => navigate('/Pagamenti')} className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-md hover:bg-red-500/20 transition-all">
                                                                            <CreditCard size={10} /> {pending.length} pagamenti da saldare (€{pendingTotal.toLocaleString()})
                                                                        </button>
                                                                    )}
                                                                    {collabPayments.filter(p => p.status === 'pagato').length > 0 && (
                                                                        <span className="text-[10px] text-green-400/60">{collabPayments.filter(p => p.status === 'pagato').length} pagati</span>
                                                                    )}
                                                                </div>
                                                            ) : null;
                                                        })()}

                                                        {/* Actions */}
                                                        {isAdmin && (
                                                            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-[#495057]">
                                                                {collab.phone && (
                                                                    <a href={`tel:${collab.phone}`}>
                                                                        <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20 h-8 w-8 p-0">
                                                                            <PhoneCall size={14} />
                                                                        </Button>
                                                                    </a>
                                                                )}
                                                                <Button variant="ghost" size="sm" onClick={() => setShowChatModal(collab)} className="text-blue-400 hover:bg-blue-500/20 h-8 w-8 p-0" title="Messaggia">
                                                                    <MessageCircle size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(collab._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0">
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'ore' && (
                        <div className="space-y-3">
                            {allHours.length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <Clock size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun record ore trovato</h3>
                                </div>
                            ) : (
                                allHours.slice().reverse().map(hour => {
                                    const collab = collaborators.find(c => c._id === hour.collaborator_id);
                                    const cantiere = cantieri.find(c => c._id === hour.cantiere_id);
                                    return (
                                        <Card key={hour._id} className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-medium text-[#f8f9fa]">{collab?.full_name || 'N/D'}</span>
                                                        <Badge variant="outline" className="border-[#495057] text-[#adb5bd]"><CalendarDays size={12} className="mr-1" />{new Date(hour.date).toLocaleDateString('it-IT')}</Badge>
                                                        {hour.approved ? (
                                                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" />Approvato</Badge>
                                                        ) : (
                                                            <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" />Da Approvare</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-[#adb5bd] mt-2">
                                                        {cantiere && <span className="flex items-center gap-1"><Building2 size={14} className="text-[#6c757d]" />{cantiere.nome_cantiere}</span>}
                                                        {hour.description && <span>{hour.description}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <span className="text-2xl font-light text-[#f8f9fa]">{hour.hours_worked}h</span>
                                                    </div>
                                                    {isAdmin && !hour.approved && (
                                                        <Button onClick={() => handleApproveHours(hour._id)} size="sm" className="bg-green-600 hover:bg-green-700">Approva</Button>
                                                    )}
                                                    {isAdmin && (
                                                        <Button onClick={() => handleDeleteHours(hour._id)} size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 px-2 h-8">
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* LOG HOURS MODAL */}
            <Dialog open={showHoursModal} onOpenChange={setShowHoursModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Registra Ore Lavorate</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={hoursForm.collaborator_id} onValueChange={v => setHoursForm({ ...hoursForm, collaborator_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Collaboratore *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {collaborators.filter(c => c.status === 'active').map(c => (
                                    <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={hoursForm.cantiere_id} onValueChange={v => setHoursForm({ ...hoursForm, cantiere_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Cantiere (Opzionale)" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {cantieri.filter(c => c.status !== 'completato').map(c => (
                                    <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.nome_cantiere}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Data *</label>
                                <Input type="date" value={hoursForm.date} onChange={e => setHoursForm({ ...hoursForm, date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Ore Lavorate *</label>
                                <Input type="number" step="0.5" placeholder="Es. 8" value={hoursForm.hours_worked} onChange={e => setHoursForm({ ...hoursForm, hours_worked: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                        </div>
                        <Input placeholder="Descrizione / Note (Opzionale)" value={hoursForm.description} onChange={e => setHoursForm({ ...hoursForm, description: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleLogHours} disabled={!hoursForm.collaborator_id || !hoursForm.hours_worked || !hoursForm.date} className="w-full bg-cyan-600 hover:bg-cyan-700">Registra Ore</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CREATE MODAL */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuovo Collaboratore</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Nome Completo *" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Email *" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Telefono" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        
                        <Select value={formData.job_title} onValueChange={v => setFormData({ ...formData, job_title: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Mansione *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {jobTitles.map(jt => (
                                    <SelectItem key={jt._id} value={jt.title} className="text-[#f8f9fa]">{jt.title}</SelectItem>
                                ))}
                                {jobTitles.length === 0 && (
                            <div className="p-2">
                                <p className="text-xs text-[#adb5bd] mb-1">Nessuna mansione configurata.</p>
                                <button onClick={async (e) => { e.preventDefault(); try { await seedJobTitlesMutation({}); } catch(err) { console.error(err); } }} className="text-xs text-indigo-400 hover:text-indigo-300 underline">
                                    Inizializza mansioni predefinite
                                </button>
                            </div>
                        )}
                            </SelectContent>
                        </Select>

                        <div className="grid grid-cols-2 gap-3">
                            <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="internal" className="text-[#f8f9fa]">Interno (Dipendente)</SelectItem>
                                    <SelectItem value="external" className="text-[#f8f9fa]">Esterno (Per Lavoro)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={formData.location_type} onValueChange={v => setFormData({ ...formData, location_type: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="site" className="text-[#f8f9fa]">Cantiere</SelectItem>
                                    <SelectItem value="showroom" className="text-[#f8f9fa]">Showroom / Ufficio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Select value={formData.contract_type} onValueChange={v => setFormData({ ...formData, contract_type: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="tempo_pieno" className="text-[#f8f9fa]">Tempo Pieno</SelectItem>
                                <SelectItem value="tempo_parziale" className="text-[#f8f9fa]">Tempo Parziale</SelectItem>
                                <SelectItem value="freelance" className="text-[#f8f9fa]">Freelance</SelectItem>
                                <SelectItem value="subappalto" className="text-[#f8f9fa]">Subappalto</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {formData.type === 'external' ? (
                                <Input placeholder="Tariffa Oraria (€)" type="number" value={formData.hourly_rate} onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            ) : (
                                <Input placeholder="Stipendio Mensile (€)" type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            )}
                            <Input placeholder="Codice Fiscale" value={formData.fiscal_code} onChange={e => setFormData({ ...formData, fiscal_code: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>

                        {/* Contract period */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Inizio Contratto</label>
                                <Input type="date" value={formData.contract_start_date} onChange={e => setFormData({ ...formData, contract_start_date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Fine Contratto</label>
                                <Input type="date" value={formData.contract_end_date} onChange={e => setFormData({ ...formData, contract_end_date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                        </div>

                        {/* Assigned cantieri */}
                        {cantieri.length > 0 && (
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Cantieri Assegnati</label>
                                <div className="bg-[#495057] border border-[#6c757d] rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                                    {cantieri.filter(c => c.status !== 'completato').map(c => (
                                        <label key={c._id} className="flex items-center gap-2 cursor-pointer text-xs text-[#f8f9fa] hover:text-white">
                                            <input
                                                type="checkbox"
                                                checked={formData.assigned_cantieri.includes(c._id)}
                                                onChange={e => {
                                                    const ids = e.target.checked
                                                        ? [...formData.assigned_cantieri, c._id]
                                                        : formData.assigned_cantieri.filter(id => id !== c._id);
                                                    setFormData({ ...formData, assigned_cantieri: ids });
                                                }}
                                                className="accent-indigo-500"
                                            />
                                            {c.nome_cantiere}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contract document */}
                        <div>
                            <label className="text-xs text-[#adb5bd] block mb-1">Contratto di Lavoro (Allegato)</label>
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={e => setSelectedContractFile(e.target.files[0])}
                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-xs file:bg-[#343a40] file:text-indigo-400 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2"
                            />
                            {selectedContractFile && <p className="text-[10px] text-green-400 mt-1">File: {selectedContractFile.name}</p>}
                        </div>

                        <Textarea placeholder="Note" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreate} disabled={!formData.full_name || !formData.email || !formData.job_title || isUploadingContract} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            {isUploadingContract ? <><Loader2 className="animate-spin mr-2" size={16} /> Caricamento...</> : 'Crea Collaboratore'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ONBOARDING SUCCESS MODAL */}
            <Dialog open={!!onboardingLink} onOpenChange={() => setOnboardingLink(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-sm">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Eseguito!</DialogTitle></DialogHeader>
                    <div className="flex flex-col items-center py-4 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <Send className="text-green-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-[#f8f9fa] mb-1">Link Generato</h3>
                        <p className="text-sm text-[#adb5bd] mb-4">Invia il link e la password al collaboratore via WhatsApp.</p>
                        
                        <div className="w-full bg-[#212529] p-4 rounded-xl border border-[#495057] mb-6 flex flex-col items-center">
                            <p className="text-[10px] text-[#6c757d] uppercase tracking-wider mb-2 text-center">Codice di Accesso Semplice</p>
                            <p className="text-3xl font-mono text-indigo-400 font-bold tracking-[0.2em] mb-4">
                                {onboardingLink?.whatsapp_url?.match(/password%20%C3%A8%3A%20%2A(\d+)%2A/)?.[1] || "******"}
                            </p>
                            <div className="bg-white p-2 rounded-lg mb-2">
                                <QRCode value={onboardingLink?.link || ""} size={120} />
                            </div>
                            <p className="text-xs text-[#adb5bd] text-center mt-2">Inquadra per aprire il link di registrazione</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Button onClick={() => window.open(onboardingLink?.whatsapp_url, '_blank')} className="bg-green-600 hover:bg-green-700 w-full gap-2 font-medium">
                                <MessageCircle size={16} /> Invia via WhatsApp
                            </Button>
                            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(onboardingLink?.link); alert('Link copiato negli appunti!'); }} className="border-[#495057] text-[#adb5bd] w-full">
                                Copia solo Link
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CHAT MODAL */}
            <Dialog open={!!showChatModal} onOpenChange={() => setShowChatModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <MessageCircle size={18} className="text-indigo-400" /> Chat con {showChatModal?.full_name}
                        </DialogTitle>
                    </DialogHeader>
                    {showChatModal && (
                        <CollabMiniChat channelId={showChatModal._id} channelName={showChatModal.full_name} />
                    )}
                </DialogContent>
            </Dialog>
            <CollaboratorDetailModal 
                id={selectedCollabDetailId} 
                onClose={() => setSelectedCollabDetailId(null)}
                onGenerateAccess={handleGenerateOnboarding}
            />
        </div>
    );
}

function CollaboratorDetailModal({ id, onClose, onGenerateAccess }) {
    const collab = useQuery(api.collaborators.getDetailed, id ? { id } : "skip");
    const collaboratorsCerts = useQuery(api.certificates.list, id ? { collaborator_id: id } : "skip") || [];

    if (!id) return null;

    return (
        <Dialog open={!!id} onOpenChange={onClose}>
            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-2xl max-h-[90vh] overflow-y-auto" style={{ maxWidth: 'min(calc(100vw - 3rem), 30rem)' }}>
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {collab?.full_name?.[0] || '?'}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-light text-[#f8f9fa]">{collab?.full_name || 'Caricamento...'}</DialogTitle>
                            <p className="text-indigo-400 font-medium">{collab?.job_title}</p>
                            {collab && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-[#6c757d] font-mono bg-[#212529] px-2 py-0.5 rounded border border-[#495057]">ID: {collab._id}</span>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(collab._id); alert('ID copiato!'); }}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                                    >
                                        Copia
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {!collab ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
                ) : (
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="bg-[#212529] border border-[#495057] w-full mb-6">
                            <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-indigo-600">Profilo</TabsTrigger>
                            <TabsTrigger value="docs" className="flex-1 data-[state=active]:bg-indigo-600">Documenti</TabsTrigger>
                            <TabsTrigger value="logs" className="flex-1 data-[state=active]:bg-indigo-600">Storico Ore</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 outline-none">
                            {/* Status Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-[#212529] p-3 rounded-xl border border-[#495057]">
                                    <p className="text-[10px] text-[#6c757d] uppercase tracking-wider mb-1">Stato Account</p>
                                    <Badge variant="outline" className={`w-fit border-none p-0 flex items-center gap-1 ${collab.user_id ? 'text-green-400' : 'text-red-400'}`}>
                                        {collab.user_id ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        {collab.user_id ? 'Collegato' : 'In Attesa'}
                                    </Badge>
                                </div>
                                <div className="bg-[#212529] p-3 rounded-xl border border-[#495057]">
                                    <p className="text-[10px] text-[#6c757d] uppercase tracking-wider mb-1">Contratto</p>
                                    <p className="text-sm text-[#f8f9fa] capitalize">{collab.contract_type?.replace('_', ' ') || 'N/D'}</p>
                                </div>
                                <div className="bg-[#212529] p-3 rounded-xl border border-[#495057]">
                                    <p className="text-[10px] text-[#6c757d] uppercase tracking-wider mb-1">Tipo</p>
                                    <p className="text-sm text-[#f8f9fa]">{collab.type === 'internal' ? 'Interno' : 'Esterno'}</p>
                                </div>
                                <div className="bg-[#212529] p-3 rounded-xl border border-[#495057]">
                                    <p className="text-[10px] text-[#6c757d] uppercase tracking-wider mb-1">Paga</p>
                                    <p className="text-sm text-[#f8f9fa]">
                                        {collab.type === 'internal' ? `€${collab.salary || 0}/mese` : `€${collab.hourly_rate || 0}/ora`}
                                    </p>
                                </div>
                            </div>

                            {/* Contact & Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-[#f8f9fa] border-b border-[#495057] pb-1">Contatti</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-[#adb5bd]">
                                            <Mail size={16} className="text-indigo-400" /> {collab.email}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-[#adb5bd]">
                                            <Phone size={16} className="text-indigo-400" /> {collab.phone || 'Non fornito'}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-[#adb5bd]">
                                            <FileText size={16} className="text-indigo-400" /> Cod. Fisc: {collab.fiscal_code || 'N/D'}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-[#f8f9fa] border-b border-[#495057] pb-1">Note</h4>
                                    <p className="text-sm text-[#adb5bd] leading-relaxed italic">
                                        {collab.notes || 'Nessuna nota aggiuntiva.'}
                                    </p>
                                </div>
                            </div>

                            {/* Cantieri */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-[#f8f9fa] border-b border-[#495057] pb-1 flex items-center justify-between">
                                    Cantieri Attivi 
                                    <Badge variant="outline" className="bg-indigo-500">{collab.cantieri?.length || 0}</Badge>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {collab.cantieri?.length > 0 ? collab.cantieri.map(c => (
                                        <div key={c._id} className="flex items-center gap-3 bg-[#212529] p-3 rounded-lg border border-[#495057]">
                                            <HardHat size={16} className="text-yellow-500" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-[#f8f9fa] truncate">{c.nome_cantiere}</p>
                                                <p className="text-[10px] text-[#6c757d]">{c.status}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-[#6c757d] py-2 col-span-2">Nessun cantiere assegnato al momento.</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="docs" className="space-y-4 outline-none">
                            <h4 className="text-sm font-semibold text-[#f8f9fa] border-b border-[#495057] pb-1 flex items-center justify-between">
                                Certificati & Documenti
                                <Badge variant="outline" className="bg-emerald-500">{collaboratorsCerts.length}</Badge>
                            </h4>
                            <div className="space-y-2">
                                {collaboratorsCerts.length > 0 ? collaboratorsCerts.map(cert => (
                                    <div key={cert._id} className="flex items-center justify-between bg-[#212529] p-3 rounded-lg border border-[#495057]">
                                        <div className="flex items-center gap-3">
                                            <Shield size={16} className="text-emerald-400" />
                                            <div>
                                                <p className="text-xs font-medium text-[#f8f9fa]">{cert.title}</p>
                                                <p className="text-[10px] text-[#6c757d]">Scadenza: {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString('it-IT') : 'Indeterminata'}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.open(cert.file_url, '_blank')}>
                                            <ExternalLink size={14} />
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-xs text-[#6c757d] py-2">Nessun certificato caricato per questo profilo.</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="logs" className="space-y-4 outline-none">
                             <CollaboratorWorkLogTab collaboratorId={id} />
                        </TabsContent>

                        {/* Management Bottom Bar */}
                        <div className="pt-6 border-t border-[#495057] flex flex-col sm:flex-row gap-3">
                            {!collab.user_id && (
                                <Button onClick={() => onGenerateAccess(collab._id)} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                                    <Link size={16} /> Genera Link Accesso Password
                                </Button>
                            )}
                            <Button variant="outline" onClick={onClose} className="flex-1 border-[#495057] text-[#adb5bd]">Chiudi</Button>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CollaboratorWorkLogTab({ collaboratorId }) {
    const logs = useQuery(api.collaborators.listLogsForAdmin, { collaborator_id: collaboratorId }) || [];
    const approveHours = useMutation(api.collaborators.approveHours);
    const removeHours = useMutation(api.collaborators.removeHours);

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#f8f9fa] border-b border-[#495057] pb-1 flex items-center justify-between">
                Storico Ore Registrate
                <Badge variant="outline" className="bg-cyan-500">{logs.length}</Badge>
            </h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                    <p className="text-xs text-[#6c757d] py-8 text-center italic">Nessun log ore trovato per questo collaboratore.</p>
                ) : (
                    logs.slice().reverse().map(log => (
                        <div key={log._id} className="bg-[#212529] p-3 rounded-lg border border-[#495057] flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={14} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-[#f8f9fa]">{new Date(log.date).toLocaleDateString('it-IT')}</span>
                                    <Badge variant="outline" className={`text-[10px] h-4 ${log.approved ? 'border-green-500/30 text-green-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                                        {log.approved ? 'Approvato' : 'Da Approvare'}
                                    </Badge>
                                </div>
                                <span className="text-sm font-black text-[#f8f9fa]">{log.hours_worked}h</span>
                            </div>
                            
                            {log.description && (
                                <p className="text-[11px] text-[#adb5bd] leading-tight italic">"{log.description}"</p>
                            )}

                            {!log.approved && (
                                <div className="flex justify-end gap-2 mt-1">
                                    <Button size="sm" variant="ghost" onClick={() => removeHours({ id: log._id })} className="h-7 text-[10px] text-red-400 hover:bg-red-500/10">Elimina</Button>
                                    <Button size="sm" onClick={() => approveHours({ id: log._id })} className="h-7 text-[10px] bg-green-600 hover:bg-green-700">Approva</Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function CollabMiniChat({ channelId, channelName }) {
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);
    const messages = useQuery(api.internal_messages.list, { channel_type: 'collaborator', channel_id: channelId }) || [];
    const sendMessage = useMutation(api.internal_messages.send);
    const markAsRead = useMutation(api.internal_messages.markAsRead);

    useEffect(() => {
        if (messages.length > 0) markAsRead({ channel_type: 'collaborator', channel_id: channelId }).catch(() => { });
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages.length]);

    const handleSend = async () => {
        if (!message.trim()) return;
        try {
            await sendMessage({ channel_type: 'collaborator', channel_id: channelId, channel_name: channelName, message: message.trim() });
            setMessage('');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex flex-col h-[300px]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3 bg-[#212529] rounded-lg">
                {messages.length === 0 && <p className="text-xs text-[#6c757d] text-center py-8">Nessun messaggio.</p>}
                {messages.map(msg => (
                    <div key={msg._id} className="flex justify-end">
                        <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs bg-indigo-600/20 text-[#f8f9fa]">
                            {msg.sender_name && <p className="text-[10px] text-indigo-400 mb-0.5 font-medium">{msg.sender_name}</p>}
                            <p>{msg.message}</p>
                            <p className="text-[9px] text-[#6c757d] mt-1">{new Date(msg.created_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-2">
                <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Scrivi..." className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-sm" onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="bg-indigo-600 hover:bg-indigo-700"><Send size={14} /></Button>
            </div>
        </div>
    );
}
