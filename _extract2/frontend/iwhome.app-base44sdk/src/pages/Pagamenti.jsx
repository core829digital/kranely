/// <reference types="vite/client" />
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import jsPDF from 'jspdf';
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import { useUser } from "@clerk/clerk-react";
import {
    CreditCard, DollarSign, Search, Plus, Loader2,
    CheckCircle, Clock, AlertTriangle, TrendingUp,
    Users, Truck, Briefcase, Calendar, Eye, Building2,
    Settings, Upload, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';

const paymentStatusConfig = {
    in_attesa: { label: 'In Attesa', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    in_verifica: { label: 'In Verifica', icon: Search, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    pending_supplier_review: { label: 'In Attesa Revisione Fornitore', icon: Eye, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    confirmed: { label: 'Ricezione Confermata', icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    pagato: { label: 'Pagato', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    in_ritardo: { label: 'In Ritardo', icon: AlertTriangle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    parziale: { label: 'Parziale', icon: TrendingUp, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const typeConfig = {
    supplier: { label: 'Fornitori', icon: Truck, color: 'from-orange-600 to-orange-700' },
    collaborator: { label: 'Collaboratori', icon: Briefcase, color: 'from-indigo-600 to-indigo-700' },
    client: { label: 'Clienti', icon: Users, color: 'from-emerald-600 to-emerald-700' },
};

export default function Pagamenti() {
    const { isAdmin, canView, isLoading: rbacLoading, role } = useRBAC();
    const isClient = role === 'client';
    const isSupplier = role === 'supplier';
    const { user } = useUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('supplier');
    const [statusFilter, setStatusFilter] = useState('all');

    React.useEffect(() => {
        if (role === 'client') setActiveTab('client');
        else if (role === 'collaborator' || role === 'collaborator_internal' || role === 'collaborator_external') setActiveTab('collaborator');
    }, [role]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        acconto_b2c_pct: '30', acconto_b2b_pct: '20', intermedio_pct: '30', saldo_pct: '40',
        settingsTab: 'b2c'
    });
    const [formData, setFormData] = useState({
        type: 'supplier', reference_id: '', reference_name: '', description: '',
        amount: '', payment_type: 'fattura', due_date: '', notes: '', cantiere_id: '', order_id: '', use_split: false
    });
    const [proofModalOpen, setProofModalOpen] = useState(false);
    const [selectedPaymentForProof, setSelectedPaymentForProof] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [confirmedAmountInput, setConfirmedAmountInput] = useState('');
    const [partialResult, setPartialResult] = useState(null);

    const payments = useQuery(api.payments.list, { type: activeTab }) || [];
    const stats = useQuery(api.payments.getStats) || null;
    const paymentSettings = useQuery(api.payments.getPaymentSettings) || {
        acconto_b2c_pct: 30,
        acconto_b2b_pct: 40,
        intermedio_pct: 40,
        saldo_pct: 30
    };
    const createMutation = useMutation(api.payments.create);
    const updateMutation = useMutation(api.payments.update);
    const removeMutation = useMutation(api.payments.remove);
    const confirmPaymentMutation = useMutation(api.payments.confirmPayment);
    const updatePaymentSettingsMutation = useMutation(api.payments.updatePaymentSettings);
    const uploadPaymentProofMutation = useMutation(api.payments.uploadPaymentProof);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    
    // NEW Calendar Queries
    const appointments = useQuery(api.appointments.get) || [];
    const myCantieri = useQuery(api.cantieri.getByWorker, (role === 'collaborator' || role === 'collaborator_internal' || role === 'collaborator_external') ? {} : "skip") || [];
    const staffTasks = useQuery(api.adminStats.getStaffTasks, { email: userEmail }) || [];

    // PDF State
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfTitle, setPdfTitle] = useState('');
    const [isPdfOpen, setIsPdfOpen] = useState(false);

    // Supplier/Collaborator lists for linking
    const suppliers = useQuery(api.suppliers.list) || [];
    const collaborators = useQuery(api.collaborators.list, {}) || [];
    const cantieri = useQuery(api.cantieri.listCantieri, { company_email: userEmail }) || [];
    const allOrders = useQuery(api.suppliers.listOrders, {}) || [];

    const availableOrders = allOrders.filter(o => {
        if (formData.type === 'supplier') return o.supplier_id === formData.reference_id;
        if (formData.type === 'client') {
            const cantiere = cantieri.find(c => c._id === o.cantiere_id);
            return cantiere && (cantiere.client_id === formData.reference_id || cantiere.cliente === formData.reference_name);
        }
        return false;
    });

    // ─── Calendar State & Logic (must be before early returns) ───
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const events = useMemo(() => {
        const evs = [];
        payments.forEach(p => {
            if (p.due_date) {
                evs.push({
                    date: p.due_date,
                    type: 'payment',
                    title: `Pagamento: ${p.amount}€`,
                    description: p.description,
                    color: p.status === 'pagato' ? 'bg-emerald-500' : 'bg-amber-500',
                    icon: CreditCard
                });
            }
        });
        appointments.forEach(a => {
            if (a.appointment_date) {
                evs.push({
                    date: a.appointment_date,
                    type: 'appointment',
                    title: `Appunto: ${a.appointment_time}`,
                    description: `${a.project_type} - ${a.notes || ''}`,
                    color: 'bg-blue-500',
                    icon: MessageSquare
                });
            }
        });
        myCantieri.forEach(c => {
            if (c.created_date) {
                evs.push({
                    date: c.created_date.split('T')[0],
                    type: 'cantiere',
                    title: `Inizio Project: ${c.nome_cantiere}`,
                    description: `Progetto avviato il ${new Date(c.created_date).toLocaleDateString()}`,
                    color: 'bg-indigo-500',
                    icon: Building2
                });
            }
        });
        staffTasks.forEach(t => {
            if (t.due_date) {
                evs.push({
                    date: t.due_date,
                    type: 'task',
                    title: `Task: ${t.title || 'In Attesa'}`,
                    description: t.description || 'Completamento task assegnato',
                    color: t.status === 'completed' ? 'bg-green-500' : 'bg-purple-500',
                    icon: CheckCircle2
                });
            }
        });
        return evs;
    }, [payments, appointments, myCantieri, staffTasks]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const grid = [];
        for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
            grid.push(null);
        }
        for (let d = 1; d <= days; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            grid.push({
                day: d,
                date: dateStr,
                events: events.filter(e => e.date === dateStr)
            });
        }
        return grid;
    }, [currentDate, events]);

    if (rbacLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>);
    }

    if (!canView('pagamenti')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
                </div>
            </div>
        );
    }

    const handleCreate = async () => {
        if (!formData.description || !formData.amount) return;
        try {
            const payload = ({
                type: formData.type,
                reference_id: formData.reference_id || 'N/A',
                reference_name: formData.reference_name || undefined,
                description: formData.description,
                amount: parseFloat(formData.amount),
                payment_type: formData.payment_type || undefined,
                due_date: formData.due_date || undefined,
                notes: formData.notes || undefined,
                cantiere_id: formData.cantiere_id || undefined,
                order_id: formData.order_id || undefined,
                supplier_id: formData.type === 'supplier' && formData.reference_id ? formData.reference_id : undefined,
                collaborator_id: formData.type === 'collaborator' && formData.reference_id ? formData.reference_id : undefined,
                client_id: formData.type === 'client' && formData.reference_id ? formData.reference_id : undefined,
            });

            if (formData.use_split) {
                const total = parseFloat(formData.amount);
                const acconto_pct = (paymentSettings.acconto_b2c_pct) || 30;
                const intermedio_pct = (paymentSettings.intermedio_pct) || 30;
                const saldo_pct = (paymentSettings.saldo_pct) || 40;

                const splits = [
                    { type: 'acconto', pct: acconto_pct, name: 'Acconto Iniziale' },
                    { type: 'rata', pct: intermedio_pct, name: 'Pagamento Intermedio' },
                    { type: 'saldo', pct: saldo_pct, name: 'Saldo Finale' }
                ];

                for (const split of splits) {
                    if (split.pct > 0) {
                        const splitAmt = (total * split.pct) / 100;
                        // @ts-ignore
                        await createMutation({
                            ...payload,
                            description: `${payload.description} - ${split.name}`,
                            amount: splitAmt,
                            payment_type: split.type
                        });
                    }
                }
            } else {
                // @ts-ignore
                await createMutation(payload);
            }

            setShowCreateModal(false);
            setFormData({ type: 'supplier', reference_id: '', reference_name: '', description: '', amount: '', payment_type: 'fattura', due_date: '', notes: '', cantiere_id: '', order_id: '', use_split: false });
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare definitivamente questo pagamento?')) return;
        try { await removeMutation({ id }); } catch (err) { console.error(err); }
    };

    const handleMarkPaid = async (id) => {
        try { await updateMutation({ id, data: { status: 'pagato', paid_date: new Date().toISOString() } }); }
        catch (err) { console.error(err); }
    };

    const generateReceiptPDF = (payment, confirmedAmt) => {
        const doc = new jsPDF();
        const now = new Date();
        doc.setFillColor(33, 37, 41);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setTextColor(248, 249, 250);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('IWHome', 20, 25);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(173, 181, 189);
        doc.text('Ricevuta di Pagamento', 20, 34);
        doc.setDrawColor(73, 80, 87);
        doc.setLineWidth(0.5);
        doc.line(20, 40, 190, 40);
        doc.setTextColor(173, 181, 189);
        doc.setFontSize(9);
        doc.text('Data emissione:', 20, 52);
        doc.setTextColor(248, 249, 250);
        doc.text(now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }), 80, 52);
        doc.setTextColor(173, 181, 189);
        doc.text('Riferimento:', 20, 62);
        doc.setTextColor(248, 249, 250);
        doc.text(payment.reference_name || 'N/A', 80, 62);
        doc.setTextColor(173, 181, 189);
        doc.text('Descrizione:', 20, 72);
        doc.setTextColor(248, 249, 250);
        const descLines = doc.splitTextToSize(payment.description || '', 110);
        doc.text(descLines, 80, 72);
        const detailY = 72 + (descLines.length - 1) * 5 + 18;
        doc.setDrawColor(73, 80, 87);
        doc.line(20, detailY - 5, 190, detailY - 5);
        doc.setTextColor(173, 181, 189);
        doc.text('Importo Dovuto:', 20, detailY);
        doc.setTextColor(248, 249, 250);
        doc.text(`€ ${payment.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 80, detailY);
        doc.setTextColor(173, 181, 189);
        doc.text('Importo Pagato:', 20, detailY + 10);
        doc.setTextColor(52, 211, 153);
        doc.setFont(undefined, 'bold');
        doc.text(`€ ${confirmedAmt.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 80, detailY + 10);
        if (confirmedAmt < payment.amount) {
            const remaining = payment.amount - confirmedAmt;
            doc.setFont(undefined, 'normal');
            doc.setTextColor(173, 181, 189);
            doc.text('Rimanente:', 20, detailY + 20);
            doc.setTextColor(251, 146, 60);
            doc.text(`€ ${remaining.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 80, detailY + 20);
        }
        doc.setFont(undefined, 'normal');
        doc.setTextColor(108, 117, 125);
        doc.setFontSize(8);
        doc.text('IWHome — Documento generato automaticamente', 20, 280);
        return doc.output('blob');
    };

    const handleConfirmPayment = async (paymentId, confirmedAmt) => {
        const payment = payments.find(p => p._id === paymentId);
        try {
            const result = await confirmPaymentMutation({
                payment_id: paymentId,
                confirmed_amount: confirmedAmt !== undefined ? confirmedAmt : undefined
            });

            if (result?.partial) {
                setPartialResult(result);
                return { partial: true };
            }

            // Pagamento completo — genera PDF ricevuta
            if (payment) {
                const pdfBlob = generateReceiptPDF(payment, confirmedAmt ?? payment.amount);
                try {
                    const postUrl = await generateUploadUrl();
                    const uploadRes = await fetch(postUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/pdf' },
                        body: pdfBlob
                    });
                    if (uploadRes.ok) {
                        const { storageId } = await uploadRes.json();
                        await updateMutation({ id: paymentId, data: { pdf_receipt_url: storageId } });
                    }
                } catch (_) { /* non bloccante */ }
            }

            alert("✅ Pagamento confermato! Ricevuta PDF generata.");
            return { partial: false };
        } catch (err) {
            console.error(err);
            alert("Errore nella conferma del pagamento.");
            return { partial: false };
        }
    };

    const handleUploadPaymentProof = async (paymentId, file) => {
        if (!file) return;
        setIsUploadingProof(true);
        const payment = selectedPaymentForProof;
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!result.ok) throw new Error("Upload fallito");
            const { storageId } = await result.json();
            await uploadPaymentProofMutation({ payment_id: paymentId, storage_id: storageId });

            // Se l'admin sta caricando la prova per un pagamento fornitore,
            // NON chiamare confirmPayment — sarà il fornitore a confermare la ricezione.
            const isAdminSupplierProof = isAdmin && payment?.type === 'supplier';
            if (isAdminSupplierProof) {
                alert("✅ Prova di pagamento caricata. Il fornitore riceverà una notifica per confermare la ricezione.");
                setProofModalOpen(false);
                setProofFile(null);
                setSelectedPaymentForProof(null);
                setConfirmedAmountInput('');
                setPartialResult(null);
                return;
            }

            // Per pagamenti cliente o conferma ricezione da fornitore:
            // avvia la conferma con l'importo inserito
            const confirmedAmt = confirmedAmountInput ? parseFloat(confirmedAmountInput) : undefined;
            const confirmResult = await handleConfirmPayment(paymentId, confirmedAmt);
            if (!confirmResult?.partial) {
                setProofModalOpen(false);
                setProofFile(null);
                setSelectedPaymentForProof(null);
                setConfirmedAmountInput('');
                setPartialResult(null);
            }
        } catch (err) {
            console.error(err);
            alert("Errore durante il caricamento della prova di pagamento.");
        } finally {
            setIsUploadingProof(false);
        }
    };

    const filteredPayments = payments.filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return p.description.toLowerCase().includes(s) || p.reference_name?.toLowerCase().includes(s) || p.invoice_number?.toLowerCase().includes(s);
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                <CreditCard className="text-emerald-400" /> Pagamenti
                            </h1>
                            <p className="text-[#adb5bd]">
                                {role === 'supplier' ? 'I pagamenti incassati da IWHome per i tuoi servizi' :
                                 role === 'client' ? 'I tuoi pagamenti e le tue ricevute' :
                                 role?.startsWith('collaborator') ? 'Visualizza i tuoi compensi e stipendi' :
                                 'Dashboard pagamenti unificata — Gestione spese e incassi'}
                            </p>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <Button onClick={() => {
                                    setSettingsForm({
                                        acconto_b2c_pct: String(paymentSettings.acconto_b2c_pct ?? 30),
                                        acconto_b2b_pct: String(paymentSettings.acconto_b2b_pct ?? 40),
                                        intermedio_pct: String(paymentSettings.intermedio_pct ?? 40),
                                        saldo_pct: String(paymentSettings.saldo_pct ?? 30),
                                        settingsTab: 'b2c'
                                    });
                                    setShowSettingsModal(true);
                                }} variant="outline" className="border-[#495057] text-[#adb5bd] hover:text-white hover:bg-[#495057]">
                                    <Settings size={16} className="mr-2" /> Impostazioni
                                </Button>
                                <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Plus size={16} className="mr-2" /> Nuovo Pagamento
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats Overview */}
                    {stats && isAdmin && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                            {[
                                { label: 'Totale', value: stats.total, color: 'from-emerald-600/80 to-emerald-700/80' },
                                { label: 'Pagati', value: `€${stats.totalPaid?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-green-600/80 to-green-700/80' },
                                { label: 'In Attesa', value: `€${stats.totalPending?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-yellow-600/80 to-yellow-700/80' },
                                { label: 'In Ritardo', value: `€${stats.totalOverdue?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-red-600/80 to-red-700/80' },
                                { label: 'Fornitori', value: stats.supplierCount, color: 'from-orange-600/80 to-orange-700/80' },
                                { label: 'Collaboratori', value: stats.collaboratorCount, color: 'from-indigo-600/80 to-indigo-700/80' },
                                { label: 'Clienti', value: stats.clientCount, color: 'from-blue-600/80 to-blue-700/80' }].map(s => (
                                <Card key={s.label} className={`bg-gradient-to-br ${s.color} border-0`}>
                                    <CardContent className="p-3 text-center">
                                        <span className="text-xl font-light text-white">{s.value}</span>
                                        <p className="text-[10px] text-white/70 mt-0.5">{s.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Filters */}
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-6">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                <Input placeholder="Cerca pagamenti..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]" />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-44 bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Stato" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="all" className="text-[#f8f9fa]">Tutti gli stati</SelectItem>
                                    <SelectItem value="in_attesa" className="text-[#f8f9fa]">In Attesa</SelectItem>
                                    <SelectItem value="pending_supplier_review" className="text-[#f8f9fa]">In Attesa Fornitore</SelectItem>
                                    <SelectItem value="confirmed" className="text-[#f8f9fa]">Confermati</SelectItem>
                                    <SelectItem value="pagato" className="text-[#f8f9fa]">Pagato</SelectItem>
                                    <SelectItem value="in_ritardo" className="text-[#f8f9fa]">In Ritardo</SelectItem>
                                    <SelectItem value="parziale" className="text-[#f8f9fa]">Parziale</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Type Tabs */}
                    {(isAdmin || role?.includes('collaborator')) && (
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-[#343a40] border border-[#495057] w-full flex overflow-x-auto sm:grid sm:grid-cols-4 mb-6 h-auto">
                                <TabsTrigger value="supplier" className="flex-shrink-0 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-[#adb5bd] text-xs sm:text-sm">
                                    <Truck size={14} className="mr-1 sm:mr-2" /> <span>Fornitori</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Uscite)</span>
                                </TabsTrigger>
                                <TabsTrigger value="collaborator" className="flex-shrink-0 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-[#adb5bd] text-xs sm:text-sm">
                                    <Briefcase size={14} className="mr-1 sm:mr-2" /> <span>Collaboratori</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Uscite)</span>
                                </TabsTrigger>
                                <TabsTrigger value="client" className="flex-shrink-0 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#adb5bd] text-xs sm:text-sm">
                                    <Users size={14} className="mr-1 sm:mr-2" /> <span>Clienti</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Entrate)</span>
                                </TabsTrigger>
                                <TabsTrigger value="calendar" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[#adb5bd] text-xs sm:text-sm">
                                    <Calendar size={14} className="mr-1 sm:mr-2" /> <span>Calendario</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Agenda)</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {!isAdmin && activeTab === 'client' && (
                        <Card className="bg-emerald-600/10 border border-emerald-600/30 mb-6">
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[#f8f9fa] font-medium">Coordinate Bancarie IWHome</h3>
                                        <p className="text-xs text-[#adb5bd]">Utilizza questi dati per i tuoi bonifici</p>
                                    </div>
                                </div>
                                <div className="text-right font-mono text-sm bg-black/20 p-3 rounded-lg border border-[#495057] w-full md:w-auto">
                                    <p className="text-[#f8f9fa]"><span className="text-[#adb5bd] mr-2">IBAN:</span> IT 99 X 01234 56789 000000123456</p>
                                    <p className="text-[#f8f9fa]"><span className="text-[#adb5bd] mr-2">BIC:</span> ABCITM1RXXX</p>
                                    <p className="text-[#f8f9fa]"><span className="text-[#adb5bd] mr-2">BANCA:</span> IWHome Financial Services</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Main Content Area */}
                    {activeTab === 'calendar' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] p-4 rounded-2xl">
                                <Button variant="ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-[#adb5bd] hover:text-[#f8f9fa]">
                                    <ChevronLeft size={20} />
                                </Button>
                                <h2 className="text-xl font-medium text-[#f8f9fa] capitalize">
                                    {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                                </h2>
                                <Button variant="ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-[#adb5bd] hover:text-[#f8f9fa]">
                                    <ChevronRight size={20} />
                                </Button>
                            </div>

                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[480px] sm:min-w-0 px-4 sm:px-0">
                                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                                    <div key={day} className="text-center py-2 text-xs font-black uppercase text-[#6c757d] tracking-widest">{day}</div>
                                ))}
                                {calendarGrid.map((day, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`min-h-[120px] bg-[#343a40]/30 backdrop-blur-sm border border-[#495057]/50 rounded-xl p-2 transition-all hover:bg-[#343a40]/50 ${!day ? 'opacity-20' : ''}`}
                                    >
                                        {day && (
                                            <>
                                                <span className={`text-sm font-bold ${new Date().toISOString().split('T')[0] === day.date ? 'text-blue-400' : 'text-[#adb5bd]'}`}>
                                                    {day.day}
                                                </span>
                                                <div className="mt-2 space-y-1">
                                                    {day.events.map((ev, eIdx) => (
                                                        <div 
                                                            key={eIdx} 
                                                            className={`group relative p-1.5 rounded-lg ${ev.color} bg-opacity-20 border border-current border-opacity-30 cursor-pointer hover:bg-opacity-30 transition-all`}
                                                            title={ev.description}
                                                        >
                                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                                <ev.icon size={10} className="shrink-0" />
                                                                <span className="text-[9px] font-bold truncate leading-none">{ev.title}</span>
                                                            </div>
                                                            <div className="absolute z-50 invisible group-hover:visible bg-[#212529] border border-[#495057] p-3 rounded-xl shadow-2xl w-48 left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#6c757d] mb-1">{ev.type}</p>
                                                                <p className="text-xs font-bold text-[#f8f9fa] mb-1">{ev.title}</p>
                                                                <p className="text-[10px] text-[#adb5bd] leading-tight">{ev.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-6 p-4 bg-[#343a40]/30 rounded-2xl border border-[#495057]/30">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#adb5bd]">
                                    <div className="w-3 h-3 rounded bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" /> Pagamenti
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#adb5bd]">
                                    <div className="w-3 h-3 rounded bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" /> Appuntamenti
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#adb5bd]">
                                    <div className="w-3 h-3 rounded bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]" /> Inizio Cantieri
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#adb5bd]">
                                    <div className="w-3 h-3 rounded bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" /> Task & Scadenze
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filteredPayments.length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <DollarSign size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun pagamento trovato</h3>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredPayments.map(payment => {
                                        const sts = paymentStatusConfig[payment.status] || paymentStatusConfig.in_attesa;
                                        const StatusIcon = sts.icon;
                                        return (
                                            <motion.div key={payment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                                    <CardContent className="p-5">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                    <h3 className="text-base sm:text-lg font-medium text-[#f8f9fa]">{payment.description}</h3>
                                                                    {payment.payment_type && (
                                                                        <Badge variant="default" className="bg-[#495057] text-[#adb5bd] text-xs capitalize">{payment.payment_type}</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-[#adb5bd] mt-1">
                                                                    {payment.reference_name && <span className="truncate max-w-[200px]">{payment.reference_name}</span>}
                                                                    {payment.invoice_number && <span>Fattura: {payment.invoice_number}</span>}
                                                                    {payment.cantiere_id && (() => {
                                                                        const cantiere = cantieri.find(c => c._id === payment.cantiere_id);
                                                                        return cantiere ? <span className="flex items-center gap-1 text-emerald-400 font-medium"><Building2 size={12} /> {cantiere.nome_cantiere}</span> : null;
                                                                    })()}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#6c757d] mt-2">
                                                                    {payment.due_date && <span className="flex items-center gap-1"><Calendar size={12} /> Scadenza: {new Date(payment.due_date).toLocaleDateString('it-IT')}</span>}
                                                                    {payment.paid_date && <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-400" /> Pagato: {new Date(payment.paid_date).toLocaleDateString('it-IT')}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <span className="text-xl font-medium text-[#f8f9fa]">€{payment.amount?.toLocaleString()}</span>
                                                                <Badge variant="default" className={`${sts.color} border flex items-center gap-1`}>
                                                                    <StatusIcon size={14} /> {sts.label}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#495057]">
                                                            <div className="flex gap-2">
                                                                {payment.type === 'supplier' && payment.reference_name && (
                                                                    <button onClick={() => navigate('/Fornitori')} className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md hover:bg-orange-500/20 transition-all">
                                                                        <Truck size={10} /> {payment.reference_name}
                                                                    </button>
                                                                )}
                                                                {payment.type === 'collaborator' && payment.reference_name && (
                                                                    <button onClick={() => navigate('/Collaboratori')} className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md hover:bg-indigo-500/20 transition-all">
                                                                        <Briefcase size={10} /> {payment.reference_name}
                                                                    </button>
                                                                )}
                                                                {payment.type === 'client' && payment.reference_name && (
                                                                    <button onClick={() => navigate('/Clienti')} className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-all">
                                                                        <Users size={10} /> {payment.reference_name}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2">
                                                                {isAdmin && (
                                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(payment._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 mr-1">
                                                                        ×
                                                                    </Button>
                                                                )}

                                                                {payment.proof_url && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setPdfUrl(payment.proof_url);
                                                                            setPdfTitle(`Prova: ${payment.description}`);
                                                                            setIsPdfOpen(true);
                                                                        }}
                                                                        className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 h-8 text-xs mr-1"
                                                                    >
                                                                        <Eye size={14} className="mr-1" /> Vedi Prova
                                                                    </Button>
                                                                )}

                                                                {isAdmin && (
                                                                    <>
                                                                        {payment.type === 'client' && payment.status !== 'pagato' && (
                                                                            <Button size="sm" onClick={() => {
                                                                                setSelectedPaymentForProof(payment);
                                                                                setConfirmedAmountInput(String(payment.amount));
                                                                                setPartialResult(null);
                                                                                setProofModalOpen(true);
                                                                            }} className="bg-green-600 hover:bg-green-700 text-xs h-8 text-nowrap">
                                                                                <CheckCircle size={14} className="mr-1" /> Segna Pagato
                                                                            </Button>
                                                                        )}

                                                                        {payment.type === 'supplier' && payment.status === 'in_attesa' && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setSelectedPaymentForProof(payment);
                                                                                    setConfirmedAmountInput(String(payment.amount));
                                                                                    setPartialResult(null);
                                                                                    setProofModalOpen(true);
                                                                                }}
                                                                                className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                                                                            >
                                                                                <Upload size={14} className="mr-1" /> Carica Prova
                                                                            </Button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {isSupplier && payment.type === 'supplier' && payment.status === 'pending_supplier_review' && (
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedPaymentForProof(payment);
                                                                                setConfirmedAmountInput(String(payment.amount));
                                                                                setPartialResult(null);
                                                                                setProofModalOpen(true);
                                                                            }}
                                                                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                                                                        >
                                                                            <CheckCircle2 size={14} className="mr-1" /> Conferma Ricezione
                                                                        </Button>
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="ghost"
                                                                            onClick={() => alert("Segnalazione inviata all'amministrazione IWHome.")} 
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8"
                                                                        >
                                                                            <AlertTriangle size={14} className="mr-1" /> Segnala Problema
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* CREATE MODAL */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuovo Pagamento</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v, reference_id: '', reference_name: '' })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="supplier" className="text-[#f8f9fa]">Fornitore</SelectItem>
                                <SelectItem value="collaborator" className="text-[#f8f9fa]">Collaboratore</SelectItem>
                                <SelectItem value="client" className="text-[#f8f9fa]">Cliente</SelectItem>
                            </SelectContent>
                        </Select>

                        {formData.type === 'supplier' && (
                            <Select value={formData.reference_id} onValueChange={v => { const s = suppliers.find(x => x._id === v); setFormData({ ...formData, reference_id: v, reference_name: s?.name }); }}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Fornitore" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa]">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {formData.type === 'collaborator' && (
                            <Select value={formData.reference_id} onValueChange={v => { const c = collaborators.find(x => x._id === v); setFormData({ ...formData, reference_id: v, reference_name: c?.full_name }); }}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Collaboratore" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {collaborators.map(c => <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.full_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {formData.type === 'client' && (
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Nome Cliente" value={formData.reference_name} onChange={e => setFormData({ ...formData, reference_name: e.target.value, reference_id: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                                    <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega Cantiere" /></SelectTrigger>
                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                        {cantieri.filter(c => c.status !== 'completato').map(c => (
                                            <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.nome_cantiere}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {formData.type !== 'client' && (
                            <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega Cantiere (Opzionale)" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {cantieri.filter(c => c.status !== 'completato').map(c => (
                                        <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.nome_cantiere}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(formData.type === 'supplier' || (formData.type === 'client' && formData.cantiere_id)) && availableOrders.length > 0 && (
                            <Select value={formData.order_id} onValueChange={v => setFormData({ ...formData, order_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega ad un Ordine" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="" className="text-[#adb5bd]">Nessun ordine collegato</SelectItem>
                                    {availableOrders.map(o => <SelectItem key={o._id} value={o._id} className="text-[#f8f9fa]">Ordine #{o.order_number || o._id.slice(-6)} - €{o.total_amount?.toLocaleString()}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}

                        <Input placeholder="Descrizione *" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Importo (€) *" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        
                        <div className="flex items-center gap-2 mt-2">
                           <input type="checkbox" id="split-toggle" checked={formData.use_split} onChange={e => setFormData({ ...formData, use_split: e.target.checked })} className="w-4 h-4 bg-[#495057] border-[#6c757d] rounded cursor-pointer" />
                           <label htmlFor="split-toggle" className="text-sm text-[#dee2e6] cursor-pointer">
                              Dividi in rate B2C ({paymentSettings.acconto_b2c_pct ?? 30}% / {paymentSettings.intermedio_pct ?? 40}% / {paymentSettings.saldo_pct ?? 30}%)
                           </label>
                        </div>
                        
                        {!formData.use_split && (
                            <Select value={formData.payment_type} onValueChange={v => setFormData({ ...formData, payment_type: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="acconto" className="text-[#f8f9fa]">Acconto</SelectItem>
                                    <SelectItem value="saldo" className="text-[#f8f9fa]">Saldo</SelectItem>
                                    <SelectItem value="rata" className="text-[#f8f9fa]">Rata</SelectItem>
                                    <SelectItem value="fattura" className="text-[#f8f9fa]">Fattura</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <div>
                            <label className="text-xs text-[#adb5bd] block mb-1">Data Scadenza</label>
                            <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>
                        <Textarea placeholder="Note" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreate} disabled={!formData.description || !formData.amount} className="w-full bg-emerald-600 hover:bg-emerald-700">Crea Pagamento</Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* PDF VIEWER */}
            <UniversalPdfViewer
                isOpen={isPdfOpen}
                onClose={() => setIsPdfOpen(false)}
                url={pdfUrl}
                title={pdfTitle}
            />

            {/* SETTINGS MODAL */}
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <Settings size={18} className="text-emerald-400" /> Impostazioni Pagamenti
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-[#adb5bd]">Configura le percentuali di split per clienti B2C (privati) e B2B (aziende). La somma di ogni colonna deve essere 100%.</p>

                        {/* Tab B2C / B2B */}
                        <div className="flex rounded-lg overflow-hidden border border-[#495057]">
                            {['b2c', 'b2b'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSettingsForm(f => ({ ...f, settingsTab: tab }))}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${settingsForm.settingsTab === tab ? 'bg-emerald-600 text-white' : 'bg-[#495057] text-[#adb5bd] hover:text-white'}`}
                                >
                                    {tab === 'b2c' ? 'B2C — Privati' : 'B2B — Aziende'}
                                </button>
                            ))}
                        </div>

                        {settingsForm.settingsTab === 'b2c' ? (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-[#adb5bd] block mb-1">Acconto %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.acconto_b2c_pct} onChange={e => setSettingsForm(f => ({ ...f, acconto_b2c_pct: e.target.value }))} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#adb5bd] block mb-1">Intermedio %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.intermedio_pct} onChange={e => setSettingsForm(f => ({ ...f, intermedio_pct: e.target.value }))} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#adb5bd] block mb-1">Saldo %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.saldo_pct} onChange={e => setSettingsForm(f => ({ ...f, saldo_pct: e.target.value }))} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                </div>
                                {(() => {
                                    const sum = (parseFloat(settingsForm.acconto_b2c_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    return <div className={`col-span-3 text-sm font-medium text-center p-2 rounded-lg ${sum === 100 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>Totale B2C: {sum}% {sum === 100 ? '✓' : '(deve essere 100%)'}</div>;
                                })()}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-[#adb5bd] block mb-1">Acconto B2B %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.acconto_b2b_pct} onChange={e => setSettingsForm(f => ({ ...f, acconto_b2b_pct: e.target.value }))} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#adb5bd] block mb-1">Intermedio %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.intermedio_pct} onChange={e => setSettingsForm(f => ({ ...f, intermedio_pct: e.target.value }))} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#adb5bd] block mb-1">Saldo %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.saldo_pct} onChange={e => setSettingsForm(f => ({ ...f, saldo_pct: e.target.value }))} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                </div>
                                {(() => {
                                    const sum = (parseFloat(settingsForm.acconto_b2b_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    return <div className={`col-span-3 text-sm font-medium text-center p-2 rounded-lg ${sum === 100 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>Totale B2B: {sum}% {sum === 100 ? '✓' : '(deve essere 100%)'}</div>;
                                })()}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setShowSettingsModal(false)} className="text-[#adb5bd] hover:text-white">Annulla</Button>
                            <Button
                                onClick={async () => {
                                    const b2cSum = (parseFloat(settingsForm.acconto_b2c_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    const b2bSum = (parseFloat(settingsForm.acconto_b2b_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    if (b2cSum !== 100 || b2bSum !== 100) { alert('La somma delle percentuali deve essere 100% per ogni tipo.'); return; }
                                    try {
                                        await updatePaymentSettingsMutation({
                                            acconto_b2c_pct: parseFloat(settingsForm.acconto_b2c_pct),
                                            acconto_b2b_pct: parseFloat(settingsForm.acconto_b2b_pct),
                                            intermedio_pct: parseFloat(settingsForm.intermedio_pct),
                                            saldo_pct: parseFloat(settingsForm.saldo_pct),
                                        });
                                        setShowSettingsModal(false);
                                    } catch (e) { alert('Errore nel salvataggio: ' + e.message); }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                Salva Impostazioni
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PROOF UPLOAD MODAL */}
            <Dialog open={proofModalOpen} onOpenChange={(open) => {
                if (!open) { setProofFile(null); setPartialResult(null); setConfirmedAmountInput(''); setSelectedPaymentForProof(null); }
                setProofModalOpen(open);
            }}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-sm max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <Upload className="text-blue-400" size={20} /> Conferma Pagamento
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Dettaglio */}
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-xs text-blue-400 font-bold uppercase mb-1">Dettaglio Pagamento</p>
                            <p className="text-sm text-[#f8f9fa]">{selectedPaymentForProof?.description}</p>
                            <p className="text-xs text-[#adb5bd] mt-0.5">{selectedPaymentForProof?.reference_name}</p>
                            <p className="text-lg font-bold text-white mt-1">Dovuto: € {selectedPaymentForProof?.amount?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                        </div>

                        {/* Importo effettivamente ricevuto */}
                        <div className="space-y-1">
                            <label className="text-sm text-[#adb5bd]">Importo effettivamente ricevuto (€)</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={selectedPaymentForProof?.amount}
                                value={confirmedAmountInput}
                                onChange={e => { setConfirmedAmountInput(e.target.value); setPartialResult(null); }}
                                className="bg-[#212529] border-[#495057] text-[#f8f9fa] text-lg font-mono"
                                placeholder="0.00"
                            />
                            {/* Riepilogo dovuto/pagato/mancante */}
                            {confirmedAmountInput && selectedPaymentForProof && (() => {
                                const dovuto = selectedPaymentForProof.amount;
                                const pagato = parseFloat(confirmedAmountInput) || 0;
                                const mancante = dovuto - pagato;
                                const isPartial = pagato < dovuto;
                                return (
                                    <div className={`mt-2 p-3 rounded-lg border text-xs space-y-1 ${isPartial ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                                        <div className="flex justify-between"><span className="text-[#adb5bd]">Dovuto</span><span className="text-white font-mono">€ {dovuto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span></div>
                                        <div className="flex justify-between"><span className="text-[#adb5bd]">Pagato</span><span className="text-emerald-400 font-mono font-bold">€ {pagato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span></div>
                                        {isPartial && <div className="flex justify-between border-t border-[#495057] pt-1"><span className="text-amber-400">Mancante</span><span className="text-amber-400 font-mono font-bold">€ {mancante.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span></div>}
                                        {isPartial && <p className="text-amber-400 text-[10px] mt-1">Pagamento parziale — il workflow non verrà avanzato fino al saldo completo.</p>}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Messaggio parziale dal backend */}
                        {partialResult && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-amber-400 text-sm font-medium">{partialResult.message}</p>
                                <p className="text-[#adb5bd] text-xs mt-1">Il pagamento è stato registrato come parziale. Puoi tornare qui per registrare il saldo rimanente.</p>
                            </div>
                        )}

                        {/* File prova */}
                        <div className="space-y-2">
                            <label className="text-sm text-[#adb5bd]">Prova di pagamento (Screenshot/PDF/Foto)</label>
                            <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                className="bg-[#212529] border-[#495057] text-[#f8f9fa]"
                            />
                            <p className="text-[10px] text-[#6c757d]">Allega la ricevuta o screenshot del bonifico.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-[#495057]">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setProofModalOpen(false);
                                    setProofFile(null);
                                    setPartialResult(null);
                                    setConfirmedAmountInput('');
                                }}
                                className="text-[#adb5bd] hover:text-white"
                            >
                                Annulla
                            </Button>
                            <Button
                                onClick={() => handleUploadPaymentProof(selectedPaymentForProof?._id, proofFile)}
                                disabled={!proofFile || isUploadingProof || !confirmedAmountInput}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                            >
                                {isUploadingProof ? <Loader2 size={16} className="animate-spin" /> : 'Conferma Pagamento'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

