/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import { useUser } from "@clerk/clerk-react";
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
    valid: { label: 'Valido', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    expiring: { label: 'In Scadenza', icon: AlertTriangle, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    expired: { label: 'Scaduto', icon: Clock, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const categoryConfig = {
    edilizia: { label: 'Edilizia', icon: Building2, color: 'from-amber-600 to-amber-700' },
    infissi: { label: 'Infissi', icon: Shield, color: 'from-blue-600 to-blue-700' },
    documenti: { label: 'Documenti', icon: FileCheck, color: 'from-purple-600 to-purple-700' },
};

export default function Certificati() {
    const { isAdmin, canView, isLoading: rbacLoading } = useRBAC();
    const { user } = useUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    // ─── Tutti gli hook PRIMA di qualsiasi early return (Rules of Hooks) ───
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
        return (<div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>);
    }

    if (!canView('certificati')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
                
                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
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
        if (!window.confirm('Eliminare questo certificato?')) return;
        try { await removeMutation({ id }); } catch (err) { console.error(err); }
    };

    const filteredCerts = certificates.filter(c => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return c.title.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s);
    });

    const getSubcategoryLabel = (sub) => {
        const labels = {
            conformita: 'Conformità', permessi: 'Permessi', collaudi: 'Collaudi',
            ce: 'CE', trasmittanza: 'Trasmittanza', acustica: 'Acustica',
        };
        return labels[sub] || sub;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            
            
            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                <Shield className="text-amber-400" /> Certificati
                            </h1>
                            <p className="text-[#adb5bd]">
                                {isWorker ? 'Consulta i tuoi documenti e certificazioni personali' : 'Gestione certificati edilizia, infissi e documenti con scadenzario'}
                            </p>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => setShowCreateModal(true)} className="bg-amber-600 hover:bg-amber-700">
                                <Plus size={16} className="mr-2" /> Nuovo Certificato
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
                                { label: 'Infissi', value: stats.infissi, color: 'from-blue-600/80 to-blue-700/80' },
                                { label: 'Documenti', value: stats.documenti, color: 'from-purple-600/80 to-purple-700/80' }].map(s => (
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
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-6">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                <Input placeholder="Cerca certificati..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Tabs */}
                    <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                        <TabsList className="bg-[#343a40] border border-[#495057] w-full flex overflow-x-auto sm:grid sm:grid-cols-3 mb-6 h-auto">
                            {Object.entries(categoryConfig).map(([key, conf]) => (
                                <TabsTrigger key={key} value={key} className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-[#adb5bd]">
                                    <conf.icon size={16} className="mr-2" /> {conf.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.keys(categoryConfig).map(cat => (
                            <TabsContent key={cat} value={cat}>
                                {filteredCerts.length === 0 ? (
                                    <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                        <Shield size={48} className="text-[#6c757d] mx-auto mb-4" />
                                        <h3 className="text-xl text-[#dee2e6]">Nessun certificato</h3>
                                        <p className="text-[#adb5bd] mt-2">Aggiungi un nuovo certificato {categoryConfig[cat].label.toLowerCase()}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredCerts.map(cert => {
                                            const sts = statusConfig[cert.status] || statusConfig.valid;
                                            const StatusIcon = sts.icon;
                                            return (
                                                <motion.div key={cert._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                    <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                                        <CardContent className="p-5">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                        <h3 className="text-base sm:text-lg font-medium text-[#f8f9fa]">{cert.title}</h3>
                                                                        {cert.subcategory && <Badge variant="default" className="bg-[#495057] text-[#adb5bd] text-xs">{getSubcategoryLabel(cert.subcategory)}</Badge>}
                                                                    </div>
                                                                    {cert.description && <p className="text-sm text-[#adb5bd] mb-2">{cert.description}</p>}
                                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#6c757d]">
                                                                        {cert.issue_date && <span className="flex items-center gap-1"><Calendar size={12} /> Emesso: {new Date(cert.issue_date).toLocaleDateString('it-IT')}</span>}
                                                                        {cert.expiry_date && <span className="flex items-center gap-1"><Clock size={12} /> Scade: {new Date(cert.expiry_date).toLocaleDateString('it-IT')}</span>}
                                                                        <span className="truncate max-w-[150px]">{cert.file_name}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                                    <Badge variant="default" className={`${sts.color} border flex items-center gap-1`}>
                                                                        <StatusIcon size={14} /> {sts.label}
                                                                    </Badge>
                                                                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-500/20" onClick={() => {
                                                                        if (cert.file_url) {
                                                                            const url = cert.file_url.startsWith('http')
                                                                                ? cert.file_url
                                                                                : `${import.meta.env.VITE_CONVEX_URL}/api/storage/${cert.file_url}`;
                                                                            window.open(url, '_blank');
                                                                        }
                                                                    }}>
                                                                        <Download size={14} className="mr-1" /> Scarica PDF
                                                                    </Button>
                                                                    {isAdmin && (
                                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cert._id)} className="text-red-400 hover:bg-red-500/20 h-8 px-2">
                                                                            ×
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Cross-reference: linked entity */}
                                                            {(cert.supplier_id || cert.collaborator_id || cert.cantiere_id) && (
                                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#495057] flex-wrap">
                                                                    {cert.supplier_id && (() => {
                                                                        const sup = suppliers.find(s => s._id === cert.supplier_id);
                                                                        return sup ? (
                                                                            <button onClick={() => navigate('/Fornitori')} className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md hover:bg-orange-500/20 transition-all">
                                                                                <Truck size={10} /> {sup.name}
                                                                            </button>
                                                                        ) : null;
                                                                    })()}
                                                                    {cert.collaborator_id && (() => {
                                                                        const col = collaborators.find(c => c._id === cert.collaborator_id);
                                                                        return col ? (
                                                                            <button onClick={() => navigate('/Collaboratori')} className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md hover:bg-indigo-500/20 transition-all">
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
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuovo Certificato</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Titolo *" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="edilizia" className="text-[#f8f9fa]">Edilizia</SelectItem>
                                <SelectItem value="infissi" className="text-[#f8f9fa]">Infissi</SelectItem>
                                <SelectItem value="documenti" className="text-[#f8f9fa]">Documenti</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={formData.subcategory} onValueChange={v => setFormData({ ...formData, subcategory: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Sottocategoria" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {formData.category === 'edilizia' ? (<><SelectItem value="conformita" className="text-[#f8f9fa]">Conformità</SelectItem><SelectItem value="permessi" className="text-[#f8f9fa]">Permessi</SelectItem><SelectItem value="collaudi" className="text-[#f8f9fa]">Collaudi</SelectItem></>) :
                                    formData.category === 'infissi' ? (<><SelectItem value="ce" className="text-[#f8f9fa]">CE</SelectItem><SelectItem value="trasmittanza" className="text-[#f8f9fa]">Trasmittanza</SelectItem><SelectItem value="acustica" className="text-[#f8f9fa]">Acustica</SelectItem></>) :
                                        (<><SelectItem value="allegato" className="text-[#f8f9fa]">Allegato Lavorazione</SelectItem></>)}
                            </SelectContent>
                        </Select>
                        <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega Cantiere (Opzionale)" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {cantieri.filter(c => c.status !== 'completato').map(c => (
                                    <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.nome_cantiere}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-3">
                            <Select value={formData.supplier_id} onValueChange={v => setFormData({ ...formData, supplier_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega Fornitore" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {suppliers.filter(s => s.status === 'active').map(s => (
                                        <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa]">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={formData.collaborator_id} onValueChange={v => setFormData({ ...formData, collaborator_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega Collaboratore" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {collaborators.filter(c => c.status === 'active').map(c => (
                                        <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Textarea placeholder="Descrizione" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <div className="space-y-2">
                            <label className="text-xs text-orange-400 font-medium">Allegato PDF/Certificato *</label>
                            <Input 
                                type="file" 
                                accept=".pdf,.doc,.docx,image/*" 
                                onChange={e => setSelectedFile(e.target.files[0])} 
                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-xs file:bg-[#343a40] file:text-orange-400 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 hover:file:bg-[#212529]" 
                            />
                            {selectedFile && <p className="text-[10px] text-green-400">File selezionato: {selectedFile.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Data Emissione</label>
                                <Input type="date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Data Scadenza</label>
                                <Input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                        </div>
                        <Button onClick={handleCreate} disabled={!formData.title || !selectedFile || isUploading} className="w-full bg-amber-600 hover:bg-amber-700">
                            {isUploading ? <><Loader2 className="animate-spin mr-2" size={16} /> Caricamento...</> : 'Crea Certificato'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
