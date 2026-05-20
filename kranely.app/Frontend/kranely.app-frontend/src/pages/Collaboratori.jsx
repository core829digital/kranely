import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from "react-qr-code";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import { useUser } from "@clerk/clerk-react";
import { useTranslation } from 'react-i18next';
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
    in_ufficio: { label: 'In Ufficio', color: 'bg-[#FFC703]/20', dot: 'bg-[#FFC703]/20' },
    disponibile: { label: 'Disponibile', color: 'bg-yellow-500', dot: 'bg-yellow-400' },
    non_disponibile: { label: 'Non Disponibile', color: 'bg-gray-500', dot: 'bg-gray-400' },
};

export default function Collaborators() {
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
    const { t } = useTranslation();

    if (rbacLoading) {
        return (<div className="min-h-screen bg-[#1C1A18] flex items-center justify-center"><Loader2 className="animate-spin text-[#FFC703]" size={40} /></div>);
    }

    if (!canView('collaboratori')) {
        return (
            <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">

                <div className="pt-0 relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-white mb-2">{t('access.denied')}</h2><p className="text-white/40">{t('access.no_permission')}</p></div>
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
            if (window.confirm("Collaborator creato con successo. Vuoi generare ora il link di accesso WhatsApp?")) {
                handleGenerateOnboarding(id);
            }
        } catch (err) { console.error(err); } finally { setIsUploadingContract(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deletere questo collaboratore?')) return;
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
        <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">


            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-light text-white mb-2 flex items-center gap-3">
                                <Users className="text-[#FFC703]" /> {t('collaborators.title')}
                            </h1>
                            <p className="text-white/40">{t('collaborators.subtitle')}</p>
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <Button onClick={() => setShowModal(true)} className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold">
                                    <UserPlus size={16} className="mr-2" /> {t('collaborators.new')}
                                </Button>
                                <Button onClick={() => setShowHoursModal(true)} className="bg-cyan-600 hover:bg-[#FFC703]/80yan-700">
                                    <Clock size={16} className="mr-2" /> {t('collaborators.log_hours')}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            {[
                                { label: 'Totale', value: stats.total, color: 'from-[#FFC703] to-indigo-700', icon: Users },
                                { label: 'Internal', value: stats.internal, color: 'from-[#FFC703] to-[#FFC703]', icon: Briefcase },
                                { label: 'External', value: stats.external, color: 'from-[#FFC703] to-[#FFC703]', icon: HardHat },
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
                        <TabsList className="bg-white/5 border border-white/10 w-full grid grid-cols-2">
                            <TabsTrigger value="anagrafica" className="data-[state=active]:bg-[#FFC703]/20 data-[state=active]:text-white text-white/40">
                                <Users size={16} className="mr-2" /> Anagrafica
                            </TabsTrigger>
                            <TabsTrigger value="ore" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-white/40">
                                <Clock size={16} className="mr-2" /> Hours Worked ({allHours.filter(h => !h.approved).length} da approvare)
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {activeTab === 'anagrafica' && (
                        <>
                            {/* Filters */}
                            <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 mb-6">
                                <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                        <Input placeholder={t('collaborators.search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#535252] border-white/10 text-white placeholder:text-white/40" />
                                    </div>
                                    <div className="flex gap-2">
                                        {['all', 'internal', 'external'].map(f => (
                                            <Button key={f} variant={typeFilter === f ? "default" : "outline"} onClick={() => setTypeFilter(f)}
                                                className={typeFilter === f ? "bg-[#FFC703]/20 text-white" : "bg-transparent text-white/40 border-white/10"}>
                                                {f === 'all' ? 'All' : f === 'internal' ? 'Internal' : 'External'}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Collaborator Cards */}
                            {filteredCollaborators.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8">
                                    <Users size={48} className="text-white/25 mx-auto mb-4" />
                                    <h3 className="text-xl text-white/70">No collaborators found</h3>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredCollaborators.map((collab) => {
                                        const liveConfig = liveStatusConfig[collab.live_status] || liveStatusConfig.non_disponibile;
                                        return (
                                            <motion.div key={collab._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <Card className="bg-white/5 border border-white/10 hover:border-[#FFC703]/30 transition-all h-full cursor-pointer group" onClick={() => setSelectedCollabDetailId(collab._id)}>
                                                    <CardContent className="p-5">
                                                        {/* Header */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFC703] to-[#FFC703] flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                                                                    {collab.full_name[0]}
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-white font-medium flex items-center gap-2">
                                                                        {collab.full_name}
                                                                        {!collab.user_id && <Badge variant="outline" className="text-[9px] h-4 border-yellow-500/30 text-yellow-500 bg-yellow-500/10">Pending</Badge>}
                                                                    </h3>
                                                                    <p className="text-xs text-white/40">{collab.job_title}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="flex items-center gap-1">
                                                                    <div className={`w-2 h-2 rounded-full ${liveConfig.dot}`} />
                                                                    <span className="text-[10px] text-white/40">{liveConfig.label}</span>
                                                                </div>
                                                                {collab.user_id ? (
                                                                    <Badge variant="outline" className="text-[9px] h-4 border-green-500/30 text-green-400 bg-green-500/10 gap-1">
                                                                        <CheckCircle size={8} /> Connected
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[9px] h-4 border-red-500/30 text-red-400 bg-red-500/10">
                                                                        Not Connected
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="space-y-2 mt-3">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Mail size={14} className="text-white/25" />
                                                                <span className="text-white/40 truncate">{collab.email}</span>
                                                            </div>
                                                            {collab.phone && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Phone size={14} className="text-white/25" />
                                                                    <span className="text-white/40">{collab.phone}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="default" className={`text-xs ${collab.type === 'internal' ? 'bg-[#FFC703]/20 text-[#FFC703]' : 'bg-purple-500/20 text-purple-400'}`}>
                                                                    {collab.type === 'internal' ? 'Dipendente' : 'Esterno'}
                                                                </Badge>
                                                                <Badge variant="default" className={`text-xs ${collab.status === 'active' ? 'bg-green-500/20 text-green-400' : collab.status === 'on_leave' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                    {collab.status === 'active' ? 'Active' : collab.status === 'on_leave' ? 'On Leave' : 'Inactive'}
                                                                </Badge>
                                                            </div>
                                                            {collab.live_location && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <MapPin size={14} className="text-white/25" />
                                                                    <span className="text-white/40">{collab.live_location}</span>
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
                                                                            <CreditCard size={10} /> {pending.length} pagamenti da saldare (â‚¬{pendingTotal.toLocaleString()})
                                                                        </button>
                                                                    )}
                                                                    {collabPayments.filter(p => p.status === 'pagato').length > 0 && (
                                                                        <span className="text-[10px] text-green-400/60">{collabPayments.filter(p => p.status === 'pagato').length} paid</span>
                                                                    )}
                                                                </div>
                                                            ) : null;
                                                        })()}

                                                        {/* Actions */}
                                                        {isAdmin && (
                                                            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-white/10">
                                                                {collab.phone && (
                                                                    <a href={`tel:${collab.phone}`}>
                                                                        <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20 h-8 w-8 p-0">
                                                                            <PhoneCall size={14} />
                                                                        </Button>
                                                                    </a>
                                                                )}
                                                                <Button variant="ghost" size="sm" onClick={() => setShowChatModal(collab)} className="text-[#FFC703] hover:bg-[#FFC703]/20 h-8 w-8 p-0" title="Messaggia">
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
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8">
                                    <Clock size={48} className="text-white/25 mx-auto mb-4" />
                                    <h3 className="text-xl text-white/70">No time records found</h3>
                                </div>
                            ) : (
                                allHours.slice().reverse().map(hour => {
                                    const collab = collaborators.find(c => c._id === hour.collaborator_id);
                                    const cantiere = cantieri.find(c => c._id === hour.cantiere_id);
                                    return (
                                        <Card key={hour._id} className="bg-white/5 border border-white/10 hover:border-white/10 transition-all">
                                            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-medium text-white">{collab?.full_name || 'N/D'}</span>
                                                        <Badge variant="outline" className="border-white/10 text-white/40"><CalendarDays size={12} className="mr-1" />{new Date(hour.date).toLocaleDateString('en-GB')}</Badge>
                                                        {hour.approved ? (
                                                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" />Approved</Badge>
                                                        ) : (
                                                            <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" />Da Approvare</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-white/40 mt-2">
                                                        {cantiere && <span className="flex items-center gap-1"><Building2 size={14} className="text-white/25" />{cantiere.nome_cantiere}</span>}
                                                        {hour.description && <span>{hour.description}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <span className="text-2xl font-light text-white">{hour.hours_worked}h</span>
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
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md">
                    <DialogHeader><DialogTitle className="text-white">Registra Hours Worked</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={hoursForm.collaborator_id} onValueChange={v => setHoursForm({ ...hoursForm, collaborator_id: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder={t('collaborators.select_collaborator')} /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                {collaborators.filter(c => c.status === 'active').map(c => (
                                    <SelectItem key={c._id} value={c._id} className="text-white">{c.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={hoursForm.cantiere_id} onValueChange={v => setHoursForm({ ...hoursForm, cantiere_id: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder={t('collaborators.select_project')} /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                {cantieri.filter(c => c.status !== 'completato').map(c => (
                                    <SelectItem key={c._id} value={c._id} className="text-white">{c.nome_cantiere}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Data *</label>
                                <Input type="date" value={hoursForm.date} onChange={e => setHoursForm({ ...hoursForm, date: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Hours Worked *</label>
                                <Input type="number" step="0.5" placeholder={t('collaborators.hours_placeholder')} value={hoursForm.hours_worked} onChange={e => setHoursForm({ ...hoursForm, hours_worked: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                        </div>
                        <Input placeholder={t('collaborators.description_placeholder')} value={hoursForm.description} onChange={e => setHoursForm({ ...hoursForm, description: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Button onClick={handleLogHours} disabled={!hoursForm.collaborator_id || !hoursForm.hours_worked || !hoursForm.date} className="w-full bg-cyan-600 hover:bg-[#FFC703]/80yan-700">Registra Ore</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CREATE MODAL */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-white">{t('common.new_collaborator')}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Full Name *" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Email *" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Telefono" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        
                        <Select value={formData.job_title} onValueChange={v => setFormData({ ...formData, job_title: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Seleziona Mansione *" /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                {jobTitles.map(jt => (
                                    <SelectItem key={jt._id} value={jt.title} className="text-white">{jt.title}</SelectItem>
                                ))}
                                {jobTitles.length === 0 && (
                            <div className="p-2">
                                <p className="text-xs text-white/40 mb-1">No mansione configurata.</p>
                                <button onClick={async (e) => { e.preventDefault(); try { await seedJobTitlesMutation({}); } catch(err) { console.error(err); } }} className="text-xs text-[#FFC703] hover:text-[#FFC703] underline">
                                    Inizializza mansioni predefinite
                                </button>
                            </div>
                        )}
                            </SelectContent>
                        </Select>

                        <div className="grid grid-cols-2 gap-3">
                            <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    <SelectItem value="internal" className="text-white">Interno (Dipendente)</SelectItem>
                                    <SelectItem value="external" className="text-white">Esterno (Per Lavoro)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={formData.location_type} onValueChange={v => setFormData({ ...formData, location_type: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    <SelectItem value="site" className="text-white">Cantiere</SelectItem>
                                    <SelectItem value="showroom" className="text-white">Showroom / Ufficio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Select value={formData.contract_type} onValueChange={v => setFormData({ ...formData, contract_type: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                <SelectItem value="tempo_pieno" className="text-white">Tempo Pieno</SelectItem>
                                <SelectItem value="tempo_parziale" className="text-white">Tempo Parziale</SelectItem>
                                <SelectItem value="freelance" className="text-white">Freelance</SelectItem>
                                <SelectItem value="subappalto" className="text-white">Subappalto</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {formData.type === 'external' ? (
                                <Input placeholder="Tariffa Oraria (â‚¬)" type="number" value={formData.hourly_rate} onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            ) : (
                                <Input placeholder="Stipendio Mensile (â‚¬)" type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            )}
                            <Input placeholder="Codice Fiscale" value={formData.fiscal_code} onChange={e => setFormData({ ...formData, fiscal_code: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        </div>

                        {/* Contract period */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Inizio Contratto</label>
                                <Input type="date" value={formData.contract_start_date} onChange={e => setFormData({ ...formData, contract_start_date: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Fine Contratto</label>
                                <Input type="date" value={formData.contract_end_date} onChange={e => setFormData({ ...formData, contract_end_date: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                        </div>

                        {/* Assigned cantieri */}
                        {cantieri.length > 0 && (
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Projects Assegnati</label>
                                <div className="bg-[#535252] border border-white/10 rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                                    {cantieri.filter(c => c.status !== 'completato').map(c => (
                                        <label key={c._id} className="flex items-center gap-2 cursor-pointer text-xs text-white hover:text-white">
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
                            <label className="text-xs text-white/40 block mb-1">Contratto di Lavoro (Allegato)</label>
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={e => setSelectedContractFile(e.target.files[0])}
                                className="bg-[#535252] border-white/10 text-white text-xs file:bg-[#1C1A18] file:text-[#FFC703] file:border-0 file:rounded file:px-2 file:py-1 file:mr-2"
                            />
                            {selectedContractFile && <p className="text-[10px] text-green-400 mt-1">File: {selectedContractFile.name}</p>}
                        </div>

                        <Textarea placeholder="Note" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Button onClick={handleCreate} disabled={!formData.full_name || !formData.email || !formData.job_title || isUploadingContract} className="w-full bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold">
                            {isUploadingContract ? <><Loader2 className="animate-spin mr-2" size={16} /> Loading...</> : 'Create Collaborator'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ONBOARDING SUCCESS MODAL */}
            <Dialog open={!!onboardingLink} onOpenChange={() => setOnboardingLink(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-sm">
                    <DialogHeader><DialogTitle className="text-white">Eseguito!</DialogTitle></DialogHeader>
                    <div className="flex flex-col items-center py-4 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <Send className="text-green-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">Link Generato</h3>
                        <p className="text-sm text-white/40 mb-4">Send the link and password to the collaratore via WhatsApp.</p>
                        
                        <div className="w-full bg-[#141210] p-4 rounded-xl border border-white/10 mb-6 flex flex-col items-center">
                            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2 text-center">Codice di Accesso Semplice</p>
                            <p className="text-3xl font-mono text-[#FFC703] font-bold tracking-[0.2em] mb-4">
                                {onboardingLink?.whatsapp_url?.match(/password%20%C3%A8%3A%20%2A(\d+)%2A/)?.[1] || "******"}
                            </p>
                            <div className="bg-white p-2 rounded-lg mb-2">
                                <QRCode value={onboardingLink?.link || ""} size={120} />
                            </div>
                            <p className="text-xs text-white/40 text-center mt-2">Inquadra per aprire il link di registrazione</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Button onClick={() => window.open(onboardingLink?.whatsapp_url, '_blank')} className="bg-green-600 hover:bg-green-700 w-full gap-2 font-medium">
                                <MessageCircle size={16} /> Send via WhatsApp
                            </Button>
                            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(onboardingLink?.link); alert('Link copiato negli appunti!'); }} className="border-white/10 text-white/40 w-full">
                                Copia solo Link
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CHAT MODAL */}
            <Dialog open={!!showChatModal} onOpenChange={() => setShowChatModal(null)}>
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <MessageCircle size={18} className="text-[#FFC703]" /> Chat con {showChatModal?.full_name}
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
            <DialogContent className="bg-white/5 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto" style={{ maxWidth: 'min(calc(100vw - 3rem), 30rem)' }}>
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC703] to-[#FFC703] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {collab?.full_name?.[0] || '?'}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-light text-white">{collab?.full_name || 'Loading...'}</DialogTitle>
                            <p className="text-[#FFC703] font-medium">{collab?.job_title}</p>
                            {collab && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-white/25 font-mono bg-[#141210] px-2 py-0.5 rounded border border-white/10">ID: {collab._id}</span>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(collab._id); alert('ID copiato!'); }}
                                        className="text-[10px] text-[#FFC703] hover:text-[#FFC703] px-2 py-0.5 rounded bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold border border-[#FFC703]/30 transition-colors"
                                    >
                                        Copia
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {!collab ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#FFC703]" /></div>
                ) : (
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="bg-[#141210] border border-white/10 w-full mb-6">
                            <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-[#FFC703]/20">Profilo</TabsTrigger>
                            <TabsTrigger value="docs" className="flex-1 data-[state=active]:bg-[#FFC703]/20">Documents</TabsTrigger>
                            <TabsTrigger value="logs" className="flex-1 data-[state=active]:bg-[#FFC703]/20">Storico Ore</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 outline-none">
                            {/* Status Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-[#141210] p-3 rounded-xl border border-white/10">
                                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Stato Account</p>
                                    <Badge variant="outline" className={`w-fit border-none p-0 flex items-center gap-1 ${collab.user_id ? 'text-green-400' : 'text-red-400'}`}>
                                        {collab.user_id ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        {collab.user_id ? 'Connected' : 'Pending'}
                                    </Badge>
                                </div>
                                <div className="bg-[#141210] p-3 rounded-xl border border-white/10">
                                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Contratto</p>
                                    <p className="text-sm text-white capitalize">{collab.contract_type?.replace('_', ' ') || 'N/D'}</p>
                                </div>
                                <div className="bg-[#141210] p-3 rounded-xl border border-white/10">
                                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Tipo</p>
                                    <p className="text-sm text-white">{collab.type === 'internal' ? 'Interno' : 'Esterno'}</p>
                                </div>
                                <div className="bg-[#141210] p-3 rounded-xl border border-white/10">
                                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Paga</p>
                                    <p className="text-sm text-white">
                                        {collab.type === 'internal' ? `â‚¬${collab.salary || 0}/mese` : `â‚¬${collab.hourly_rate || 0}/ora`}
                                    </p>
                                </div>
                            </div>

                            {/* Contact & Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-white border-b border-white/10 pb-1">Contatti</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-white/40">
                                            <Mail size={16} className="text-[#FFC703]" /> {collab.email}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/40">
                                            <Phone size={16} className="text-[#FFC703]" /> {collab.phone || 'Non fornito'}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/40">
                                            <FileText size={16} className="text-[#FFC703]" /> Cod. Fisc: {collab.fiscal_code || 'N/D'}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-white border-b border-white/10 pb-1">Note</h4>
                                    <p className="text-sm text-white/40 leading-relaxed italic">
                                        {collab.notes || 'No nota aggiuntiva.'}
                                    </p>
                                </div>
                            </div>

                            {/* Projects */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-white border-b border-white/10 pb-1 flex items-center justify-between">
                                    Projects Attivi 
                                    <Badge variant="outline" className="bg-[#FFC703]/20">{collab.cantieri?.length || 0}</Badge>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {collab.cantieri?.length > 0 ? collab.cantieri.map(c => (
                                        <div key={c._id} className="flex items-center gap-3 bg-[#141210] p-3 rounded-lg border border-white/10">
                                            <HardHat size={16} className="text-yellow-500" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-white truncate">{c.nome_cantiere}</p>
                                                <p className="text-[10px] text-white/25">{c.status}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-white/25 py-2 col-span-2">No projects assigned tol momento.</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="docs" className="space-y-4 outline-none">
                            <h4 className="text-sm font-semibold text-white border-b border-white/10 pb-1 flex items-center justify-between">
                                Certificates & Documents
                                <Badge variant="outline" className="bg-emerald-500">{collaboratorsCerts.length}</Badge>
                            </h4>
                            <div className="space-y-2">
                                {collaboratorsCerts.length > 0 ? collaboratorsCerts.map(cert => (
                                    <div key={cert._id} className="flex items-center justify-between bg-[#141210] p-3 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Shield size={16} className="text-emerald-400" />
                                            <div>
                                                <p className="text-xs font-medium text-white">{cert.title}</p>
                                                <p className="text-[10px] text-white/25">Scadenza: {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString('en-GB') : 'Indeterminata'}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.open(cert.file_url, '_blank')}>
                                            <ExternalLink size={14} />
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-xs text-white/25 py-2">No certificates uploaded for this profilo.</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="logs" className="space-y-4 outline-none">
                             <CollaboratorWorkLogTab collaboratorId={id} />
                        </TabsContent>

                        {/* Management Bottom Bar */}
                        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                            {!collab.user_id && (
                                <Button onClick={() => onGenerateAccess(collab._id)} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                                    <Link size={16} /> Genera Link Accesso Password
                                </Button>
                            )}
                            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/40">Chiudi</Button>
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
            <h4 className="text-sm font-semibold text-white border-b border-white/10 pb-1 flex items-center justify-between">
                Storico Ore Registrate
                <Badge variant="outline" className="bg-cyan-500">{logs.length}</Badge>
            </h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                    <p className="text-xs text-white/25 py-8 text-center italic">Nessun log ore trovato per questo collaboratore.</p>
                ) : (
                    logs.slice().reverse().map(log => (
                        <div key={log._id} className="bg-[#141210] p-3 rounded-lg border border-white/10 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={14} className="text-[#FFC703]" />
                                    <span className="text-xs font-bold text-white">{new Date(log.date).toLocaleDateString('en-GB')}</span>
                                    <Badge variant="outline" className={`text-[10px] h-4 ${log.approved ? 'border-green-500/30 text-green-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                                        {log.approved ? 'Approved' : 'Da Approvare'}
                                    </Badge>
                                </div>
                                <span className="text-sm font-black text-white">{log.hours_worked}h</span>
                            </div>
                            
                            {log.description && (
                                <p className="text-[11px] text-white/40 leading-tight italic">"{log.description}"</p>
                            )}

                            {!log.approved && (
                                <div className="flex justify-end gap-2 mt-1">
                                    <Button size="sm" variant="ghost" onClick={() => removeHours({ id: log._id })} className="h-7 text-[10px] text-red-400 hover:bg-red-500/10">Delete</Button>
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3 bg-[#141210] rounded-lg">
                {messages.length === 0 && <p className="text-xs text-white/25 text-center py-8">Nessun messaggio.</p>}
                {messages.map(msg => (
                    <div key={msg._id} className="flex justify-end">
                        <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs bg-[#FFC703]/20 text-white">
                            {msg.sender_name && <p className="text-[10px] text-[#FFC703] mb-0.5 font-medium">{msg.sender_name}</p>}
                            <p>{msg.message}</p>
                            <p className="text-[9px] text-white/25 mt-1">{new Date(msg.created_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-2">
                <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Scrivi..." className="bg-[#535252] border-white/10 text-white text-sm" onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold"><Send size={14} /></Button>
            </div>
        </div>
    );
}





