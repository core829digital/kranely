/// <reference types="vite/client" />
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import jsPDF from 'jspdf';
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    in_attesa: { label: 'Pending', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    in_verifica: { label: 'Under Review', icon: Search, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    pending_supplier_review: { label: 'Pending Supplier Review', icon: Eye, color: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30' },
    confirmed: { label: 'Receipt Confirmed', icon: CheckCircle2, color: 'bg-[#FFC703]/10 text-emerald-400 border-emerald-500/30' },
    pagato: { label: 'Paid', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    in_ritardo: { label: 'Overdue', icon: AlertTriangle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    parziale: { label: 'Parziale', icon: TrendingUp, color: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30' },
};

const typeConfig = {
    supplier: { label: 'Suppliers', icon: Truck, color: 'from-orange-600 to-orange-700' },
    collaborator: { label: 'Collaborators', icon: Briefcase, color: 'from-[#FFC703] to-indigo-700' },
    client: { label: 'Clients', icon: Users, color: 'from-emerald-600 to-emerald-700' },
};

export default function Pagamenti() {
    const { t } = useTranslation();
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
    const myProjects = useQuery(api.cantieri.getByWorker, (role === 'collaborator' || role === 'collaborator_internal' || role === 'collaborator_external') ? {} : "skip") || [];
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

    // â”€â”€â”€ Calendar State & Logic (must be before early returns) â”€â”€â”€
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
                    title: `Payment: ${p.amount}â‚¬`,
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
                    color: 'bg-[#FFC703]/20',
                    icon: MessageSquare
                });
            }
        });
        myProjects.forEach(c => {
            if (c.created_date) {
                evs.push({
                    date: c.created_date.split('T')[0],
                    type: 'cantiere',
                    title: `Inizio Project: ${c.nome_cantiere}`,
                    description: `Progetto avviato il ${new Date(c.created_date).toLocaleDateString()}`,
                    color: 'bg-[#FFC703]/20',
                    icon: Building2
                });
            }
        });
        staffTasks.forEach(t => {
            if (t.due_date) {
                evs.push({
                    date: t.due_date,
                    type: 'task',
                    title: `Task: ${t.title || 'Pending'}`,
                    description: t.description || 'Assigned task completion',
                    color: t.status === 'completed' ? 'bg-green-500' : 'bg-purple-500',
                    icon: CheckCircle2
                });
            }
        });
        return evs;
    }, [payments, appointments, myProjects, staffTasks]);

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
        return (<div className="min-h-screen flex items-center justify-center" style={{ background: '#1C1A18' }}><div className="w-10 h-10 rounded-full border-[3px] border-[#FFC703]/20 border-t-[#FFC703] animate-spin" /></div>);
    }

    if (!canView('pagamenti')) {
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
                    { type: 'acconto', pct: acconto_pct, name: 'Initial Deposit' },
                    { type: 'rata', pct: intermedio_pct, name: 'Interim Payment' },
                    { type: 'saldo', pct: saldo_pct, name: 'Final Balance' }
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
        if (!window.confirm('Are you sure you want to permanently delete this payment??')) return;
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
        doc.text('Kranely', 20, 25);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(173, 181, 189);
        doc.text('Payment Receipt', 20, 34);
        doc.setDrawColor(73, 80, 87);
        doc.setLineWidth(0.5);
        doc.line(20, 40, 190, 40);
        doc.setTextColor(173, 181, 189);
        doc.setFontSize(9);
        doc.text('Issue date:', 20, 52);
        doc.setTextColor(248, 249, 250);
        doc.text(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 80, 52);
        doc.setTextColor(173, 181, 189);
        doc.text('Reference:', 20, 62);
        doc.setTextColor(248, 249, 250);
        doc.text(payment.reference_name || 'N/A', 80, 62);
        doc.setTextColor(173, 181, 189);
        doc.text('Description:', 20, 72);
        doc.setTextColor(248, 249, 250);
        const descLines = doc.splitTextToSize(payment.description || '', 110);
        doc.text(descLines, 80, 72);
        const detailY = 72 + (descLines.length - 1) * 5 + 18;
        doc.setDrawColor(73, 80, 87);
        doc.line(20, detailY - 5, 190, detailY - 5);
        doc.setTextColor(173, 181, 189);
        doc.text('Amount Due:', 20, detailY);
        doc.setTextColor(248, 249, 250);
        doc.text(`â‚¬ ${payment.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 80, detailY);
        doc.setTextColor(173, 181, 189);
        doc.text('Amount Paid:', 20, detailY + 10);
        doc.setTextColor(52, 211, 153);
        doc.setFont(undefined, 'bold');
        doc.text(`â‚¬ ${confirmedAmt.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 80, detailY + 10);
        if (confirmedAmt < payment.amount) {
            const remaining = payment.amount - confirmedAmt;
            doc.setFont(undefined, 'normal');
            doc.setTextColor(173, 181, 189);
            doc.text('Remaining:', 20, detailY + 20);
            doc.setTextColor(251, 146, 60);
            doc.text(`â‚¬ ${remaining.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 80, detailY + 20);
        }
        doc.setFont(undefined, 'normal');
        doc.setTextColor(108, 117, 125);
        doc.setFontSize(8);
        doc.text('Kranely "” Automatically generated document', 20, 280);
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

            // Payment completo "” genera PDF ricevuta
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

            alert("Payment confirmed! PDF receipt generated.");
            return { partial: false };
        } catch (err) {
            console.error(err);
            alert("Error confirming payment.");
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
            // NON chiamare confirmPayment "” sarÃ  il fornitore a confermare la ricezione.
            const isAdminSupplierProof = isAdmin && payment?.type === 'supplier';
            if (isAdminSupplierProof) {
alert("Payment proof uploaded. The supplier will receive a notification to confirm receipt.");
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
            alert("Error uploading payment proof.");
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
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C1A18 0%, #232323 60%, #2a2826 100%)' }}>
            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-[#F0EBE8] mb-2 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#FFC703]/15 border border-[#FFC703]/25">
                                    <CreditCard className="text-[#FFC703]" size={22} />
                                </div>
                                Payments
                            </h1>
                            <p className="text-[#F0EBE8]/40 text-sm">
                                {role === 'supplier' ? 'Payments received from Kranely for your services' :
                                 role === 'client' ? 'Your payments and receipts' :
                                 role?.startsWith('collaborator') ? 'View your earnings and compensation' :
                                 'Unified payment dashboard "” Manage expenses and income'}
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
                                }} variant="outline" className="bg-white/5 border-white/10 text-[#F0EBE8]/60 hover:text-[#F0EBE8] hover:bg-white/10">
                                    <Settings size={16} className="mr-2" /> Settings
                                </Button>
                                <Button onClick={() => setShowCreateModal(true)} className="font-semibold text-[#1C1A18]" style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)' }}>
                                    <Plus size={16} className="mr-2" /> New Payment
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats Overview */}
                    {stats && isAdmin && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                            {[
                                { label: 'Total', value: stats.total, color: 'from-emerald-600/80 to-emerald-700/80' },
                                { label: 'Pagati', value: `â‚¬${stats.totalPaid?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-green-600/80 to-green-700/80' },
                                { label: 'Pending', value: `â‚¬${stats.totalPending?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-yellow-600/80 to-yellow-700/80' },
                                { label: 'Overdue', value: `â‚¬${stats.totalOverdue?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-red-600/80 to-red-700/80' },
                                { label: 'Suppliers', value: stats.supplierCount, color: 'from-orange-600/80 to-orange-700/80' },
                                { label: 'Collaborators', value: stats.collaboratorCount, color: 'from-[#FFC703]/80 to-indigo-700/80' },
                                { label: 'Clients', value: stats.clientCount, color: 'from-[#FFC703]/80 to-[#FFC703]/80' }].map(s => (
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
                    <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 mb-6">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <Input placeholder={t('payments.search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#535252] border-white/10 text-white placeholder:text-white/40" />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-44 bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    <SelectItem value="all" className="text-white">All statuses</SelectItem>
                                    <SelectItem value="in_attesa" className="text-white">Pending</SelectItem>
                                    <SelectItem value="pending_supplier_review" className="text-white">Pending Supplier</SelectItem>
                                    <SelectItem value="confirmed" className="text-white">Confirmed</SelectItem>
                                    <SelectItem value="pagato" className="text-white">Paid</SelectItem>
                                    <SelectItem value="in_ritardo" className="text-white">Overdue</SelectItem>
                                    <SelectItem value="parziale" className="text-white">Parziale</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Type Tabs */}
                    {(isAdmin || role?.includes('collaborator')) && (
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-white/5 border border-white/10 w-full flex overflow-x-auto sm:grid sm:grid-cols-4 mb-6 h-auto">
                                <TabsTrigger value="supplier" className="flex-shrink-0 data-[state=active]:bg-[#FFC703]/20 data-[state=active]:text-[#FFC703] text-[#F0EBE8]/40 text-xs sm:text-sm">
                                    <Truck size={14} className="mr-1 sm:mr-2" /> <span>Suppliers</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Outgoing)</span>
                                </TabsTrigger>
                                <TabsTrigger value="collaborator" className="flex-shrink-0 data-[state=active]:bg-[#FFC703]/20 data-[state=active]:text-[#FFC703] text-[#F0EBE8]/40 text-xs sm:text-sm">
                                    <Briefcase size={14} className="mr-1 sm:mr-2" /> <span>Staff</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Outgoing)</span>
                                </TabsTrigger>
                                <TabsTrigger value="client" className="flex-shrink-0 data-[state=active]:bg-[#FFC703]/20 data-[state=active]:text-[#FFC703] text-[#F0EBE8]/40 text-xs sm:text-sm">
                                    <Users size={14} className="mr-1 sm:mr-2" /> <span>Clients</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Incoming)</span>
                                </TabsTrigger>
                                <TabsTrigger value="calendar" className="flex-shrink-0 data-[state=active]:bg-[#FFC703]/20 data-[state=active]:text-[#FFC703] text-[#F0EBE8]/40 text-xs sm:text-sm">
                                    <Calendar size={14} className="mr-1 sm:mr-2" /> <span>Calendar</span> <span className="hidden sm:inline ml-1.5 text-[10px] opacity-70">(Schedule)</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {!isAdmin && activeTab === 'client' && (
                        <Card className="border border-[#FFC703]/20 mb-6" style={{ background: 'rgba(255,199,3,0.05)' }}>
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#FFC703]/15 flex items-center justify-center text-[#FFC703]">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[#F0EBE8] font-medium">Kranely Bank Details</h3>
                                        <p className="text-xs text-[#F0EBE8]/40">Use these details for your bank transfers</p>
                                    </div>
                                </div>
                                <div className="text-right font-mono text-sm bg-black/20 p-3 rounded-lg border border-white/10 w-full md:w-auto">
                                    <p className="text-[#F0EBE8]"><span className="text-[#F0EBE8]/40 mr-2">IBAN:</span> IT 99 X 01234 56789 000000123456</p>
                                    <p className="text-[#F0EBE8]"><span className="text-[#F0EBE8]/40 mr-2">BIC:</span> ABCITM1RXXX</p>
                                    <p className="text-[#F0EBE8]"><span className="text-[#F0EBE8]/40 mr-2">BANK:</span> Kranely Financial Services</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Main Content Area */}
                    {activeTab === 'calendar' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-[#1C1A18]/ backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                                <Button variant="ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-white/40 hover:text-white">
                                    <ChevronLeft size={20} />
                                </Button>
                                <h2 className="text-xl font-medium text-white capitalize">
                                    {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                                </h2>
                                <Button variant="ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-white/40 hover:text-white">
                                    <ChevronRight size={20} />
                                </Button>
                            </div>

                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[480px] sm:min-w-0 px-4 sm:px-0">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="text-center py-2 text-xs font-black uppercase text-white/25 tracking-widest">{day}</div>
                                ))}
                                {calendarGrid.map((day, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`min-h-[120px] bg-[#1C1A18]/ backdrop-blur-sm border border-white/10/50 rounded-xl p-2 transition-all hover:bg-[#1C1A18]/ ${!day ? 'opacity-20' : ''}`}
                                    >
                                        {day && (
                                            <>
                                                <span className={`text-sm font-bold ${new Date().toISOString().split('T')[0] === day.date ? 'text-[#FFC703]' : 'text-white/40'}`}>
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
                                                            <div className="absolute z-50 invisible group-hover:visible bg-[#141210] border border-white/10 p-3 rounded-xl shadow-2xl w-48 left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">{ev.type}</p>
                                                                <p className="text-xs font-bold text-white mb-1">{ev.title}</p>
                                                                <p className="text-[10px] text-white/40 leading-tight">{ev.description}</p>
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

<div className="flex flex-wrap gap-4 mt-6 p-4 bg-[#1C1A18]/ rounded-2xl border border-white/10/30">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                                    <div className="w-3 h-3 rounded bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" /> Payments
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                                    <div className="w-3 h-3 rounded bg-[#FFC703]/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]" /> Appointments
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                                    <div className="w-3 h-3 rounded bg-[#FFC703]/20 shadow-[0_0_10px_rgba(99,102,241,0.3)]" /> Project Starts
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                                    <div className="w-3 h-3 rounded bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" /> Tasks & Deadlines
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filteredPayments.length === 0 ? (
                                <div className="text-center py-12 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <DollarSign size={48} className="text-[#F0EBE8]/20 mx-auto mb-4" />
                                    <h3 className="text-xl text-[#F0EBE8]/60">No payments found</h3>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredPayments.map(payment => {
                                        const sts = paymentStatusConfig[payment.status] || paymentStatusConfig.in_attesa;
                                        const StatusIcon = sts.icon;
                                        return (
                                            <motion.div key={payment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <Card className="border border-white/10 hover:border-[#FFC703]/20 transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                    <CardContent className="p-5">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                    <h3 className="text-base sm:text-lg font-medium text-white">{payment.description}</h3>
                                                                    {payment.payment_type && (
                                                                        <Badge variant="default" className="bg-[#535252] text-white/40 text-xs capitalize">{payment.payment_type}</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-white/40 mt-1">
                                                                    {payment.reference_name && <span className="truncate max-w-[200px]">{payment.reference_name}</span>}
                                                                    {payment.invoice_number && <span>Invoice: {payment.invoice_number}</span>}
                                                                    {payment.cantiere_id && (() => {
                                                                        const cantiere = cantieri.find(c => c._id === payment.cantiere_id);
                                                                        return cantiere ? <span className="flex items-center gap-1 text-emerald-400 font-medium"><Building2 size={12} /> {cantiere.nome_cantiere}</span> : null;
                                                                    })()}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-white/25 mt-2">
{payment.due_date && <span className="flex items-center gap-1"><Calendar size={12} /> Due: {new Date(payment.due_date).toLocaleDateString('en-GB')}</span>}
                                                                    {payment.paid_date && <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-400" /> Paid: {new Date(payment.paid_date).toLocaleDateString('en-GB')}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <span className="text-xl font-medium text-white">â‚¬{payment.amount?.toLocaleString()}</span>
                                                                <Badge variant="default" className={`${sts.color} border flex items-center gap-1`}>
                                                                    <StatusIcon size={14} /> {sts.label}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                                                            <div className="flex gap-2">
                                                                {payment.type === 'supplier' && payment.reference_name && (
                                                                    <button onClick={() => navigate('/Suppliers')} className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md hover:bg-orange-500/20 transition-all">
                                                                        <Truck size={10} /> {payment.reference_name}
                                                                    </button>
                                                                )}
                                                                {payment.type === 'collaborator' && payment.reference_name && (
                                                                    <button onClick={() => navigate('/Collaborators')} className="flex items-center gap-1 text-[10px] bg-[#FFC703]/20 text-[#FFC703] px-2 py-1 rounded-md hover:bg-[#FFC703]/20 transition-all">
                                                                        <Briefcase size={10} /> {payment.reference_name}
                                                                    </button>
                                                                )}
                                                                {payment.type === 'client' && payment.reference_name && (
                                                                    <button onClick={() => navigate('/Clients')} className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md hover:bg-[#FFC703]/10 transition-all">
                                                                        <Users size={10} /> {payment.reference_name}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2">
                                                                {isAdmin && (
                                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(payment._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 mr-1">
                                                                        Ã—
                                                                    </Button>
                                                                )}

                                                                {payment.proof_url && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setPdfUrl(payment.proof_url);
                                                                            setPdfTitle(`Proof: ${payment.description}`);
                                                                            setIsPdfOpen(true);
                                                                        }}
                                                                        className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 h-8 text-xs mr-1"
                                                                    >
                                                                        <Eye size={14} className="mr-1" /> View Proof
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
                                                                                <CheckCircle size={14} className="mr-1" /> Mark Paid
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
                                                                                className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold text-xs h-8"
                                                                            >
                                                                                <Upload size={14} className="mr-1" /> Upload Proof
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
                                                                            <CheckCircle2 size={14} className="mr-1" /> Confirm Receipt
                                                                        </Button>
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="ghost"
                                                                            onClick={() => alert("Segnalazione sent all'amministrazione Kranely.")} 
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8"
                                                                        >
                                                                            <AlertTriangle size={14} className="mr-1" /> Report Issue
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
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-white">{t('common.new_payment')}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v, reference_id: '', reference_name: '' })}>
                            <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white/5 border-white/10">
                                <SelectItem value="supplier" className="text-white">Supplier</SelectItem>
                                <SelectItem value="collaborator" className="text-white">Collaborator</SelectItem>
                                <SelectItem value="client" className="text-white">Client</SelectItem>
                            </SelectContent>
                        </Select>

                        {formData.type === 'supplier' && (
                            <Select value={formData.reference_id} onValueChange={v => { const s = suppliers.find(x => x._id === v); setFormData({ ...formData, reference_id: v, reference_name: s?.name }); }}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Seleziona Supplier" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-white">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {formData.type === 'collaborator' && (
                            <Select value={formData.reference_id} onValueChange={v => { const c = collaborators.find(x => x._id === v); setFormData({ ...formData, reference_id: v, reference_name: c?.full_name }); }}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Seleziona Collaborator" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    {collaborators.map(c => <SelectItem key={c._id} value={c._id} className="text-white">{c.full_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {formData.type === 'client' && (
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Nome Client" value={formData.reference_name} onChange={e => setFormData({ ...formData, reference_name: e.target.value, reference_id: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                                <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                                    <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Collega Cantiere" /></SelectTrigger>
                                    <SelectContent className="bg-white/5 border-white/10">
                                        {cantieri.filter(c => c.status !== 'completed').map(c => (
                                            <SelectItem key={c._id} value={c._id} className="text-white">{c.nome_cantiere}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {formData.type !== 'client' && (
                            <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Collega Cantiere (Opzionale)" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    {cantieri.filter(c => c.status !== 'completed').map(c => (
                                        <SelectItem key={c._id} value={c._id} className="text-white">{c.nome_cantiere}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(formData.type === 'supplier' || (formData.type === 'client' && formData.cantiere_id)) && availableOrders.length > 0 && (
                            <Select value={formData.order_id} onValueChange={v => setFormData({ ...formData, order_id: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue placeholder="Collega ad un Ordine" /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    <SelectItem value="" className="text-white/40">Nessun ordine collegato</SelectItem>
                                    {availableOrders.map(o => <SelectItem key={o._id} value={o._id} className="text-white">Ordine #{o.order_number || o._id.slice(-6)} - â‚¬{o.total_amount?.toLocaleString()}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}

                        <Input placeholder="Description *" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Input placeholder="Importo (â‚¬) *" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        
                        <div className="flex items-center gap-2 mt-2">
                           <input type="checkbox" id="split-toggle" checked={formData.use_split} onChange={e => setFormData({ ...formData, use_split: e.target.checked })} className="w-4 h-4 bg-[#535252] border-white/10 rounded cursor-pointer" />
                           <label htmlFor="split-toggle" className="text-sm text-white/70 cursor-pointer">
                              Dividi in rate B2C ({paymentSettings.acconto_b2c_pct ?? 30}% / {paymentSettings.intermedio_pct ?? 40}% / {paymentSettings.saldo_pct ?? 30}%)
                           </label>
                        </div>
                        
                        {!formData.use_split && (
                            <Select value={formData.payment_type} onValueChange={v => setFormData({ ...formData, payment_type: v })}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white/5 border-white/10">
                                    <SelectItem value="acconto" className="text-white">Acconto</SelectItem>
                                    <SelectItem value="saldo" className="text-white">Saldo</SelectItem>
                                    <SelectItem value="rata" className="text-white">Rata</SelectItem>
                                    <SelectItem value="fattura" className="text-white">Fattura</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Due Date</label>
                            <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        </div>
                        <Textarea placeholder="Note" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#535252] border-white/10 text-white" />
                        <Button onClick={handleCreate} disabled={!formData.description || !formData.amount} className="w-full bg-emerald-600 hover:bg-emerald-700">Crea Payment</Button>
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
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Settings size={18} className="text-emerald-400" /> Payment Settings
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-white/40">Configure split percentages for B2C (private) and B2B (business) clients. The sum of each column must be 100%.</p>

                        {/* Tab B2C / B2B */}
                        <div className="flex rounded-lg overflow-hidden border border-white/10">
                            {['b2c', 'b2b'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSettingsForm(f => ({ ...f, settingsTab: tab }))}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${settingsForm.settingsTab === tab ? 'bg-emerald-600 text-white' : 'bg-[#535252] text-white/40 hover:text-white'}`}
                                >
                                    {tab === 'b2c' ? 'B2C "” Privati' : 'B2B "” Aziende'}
                                </button>
                            ))}
                        </div>

                        {settingsForm.settingsTab === 'b2c' ? (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Acconto %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.acconto_b2c_pct} onChange={e => setSettingsForm(f => ({ ...f, acconto_b2c_pct: e.target.value }))} className="bg-[#535252] border-white/10 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Intermedio %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.intermedio_pct} onChange={e => setSettingsForm(f => ({ ...f, intermedio_pct: e.target.value }))} className="bg-[#535252] border-white/10 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Saldo %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.saldo_pct} onChange={e => setSettingsForm(f => ({ ...f, saldo_pct: e.target.value }))} className="bg-[#535252] border-white/10 text-white" />
                                </div>
                                {(() => {
                                    const sum = (parseFloat(settingsForm.acconto_b2c_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    return <div className={`col-span-3 text-sm font-medium text-center p-2 rounded-lg ${sum === 100 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>Totale B2C: {sum}% {sum === 100 ? 'âœ“' : '(deve essere 100%)'}</div>;
                                })()}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Acconto B2B %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.acconto_b2b_pct} onChange={e => setSettingsForm(f => ({ ...f, acconto_b2b_pct: e.target.value }))} className="bg-[#535252] border-white/10 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Intermedio %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.intermedio_pct} onChange={e => setSettingsForm(f => ({ ...f, intermedio_pct: e.target.value }))} className="bg-[#535252] border-white/10 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Saldo %</label>
                                    <Input type="number" min="0" max="100" value={settingsForm.saldo_pct} onChange={e => setSettingsForm(f => ({ ...f, saldo_pct: e.target.value }))} className="bg-[#535252] border-white/10 text-white" />
                                </div>
                                {(() => {
                                    const sum = (parseFloat(settingsForm.acconto_b2b_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    return <div className={`col-span-3 text-sm font-medium text-center p-2 rounded-lg ${sum === 100 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>Totale B2B: {sum}% {sum === 100 ? 'âœ“' : '(deve essere 100%)'}</div>;
                                })()}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setShowSettingsModal(false)} className="text-white/40 hover:text-white">Cancel</Button>
                            <Button
                                onClick={async () => {
                                    const b2cSum = (parseFloat(settingsForm.acconto_b2c_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    const b2bSum = (parseFloat(settingsForm.acconto_b2b_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    if (b2cSum !== 100 || b2bSum !== 100) { alert('The percentages must sum to 100% for each type.'); return; }
                                    try {
                                        await updatePaymentSettingsMutation({
                                            acconto_b2c_pct: parseFloat(settingsForm.acconto_b2c_pct),
                                            acconto_b2b_pct: parseFloat(settingsForm.acconto_b2b_pct),
                                            intermedio_pct: parseFloat(settingsForm.intermedio_pct),
                                            saldo_pct: parseFloat(settingsForm.saldo_pct),
                                        });
                                        setShowSettingsModal(false);
                                    } catch (e) { alert('Save error: ' + e.message); }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                Save Settings
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
                <DialogContent className="bg-white/5 border-white/10 text-white max-w-sm max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Upload className="text-[#FFC703]" size={20} /> Confirm Payment
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Dettaglio */}
                        <div className="p-3 bg-[#FFC703]/20 border border-[#FFC703]/30 rounded-lg">
                            <p className="text-xs text-[#FFC703] font-bold uppercase mb-1">Dettaglio Payment</p>
                            <p className="text-sm text-white">{selectedPaymentForProof?.description}</p>
                            <p className="text-xs text-white/40 mt-0.5">{selectedPaymentForProof?.reference_name}</p>
                            <p className="text-lg font-bold text-white mt-1">Dovuto: â‚¬ {selectedPaymentForProof?.amount?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                        </div>

                        {/* Importo effettivamente ricevuto */}
                        <div className="space-y-1">
                            <label className="text-sm text-white/40">Importo effettivamente ricevuto (â‚¬)</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={selectedPaymentForProof?.amount}
                                value={confirmedAmountInput}
                                onChange={e => { setConfirmedAmountInput(e.target.value); setPartialResult(null); }}
                                className="bg-[#141210] border-white/10 text-white text-lg font-mono"
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
                                        <div className="flex justify-between"><span className="text-white/40">Dovuto</span><span className="text-white font-mono">â‚¬ {dovuto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span></div>
                                        <div className="flex justify-between"><span className="text-white/40">Pagato</span><span className="text-emerald-400 font-mono font-bold">â‚¬ {pagato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span></div>
                                        {isPartial && <div className="flex justify-between border-t border-white/10 pt-1"><span className="text-amber-400">Mancante</span><span className="text-amber-400 font-mono font-bold">â‚¬ {mancante.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span></div>}
                                        {isPartial && <p className="text-amber-400 text-[10px] mt-1">Payment parziale "” il workflow non verrÃ  avanzato fino al saldo completo.</p>}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Messaggio parziale dal backend */}
                        {partialResult && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-amber-400 text-sm font-medium">{partialResult.message}</p>
                                <p className="text-white/40 text-xs mt-1">Il pagamento è stato registrato come parziale. Puoi tornare qui per registrare il saldo rimanente.</p>
                            </div>
                        )}

                        {/* File prova */}
                        <div className="space-y-2">
                            <label className="text-sm text-white/40">Payment Proof (Screenshot/PDF/Photo)</label>
                            <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                className="bg-[#141210] border-white/10 text-white"
                            />
                            <p className="text-[10px] text-white/25">Allega la ricevuta o screenshot del bonifico.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setProofModalOpen(false);
                                    setProofFile(null);
                                    setPartialResult(null);
                                    setConfirmedAmountInput('');
                                }}
                                className="text-white/40 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleUploadPaymentProof(selectedPaymentForProof?._id, proofFile)}
                                disabled={!proofFile || isUploadingProof || !confirmedAmountInput}
                                className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold min-w-[120px]"
                            >
                                {isUploadingProof ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Payment'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}







