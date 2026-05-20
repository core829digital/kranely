/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import { useUser } from "@clerk/clerk-react";
import { useTranslation } from 'react-i18next';
import {
    Shield, FileCheck, Search, Plus, Loader2, AlertTriangle,
    CheckCircle, Clock, Download, Eye, Calendar, Building2, Truck, Users, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';



const statusConfig = {
    valid: { label: 'Valid', icon: CheckCircle, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    expiring: { label: 'Expiring Soon', icon: AlertTriangle, color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
    expired: { label: 'Expired', icon: Clock, color: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

const categoryConfig = {
    edilizia: { label: 'Edilizia', icon: Building2, color: 'from-amber-600 to-amber-700' },
    infissi: { label: 'Infissi', icon: Shield, color: 'from-[#FFC703] to-[#FFC703]' },
    documenti: { label: 'Documents', icon: FileCheck, color: 'from-[#FFC703] to-[#FFC703]' },
};

export default function Certificati() {
    const { isAdmin, canView, isLoading: rbacLoading } = useRBAC();
    const { user } = useUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    // â”€â”€â”€ All gli hook PRIMA di qualsiasi early return (Rules of Hooks) â”€â”€â”€
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('edilizia');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '', category: 'edilizia', subcategory: '', description: '',
        issue_date: '', expiry_date: '',
        cantiere_id: '', supplier_id: '', collaborator_id: '',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const { t } = useTranslation();

    const convexUser = useQuery(api.users.getByEmail, userEmail ? { email: userEmail } : "skip");
    const isWorker = convexUser?.role?.startsWith("collaborator");
    const certificates = useQuery(api.certificates.list, { category: activeCategory }) || [];
    const stats = useQuery(api.certificates.getStats) || null;
    const suppliers = useQuery(api.suppliers.list) || [];
    const collaborators = useQuery(api.collaborators.list, {}) || [];
    const cantieri = useQuery(api.cantieri.listCantieri, userEmail ? { company_email: userEmail } : "skip") || [];
    const createMutation = useMutation(api.certificates.create);
    const removeMutation = useMutation(api.certificates.remove);
    const generateUploadUrl = useMutation(api.documents.generateUploadUrl);

    if (!userEmail) return null;

    if (rbacLoading) {
        return (<div className="min-h-screen flex items-center justify-center" style={{ background: '#1C1A18' }}><div className="w-10 h-10 rounded-full border-[3px] border-[#FFC703]/20 border-t-[#FFC703] animate-spin" /></div>);
    }

    if (!canView('certificati')) {
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

    const handleCreate = async () => {
        if (!formData.title || !selectedFile) return;
        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": selectedFile.type },
                body: selectedFile,
            });
            const { storageId } = await result.json();
            const fileId = storageId;
            const fileName = selectedFile.name;

            const payload = /** @type {any} */ ({
                title: formData.title,
                category: formData.category,
                subcategory: formData.subcategory,
                description: formData.description,
                file_url: fileId,
                file_name: fileName,
                issue_date: formData.issue_date || undefined,
                expiry_date: formData.expiry_date || undefined,
                cantiere_id: formData.cantiere_id || undefined,
                supplier_id: formData.supplier_id || undefined,
                collaborator_id: formData.collaborator_id || undefined,
            });
            await createMutation(payload);
            setShowCreateModal(false);
            setFormData({
                title: '', category: 'edilizia', subcategory: '', description: '',
                issue_date: '', expiry_date: '',
                cantiere_id: '', supplier_id: '', collaborator_id: '',
            });
            setSelectedFile(null);
        } catch (err) {
            console.error(err);
            alert("Errore durante il caricamento del file.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this certificate?')) return;
        try { await removeMutation({ id }); } catch (err) { console.error(err); }
    };

    const filteredCerts = certificates.filter(c => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return c.title.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s);
    });

    const getSubcategoryLabel = (sub) => {
        const labels = {
            conformita: 'Compliance', permessi: 'Permits', collaudi: 'Inspection',
            ce: 'CE Mark', trasmittanza: 'Thermal Transmittance', acustica: 'Acoustics',
        };
        return labels[sub] || sub;
    };

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C1A18 0%, #232323 60%, #2a2826 100%)' }}>
            
            
            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-[#F0EBE8] mb-2 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#FFC703]/15 border border-[#FFC703]/25">
                                    <Shield className="text-[#FFC703]" size={22} />
                                </div>
                                {t('certificates.title')}
                            </h1>
                            <p className="text-[#F0EBE8]/40 text-sm">
                                {isWorker ? t('certificates.worker_subtitle') : t('certificates.subtitle')}
                            </p>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => setShowCreateModal(true)} className="font-semibold text-[#1C1A18]" style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)' }}>
                                <Plus size={16} className="mr-2" /> New Certificate
                            </Button>
                        )}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                            {[
                                { label: 'Totale', value: stats.total, color: 'from-amber-600/80 to-amber-700/80' },
                                { label: 'Validi', value: stats.valid, color: 'from-green-600/80 to-green-700/80' },
                                { label: 'In Scadenza', value: stats.expiring, color: 'from-yellow-600/80 to-yellow-700/80' },
                                { label: 'Scaduti', value: stats.expired, color: 'from-red-600/80 to-red-700/80' },
                                { label: 'Edilizia', value: stats.edilizia, color: 'from-orange-600/80 to-orange-700/80' },
                                { label: 'Infissi', value: stats.infissi, color: 'from-[#FFC703]/80 to-[#FFC703]/80' },
                                { label: 'Documenti', value: stats.documenti, color: 'from-[#FFC703]/80 to-[#FFC703]/80' }].map(s => (
                                <Card key={s.label} className={`bg-gradient-to-br ${s.color} border-0`}>
                                    <CardContent className="p-3 text-center">
                                        <span className="text-xl font-light text-white">{s.value}</span>
                                        <p className="text-[10px] text-white/70 mt-0.5">{s.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 mb-6">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <Input placeholder="Search certificates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#535252] border-white/10 text-white placeholder:text-white/40" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Tabs */}
                    <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                        <TabsList className="bg-white/5 border border-white/10 w-full flex overflow-x-auto sm:grid sm:grid-cols-3 mb-6 h-auto">
                            {Object.entries(categoryConfig).map(([key, conf]) => (
                                <TabsTrigger key={key} value={key} className="data-[state=active]:bg-[#FFC703]/20 data-[state=active]:text-[#FFC703] text-[#F0EBE8]/40">
                                    <conf.icon size={16} className="mr-2" /> {conf.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.keys(categoryConfig).map(cat => (
                            <TabsContent key={cat} value={cat}>
                                {filteredCerts.length === 0 ? (
                                    <div className="text-center py-12 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <Shield size={48} className="text-[#F0EBE8]/20 mx-auto mb-4" />
                                        <h3 className="text-xl text-[#F0EBE8]/60">No certificates</h3>
                                        <p className="text-[#F0EBE8]/30 mt-2">Add a new {categoryConfig[cat].label.toLowerCase()} certificate</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredCerts.map(cert => {
                                            const sts = statusConfig[cert.status] || statusConfig.valid;
                                            const StatusIcon = sts.icon;
                                            return (
                                                <motion.div key={cert._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                    <Card className="border border-white/10 hover:border-[#FFC703]/20 transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                        <CardContent className="p-5">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                        <h3 className="text-base sm:text-lg font-medium text-white">{cert.title}</h3>
                                                                    </div>
                                                                    {cert.description && <p className="text-sm text-white/40 mb-2">{cert.description}</p>}
                                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-white/25">
                                                                        {cert.issue_date && <span className="flex items-center gap-1"><Calendar size={12} /> Emesso: {new Date(cert.issue_date).toLocaleDateString('en-GB')}</span>}
                                                                        {cert.expiry_date && <span className="flex items-center gap-1"><Clock size={12} /> Scade: {new Date(cert.expiry_date).toLocaleDateString('en-GB')}</span>}
                                                                        <span className="truncate max-w-[150px]">{cert.file_name}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                                    <Badge variant="default" className={`${sts.color} border flex items-center gap-1`}>
                                                                        <StatusIcon size={14} /> {sts.label}
                                                                    </Badge>
                                                                    <Button variant="ghost" size="sm" className="text-[#FFC703]/60 hover:bg-[#FFC703]/10 hover:text-[#FFC703]" onClick={() => {
                                                                        if (cert.file_url) {
                                                                            const url = cert.file_url.startsWith('http')
                                                                                ? cert.file_url
                                                                                : `${import.meta.env.VITE_CONVEX_URL}/api/storage/${cert.file_url}`;
                                                                            window.open(url, '_blank');
                                                                        }
                                                                    }}>
                                                                        <Download size={14} className="mr-1" /> Download PDF
                                                                    </Button>
                                                                    {isAdmin && (
                                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cert._id)} className="text-red-400 hover:bg-red-500/20 h-8 px-2">
                                                                            Ã—
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Cross-reference: linked entity */}
                                                            {(cert.supplier_id || cert.collaborator_id || cert.cantiere_id) && (
                                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 flex-wrap">
                                                                    {cert.supplier_id && (() => {
                                                                        const sup = suppliers.find(s => s._id === cert.supplier_id);
                                                                        return sup ? (
                                                                            <button onClick={() => navigate('/Suppliers')} className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md hover:bg-orange-500/20 transition-all">
                                                                                <Truck size={10} /> {sup.name}
                                                                            </button>
                                                                        ) : null;
                                                                    })()}
                                                                    {cert.collaborator_id && (() => {
                                                                        const col = collaborators.find(c => c._id === cert.collaborator_id);
                                                                        return col ? (
                                                                            <button onClick={() => navigate('/Collaborators')} className="flex items-center gap-1 text-[10px] bg-[#FFC703]/20 text-[#FFC703] px-2 py-1 rounded-md hover:bg-[#FFC703]/20 transition-all">
                                                                                <Users size={10} /> {col.full_name}
                                                                            </button>
                                                                        ) : null;
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>

            {/* CREATE MODAL */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="border-white/10 text-[#F0EBE8] max-w-md max-h-[85vh] overflow-y-auto" style={{ background: '#232323' }}>
                    <DialogHeader><DialogTitle className="text-[#F0EBE8]">{t('common.new_certificate')}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Title *" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                        <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                <SelectItem value="edilizia" className="text-white">Construction</SelectItem>
                                <SelectItem value="infissi" className="text-white">Windows</SelectItem>
                                <SelectItem value="documenti" className="text-white">Documenti</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={formData.subcategory} onValueChange={v => setFormData({ ...formData, subcategory: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Sottocategoria" /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                {formData.category === 'edilizia' ? (<><SelectItem value="conformita" className="text-white">ConformitÃ </SelectItem><SelectItem value="permessi" className="text-white">Permessi</SelectItem><SelectItem value="collaudi" className="text-white">Collaudi</SelectItem></>) :
                                    formData.category === 'infissi' ? (<><SelectItem value="ce" className="text-white">CE</SelectItem><SelectItem value="trasmittanza" className="text-white">Trasmittanza</SelectItem><SelectItem value="acustica" className="text-white">Acustica</SelectItem></>) :
                                        (<><SelectItem value="allegato" className="text-white">Allegato Lavorazione</SelectItem></>)}
                            </SelectContent>
                        </Select>
                        <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Collega Cantiere (Opzionale)" /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                {cantieri.filter(c => c.status !== 'completato').map(c => (
                                    <SelectItem key={c._id} value={c._id} className="text-white">{c.nome_cantiere}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-3">
                            <Select value={formData.supplier_id} onValueChange={v => setFormData({ ...formData, supplier_id: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Collega Supplier" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    {suppliers.filter(s => s.status === 'active').map(s => (
                                        <SelectItem key={s._id} value={s._id} className="text-white">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={formData.collaborator_id} onValueChange={v => setFormData({ ...formData, collaborator_id: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Collega Collaborator" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    {collaborators.filter(c => c.status === 'active').map(c => (
                                        <SelectItem key={c._id} value={c._id} className="text-white">{c.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <div className="space-y-2">
                            <label className="text-xs text-orange-400 font-medium">Allegato PDF/Certificato *</label>
                            <Input 
                                type="file" 
                                accept=".pdf,.doc,.docx,image/*" 
                                onChange={e => setSelectedFile(e.target.files[0])} 
                                className="bg-[#535252] border-white/10 text-white text-xs file:bg-[#1C1A18] file:text-orange-400 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 hover:file:bg-[#141210]" 
                            />
                            {selectedFile && <p className="text-[10px] text-green-400">File selezionato: {selectedFile.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Issue Date</label>
                                <Input type="date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Expiry Date</label>
                                <Input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                            </div>
                        </div>
                        <Button onClick={handleCreate} disabled={!formData.title || !selectedFile || isUploading} className="w-full font-semibold text-[#1C1A18]" style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)' }}>
                            {isUploading ? <><Loader2 className="animate-spin mr-2" size={16} /> Uploading...</> : 'Create Certificate'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}





